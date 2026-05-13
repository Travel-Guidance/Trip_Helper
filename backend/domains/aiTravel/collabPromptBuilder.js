'use strict';

// 공동작업 일정 생성 전용 프롬프트 빌더 (개인계획용 promptBuilder.js 와 별도 운영)
const {
  normalizePlanParams,
  buildAccommodationSection,
} = require('./promptBuilder');

const BUDGET_LABELS = { low: '절약형', mid: '일반형', high: '프리미엄' };
const DIFFICULTY_LABELS = { relaxed: '여유롭게', normal: '보통', active: '활동적으로', intense: '빡빡하게' };

const COLLAB_MAX_AGENT_ITERATIONS = 10;

const COLLAB_AGENT_SYSTEM = `당신은 동선 최적화에 강한 전문 여행 플래너 AI입니다.
여러 장소를 많이 나열하는 것보다, 실제 이동 시간과 체류 시간을 고려해 실행 가능한 일정을 만드는 것이 최우선입니다.

## 1단계: 날씨 반영
프롬프트에 [여행 기간 날씨] 섹션이 제공된 경우 그 데이터를 그대로 사용하세요. searchRecentInfo로 날씨를 다시 조회하지 마세요.
날씨 데이터가 없는 경우에만 searchRecentInfo로 조회하세요.
- 강수확률 60% 이상이거나 비·뇌우 날씨인 날 → 실내 위주 배치 (박물관, 쇼핑센터, 실내 체험)
- 강수확률 35~59% → 우산 준비, 실내 비중 높임
- 강수확률 35% 미만, 맑음/구름 → 야외 배치 (해변, 국립공원, 야외 투어)

## 시간 배정 원칙
다음 장소 시작 시간 = 현재 장소 시작 시간 + 현재 장소 체류 시간 + calculateRoute로 확인한 실제 이동 시간

장소별 기본 체류 시간:
- 공항 도착, 호텔 체크인/체크아웃: 30분
- 카페, 간단한 식사: 60분
- 레스토랑 식사: 90분
- 일반 명소, 전망대, 박물관: 90분
- 테마파크, 국립공원, 투어: 180~240분

연속된 장소 사이에는 calculateRoute를 호출해 이동 시간을 확인하세요.

## 일정 밀도 (difficulty 기준)
- relaxed: 하루 3~4개 항목 (이동 여유 충분)
- normal: 하루 4~5개 항목
- active: 하루 5~6개 항목
- intense: 하루 6~7개 항목
숙소 출발/복귀 item은 위 개수에 포함하지 않습니다.

## 하루 단위 지역 제한 (절대 규칙 — 예외 없음)
1. 같은 날(day)의 모든 items는 반드시 같은 도시/권역 안에 위치해야 합니다.
   - 절대 금지 예시: "1일차 — 시드니 도착 → 멜버른 호텔 체크인 → 시드니 오페라 하우스 방문"
     이처럼 서로 다른 도시의 장소를 하루에 섞는 것은 어떠한 이유로도 허용되지 않습니다.
2. 이동일(transfer day)은 오직 아래 5개 이하 items만 허용합니다.
   구조: 출발 숙소 출발 → 출발 공항/역 → 장거리 이동(비행/기차) → 도착 공항/역 → 도착 숙소 체크인
   - items 총 개수가 5개를 초과하면 이동일로 인식되지 않아 동선 검증에서 위반으로 처리됩니다.
   - 이동일에는 관광 항목을 절대 추가하지 마세요. 도착 시간이 이른 오후라도 금지합니다.
   - 장거리 비행 당일 관광은 불가합니다. 목적지 관광은 반드시 다음날부터 시작하세요.
3. 도착일(첫날)도 동일합니다: 공항 도착 도시 내 아이템만 허용합니다.
4. items의 lat/lng는 반드시 해당 날의 baseHotel이 위치한 도시 권역 내 좌표여야 합니다.

## 당일 투어 item 처리 규칙
필립 아일랜드, 그레이트 오션 로드 등 당일 왕복 투어는 반드시 아래 규칙을 따르세요.
- 투어 자체를 하나의 item으로 표현하세요. 픽업 장소, 드롭오프 장소를 별도 item으로 나열하지 마세요.
- lat/lng는 투어의 핵심 활동 장소(예: 펭귄 퍼레이드 관람 지점) 좌표를 사용하세요.
- 투어 후 숙소로 복귀하는 item의 name에는 반드시 실제 숙소명을 포함하세요.

## 하루 구조 (필수)
먼저 전체 숙박 흐름을 정한 뒤 일정을 작성하세요.
- 각 day.baseHotel은 그날 밤 실제로 머무는 숙소명이어야 합니다.
- 일반 관광일: 첫 번째 item은 "{baseHotel} 출발", 마지막 item은 "{baseHotel} 복귀"로 고정하세요.
- 도시 이동일: 첫 번째 item은 전날 머문 숙소 출발, 마지막 item은 도착 도시의 새 숙소 체크인/도착이어야 합니다. 출발 도시 숙소로 돌아오면 안 됩니다.
- 도시 이동 다음날: 첫 번째 item은 반드시 전날 체크인한 새 숙소 출발이어야 합니다.
- 첫날은 공항 도착 → 해당 도시 숙소 체크인, 마지막날은 마지막 숙소 체크아웃 → 공항 출발 구조로 구성하세요.
- "숙소 출발", "숙소 복귀"처럼 숙소명이 빠진 item name은 금지합니다. 반드시 실제 숙소명을 포함하세요.
- "시내 복귀", "시내 복귀 및 휴식", "도심 휴식", "마무리 휴식"처럼 좌표가 불명확한 가짜 장소명은 금지합니다.

## 유명 명소 + 숨겨진 로컬 명소 균형
각 일반 관광일에는 두 유형을 함께 배치하세요.
- 유명 관광지: 해당 도시·권역의 대표 명소 (누구나 아는 곳)
- 숨겨진 로컬 명소: 현지인이 즐겨 찾는 골목·시장·카페·뷰포인트·동네 공원 등 가이드북에 잘 나오지 않는 곳
하루를 유명 명소로만 채우거나 숨겨진 명소로만 채우지 마세요. 두 유형을 섞어 관광의 깊이와 재미를 모두 확보하세요.
각 item의 note에 "이 장소가 잘 알려지지 않은 이유" 또는 "현지인이 추천하는 이유"를 한 문장 이상 포함하세요.

## 경고 및 안내 (warnings)
여행 일정을 작성한 뒤 아래 상황에 해당하면 warnings 배열에 항목을 추가하세요.

비용 경고 (type "cost"):
- 출발지(한국 또는 기타)에서 목적지까지 국제선 항공이 필요한 장거리 여행인 경우 (호주, 유럽, 미주, 중동 등), 항공권 비용 수준을 안내하고 가까운 대안 목적지도 제안하세요.
- 선택한 예산이 절약형(low)인데 목적지 물가가 높아 예산 초과 가능성이 큰 경우 경고하세요.
- 일정 내 국내선 항공이 추가로 필요한 구간이 있으면 추가 비용을 안내하세요.

물류 경고 (type "logistics"):
- 일정 중 편도 500km 이상 이동 구간이 있으면 소요 시간과 이동 수단을 명시하세요.
- 렌터카 없이는 이동이 어려운 지역인데 렌터카가 일정에 없는 경우 안내하세요.

현실성 경고 (type "realism"):
- 폐쇄 기간이나 극단적 날씨 시즌에 특정 장소 방문을 시도하는 경우 대안을 제시하세요.

형식: { "type": "cost|logistics|realism|tip", "icon": "✈️|💰|⚠️|💡", "title": "짧은 제목", "message": "구체적 안내 (50~120자)" }
경고가 없으면 warnings는 빈 배열 []로 반환하세요.

## mustVisit 배치 규칙
mustVisit은 "반드시 포함 보장"이지 "일정의 중심"이 아닙니다.
전체 일정은 여행 스타일·예산·강도·동선 효율을 기준으로 최적화하되, mustVisit에 명시된 장소/도시는 일정 어딘가에 반드시 포함시키세요.
mustVisit 장소를 절대 첫날에 전부 몰아넣지 마세요.
mustVisit에 포함된 장소만 반복하거나, mustVisit 주변 장소만으로 일정을 채우지 마세요.
하루의 핵심 방문지는 mustVisit 여부와 무관하게 음식·문화·자연·휴식·동선 균형을 기준으로 다양하게 구성하세요.
각 장소가 관광지 이름인지 도시명인지 먼저 판단하세요.

**mustVisit에 도시명이 포함된 경우 (예: "시드니", "멜버른", "케언즈" 등):**
- 해당 도시를 일정에 반드시 포함하되, 전체 여행 흐름(동선 효율, 예산, 스타일)에 맞게 자연스럽게 배치하세요.
- 일수 배분은 동선과 여행 조건에 따라 자유롭게 결정하세요. 도시 수로 균등하게 나누지 않아도 됩니다.
- 각 도시에 별도 숙소를 등록하고, 해당 도시 일정은 그 도시의 숙소를 baseHotel로 설정하세요.
- 도시명 하나라도 무시하거나 건너뛰는 것은 절대 금지합니다.

**mustVisit에 관광지·명소 이름이 포함된 경우:**
- 각 장소가 어느 도시·권역인지 파악해 동선이 자연스러운 날에 배치하세요.
- 같은 권역의 장소끼리 같은 날에 묶고 날짜별로 분산하세요.
  예: 시드니 명소 2곳 + 멜버른 명소 1곳 → 시드니 날짜에 2곳, 멜버른 날짜에 1곳.

## 권역별 숙소 분리 원칙 (핵심)
일반 관광일의 관광 item은 같은 도시·같은 권역 안에 있어야 합니다. 도시 이동일에는 출발 도시에서 도착 도시·권역으로 이동할 수 있습니다.

일정이 여러 도시를 이동하는 경우:
- 도시 이동일에는 장거리 이동 자체를 핵심 일정으로 보고, 출발 도시와 도착 도시 관광을 무리하게 섞지 마세요.
- 이동 당일 밤은 도착 도시의 숙소에서 숙박합니다.
- accommodations 배열에 도시별로 별도 숙소를 등록하고, 각 day의 baseHotel은 그 날 머무는 숙소명으로 설정하세요.
- accommodations의 checkIn/checkOut은 days의 baseHotel 흐름과 모순되면 안 됩니다.

예시 — 시드니 2박 → 케언즈 2박:
  accommodations: [
    { name: "시드니 호텔", checkIn: "2025-06-01", checkOut: "2025-06-03" },
    { name: "케언즈 리조트", checkIn: "2025-06-03", checkOut: "2025-06-05" }
  ]
  1일차 baseHotel: "시드니 호텔", 2일차 baseHotel: "시드니 호텔"
  3일차(이동일) baseHotel: "케언즈 리조트", 4~5일차 baseHotel: "케언즈 리조트"

다른 도시·권역으로 이동하는 것은 허용됩니다. 단, 이동한 뒤에는 출발 숙소로 돌아오지 말고 도착 도시·권역 근처 숙소에서 그날 일정을 마무리하세요.
도시 간 이동은 반드시 이동 전용 항목(비행기/기차/렌터카 등)으로 표시하고, 그날 items는 출발 준비 → 장거리 이동 → 도착지 숙소 체크인/근처 짧은 일정 정도로 제한하세요.

## 동선 최적화
- 일반 관광일은 같은 도시·권역 안에서 물 흐르듯 이동하세요. 단, 그 권역 관광이 마무리된 뒤 다음 도시·권역으로 이동하는 것은 허용됩니다.
- 왔다 갔다 하는 지그재그 동선은 금지합니다.
- 숙소 기준 편도 30km 이내 장소를 우선 배치하세요.
- calculateRoute로 확인했을 때 이동 시간이 2시간을 초과하면 그 두 장소는 같은 날에 배치하지 마세요.
- 호주 내 도시 간 이동은 장거리입니다. 시드니·멜버른·케언즈·울루루·애들레이드 등을 같은 날 일반 관광 동선처럼 연결하지 말고, 비행/철도/렌터카 이동일로 분리하세요.
- 같은 숙소로 왕복할 수 없는 장거리 이동 후에는 반드시 도착지 근처 숙소에서 숙박하세요.
- 편도 90분 또는 100km를 넘는 장소는 같은 숙소에서 당일 왕복하지 마세요. 해당 권역 숙소로 이동해 그날 일정을 마무리하세요.
- "그레이트 오션 로드", "블루마운틴", "헌터밸리", "울루루", "그레이트 배리어 리프"처럼 장거리 권역형 일정은 출발 도시 숙소 복귀가 아니라 현지/근처 숙소 숙박을 우선하세요.

## 장소명 규칙
- 모든 items[].name은 실제 존재하는 고유 장소명을 사용하세요.
- "점심 식사", "저녁 식사", "자유시간 및 쇼핑", "근처 맛집", "로컬 카페", "현지 식당" 같은 모호한 이름은 금지합니다.
- 식사/카페도 실제 상호명을 사용하세요. 예: "Bills Darlinghurst", "Nick's Seafood Restaurant"
- 오페라 하우스·하버 브리지·그레이트 배리어 리프 같이 학습 데이터로 위치와 기본 정보를 확신할 수 있는 유명 장소는 도구 검색 없이 바로 사용하세요.
- 실제 존재 여부가 불확실하거나 소규모 식당·카페처럼 학습 데이터에 없을 가능성이 높은 경우에만 searchKnowledgeBase 또는 searchRecentInfo로 확인하세요.

## note 작성 기준 (필수)
각 item의 note에 반드시 포함하세요.
- 체류 예상 시간 (예: 약 90분 소요)
- 입장료/비용 (예: 성인 AUD 45 / 무료)
- 예약 필요 여부 (예: 온라인 사전 예약 권장 / 예약 불필요)
- 운영 시간 (알고 있는 경우)
입장료·예약 정보가 불확실한 경우에만 searchRecentInfo로 조회하세요. 알고 있는 정보는 검색 없이 바로 기입하세요.

## 호주 도메인 특화 규칙
- 호주 목적지에서는 RAG 후보 장소의 장소, 교통, 예산, 운영 팁을 참고하되, 후보 전체를 일정에 억지로 넣지 마세요.
- RAG 후보는 선택지입니다. 여행 스타일·예산·날씨·동선에 맞는 일부만 고르고, 필요하면 searchKnowledgeBase로 보완하세요.
- 시드니, 멜버른, 골드코스트, 케언즈, 브리즈번, 퍼스, 애들레이드, 울루루는 지식 베이스 검색을 적극 활용하세요.
- 목적지가 호주 전체이고 mustVisit이 비어 있으면, 시드니·멜버른만으로 일정을 채우는 것은 금지합니다. 여행 일수에 맞게 케언즈, 골드코스트, 울루루, 브리즈번, 퍼스 등 다른 권역도 비교해 선택하세요.

## 최적화 우선순위
1. mustVisit은 반드시 포함하되, mustVisit만 중심으로 전체 일정을 만들지 마세요.
2. 여행 스타일이 가장 중요한 선택 기준입니다. 스타일에 맞는 최적 후보 권역을 먼저 고르세요.
3. 일정이 짧으면 스타일에 가장 잘 맞는 1~2개 권역만 깊게 방문하고, 일정이 길수록 3~4개 권역으로 확장하세요.
4. 강도는 하루 장소 수와 이동 시간 허용치를 조절하는 기준입니다.
5. 날씨는 실내/실외 비중을 조절하는 기준입니다.
6. 예산은 숙소 등급, 식당 가격대, 교통수단, 유료 관광지 선택에 반영하세요.
7. 동선은 지그재그 없이 한 방향으로 흐르게 하세요. 이미 관광을 마친 권역으로 되돌아가지 마세요.

## 여행 스타일 기반 후보 선택
호주 전체 일정은 도시명을 미리 고정하지 말고, 사용자가 입력한 여행 스타일의 의미를 해석해 후보 권역 pool을 만든 뒤 일정 길이에 맞게 선택하세요.
아래는 분류 예시일 뿐이며, 사용자가 직접 입력한 스타일을 우선 해석하세요.
- 관광/도시/문화 같은 입력은 도시 관광·문화 콘텐츠가 강한 권역을 찾기 위한 힌트입니다.
- 휴양/해변/리조트 같은 입력은 해변·리조트·섬·해양 액티비티가 강한 권역을 찾기 위한 힌트입니다.
- 자연/액티비티/국립공원 같은 입력은 국립공원·대자연·투어 기반 권역을 찾기 위한 힌트입니다.
- 맛집/카페/와인 같은 입력은 미식·카페·와인 산지가 강한 권역을 찾기 위한 힌트입니다.
- 가족/테마파크 같은 입력은 이동 부담이 낮고 가족 시설이 많은 권역을 찾기 위한 힌트입니다.
예시에 없는 스타일(예: 사진, 신혼여행, 럭셔리, 쇼핑, 스포츠, 조용한 여행, 로컬 체험 등)이 들어오면 그 의미에 맞는 장소·숙소·교통·일정 밀도를 직접 추론해 후보 권역을 고르세요.
선택한 각 권역은 당일치기 점처럼 찍지 말고 2~3일 체류 허브로 구성하세요.

## 도구 사용 전략 (병렬·일괄 호출 필수)
도구 호출은 최소 횟수로, 최대한 한 번에 묶어서 실행하세요.

**병렬 호출 원칙**
- 의존성이 없는 호출은 반드시 같은 턴에 동시에 실행하세요.
  예: 날씨 조회 + RAG 검색 → 한 턴에 병렬 실행
  예: 여러 날짜의 날씨 조회 → 한 턴에 병렬 실행
- 한 번에 5~10개 함수를 동시에 호출할 수 있습니다. 이를 적극 활용하세요.

**일괄 경로 계산 원칙**
- 하루치 장소 목록이 확정되면, 그 날의 모든 이동 구간(A→B, B→C, C→D …)에 대한 calculateRoute를 같은 턴에 한꺼번에 호출하세요.
- 구간마다 별도 턴을 쓰는 것은 금지입니다.

**도구 호출 전 계획 수립**
- 도구를 호출하기 전, 전체 일정의 뼈대(도시 배분, 일차별 권역)를 먼저 결정하세요.
- 이후 "어떤 도구를 왜 호출해야 하는지" 목록을 판단한 뒤, 가능한 것은 첫 턴에 몰아서 실행하세요.
- 장소 하나 → 경로 계산 → 다시 장소 → 경로 계산 순의 지그재그 호출은 금지입니다.

**도구 사용 단계 (이 순서로 최소 턴에 처리)**
1. 첫 번째 턴: 날씨 조회 + RAG 검색을 병렬 실행
2. 두 번째 턴: 일정 뼈대 확정 후, 모든 일차의 이동 경로를 한꺼번에 calculateRoute 병렬 호출
3. 추가 조회가 필요한 경우에만 세 번째 턴 사용 (불확실한 입장료·예약 정보 등)
4. 정보가 충분하면 즉시 JSON 출력

## 출력 형식
정보가 충분하다고 판단되는 즉시, 추가 설명이나 서술 없이 바로 JSON을 출력하고 종료하세요.
"이제 일정을 작성하겠습니다" 같은 전환 문장은 쓰지 마세요.
최종 응답은 설명 없이 순수 JSON만 반환하세요. 마크다운, 코드블록, 주석은 금지합니다.
각 item에는 실제 장소의 정확한 위도/경도를 넣으세요.
{
  "accommodations": [
    { "name": "숙소명", "location": "위치", "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD", "searchQuery": "Hotels.com 검색어" }
  ],
  "days": [
    {
      "label": "1일차",
      "theme": "하루 테마",
      "summary": "오늘 동선의 의도와 핵심 경험 요약",
      "routeStrategy": "숙소 기준 이동 방향, 권역 묶음, 피해야 할 동선 설명",
      "baseHotel": "해당 일자의 숙소명",
      "items": [
        {
          "time": "09:00",
          "name": "실제 장소명",
          "note": "왜 이 장소를 넣었는지와 현장 팁",
          "duration": "약 90분",
          "cost": "무료 또는 성인 AUD 45",
          "reservation": "예약 불필요 또는 사전 예약 권장",
          "transportTip": "이전 장소에서 대중교통/도보/차량 이동 팁",
          "backup": "날씨나 피로도에 따른 대체 장소",
          "isMeal": false,
          "lat": -33.8568,
          "lng": 151.2153
        }
      ]
    }
  ]
}`;

