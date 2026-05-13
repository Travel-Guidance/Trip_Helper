'use strict';

const { chat, generateText } = require('../services/geminiService');
const { buildPersonaSystem, getPersona } = require('../domains/aiTravel/persona');
const { enrichPlanWithCoordinates } = require('../services/geocodeService');
const { sanitizeAustraliaItinerary } = require('../services/itinerarySanitizer');
const pool = require('../config/database');

function normalizeJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function extractJsonObject(text) {
  const raw = String(text || '').replace(/```json|```/g, '').trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('JSON 응답을 찾을 수 없습니다.');
  return JSON.parse(raw.slice(start, end + 1));
}

function parseMustVisitList(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function extractMaxNumber(costStr) {
  const nums = String(costStr || '').match(/\d+(?:\.\d+)?/g);
  if (!nums?.length) return null;
  return Math.max(...nums.map(Number));
}

function isProtectedMustVisitItem(item, mustVisitList) {
  const name = String(item?.name || '').toLowerCase();
  return mustVisitList.some(place => {
    const target = place.toLowerCase();
    return target && (name.includes(target) || target.includes(name));
  });
}

async function searchNearbyPlaces(lat, lng, key, includedTypes, radius = 2000) {
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': [
          'places.displayName', 'places.formattedAddress',
          'places.location', 'places.rating', 'places.priceLevel',
          'places.regularOpeningHours',
        ].join(','),
      },
      body: JSON.stringify({
        includedTypes,
        languageCode: 'ko',
        rankPreference: 'DISTANCE',
        maxResultCount: 8,
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius },
        },
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.places || [])
      .slice(0, 5)
      .map(p => ({
        name: p.displayName?.text || '',
        address: p.formattedAddress || '',
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        rating: p.rating ?? null,
        priceLevel: p.priceLevel ?? null,
      }));
  } catch {
    return [];
  }
}

// 식사 항목: 저렴한 식당만 필터
async function searchNearbyRestaurants(lat, lng, key) {
  const all = await searchNearbyPlaces(lat, lng, key, ['restaurant', 'cafe'], 2000);
  const CHEAP = new Set(['PRICE_LEVEL_FREE', 'PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_UNSPECIFIED', undefined, null]);
  return all.filter(p => CHEAP.has(p.priceLevel));
}

// 관광/입장 항목: 무료/저가 명소
async function searchNearbyAttractions(lat, lng, key) {
  return searchNearbyPlaces(lat, lng, key, [
    'tourist_attraction', 'museum', 'art_gallery', 'park', 'viewpoint',
    'national_park', 'historical_landmark', 'cultural_landmark',
  ], 2000);
}

function priceLevelOrder(level) {
  const order = { PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_UNSPECIFIED: 1 };
  return order[level] ?? 3;
}

function cheapestCandidate(candidates) {
  return [...candidates].sort((a, b) => {
    const diff = priceLevelOrder(a.priceLevel) - priceLevelOrder(b.priceLevel);
    return diff !== 0 ? diff : (b.rating ?? 0) - (a.rating ?? 0);
  })[0];
}

