export const CITY_GROUPS = [
    { id:'barcelona',    name:'바르셀로나',   wx:'☀',  range:'Day 1–5',   indices:[0,1,2,3,4] },
    { id:'madrid',       name:'마드리드',     wx:'☀',  range:'Day 6–9',   indices:[5,6,7,8] },
    { id:'sevilla',      name:'세비야',       wx:'☀',  range:'Day 10–13', indices:[9,10,11,12] },
    { id:'granada',      name:'그라나다',     wx:'🌤', range:'Day 14–16', indices:[13,14,15] },
    { id:'malaga',       name:'말라가',       wx:'☀',  range:'Day 17–19', indices:[16,17,18] },
    { id:'valencia',     name:'발렌시아',     wx:'☀',  range:'Day 20–22', indices:[19,20,21] },
    { id:'bilbao',       name:'빌바오',       wx:'🌧', range:'Day 23–25', indices:[22,23,24] },
    { id:'sansebastian', name:'산세바스티안', wx:'🌤', range:'Day 26–27', indices:[25,26] },
    { id:'zaragoza',     name:'사라고사',     wx:'☀',  range:'Day 28–29', indices:[27,28] },
    { id:'return',       name:'복귀',         wx:'✈',  range:'Day 30',    indices:[29] },
  ];

export const SCHEDULE = [
    { day:1,  city:'바르셀로나', wx:'☀',  base:'barcelona',    done:true  },
    { day:2,  city:'바르셀로나', wx:'☀',  base:'barcelona',    done:true  },
    { day:3,  city:'바르셀로나', wx:'🌦', base:'barcelona',    done:true  },
    { day:4,  city:'바르셀로나', wx:'🌦', base:'barcelona',    today:true },
    { day:5,  city:'바르셀로나', wx:'☁',  base:'barcelona'               },
    { day:6,  city:'마드리드',   wx:'☀',  base:'madrid',       cityStart:true },
    { day:7,  city:'마드리드',   wx:'☀',  base:'madrid'                  },
    { day:8,  city:'마드리드',   wx:'☁',  base:'madrid'                  },
    { day:9,  city:'마드리드',   wx:'🌧', base:'madrid'                  },
    { day:10, city:'세비야',     wx:'☀',  base:'sevilla',      cityStart:true },
    { day:11, city:'세비야',     wx:'☀',  base:'sevilla'                 },
    { day:12, city:'세비야',     wx:'🌤', base:'sevilla'                 },
    { day:13, city:'세비야',     wx:'☀',  base:'sevilla'                 },
    { day:14, city:'그라나다',   wx:'🌤', base:'granada',      cityStart:true },
    { day:15, city:'그라나다',   wx:'☀',  base:'granada'                 },
    { day:16, city:'그라나다',   wx:'☁',  base:'granada'                 },
    { day:17, city:'말라가',     wx:'☀',  base:'malaga',       cityStart:true },
    { day:18, city:'말라가',     wx:'☀',  base:'malaga'                  },
    { day:19, city:'말라가',     wx:'🌤', base:'malaga'                  },
    { day:20, city:'발렌시아',   wx:'☀',  base:'valencia',     cityStart:true },
    { day:21, city:'발렌시아',   wx:'☀',  base:'valencia'                },
    { day:22, city:'발렌시아',   wx:'☁',  base:'valencia'                },
    { day:23, city:'빌바오',     wx:'🌧', base:'bilbao',       cityStart:true },
    { day:24, city:'빌바오',     wx:'🌦', base:'bilbao'                  },
    { day:25, city:'빌바오',     wx:'☁',  base:'bilbao'                  },
    { day:26, city:'산세바스티안',wx:'🌤', base:'sansebastian', cityStart:true },
    { day:27, city:'산세바스티안',wx:'☀',  base:'sansebastian'            },
    { day:28, city:'사라고사',   wx:'☀',  base:'zaragoza',     cityStart:true },
    { day:29, city:'사라고사',   wx:'☁',  base:'zaragoza'                },
    { day:30, city:'복귀',       wx:'✈',  base:'return',       cityStart:true },
  ];