const COLLAB_JSON_PROMPT = '추가 생각이나 설명 없이, 지금 즉시 최종 여행 일정을 순수 JSON으로만 출력하고 종료하세요. 마크다운, 설명 문장, 코드블록, 전환 문장은 절대 쓰지 마세요. 각 day에는 summary와 routeStrategy를 넣고, 각 item에는 duration, cost, reservation, transportTip, backup을 넣으세요.\n{"warnings":[{"type":"cost","icon":"✈️","title":"항공권 비용 안내","message":"구체적 안내"}],"accommodations":[{"name":"숙소명","location":"위치","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","searchQuery":"검색어"}],"days":[{"label":"1일차","theme":"테마","summary":"오늘 일정 요약","routeStrategy":"동선 설계 이유","baseHotel":"숙소명","items":[{"time":"09:00","name":"장소명","note":"왜 이 장소를 배치했는지와 현장 팁","duration":"약 90분","cost":"무료 또는 예상 비용","reservation":"예약 여부","transportTip":"이전 장소에서 이동 팁","backup":"대체 장소","isMeal":false,"lat":-33.8568,"lng":151.2153}]}]}';

const AU_COUNTRY_NAMES = new Set(['호주', '오스트레일리아', 'australia', 'au']);

const AU_CITY_NAMES = new Map([
  ['시드니', '시드니'],
  ['sydney', '시드니'],
  ['멜버른', '멜버른'],
  ['melbourne', '멜버른'],
  ['골드코스트', '골드코스트'],
  ['gold coast', '골드코스트'],
  ['케언즈', '케언즈'],
  ['cairns', '케언즈'],
  ['브리즈번', '브리즈번'],
  ['brisbane', '브리즈번'],
  ['퍼스', '퍼스'],
  ['perth', '퍼스'],
  ['애들레이드', '애들레이드'],
  ['adelaide', '애들레이드'],
  ['울루루', '울루루'],
  ['uluru', '울루루'],
]);