function buildRebudgetPrompt({ day, targetItems, activeItemIndex, remainingBudgetWon, budgetForAdjustments, selectedCount, remainingCostWon, mustVisit, mealCandidatesMap, placeCandidatesMap }) {
  const hasMealCandidates  = mealCandidatesMap  && Object.keys(mealCandidatesMap).length  > 0;
  const hasPlaceCandidates = placeCandidatesMap && Object.keys(placeCandidatesMap).length > 0;
  const candidatesSection = [
    hasMealCandidates  ? `\n근처 저가 식당 후보 (itemIndex → 후보, 반경 2km):\n${JSON.stringify(mealCandidatesMap)}`  : '',
    hasPlaceCandidates ? `\n근처 저가 명소 후보 (itemIndex → 후보, 반경 2km):\n${JSON.stringify(placeCandidatesMap)}` : '',
  ].filter(Boolean).join('\n');
  const mealRule = hasMealCandidates
    ? '3. 식사 항목은 반드시 위 "근처 저가 식당 후보" 목록에서 실제 다른 식당 하나를 골라 교체하세요. priceLevel이 낮고 rating이 높은 것을 우선합니다. 교체 시 name/lat/lng는 해당 후보 값으로 덮어쓰세요. 식사 항목의 교체 결과는 반드시 식당이어야 합니다.'
    : '3. 식사 비용이 문제면 더 저렴한 식당으로 교체하세요. 식당을 다른 종류의 장소로 바꾸면 안 됩니다.';
  const placeRule = hasPlaceCandidates
    ? '4. 관광·입장 항목은 반드시 위 "근처 저가 명소 후보" 목록에서 더 저렴한 명소로 교체하세요. 교체 결과는 반드시 관광지·명소여야 하며 식당으로 바꾸면 안 됩니다.'
    : '4. 관광·입장 항목이 문제면 무료 전망대, 공원, 산책 코스 등 같은 지역의 저가 명소로 대체하세요. 식당으로 바꾸면 안 됩니다.';
  const perItemBudget = selectedCount > 0 ? Math.floor(budgetForAdjustments / selectedCount) : budgetForAdjustments;

  return `오늘 남은 여행 일정만 예산에 맞게 재조정하세요. 반드시 순수 JSON만 반환하세요.

상황:
- 현재 활성 일정 인덱스: ${activeItemIndex}
- 오늘 사용 가능 총 예산: ${remainingBudgetWon} KRW
- 유지하는 항목들의 확정 비용: ${remainingBudgetWon - budgetForAdjustments} KRW
- 재조정 항목들에 쓸 수 있는 최대 예산: ${budgetForAdjustments} KRW (항목당 약 ${perItemBudget} KRW)
- 현재 재조정 항목들의 총 비용: ${remainingCostWon} KRW → 이것을 ${budgetForAdjustments} KRW 이하로 줄여야 합니다.
- 사용자가 반드시 방문하길 원한 장소(mustVisit): ${mustVisit || '없음'}
${candidatesSection}
규칙:
1. 이미 지나간 일정은 절대 수정하지 않습니다. 아래 targetItems만 수정합니다.
2. 재조정 후 항목들의 KRW 환산 총 비용이 ${budgetForAdjustments} KRW 이하여야 합니다. 이 조건이 최우선입니다.
${mealRule}
${placeRule}
5. 쇼핑 비용이 문제면 쇼핑 시간을 줄이거나 구매 상한을 둡니다.
6. 항목 종류(식사→식당, 관광→명소)를 절대 바꾸지 마세요. 식사 항목을 명소로, 명소를 식당으로 교체하면 안 됩니다.
7. mustVisit에 포함된 장소는 삭제하거나 다른 장소로 바꾸지 않습니다.
8. 각 item의 필드는 가능한 유지하되 name, note, cost, isMeal, lat, lng를 포함하세요.
9. 모든 후보는 원래 일정 위치 반경 2km 이내입니다.

반환 형식:
{"items":[...],"summary":"무엇을 줄였는지 한 문장","warnings":["주의사항"]}

오늘 day:
${JSON.stringify(day)}

수정 대상 targetItems:
${JSON.stringify(targetItems)}`;
}

const CATEGORY_TO_DB = {
  meal: 'food',
  food: 'food',
  transport: 'transport',
  entry: 'entrance',
  entrance: 'entrance',
  shop: 'shopping',
  shopping: 'shopping',
  accommodation: 'accommodation',
  other: 'other',
};

const CATEGORY_TO_CLIENT = {
  food: 'meal',
  transport: 'transport',
  entrance: 'entry',
  shopping: 'shop',
  accommodation: 'accommodation',
  other: 'other',
};

