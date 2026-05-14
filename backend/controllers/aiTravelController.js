'use strict';

const { chat, generateText, generateFromImage } = require('../services/geminiService');
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

function sanitizePodcastScript(value) {
  return String(value || '')
    .replace(/^["'\s]*(?:안녕하세요[!.?,。\s]*)+/i, '')
    .replace(/^["'\s]*(?:여러분[,\s]*)?(?:오늘은|지금부터|이번에는|자[,，]?\s*)\s*/i, '')
    .trim();
}

function parseMustVisitList(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function isProtectedMustVisitItem(item, mustVisitList) {
  const name = String(item?.name || '').toLowerCase();
  return mustVisitList.some(place => {
    const target = place.toLowerCase();
    return target && (name.includes(target) || target.includes(name));
  });
}

function buildRebudgetPrompt({ day, targetItems, activeItemIndex, remainingBudgetWon, remainingCostWon, mustVisit }) {
  return `오늘 남은 여행 일정만 예산에 맞게 재조정하세요. 반드시 순수 JSON만 반환하세요.

상황:
- 현재 활성 일정 인덱스: ${activeItemIndex}
- 오늘 남은 사용 가능 예산: ${remainingBudgetWon} KRW
- 남은 식사/쇼핑/입장비 예상 합계: ${remainingCostWon} KRW
- 사용자가 반드시 방문하길 원한 장소(mustVisit): ${mustVisit || '없음'}

규칙:
1. 이미 지나간 일정은 절대 수정하지 않습니다. 아래 targetItems만 수정합니다.
2. 전체 여행이 아니라 오늘 남은 일정만 예산에 맞게 조정합니다.
3. 식사 비용이 문제면 저가 식당, 간단한 식사, 메뉴/주문 팁으로 조정합니다.
4. 쇼핑 비용이 문제면 쇼핑 시간을 줄이거나 구매 상한을 둡니다.
5. 입장비가 문제면 무료 전망, 산책 코스, 저가 입장 옵션으로 대체합니다.
6. mustVisit에 포함된 장소는 삭제하거나 다른 장소로 바꾸지 않습니다. 특히 mustVisit 음식점은 name/time/lat/lng/isMeal을 유지하고 note/cost/reservation/transportTip/backup만 예산형으로 바꿉니다.
7. 각 item의 필드는 가능한 유지하되 name, note, cost, reservation, transportTip, backup, isMeal, lat, lng를 포함하세요.
8. 동선이 과도하게 늘어나지 않게 같은 지역/근처 대체안을 사용하세요.

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
    if (isSSE) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
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
    const prompt = buildRebudgetPrompt({
      day,
      targetItems,
      activeItemIndex,
      remainingBudgetWon: Number(req.body.remainingBudgetWon) || 0,
      remainingCostWon: Number(req.body.remainingCostWon) || 0,
      mustVisit,
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
    const nextItems = [...items];
    uniqueSelectedIndexes.forEach((itemIndex, resultIndex) => {
      nextItems[itemIndex] = protectedRevised[resultIndex] || nextItems[itemIndex];
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

async function translateImage(req, res, next) {
  try {
    const { destination = '' } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: '번역할 이미지를 업로드해 주세요.' });
    }

    const prompt = `You are a travel image translator and long-form audio guide writer for Korean travelers.
Inspect the uploaded image. Identify what the photo is, then summarize and translate the useful meaning into natural Korean.
The summary must read like a smooth spoken explanation, not like disconnected bullet points.
If the image appears to show a tourist attraction, landmark, museum, historic site, monument, temple, palace, church, street, natural attraction, or famous building, identify the most likely place name. If you are not certain, say it is an estimated identification in the summary and podcastScript.
For tourist attraction photos, write the podcastScript as a rich audio guide: explain the attraction name, origin of the name, historical background, cultural meaning, architecture or natural features, why it is famous, what to look at on site, photo/view points, hidden details, visitor tips, etiquette, and nearby context.
If the image contains signs, menus, notices, tickets, receipts, labels, or travel instructions, translate the important content and include practical traveler guidance.
If there is little or no readable text and it is not clearly a tourist attraction, describe the subject of the photo and explain what a traveler should know.
Destination context: "${String(destination || '').trim() || 'unknown destination'}".

Return ONLY a valid JSON object (no markdown, no code block):
{
  "title": "<what this photo is, in Korean, short and clear>",
  "summary": "<Natural Korean explanatory prose, 4-7 connected sentences. Use complete predicates and smooth transitions, not fragments or bullet points.>",
  "podcastScript": "<a Korean long-form podcast/audio-guide script, around 20 minutes when read aloud, based on the image and destination context>"
}

PodcastScript rules:
- Target length: about 20 minutes when read aloud. Aim for 6,000-8,000 Korean characters.
- Write in natural spoken Korean, as if a local audio guide is explaining the place while the traveler is looking at the photo.
- Use multiple coherent paragraphs separated with escaped \\n\\n inside the JSON string.
- Do NOT use "안녕하세요" anywhere.
- Do NOT start with a greeting, host intro, opening line, or setup phrase.
- Start immediately with the useful content from the image.
- Bad starts: "안녕하세요", "여러분", "오늘은", "지금부터", "이번에는", "자,".
- Good starts for attractions: "이곳은...", "사진 속 장소는...", "이 건축물은...", "이 유적은...".
- Do not invent precise dates, names, legends, or facts if uncertain. Say "정확한 명칭은 사진만으로 단정하기 어렵지만" when needed.
- Keep the output valid JSON. Escape all line breaks inside string values as \\n.`;

    const raw = await generateFromImage(prompt, file.buffer, file.mimetype, {
      maxOutputTokens: 8192,
      temperature: 0.7,
    });
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('이미지 번역 결과를 파싱할 수 없습니다.');
    const parsed = JSON.parse(jsonMatch[0]);

    res.json({
      title: parsed.title || '이미지 설명',
      summary: parsed.summary || parsed.translated || '',
      podcastScript: sanitizePodcastScript(parsed.podcastScript || parsed.summary || parsed.translated || ''),
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
  translateImage,
};