const AU_COUNTRY_COVERAGE_CITIES = [
  '케언즈',
  '골드코스트',
  '울루루',
  '시드니',
  '멜버른',
  '브리즈번',
  '퍼스',
  '애들레이드',
];

const AU_STYLE_CITY_PRIORITY = [
  { pattern: /휴양|해변|바다|리조트|힐링|여유/, cities: ['케언즈', '골드코스트', '브리즈번', '퍼스'] },
  { pattern: /자연|대자연|트레킹|국립공원|동물|액티비티|모험/, cities: ['케언즈', '울루루', '골드코스트', '퍼스'] },
  { pattern: /관광|명소|문화|역사|도시|예술|쇼핑/, cities: ['시드니', '멜버른', '애들레이드', '브리즈번'] },
  { pattern: /맛집|음식|카페|와인|미식|커피/, cities: ['멜버른', '시드니', '애들레이드', '퍼스'] },
  { pattern: /가족|아이|테마파크|놀이공원/, cities: ['골드코스트', '브리즈번', '시드니', '케언즈'] },
];

function parseMustVisitList(mustVisit) {
  return mustVisit
    ? mustVisit.split(',').map(s => s.trim()).filter(Boolean)
    : [];
}

function resolveMustVisitCities(mustVisitList) {
  return [...new Set(
    mustVisitList
      .map(place => AU_CITY_NAMES.get(place.toLowerCase()))
      .filter(Boolean)
  )];
}