function normalizeExpenseCategory(value) {
  return CATEGORY_TO_DB[String(value || '').trim()] || 'other';
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPositiveAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatExpense(row) {
  const amount = Number(row.amount);
  const amountKrw = row.amount_krw == null ? null : Number(row.amount_krw);
  return {
    id: row.id,
    planId: row.plan_id,
    day: row.day_index,
    dayIndex: row.day_index,
    itemIndex: row.item_index,
    source: row.source || 'manual',
    category: row.category,
    cat: CATEGORY_TO_CLIENT[row.category] || 'other',
    amountLocal: Number.isFinite(amount) ? amount : 0,
    amountKrw: Number.isFinite(amountKrw) ? amountKrw : amount,
    currency: row.currency || 'KRW',
    name: row.description || '',
    description: row.description || '',
    spentAt: row.spent_at,
  };
}

async function getOwnedPlan(planId, userId) {
  const [rows] = await pool.query(
    'SELECT id FROM travel_plans WHERE id = ? AND user_id = ?',
    [planId, userId]
  );
  return rows[0] || null;
}

async function generatePlan(req, res, next) {
  const isSSE = req.headers.accept === 'text/event-stream';

  if (isSSE) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  }

  const sendProgress = (data) => {
    if (isSSE) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  try {
    const { runAgent } = require('../services/agentService');
    const plan = await runAgent(req.body, sendProgress);
    const ragDebug = plan.ragDebug || null;
    delete plan.ragDebug;
    
    sendProgress({ step: 'GEOCODING', progress: 95, message: '장소 위치 정보 확인 중...' });
    const enriched = await enrichPlanWithCoordinates(plan, req.body);
    const data = sanitizeAustraliaItinerary(enriched, req.body);

    const userId = req.user?.id || null;
    let savedPlanId = null;
    if (userId) {
      const { destination, country, dest, continent, nights, budget, budgetText } = req.body;
      const destinationName = destination || country || dest || continent || '';
      const [result] = await pool.query(
        'INSERT INTO travel_plans (user_id, destination, plan_data, budget, nights) VALUES (?, ?, ?, ?, ?)',
        [userId, destinationName, JSON.stringify(data), budget || budgetText || '', nights || 0]
      );
      savedPlanId = result.insertId;
    }

    const finalResponse = {
      success: true,
      data,
      planId: savedPlanId,
      ...(req.body.includeDebug ? { debug: { rag: ragDebug } } : {}),
    };

    if (isSSE) {
      res.write(`data: ${JSON.stringify({ step: 'COMPLETED', progress: 100, ...finalResponse })}\n\n`);
      res.end();
    } else {
      res.json(finalResponse);
    }
  } catch (err) {
    console.error('[ai-travel] 일정 생성 오류:', err);
    if (isSSE) {
      res.write(`data: ${JSON.stringify({ error: '일정 생성에 실패했습니다.' })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}

async function getUserPlans(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, destination, budget, nights, created_at FROM travel_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getPlanById(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM travel_plans WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    const plan = rows[0];
    res.json({ ...plan, plan_data: normalizeJson(plan.plan_data, {}) });
  } catch (err) {
    next(err);
  }
}

async function deletePlan(req, res, next) {
  try {
    await pool.query(
      'DELETE FROM travel_plans WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getPlanExpenses(req, res, next) {
  try {
    const planId = Number(req.params.id);
    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 일정 ID입니다.' });
    }

    const plan = await getOwnedPlan(planId, req.user.id);
    if (!plan) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const [rows] = await pool.query(
      `SELECT id, plan_id, day_index, item_index, source, category, amount, currency, amount_krw, description, spent_at
       FROM expenses
       WHERE plan_id = ?
       ORDER BY spent_at DESC, id DESC`,
      [planId]
    );
    res.json(rows.map(formatExpense));
  } catch (err) {
    next(err);
  }
}

async function createPlanExpense(req, res, next) {
  try {
    const planId = Number(req.params.id);
    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 일정 ID입니다.' });
    }

    const plan = await getOwnedPlan(planId, req.user.id);
    if (!plan) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const amount = toPositiveAmount(req.body.amount ?? req.body.amountLocal);
    if (!amount) return res.status(400).json({ error: '지출 금액을 입력해 주세요.' });

    const category = normalizeExpenseCategory(req.body.category ?? req.body.cat);
    const description = String(req.body.description ?? req.body.name ?? '').trim().slice(0, 255);
    const currency = String(req.body.currency || 'KRW').trim().slice(0, 10) || 'KRW';
    const amountKrw = toNumberOrNull(req.body.amountKrw ?? req.body.amount_krw);
    const dayIndex = toNumberOrNull(req.body.dayIndex ?? req.body.day);
    const itemIndex = toNumberOrNull(req.body.itemIndex);
    const source = String(req.body.source || 'manual').trim().slice(0, 20) || 'manual';

    const [result] = await pool.query(
      `INSERT INTO expenses
         (plan_id, day_index, item_index, source, category, amount, currency, amount_krw, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [planId, dayIndex, itemIndex, source, category, amount, currency, amountKrw, description || null]
    );

    const [rows] = await pool.query(
      `SELECT id, plan_id, day_index, item_index, source, category, amount, currency, amount_krw, description, spent_at
       FROM expenses
       WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json(formatExpense(rows[0]));
  } catch (err) {
    next(err);
  }
}

async function updatePlanExpense(req, res, next) {
  try {
    const planId = Number(req.params.id);
    const expenseId = Number(req.params.expenseId);
    if (!Number.isInteger(planId) || planId <= 0 || !Number.isInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 요청입니다.' });
    }

    const plan = await getOwnedPlan(planId, req.user.id);
    if (!plan) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const [existingRows] = await pool.query(
      'SELECT * FROM expenses WHERE id = ? AND plan_id = ?',
      [expenseId, planId]
    );
    if (!existingRows.length) return res.status(404).json({ error: '지출 내역을 찾을 수 없습니다.' });

    const existing = existingRows[0];
    const amount = req.body.amount !== undefined || req.body.amountLocal !== undefined
      ? toPositiveAmount(req.body.amount ?? req.body.amountLocal)
      : Number(existing.amount);
    if (!amount) return res.status(400).json({ error: '지출 금액을 입력해 주세요.' });

    const category = req.body.category !== undefined || req.body.cat !== undefined
      ? normalizeExpenseCategory(req.body.category ?? req.body.cat)
      : existing.category;
    const description = req.body.description !== undefined || req.body.name !== undefined
      ? String(req.body.description ?? req.body.name ?? '').trim().slice(0, 255)
      : existing.description;
    const currency = req.body.currency !== undefined
      ? String(req.body.currency || 'KRW').trim().slice(0, 10) || 'KRW'
      : existing.currency;
    const amountKrw = req.body.amountKrw !== undefined || req.body.amount_krw !== undefined
      ? toNumberOrNull(req.body.amountKrw ?? req.body.amount_krw)
      : existing.amount_krw;
    const dayIndex = req.body.dayIndex !== undefined || req.body.day !== undefined
      ? toNumberOrNull(req.body.dayIndex ?? req.body.day)
      : existing.day_index;
    const itemIndex = req.body.itemIndex !== undefined
      ? toNumberOrNull(req.body.itemIndex)
      : existing.item_index;
    const source = req.body.source !== undefined
      ? String(req.body.source || 'manual').trim().slice(0, 20) || 'manual'
      : existing.source;

    await pool.query(
      `UPDATE expenses
       SET day_index = ?, item_index = ?, source = ?, category = ?, amount = ?, currency = ?, amount_krw = ?, description = ?
       WHERE id = ? AND plan_id = ?`,
      [dayIndex, itemIndex, source, category, amount, currency, amountKrw, description || null, expenseId, planId]
    );

    const [rows] = await pool.query(
      `SELECT id, plan_id, day_index, item_index, source, category, amount, currency, amount_krw, description, spent_at
       FROM expenses
       WHERE id = ?`,
      [expenseId]
    );
    res.json(formatExpense(rows[0]));
  } catch (err) {
    next(err);
  }
}

async function deletePlanExpense(req, res, next) {
  try {
    const planId = Number(req.params.id);
    const expenseId = Number(req.params.expenseId);
    if (!Number.isInteger(planId) || planId <= 0 || !Number.isInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 요청입니다.' });
    }

    const plan = await getOwnedPlan(planId, req.user.id);
    if (!plan) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const [result] = await pool.query(
      'DELETE FROM expenses WHERE id = ? AND plan_id = ?',
      [expenseId, planId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: '지출 내역을 찾을 수 없습니다.' });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function rebudgetPlanDay(req, res, next) {
  try {
    const planId = Number(req.params.id);
    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 일정 ID입니다.' });
    }

    const [rows] = await pool.query(
      'SELECT id, plan_data FROM travel_plans WHERE id = ? AND user_id = ?',
      [planId, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const planData = normalizeJson(rows[0].plan_data, {});
    const dayIndex = Number(req.body.dayIndex);
    const activeItemIndex = Number(req.body.activeItemIndex);
    if (!Array.isArray(planData.days) || !planData.days[dayIndex]) {
      return res.status(400).json({ error: '재조정할 일차를 찾을 수 없습니다.' });
    }

    const day = planData.days[dayIndex];
    const items = Array.isArray(day.items) ? day.items : [];
    const selectedItemIndexes = Array.isArray(req.body.selectedItemIndexes)
      ? req.body.selectedItemIndexes
        .map(Number)
        .filter(index => Number.isInteger(index) && index > activeItemIndex && index < items.length)
      : [];
    const uniqueSelectedIndexes = [...new Set(selectedItemIndexes)];
    if (!uniqueSelectedIndexes.length) {
      return res.status(400).json({ error: '재조정할 일정을 선택해 주세요.' });
    }
    const targetItems = uniqueSelectedIndexes.map(index => ({ index, item: items[index] }));
    console.log('[ai-travel:rebudget] adjustment target', {
      planId,
      dayIndex,
      activeItemIndex,
      selectedItemIndexes: uniqueSelectedIndexes,
      targetItems: targetItems.map(({ index, item }) => ({
        index,
        name: item?.name,
        time: item?.time,
        cost: item?.cost,
        isMeal: item?.isMeal,
      })),
    });

    const mustVisit = String(req.body.mustVisit || '');
    const mustVisitList = parseMustVisitList(mustVisit);

    const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
    const mealCandidatesMap = {};       // 식사 항목 → 근처 저가 식당 후보
    const placeCandidatesMap = {};      // 관광/입장 항목 → 근처 저가 명소 후보

    function isMealItem(item) {
      return item?.isMeal || item?.kind === 'meal' || item?.badge === '식사';
    }
    function isSpotItem(item) {
      return item?.kind === 'spot' || item?.kind === 'entry' || item?.badge === '명소' || item?.badge === '입장';
    }

    if (mapsKey) {
      await Promise.all(
        targetItems.map(async ({ index, item }) => {
          const lat = Number(item?.lat);
          const lng = Number(item?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          if (isMealItem(item)) {
            const candidates = await searchNearbyRestaurants(lat, lng, mapsKey);
            if (candidates.length) mealCandidatesMap[index] = candidates;
          } else if (isSpotItem(item)) {
            const candidates = await searchNearbyAttractions(lat, lng, mapsKey);
            if (candidates.length) placeCandidatesMap[index] = candidates;
          }
        })
      );
    }
    console.log('[ai-travel:rebudget] candidates', {
      planId, dayIndex,
      meal:  Object.keys(mealCandidatesMap).map(idx => ({ idx, count: mealCandidatesMap[idx].length })),
      place: Object.keys(placeCandidatesMap).map(idx => ({ idx, count: placeCandidatesMap[idx].length })),
    });

    const remainingBudgetWon  = Number(req.body.remainingBudgetWon)  || 0;
    const remainingCostWon    = Number(req.body.remainingCostWon)    || 0;
    const lockedCostWon       = Number(req.body.lockedCostWon)       || 0;
    const exchangeRateToKrw   = Number(req.body.exchangeRateToKrw)   || 1;
    // 유지 항목 비용을 제외한 실제 재조정 예산
    const budgetForAdjustments = Math.max(0, remainingBudgetWon - lockedCostWon);

    console.log('[ai-travel:rebudget] budget', {
      remainingBudgetWon, lockedCostWon, budgetForAdjustments, remainingCostWon,
    });

    const prompt = buildRebudgetPrompt({
      day,
      targetItems,
      activeItemIndex,
      remainingBudgetWon,
      budgetForAdjustments,
      selectedCount: uniqueSelectedIndexes.length,
      remainingCostWon,
      mustVisit,
      mealCandidatesMap,
      placeCandidatesMap,
    });

    const text = await generateText(prompt, 'You are a budget-aware travel itinerary editor. Return strict JSON only.');
    const parsed = extractJsonObject(text);
    const revisedItems = Array.isArray(parsed.items) ? parsed.items : [];
    if (!revisedItems.length) {
      return res.status(502).json({ error: '재조정 결과가 비어 있습니다.' });
    }
    console.log('[ai-travel:rebudget] ai result', {
      planId,
      dayIndex,
      summary: parsed.summary || '',
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      revisedItems: revisedItems.map((item, index) => ({
        targetIndex: targetItems[index]?.index,
        name: item?.name,
        time: item?.time,
        cost: item?.cost,
        isMeal: item?.isMeal,
      })),
    });

    const protectedRevised = revisedItems.map((item, index) => {
      const original = targetItems[index]?.item || {};
      if (!isProtectedMustVisitItem(original, mustVisitList)) return item;
      return {
        ...item,
        name: original.name,
        time: original.time,
        lat: original.lat,
        lng: original.lng,
        isMeal: original.isMeal,
      };
    });

    // 후처리 검증: 식사 항목은 candidates 강제 적용, 비용 상승 방지
    // 항목당 최대 허용 비용(현지 통화) 계산
    const perItemBudgetKrw = uniqueSelectedIndexes.length > 0
      ? Math.floor(budgetForAdjustments / uniqueSelectedIndexes.length)
      : budgetForAdjustments;
    const perItemBudgetLocal = exchangeRateToKrw > 0
      ? perItemBudgetKrw / exchangeRateToKrw
      : null;

    function buildForcedItem(original, candidate, note) {
      return {
        ...original,
        name:  candidate.name,
        lat:   candidate.lat  ?? original.lat,
        lng:   candidate.lng  ?? original.lng,
        note,
        badge: original.badge,
        kind:  original.kind,
        isMeal: original.isMeal,
        time:  original.time,
      };
    }

    function usedFromList(aiName, candidates) {
      const n = String(aiName || '').toLowerCase().trim();
      return candidates.some(c => {
        const cn = String(c.name || '').toLowerCase().trim();
        return cn && (cn.includes(n) || n.includes(cn));
      });
    }

    const finalRevised = protectedRevised.map((revisedItem, resultIndex) => {
      const origIndex      = targetItems[resultIndex]?.index;
      const original       = targetItems[resultIndex]?.item || {};
      const mealCands      = mealCandidatesMap[origIndex];
      const placeCands     = placeCandidatesMap[origIndex];
      const isMeal         = isMealItem(original);
      const isSpot         = isSpotItem(original);
      const origNum        = extractMaxNumber(original.cost);
      const newNum         = extractMaxNumber(revisedItem?.cost);
      const exceedsBudget  = perItemBudgetLocal != null && newNum != null && newNum > perItemBudgetLocal;
      const costIncreased  = origNum != null && newNum != null && newNum > origNum * 1.05;
      const needsForce     = exceedsBudget || costIncreased;

      // ── 식사 항목 처리 ──────────────────────────────────────
      if (isMeal && mealCands?.length) {
        const aiUsed = usedFromList(revisedItem?.name, mealCands);
        if (!aiUsed || needsForce) {
          const best = cheapestCandidate(mealCands);
          console.log('[ai-travel:rebudget] meal→force restaurant', { origIndex, best: best.name, needsForce, aiUsed });
          return buildForcedItem(original, best,
            `예산 절약을 위해 근처 저가 식당으로 교체되었습니다. (${best.address || ''})`.trim());
        }
      }

      // ── 관광/입장 항목 처리 ────────────────────────────────
      if (isSpot && placeCands?.length) {
        const aiUsed = usedFromList(revisedItem?.name, placeCands);
        if (!aiUsed || needsForce) {
          const best = cheapestCandidate(placeCands);
          console.log('[ai-travel:rebudget] spot→force attraction', { origIndex, best: best.name, needsForce, aiUsed });
          return buildForcedItem(original, best,
            `예산 절약을 위해 근처 저가 명소로 교체되었습니다. (${best.address || ''})`.trim());
        }
      }

      // ── 예산 초과 폴백 (candidates 없는 경우) ──────────────
      if (needsForce) {
        console.log('[ai-travel:rebudget] cost over budget, marking free', { origIndex, origNum, newNum });
        return { ...revisedItem, cost: '무료', note: revisedItem?.note || original.note || '' };
      }

      return revisedItem;
    });

    const nextItems = [...items];
    uniqueSelectedIndexes.forEach((itemIndex, resultIndex) => {
      nextItems[itemIndex] = finalRevised[resultIndex] || nextItems[itemIndex];
    });
    console.log('[ai-travel:rebudget] applied changes', {
      planId,
      dayIndex,
      changes: uniqueSelectedIndexes.map((itemIndex, resultIndex) => ({
        index: itemIndex,
        before: {
          name: items[itemIndex]?.name,
          time: items[itemIndex]?.time,
          cost: items[itemIndex]?.cost,
          note: items[itemIndex]?.note,
        },
        after: {
          name: nextItems[itemIndex]?.name,
          time: nextItems[itemIndex]?.time,
          cost: nextItems[itemIndex]?.cost,
          note: nextItems[itemIndex]?.note,
        },
      })),
    });

    planData.days[dayIndex] = {
      ...day,
      summary: parsed.summary || day.summary,
      warnings: [
        ...(Array.isArray(day.warnings) ? day.warnings : []),
        ...(Array.isArray(parsed.warnings) ? parsed.warnings : []),
      ],
      items: nextItems,
    };

    await pool.query(
      'UPDATE travel_plans SET plan_data = ? WHERE id = ? AND user_id = ?',
      [JSON.stringify(planData), planId, req.user.id]
    );

    res.json({
      success: true,
      planData,
      day: planData.days[dayIndex],
      summary: parsed.summary || '',
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    });
  } catch (err) {
    next(err);
  }
}

async function getChatContext(destination, message) {
  if (!destination) return '';

  try {
    const { retrieveContext } = require('../services/ragService');
    return retrieveContext(`${destination} ${message}`, { dest: destination, limit: 3 });
  } catch {
    return '';
  }
}

async function chatbot(req, res, next) {
  try {
    const { message, history = [], destination = '' } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: '메시지를 입력해 주세요.' });
    }

    const ragContext = await getChatContext(destination, message);
    const systemPrompt = buildPersonaSystem(destination, ragContext);
    const reply = await chat(history, message, systemPrompt);
    const persona = getPersona(destination);

    res.json({
      success: true,
      reply,
      persona: { name: persona.name, emoji: persona.emoji },
    });
  } catch (err) {
    next(err);
  }
}

async function translateText(req, res, next) {
  try {
    const { text, destination } = req.body;
    if (!text?.trim() || !destination?.trim()) {
      return res.status(400).json({ error: '텍스트와 여행지를 입력하세요.' });
    }

    const prompt = `You are a professional travel translator.
Translate the following Korean text into the local language of the travel destination "${destination.trim()}".

The "pronunciation" field must show how to READ the TRANSLATED text aloud, written in Korean phonetic syllables.
Examples:
- translated "How much is this?" → pronunciation "하우 머치 이즈 디스"
- translated "¿Cuánto cuesta esto?" → pronunciation "꽌또 꾸에스따 에스또"
- translated "これはいくらですか" → pronunciation "코레와 이쿠라 데스카"
- translated "เท่าไหร่" → pronunciation "타오라이"
NEVER put the original Korean input text in the pronunciation field. ONLY Korean phonetic approximation of the translated language.

Return ONLY a valid JSON object (no markdown, no code block, no explanation):
{
  "translated": "<translated text in native script>",
  "pronunciation": "<Korean phonetic spelling of how to pronounce the translated text>",
  "targetLanguage": "<language name in Korean, e.g. 영어, 일본어, 스페인어, 태국어>"
}

Korean text to translate: "${text.trim().replace(/"/g, '\\"')}"`;

    const raw = await generateText(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('번역 결과를 파싱할 수 없습니다.');
    const parsed = JSON.parse(jsonMatch[0]);

    res.json({
      translated: parsed.translated || '',
      pronunciation: parsed.pronunciation || '',
      targetLanguage: parsed.targetLanguage || '',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generatePlan,
  chatbot,
  getUserPlans,
  getPlanById,
  deletePlan,
  getPlanExpenses,
  createPlanExpense,
  updatePlanExpense,
  deletePlanExpense,
  rebudgetPlanDay,
  translateText,
};