export const CITY_DATA = {
    barcelona: {
      title:'바르셀로나 도보 미식 루트',
      desc:'숙소 출발·복귀 기준. 식당·날씨·안전 이슈는 기존 루트 반경 내에서만 대체.',
      stops:[
        { t:'09:00', name:'Praktik Garden', badge:'숙소 출발', kind:'rest', now:true, desc:'오늘 모든 경로의 기준점. 여기서 시작하고 여기로 돌아옵니다.', tags:['짐 없음','도보 시작'], safety:'safe' },
        { t:'09:20', name:'카사 바트요', badge:'예약 입장', kind:'spot', desc:'오전 입장으로 혼잡 줄이기. AI 가이드로 건물 역사 해설을 바로 켤 수 있습니다.', tags:['도보 12분','€35','포토'], safety:'safe' },
        { t:'12:40', name:'El Nacional', badge:'점심', kind:'meal', desc:'예상 €28. 초과 시 480m 이내 대체 식당만 재조회합니다. 관광 순서는 유지됩니다.', tags:['평균 €28','루트 내'], safety:'safe', mealReroute:true },
        { t:'15:20', name:'피카소 미술관', badge:'실내 대체 가능', kind:'spot', desc:'오후 비 예보 시 야외 산책 대신 이 실내 코스를 우선 배치합니다.', tags:['실내','예약 권장','비 대비'], safety:'safe' },
        { t:'18:40', name:'Cervecería Catalana', badge:'저녁', kind:'meal', desc:'카사 밀라 근처 타파스 저녁 후보. 대기 길면 주변 같은 가격대 식당으로 대체합니다.', tags:['평균 €24','타파스','대기 주의'], safety:'safe', mealReroute:true },
        { t:'21:30', name:'Passeig de Gracia 복귀', badge:'야간', kind:'risk', desc:'최단 골목보다 6분 더 걸리지만 최근 3년 내 사고 이력이 없는 대로변 경로입니다.', tags:['대로변 우회','18분'], safety:'warn', safeReroute:true },
      ]
    },
    madrid: {
      title:'마드리드 미술관과 광장 루트',
      desc:'Room Mate Alba 기준 프라도 → 레티로 → 솔 광장 연결.',
      stops:[
        { t:'08:40', name:'Room Mate Alba', badge:'숙소 출발', kind:'rest', desc:'마드리드 베이스. 프라도·솔 이동 피로 최소.', tags:['중심 숙소','지하철'], safety:'safe' },
        { t:'10:00', name:'프라도 미술관', badge:'미술관', kind:'spot', desc:'오전 예약. 비 오면 체류 연장 후보.', tags:['€15','실내'], safety:'safe' },
        { t:'13:10', name:'Mercado de San Miguel', badge:'점심', kind:'meal', desc:'예산 초과 알림 포인트. 평균 금액 자동 비교.', tags:['평균 €22','혼잡'], safety:'safe', mealReroute:true },
        { t:'16:20', name:'레티로 공원', badge:'휴식', kind:'rest', desc:'걷기 부담이 있으면 숙소 카페로 전환.', tags:['휴식','도보'], safety:'safe' },
        { t:'20:50', name:'솔 광장', badge:'야간 이동', kind:'risk', desc:'야간 대로변 경로 기본값. 안전 알림 연결.', tags:['대로변','택시 가능'], safety:'warn', safeReroute:true },
      ]
    },
    sevilla: {
      title:'세비야 구시가지와 플라멩코 루트',
      desc:'알카사르 → 히랄다 탑 → 플라멩코 공연. 폭염 주의 — 오전·저녁 집중.',
      stops:[
        { t:'08:00', name:'Hotel Amadeus', badge:'숙소 출발', kind:'rest', desc:'세비야 베이스. 구시가지 도보권.', tags:['구시가지 중심'], safety:'safe' },
        { t:'09:00', name:'알카사르', badge:'왕궁', kind:'spot', desc:'오전 예약 필수. 오후는 관광객 과밀.', tags:['€14.50','예약 필수'], safety:'safe' },
        { t:'12:30', name:'El Rinconcillo', badge:'점심', kind:'meal', desc:'1670년 창업 타파스 바. 현지 추천 최상위.', tags:['평균 €18','현지 맛집'], safety:'safe', mealReroute:true },
        { t:'19:00', name:'Casa de la Memoria', badge:'플라멩코', kind:'spot', desc:'소규모 공연장. 예약 필수 — 전날 마감 빈번.', tags:['€18','예약 필수','저녁'], safety:'safe' },
        { t:'22:00', name:'숙소 복귀', badge:'야간', kind:'risk', desc:'구시가지 골목 야간 소매치기 주의. 대로변 이용.', tags:['대로변 복귀'], safety:'warn', safeReroute:true },
      ]
    },
    granada: {
      title:'그라나다 알함브라와 알바이신 루트',
      desc:'알함브라 오전 예약 필수. 오후 알바이신 언덕 산책.',
      stops:[
        { t:'08:30', name:'Hotel Casa 1800', badge:'숙소 출발', kind:'rest', desc:'알함브라 도보 20분. 알바이신 뷰.', tags:['알람브라 근접'], safety:'safe' },
        { t:'09:00', name:'알함브라 궁전', badge:'예약 입장', kind:'spot', desc:'오전 슬롯만 입장 가능. 예약 번호 필수 지참.', tags:['€14','예약 필수','포토'], safety:'safe' },
        { t:'13:00', name:'Bodegas Castañeda', badge:'점심', kind:'meal', desc:'전통 타파스. 무료 타파스 제공 시간 확인.', tags:['평균 €16'], safety:'safe', mealReroute:true },
        { t:'16:00', name:'알바이신 전망대', badge:'전망', kind:'spot', desc:'알함브라 맞은편 언덕. 일몰 뷰 최상.', tags:['도보 25분','포토','일몰'], safety:'safe' },
        { t:'21:30', name:'숙소 복귀', badge:'야간', kind:'risk', desc:'알바이신 언덕 야간 단독 비권장. 택시 이용 권고.', tags:['택시 추천'], safety:'warn', safeReroute:true },
      ]
    },
    malaga: {
      title:'말라가 구시가지와 피카소 생가 루트',
      desc:'피카소 박물관 → 히브랄파로 성 → 말라게타 해변.',
      stops:[
        { t:'09:30', name:'Room Mate Valeria', badge:'숙소 출발', kind:'rest', desc:'말라가 구시가지 중심.', tags:['해변 도보권'], safety:'safe' },
        { t:'10:00', name:'피카소 박물관', badge:'미술관', kind:'spot', desc:'피카소 생가 인근. 오전이 한산.', tags:['€12','실내'], safety:'safe' },
        { t:'13:00', name:'El Pimpi', badge:'점심', kind:'meal', desc:'말라가 대표 와인 바. 해산물 추천.', tags:['평균 €22'], safety:'safe', mealReroute:true },
        { t:'16:00', name:'히브랄파로 성', badge:'전망', kind:'spot', desc:'항구와 해변 파노라마 뷰.', tags:['€3.5','도보 30분'], safety:'safe' },
        { t:'20:00', name:'말라게타 해변', badge:'석양', kind:'rest', desc:'해질녘 해변 산책. 저녁 전 여유.', tags:['무료','석양'], safety:'safe' },
      ]
    },
    valencia: {
      title:'발렌시아 예술과 파에야 루트',
      desc:'예술과학도시 → 중앙시장 → 라 말바로사 해변.',
      stops:[
        { t:'09:00', name:'SH Valencia Palace', badge:'숙소 출발', kind:'rest', desc:'발렌시아 구시가지 인근.', tags:['도보권'], safety:'safe' },
        { t:'10:00', name:'예술과학도시', badge:'건축', kind:'spot', desc:'칼라트라바 설계. 반일 코스 권장.', tags:['€38 통합','포토'], safety:'safe' },
        { t:'13:30', name:'La Pepica', badge:'점심', kind:'meal', desc:'헤밍웨이가 즐겨찾던 파에야 원조 레스토랑.', tags:['평균 €28','예약 권장'], safety:'safe', mealReroute:true },
        { t:'16:30', name:'발렌시아 중앙시장', badge:'쇼핑', kind:'spot', desc:'유럽 최대 재래시장. 스낵·과일 구매.', tags:['무료입장','현지 체험'], safety:'safe' },
        { t:'19:00', name:'라 말바로사 해변', badge:'석양', kind:'rest', desc:'발렌시아 메인 해변. 석양 타이밍 맞추기.', tags:['트램 이동','석양'], safety:'safe' },
      ]
    },
    bilbao: {
      title:'빌바오 구겐하임과 핀초스 루트',
      desc:'비스케이만 날씨 변동 큼. 우산 필수. 핀초스 바 탐방 저녁 집중.',
      stops:[
        { t:'10:00', name:'Gran Hotel Domine', badge:'숙소 출발', kind:'rest', desc:'구겐하임 바로 앞 위치.', tags:['구겐하임 도보 1분'], safety:'safe' },
        { t:'10:15', name:'구겐하임 미술관', badge:'미술관', kind:'spot', desc:'티타늄 외관 필수 포토. 내부 현대미술 컬렉션.', tags:['€16','포토'], safety:'safe' },
        { t:'13:30', name:'레스토랑 Etxanobe', badge:'점심', kind:'meal', desc:'빌바오 대표 바스크 요리. 예약 권장.', tags:['평균 €35'], safety:'safe', mealReroute:true },
        { t:'17:00', name:'카스코 비에호', badge:'구시가지', kind:'spot', desc:'빌바오 구시가지. 핀초스 바 밀집 구역.', tags:['도보 탐방'], safety:'safe' },
        { t:'20:00', name:'핀초스 바 투어', badge:'저녁', kind:'meal', desc:'Plaza Nueva 주변 5개 바 순차 방문.', tags:['바당 €8-12'], safety:'safe', mealReroute:true },
      ]
    },
    sansebastian: {
      title:'산세바스티안 미슐랭 핀초스 루트',
      desc:'세계 최고 밀도 미슐랭 레스토랑 도시. 파르테 비에하(구시가지) 집중.',
      stops:[
        { t:'09:30', name:'Hotel de Londres', badge:'숙소 출발', kind:'rest', desc:'콘차 해변 바로 앞. 최고 위치.', tags:['해변 즉시'], safety:'safe' },
        { t:'10:00', name:'콘차 해변', badge:'산책', kind:'rest', desc:'유럽 최고 도심 해변. 오전 산책 코스.', tags:['무료','포토'], safety:'safe' },
        { t:'13:00', name:'Bar Nestor', badge:'점심', kind:'meal', desc:'예약 없이 줄 서서 입장. 토마토 샐러드·스테이크 유명.', tags:['예약 불가','현금만'], safety:'safe', mealReroute:true },
        { t:'16:00', name:'몬테 이겔도', badge:'전망', kind:'spot', desc:'케이블카 탑승. 만 전경 포토 포인트.', tags:['€3.5 케이블카','포토'], safety:'safe' },
        { t:'20:00', name:'파르테 비에하 핀초스', badge:'저녁', kind:'meal', desc:'세계 최고 핀초스 바 투어. 1인 €30-40 예산.', tags:['바당 €6-10','핀초스'], safety:'safe', mealReroute:true },
      ]
    },
    zaragoza: {
      title:'사라고사 필라르 대성당과 무데하르 루트',
      desc:'바르셀로나↔마드리드 중간 거점. 무데하르 건축 세계유산 집중.',
      stops:[
        { t:'10:00', name:'Hotel Palafox', badge:'숙소 출발', kind:'rest', desc:'사라고사 중심가. 대성당 도보권.', tags:['구시가지 중심'], safety:'safe' },
        { t:'10:30', name:'필라르 대성당', badge:'성당', kind:'spot', desc:'에브로 강변 고야 프레스코화. 탑 등반 권장.', tags:['무료(탑 €3)','포토'], safety:'safe' },
        { t:'13:00', name:'La Rinconada de Lorenzo', badge:'점심', kind:'meal', desc:'아라곤 전통 요리. 현지 추천 맛집.', tags:['평균 €20'], safety:'safe', mealReroute:true },
        { t:'15:00', name:'알하페리아 궁전', badge:'왕궁', kind:'spot', desc:'이슬람-기독교 혼합 무데하르 건축 정수.', tags:['€5','세계유산'], safety:'safe' },
        { t:'20:00', name:'숙소 복귀', badge:'야간', kind:'risk', desc:'구시가지 야간 이동. 대로변 기본.', tags:['야간 주의'], safety:'warn', safeReroute:true },
      ]
    },
    return: {
      title:'공항 복귀와 여유 시간',
      desc:'출국일은 교통 안정성 우선. 변수 대응이 핵심.',
      stops:[
        { t:'08:30', name:'체크아웃', badge:'출발', kind:'rest', desc:'짐 보관 또는 바로 공항 이동.', tags:['체크아웃'], safety:'safe' },
        { t:'10:30', name:'기차역 이동', badge:'교통', kind:'spot', desc:'예산·시간 기준 기차/택시 비교.', tags:['교통비'], safety:'safe' },
        { t:'12:20', name:'공항 근처 식사', badge:'점심', kind:'meal', desc:'남은 예산 기준 마지막 식사.', tags:['평균 €18'], safety:'safe', mealReroute:true },
        { t:'14:00', name:'공항 도착', badge:'출국', kind:'spot', desc:'여유 있게 도착 루트 고정.', tags:['출국','완료'], safety:'safe' },
      ]
    }
  };

export const EUR_TO_KRW = 1470;

export const INITIAL_EXPENSES = [
    { name:'아침 카페', cat:'meal', amt:12 },
    { name:'지하철 L5', cat:'transport', amt:2.4 }
  ];