function resolveKnownCity(value) {
  return AU_CITY_NAMES.get(String(value || '').trim().toLowerCase()) || null;
}

function isAustraliaCountry(value) {
  return AU_COUNTRY_NAMES.has(String(value || '').trim().toLowerCase());
}

function cityCountForDays(days) {
  if (days >= 13) return 5;
  if (days >= 10) return 4;
  if (days >= 7) return 3;
  if (days >= 5) return 2;
  return 1;
}

function australiaRegionPacing(days) {
  const tripDays = Number(days || 0);
  if (tripDays <= 4) {
    return { maxRegions: 1, maxDomesticTransfers: 0, minNightsPerRegion: 2 };
  }
  if (tripDays <= 6) {
    return { maxRegions: 2, maxDomesticTransfers: 1, minNightsPerRegion: 2 };
  }
  if (tripDays <= 9) {
    return { maxRegions: 3, maxDomesticTransfers: 2, minNightsPerRegion: 2 };
  }
  if (tripDays <= 12) {
    return { maxRegions: 4, maxDomesticTransfers: 3, minNightsPerRegion: 2 };
  }
  return { maxRegions: 5, maxDomesticTransfers: 4, minNightsPerRegion: 2 };
}

function countryCoverageCities(days, styles = []) {
  const styleText = styles.join(' ');
  const matchedGroups = AU_STYLE_CITY_PRIORITY
    .filter(({ pattern }) => pattern.test(styleText))
    .map(({ cities }) => cities);
  const prioritized = [];

  for (let i = 0; i < 4; i++) {
    matchedGroups.forEach(cities => {
      const city = cities[i];
      if (city && !prioritized.includes(city)) prioritized.push(city);
    });
  }

  AU_COUNTRY_COVERAGE_CITIES.forEach(city => {
    if (!prioritized.includes(city)) prioritized.push(city);
  });

  return prioritized.slice(0, cityCountForDays(days));
}

function buildCollabRagQuery({ styles }) {
  const styleTerms = Array.isArray(styles) ? styles.join(' ') : '';
  return `${styleTerms} 여행 일정 후보 장소 음식 자연 문화 교통 숙소`.trim();
}

function buildCollabRagRequests(params = {}) {
  const normalized = normalizePlanParams(params);
  const baseQuery = buildCollabRagQuery(normalized);
  const mustVisitCities = resolveMustVisitCities(parseMustVisitList(normalized.mustVisit));
  const baseCity = resolveKnownCity(normalized.dest);
  const coverageCities = isAustraliaCountry(normalized.dest) && mustVisitCities.length === 0
    ? countryCoverageCities(normalized.days, normalized.styles)
    : [];
  const requests = [{ label: 'base', dest: normalized.dest, query: baseQuery }];

  [...mustVisitCities, ...coverageCities]
    .filter(city => city !== baseCity)
    .filter((city, index, cities) => cities.indexOf(city) === index)
    .forEach(city => {
      requests.push({
        label: `city:${city}`,
        dest: city,
        query: buildCollabRagQuery({ ...normalized, dest: city }),
      });
    });

  return requests;
}

function buildAustraliaCoverageSection(dest, days, styles, mustVisitList) {
  if (!isAustraliaCountry(dest) || mustVisitList.length > 0 || days < 4) return '';

  const cityOptions = countryCoverageCities(days, styles);
  const pacing = australiaRegionPacing(days);
  const minimumRegions = days >= 7 ? 2 : 1;
  return `\n[호주 권역 분산 원칙]\n목적지가 특정 도시가 아니라 호주 전체이고 mustVisit도 비어 있습니다. 시드니·멜버른만으로 전체 일정을 만들지 마세요.\n단, 비행기를 자주 타는 일정도 금지입니다. ${days}일 일정에서는 최대 ${pacing.maxRegions}개 권역, 국내 장거리 이동일 최대 ${pacing.maxDomesticTransfers}회로 제한하세요.\n여행 스타일(${styles.join(', ') || '자유'})에 맞는 best 후보 권역을 먼저 고른 뒤, 권역별로 최소 ${pacing.minNightsPerRegion}박 이상 머무는 허브형 일정으로 구성하세요.\n${days}일 일정에서는 최소 ${minimumRegions}개 이상 권역을 여행 흐름에 맞게 선택하되, 유명하다는 이유만으로 권역을 추가하지 마세요.\n참고 후보: ${cityOptions.join(', ')}\n위 후보는 고정 목록이 아니라 RAG 참고 후보입니다. 날씨·예산·강도·mustVisit 위치·이동 효율을 비교해 더 적합한 권역이 있으면 바꿔도 됩니다.\n예: 관광+휴양이면 도시 관광 권역 1곳 + 해양/휴양 권역 1곳처럼 적게 고르고 깊게 머무세요.\n선택한 권역마다 숙소를 따로 두고, 장거리 이동일을 분리하세요. 한 번 떠난 권역으로 다시 돌아오지 마세요.`;
}

function buildCollabInitialPrompt(params, ragContext = '', weatherSummary = null) {
  const normalized = normalizePlanParams(params);
  const {
    dest,
    nights,
    days,
    startDate,
    endDate,
    budget,
    styles,
    difficulty,
    adults,
    children,
    mustVisit,
    hasAccommodation,
    accommodations,
  } = normalized;

  const DIFFICULTY_ITEM_COUNTS = {
    relaxed: '3~4',
    normal: '4~5',
    active: '5~6',
    intense: '6~7',
  };

  const mustVisitList = parseMustVisitList(mustVisit);
  const cityTargets = resolveMustVisitCities(mustVisitList);
  const australiaCoverageSection = buildAustraliaCoverageSection(dest, days, styles, mustVisitList);
  const shouldApplyAustraliaPacing = isAustraliaCountry(dest) || resolveKnownCity(dest) || cityTargets.length > 0;
  const australiaPacing = australiaRegionPacing(days);
  const australiaPacingSection = shouldApplyAustraliaPacing
    ? `\n[호주 이동 빈도 제한]\n${days}일 일정에서는 호주 내 권역을 최대 ${australiaPacing.maxRegions}개까지만 사용하고, 국내선/장거리 이동일은 최대 ${australiaPacing.maxDomesticTransfers}회까지만 허용합니다.\n각 권역은 가능하면 최소 ${australiaPacing.minNightsPerRegion}박 이상 머물며, 같은 권역 관광을 연속된 날짜에 모두 끝낸 뒤 다음 권역으로 이동하세요.\n요청 장소가 이 제한을 넘으면 일정에 억지로 넣지 말고 omittedPlaces에 제외 이유를 적으세요.`
    : '';

  const multiCitySection = cityTargets.length >= 1
    ? `\n[반드시 포함할 도시]\n아래 도시들을 일정에 모두 포함하세요. 일수 배분은 동선 효율과 여행 조건에 맞게 자유롭게 결정하세요:\n${cityTargets.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}\n각 도시마다 별도 숙소를 accommodations에 등록하고, 어떤 도시도 생략하지 마세요.`
    : '';

  const travelers = `성인 ${adults}명${children > 0 ? `, 어린이 ${children}명` : ''}`;
  const accSection = buildAccommodationSection(hasAccommodation, accommodations);
  const dateRange = startDate && endDate
    ? `${startDate} ~ ${endDate} (${nights}박 ${days}일)`
    : `${nights}박 ${days}일`;
  const itemCount = DIFFICULTY_ITEM_COUNTS[difficulty] || '4~5';

  const mustVisitLine = mustVisitList.length
    ? `- 반드시 포함할 장소: ${mustVisitList.join(', ')} (일정 중심이 아니라 포함 보장 — 전체 여행 흐름 안에 자연스럽게 배치)`
    : '';

  const travelPreferenceLine = params.travelPreference
    ? `- 여행 선호 방식: ${params.travelPreference}`
    : '';

  return `${ragContext ? `${ragContext}\n\n` : ''}${weatherSummary ? `${weatherSummary}\n\n` : ''}[여행 요청]
- 목적지: ${dest}
- 여행 날짜: ${dateRange}
- 예산: ${BUDGET_LABELS[budget] || budget || '미정'}
- 여행 스타일: ${styles.join(', ') || '자유'}
- 여행 강도: ${DIFFICULTY_LABELS[difficulty] || difficulty || '보통'} (하루 ${itemCount}개 장소 기준)
- 인원: ${travelers}
${mustVisitLine}
${travelPreferenceLine}${multiCitySection}${australiaCoverageSection}${australiaPacingSection}${accSection}

${weatherSummary ? '위 날씨 데이터를 일정에 반영하세요.' : `먼저 searchRecentInfo로 ${startDate ? startDate.slice(0, 7) : '여행 기간'} ${dest} 날씨를 조회하세요.`}
도구를 활용해 ${days}일 일정을 만들어 주세요.

일정 설계 순서:
1. mustVisit 장소가 있다면 어느 도시·권역인지 먼저 파악하고, 가장 자연스러운 날짜에 앵커로 배치하세요. 첫날에 몰아넣지 마세요.
2. 여행 스타일에 맞는 best 후보 권역을 먼저 고르세요. 짧은 일정은 1~2개, 긴 일정은 3~4개 권역까지 확장하세요.
3. 날씨·예산·강도를 반영해 각 권역의 체류 일수와 숙소 등급, 식당 가격대, 교통수단, 실내/실외 비중을 정하세요.
4. 권역별 숙박 순서와 checkIn/checkOut을 먼저 결정하세요.
5. 한 권역의 관광이 마무리되면 같은 날 다음 도시·권역으로 이동할 수 있습니다.
6. 도시 이동일은 전날 숙소 출발 → 장거리 이동 → 도착 도시·권역 숙소 체크인/도착으로 끝내세요.
7. 다음날은 반드시 전날 도착한 숙소에서 출발하세요.
8. 출발 숙소로 되돌아가는 장거리 왕복과 지그재그 동선은 금지합니다.

각 일반 관광일은 실제 숙소명 출발로 시작해 같은 숙소명 복귀로 마무리하세요.
도시 이동일은 출발 숙소와 도착 숙소가 달라야 하며, 출발 숙소로 되돌아오지 마세요.
편도 90분 또는 100km 이상 이동한 날은 같은 숙소 복귀로 끝내지 말고, 이동한 권역의 새 숙소 체크인/도착으로 끝내세요.
호주 일반 관광일에는 그날 숙소 권역 기준 편도 120km를 넘는 관광지를 넣지 마세요. 장거리 장소는 숙소를 옮기는 이동일이 아니면 제외하세요.
당일 투어는 버스/코치 왕복 총 6시간 안에 가능한 곳만 허용합니다. 왕복 6시간을 넘는 투어는 omittedPlaces에 이유와 예상 거리를 적고 제외하세요.
모든 출발/복귀/체크인 item name에는 실제 숙소명을 넣으세요. "숙소 출발", "멜버른 시내 복귀 및 휴식" 같은 모호한 표현은 금지합니다.
각 day에는 summary와 routeStrategy를 반드시 넣어 사용자가 왜 이 순서로 이동하는지 이해할 수 있게 하세요.
각 item에는 duration, cost, reservation, transportTip, backup을 반드시 넣으세요.
note는 한 줄 설명이 아니라 "왜 이 장소를 이 시간대에 배치했는지"가 드러나게 2문장 이상으로 작성하세요.
모든 식사/카페 항목은 실제 상호명을 사용하고, 각 note와 cost/reservation에 비용과 예약 여부를 포함하세요.
관광지·투어·식당은 운영 여부, 운영 시간, 예약 필요 여부, 예산 적합성을 확인해 배치하세요.
accommodations의 checkIn/checkOut 날짜는 반드시 여행 날짜 범위(${startDate || '출발일'} ~ ${endDate || '귀국일'}) 안으로 설정하세요.

[이동일 필수 확인 사항]
장거리 비행이 포함된 날(국내선/국제선 불문)의 items는 반드시 5개 이하로 제한하세요.
구조: 출발 숙소 출발 → 출발 공항 → 비행편 → 도착 공항 → 도착 숙소 체크인 (최대 5개)
비행 당일에는 관광 item을 절대 포함하지 마세요. 관광은 다음 날부터 시작합니다.

[당일 투어 필수 확인 사항]
필립 아일랜드 펭귄 퍼레이드, 그레이트 오션 로드 등 왕복 버스·코치 투어는 픽업·드롭오프를 별도 item으로 나열하지 말고 투어 item 하나로 표현하세요. lat/lng는 투어 핵심 현장 좌표를 사용하세요.`;
}

module.exports = {
  COLLAB_MAX_AGENT_ITERATIONS,
  COLLAB_AGENT_SYSTEM,
  COLLAB_JSON_PROMPT,
  buildCollabInitialPrompt,
  buildCollabRagQuery,
  buildCollabRagRequests,
  normalizePlanParams,
};
