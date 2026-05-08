import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiPost } from '../api/apiClient'
import {
  ArrowLeft, Sparkles, X, Plus, Minus, Check,
  Copy, Link, ChevronRight, Search, MapPin, Calendar,
  Users, DollarSign, Zap, Send, MessageCircle,
} from 'lucide-react'
import CalendarPicker from '../components/common/CalendarPicker'

/* ──────────────────────────────────────────── 상수 */

const CONTINENTS = [
  { key: 'asia',       label: '아시아',       emoji: '🌏', countries: ['일본', '태국', '베트남', '싱가포르', '인도네시아', '대만', '홍콩', '말레이시아'] },
  { key: 'europe',     label: '유럽',         emoji: '🏰', countries: ['프랑스', '이탈리아', '스페인', '영국', '독일', '체코', '포르투갈', '그리스'] },
  { key: 'americas',   label: '미주',         emoji: '🗽', countries: ['미국', '캐나다', '멕시코', '브라질', '페루', '아르헨티나', '쿠바'] },
  { key: 'oceania',    label: '오세아니아',   emoji: '🦘', countries: ['시드니', '멜버른', '골드코스트', '케언즈', '울루루', '뉴질랜드', '피지'] },
  { key: 'middleeast', label: '중동·아프리카', emoji: '🌴', countries: ['튀르키예', 'UAE', '모로코', '이집트', '케냐', '남아공'] },
]

const STYLE_LIBRARY = [
  { category: '음식 & 음료', items: [
    { label: '맛집 탐방',        emoji: '🍜', theme: 'food' },
    { label: '현지 길거리 음식', emoji: '🥡', theme: 'food' },
    { label: '파인다이닝',       emoji: '🍽️', theme: 'food' },
    { label: '카페 투어',        emoji: '☕', theme: 'food' },
    { label: '디저트 투어',      emoji: '🧁', theme: 'food' },
    { label: '현지 술 문화',     emoji: '🍺', theme: 'night' },
    { label: '와이너리 투어',    emoji: '🍷', theme: 'food' },
    { label: '야시장',           emoji: '🏮', theme: 'food' },
  ]},
  { category: '자연 & 야외', items: [
    { label: '자연 힐링',     emoji: '🌿', theme: 'nature' },
    { label: '해변 · 바다',   emoji: '🏖️', theme: 'rest' },
    { label: '등산 · 트레킹', emoji: '🥾', theme: 'nature' },
    { label: '섬 투어',       emoji: '🏝️', theme: 'rest' },
    { label: '일출 · 일몰',   emoji: '🌅', theme: 'nature' },
    { label: '캠핑 · 글램핑', emoji: '⛺', theme: 'nature' },
    { label: '국립공원',      emoji: '🌲', theme: 'nature' },
    { label: '강 · 호수',     emoji: '🛶', theme: 'nature' },
  ]},
  { category: '문화 & 역사', items: [
    { label: '문화 · 역사',     emoji: '🏛️', theme: 'culture' },
    { label: '박물관',          emoji: '🗿', theme: 'culture' },
    { label: '미술관 · 갤러리', emoji: '🎨', theme: 'culture' },
    { label: '공연 · 뮤지컬',   emoji: '🎭', theme: 'culture' },
    { label: '사원 · 성지',     emoji: '⛩️', theme: 'culture' },
    { label: '서점 투어',       emoji: '📚', theme: 'culture' },
    { label: '건축 기행',       emoji: '🏰', theme: 'culture' },
    { label: '야경 감상',       emoji: '🌃', theme: 'night' },
  ]},
  { category: '쇼핑 & 라이프스타일', items: [
    { label: '쇼핑',          emoji: '🛍️', theme: 'shopping' },
    { label: '명품 · 패션',   emoji: '👗', theme: 'shopping' },
    { label: '로컬 마켓',     emoji: '🏪', theme: 'shopping' },
    { label: '빈티지 · 앤틱', emoji: '🪣', theme: 'shopping' },
    { label: '면세 쇼핑',     emoji: '🧳', theme: 'shopping' },
    { label: '포토 스팟',     emoji: '📸', theme: 'photo' },
    { label: '인스타 감성',   emoji: '🤳', theme: 'photo' },
    { label: '나이트라이프',  emoji: '🌙', theme: 'night' },
  ]},
  { category: '액티비티', items: [
    { label: '서핑 · 수상스포츠', emoji: '🏄', theme: 'activity' },
    { label: '스카이다이빙',      emoji: '🪂', theme: 'activity' },
    { label: '스쿠버다이빙',      emoji: '🤿', theme: 'activity' },
    { label: '골프',              emoji: '⛳', theme: 'activity' },
    { label: '스키 · 스노보드',   emoji: '🎿', theme: 'activity' },
    { label: '자전거 투어',       emoji: '🚴', theme: 'activity' },
    { label: '클라이밍',          emoji: '🧗', theme: 'activity' },
    { label: '번지점프',          emoji: '⚡', theme: 'activity' },
  ]},
  { category: '휴양 & 웰니스', items: [
    { label: '온천 · 스파',     emoji: '♨️', theme: 'rest' },
    { label: '리조트 · 풀빌라', emoji: '🏊', theme: 'rest' },
    { label: '요가 · 명상',     emoji: '🧘', theme: 'rest' },
    { label: '마사지',           emoji: '💆', theme: 'rest' },
    { label: '크루즈',           emoji: '🛳️', theme: 'rest' },
    { label: '테마파크',         emoji: '🎠', theme: 'activity' },
    { label: '동물원 · 사파리',  emoji: '🦁', theme: 'nature' },
    { label: '음악 · 라이브',    emoji: '🎵', theme: 'night' },
  ]},
]

const BUDGET_OPTIONS = [
  { key: 'low',  label: '알뜰',    sub: '하루 10만원 이하', emoji: '💰', dayRate: 100000 },
  { key: 'mid',  label: '적정',    sub: '하루 30만원대',    emoji: '💳', dayRate: 300000 },
  { key: 'high', label: '프리미엄', sub: '하루 50만원 이상', emoji: '💎', dayRate: 500000 },
]

const DIFFICULTY_OPTIONS = [
  { key: 'relaxed', label: '여유롭게',  sub: '느긋하게, 충분한 휴식' },
  { key: 'normal',  label: '보통',      sub: '관광과 휴식의 균형'    },
  { key: 'active',  label: '알차게',    sub: '최대한 많이 경험하기'  },
  { key: 'intense', label: '빡빡하게',  sub: '쉬는 시간 없이 풀코스' },
]

/* ──────────────────────────────────────────── mock data */

function getDominantTheme(tags) {
  const counts = {}
  STYLE_LIBRARY.forEach(cat => cat.items.forEach(item => {
    if (tags.includes(item.label)) counts[item.theme] = (counts[item.theme] || 0) + 1
  }))
  if (!Object.keys(counts).length) return 'food'
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

const MOCK_RESULTS = {
  food: { days: [
    { label: '1일차', theme: '미식 탐방 — 전통 시장부터 파인다이닝까지', items: [
      { time: '08:30', name: '츠키지 시장 아침', note: '참치 해체쇼 관람 후 카이센동 · 1인 1,500엔', isMeal: true },
      { time: '10:30', name: '아사쿠사 나카미세', note: '닌교야키·인형소바 등 전통 길거리 음식' },
      { time: '12:30', name: '우에노 라멘 골목', note: '현지인 단골, 24시간 영업 라멘집 밀집 구역', isMeal: true },
      { time: '14:30', name: '아메요코 시장', note: '과일·견과류·해산물 저렴하게 구매 가능' },
      { time: '16:00', name: '도쿄 카페 투어', note: '블루보틀·% 아라비카·오니버스 커피 순례' },
      { time: '19:00', name: '롯폰기 파인다이닝', note: '미슐랭 1스타 오마카세 코스 · 예약 필수', isMeal: true },
    ]},
    { label: '2일차', theme: '야시장 & 현지 술 문화', items: [
      { time: '10:00', name: '도요스 스시 오마카세', note: '오전 10시 전 도착 권장 · 3,000엔대', isMeal: true },
      { time: '12:30', name: '긴자 이세탄 식품관', note: '고급 식품관 구경 & 테이스팅' },
      { time: '14:00', name: '디저트 카페 순례', note: '하라주쿠 크레페 → 오모테산도 파르페' },
      { time: '16:30', name: '스미다 양조장 견학', note: '도쿄 크래프트 맥주 시음 체험' },
      { time: '18:30', name: '야키토리 골목', note: '숯불 야키토리 골목 · 꼬치 150엔~', isMeal: true },
      { time: '20:30', name: '신주쿠 이자카야', note: '일본식 포차 문화 체험 · 호피 맥주 필수' },
    ]},
    { label: '3일차', theme: '와이너리 & 특별한 미식', items: [
      { time: '09:00', name: '전통 다방 모닝세트', note: '낫토·미소국 세트 일본 정통 아침', isMeal: true },
      { time: '10:30', name: '도쿄 라멘 뮤지엄', note: '일본 전국 유명 라멘 한자리 체험' },
      { time: '13:00', name: '요코하마 중화가', note: '100년 역사 중화요리 거리', isMeal: true },
      { time: '15:00', name: '시부야 푸드홀', note: '신흥 맛집 팝업 밀집 공간' },
      { time: '17:00', name: '내추럴 와인 바', note: '일본산 내추럴 와인 전문 바' },
      { time: '19:30', name: '와규 샤부샤부 코스', note: '1인 6,000엔대 · 예약 권장', isMeal: true },
    ]},
  ]},
  nature: { days: [
    { label: '1일차', theme: '후지산 자락 — 자연 힐링', items: [
      { time: '07:00', name: '후지산 5합목 출발', note: '새벽 버스 이동 · 스바루라인 등산 시작' },
      { time: '10:00', name: '후지산 정상 (3,776m)', note: '일본 최고봉 등정 · 분화구 감상' },
      { time: '13:00', name: '산장 산악 도시락', note: '5합목 산장 산악 라멘 · 경치 최고', isMeal: true },
      { time: '15:00', name: '가와구치코', note: '호수 반영 후지산 사진 최고 스팟' },
      { time: '17:00', name: '오시노핫카이', note: '후지산 눈녹은 물 용출 연못 · 무료 입장' },
      { time: '19:00', name: '온천 료칸 저녁', note: '후지산 뷰 료칸 가이세키 요리', isMeal: true },
    ]},
    { label: '2일차', theme: '닛코 국립공원 — 깊은 숲속', items: [
      { time: '09:00', name: '닛코 도쇼구', note: '울창한 삼나무숲 속 세계문화유산 신사' },
      { time: '11:00', name: '기누가와 계곡 트레킹', note: '단풍 명소 · 왕복 2시간' },
      { time: '13:00', name: '계곡 옆 산채 정식', note: '산나물 위주 건강한 현지 한 상', isMeal: true },
      { time: '14:30', name: '게곤 폭포 (97m)', note: '엘리베이터로 하강 가능' },
      { time: '16:30', name: '주젠지 호수', note: '단풍 반영 최고 뷰포인트' },
      { time: '19:00', name: '유황천 노천욕', note: '닛코 온천 료칸 저녁 포함', isMeal: true },
    ]},
    { label: '3일차', theme: '가마쿠라 — 바다와 절', items: [
      { time: '09:00', name: '가마쿠라 알프스 하이킹', note: '해발 150m 능선 · 바다 조망' },
      { time: '11:00', name: '쓰루가오카 하치만구', note: '가마쿠라 최대 신사 · 무료 입장' },
      { time: '13:00', name: '가마쿠라 시라스동', note: '갓 잡은 멸치 덮밥 · 해안가 식당', isMeal: true },
      { time: '14:30', name: '가마쿠라 대불', note: '높이 11m 청동 대불 · 내부 입장 가능' },
      { time: '16:00', name: '이나무라가사키 해안 일몰', note: '후지산 실루엣 일몰' },
      { time: '18:30', name: '에노시마 해산물', note: '사자에 구이 & 조개 구이', isMeal: true },
    ]},
  ]},
  rest:     { days: [{ label:'1일차',theme:'온천 료칸 — 완전한 휴식',items:[{time:'11:00',name:'료칸 체크인 (하코네)',note:'유황천 온천 료칸'},{time:'12:00',name:'가이세키 런치',note:'제철 재료 코스',isMeal:true},{time:'14:00',name:'노천 온천',note:'4개 욕탕 포함'},{time:'16:00',name:'오와쿠다니 지열지대',note:'지옥곡 & 검은 달걀'},{time:'18:30',name:'저녁 가이세키 코스',note:'9첩 일식 코스',isMeal:true},{time:'20:30',name:'전세 노천탕',note:'2시간 · 커플/가족 추천'}]},{label:'2일차',theme:'스파 & 마사지',items:[{time:'07:00',name:'새벽 노천탕',note:'안개 속 후지산 뷰'},{time:'09:00',name:'일식 조식',note:'구운 생선·낫토·미소국',isMeal:true},{time:'10:30',name:'아시 호수 유람선',note:'60분 코스'},{time:'12:30',name:'호반 레스토랑',note:'테라스 좌석 추천',isMeal:true},{time:'14:00',name:'전신 마사지',note:'1시간 코스 · 예약 필수'},{time:'19:00',name:'와규 추가 코스',note:'미리 요청 필요',isMeal:true}]},{label:'3일차',theme:'풀빌라 & 크루즈',items:[{time:'09:00',name:'레이트 체크아웃',note:'12시까지 가능'},{time:'10:30',name:'하코네 오픈에어 뮤지엄',note:'야외 조각 공원'},{time:'12:30',name:'공방 카페 점심',note:'수제 디저트 유명',isMeal:true},{time:'14:00',name:'아시 호수 보트',note:'전동 보트 1시간'},{time:'16:30',name:'족욕 카페',note:'말차 라떼 즐기기'},{time:'19:00',name:'와규 스테이크',note:'예약 권장',isMeal:true}]}] },
  shopping: { days: [{ label:'1일차',theme:'긴자 & 하라주쿠',items:[{time:'10:00',name:'긴자 6 (G-SIX)',note:'루이비통·샤넬·프라다'},{time:'12:00',name:'이토야 카페',note:'문구 왕국 내 점심',isMeal:true},{time:'13:30',name:'미쓰코시 지하 식품관',note:'고급 식품관 쇼핑'},{time:'15:00',name:'하라주쿠 타케시타',note:'트렌드 패션 & 굿즈'},{time:'17:00',name:'오모테산도 힐즈',note:'건축 명소 쇼핑몰'},{time:'19:30',name:'오모테산도 디너',note:'분위기 있는 레스토랑',isMeal:true}]},{label:'2일차',theme:'아키하바라 & 시부야',items:[{time:'10:00',name:'아키하바라 면세',note:'요도바시 최대 8%'},{time:'12:00',name:'메이드 카페',note:'오타쿠 문화 체험',isMeal:true},{time:'13:30',name:'시부야 109 & 파르코',note:'MZ 패션 성지'},{time:'15:30',name:'다이칸야마 빈티지',note:'80~90년대 데님'},{time:'17:00',name:'나카메구로 셀렉트샵',note:'인디 브랜드 밀집'},{time:'19:30',name:'강변 다이닝',note:'벚꽃 시즌 최고',isMeal:true}]},{label:'3일차',theme:'로컬 마켓 & 앤틱',items:[{time:'09:00',name:'니시오기쿠보 앤틱',note:'200여 개 앤틱 가게'},{time:'11:00',name:'아자부다이 힐즈',note:'도쿄 최신 복합몰'},{time:'13:00',name:'푸드홀 점심',note:'전세계 음식 한자리',isMeal:true},{time:'14:30',name:'오다이바 면세관',note:'관광객 집중 구역'},{time:'16:30',name:'가챠 뽑기 투어',note:'아키하바라 성지'},{time:'19:00',name:'이케부쿠로 야키니쿠',note:'와규 코스',isMeal:true}]}] },
  activity: { days: [{ label:'1일차',theme:'스카이다이빙 & 번지점프',items:[{time:'07:30',name:'후지큐 하이랜드',note:'세계 최고 롤러코스터'},{time:'10:30',name:'번지점프 55m',note:'후지산 배경 · 예약 필수'},{time:'13:00',name:'테마파크 레스토랑',note:'굵은 소바 명물',isMeal:true},{time:'14:30',name:'집라인 1km',note:'후지산 뷰 짚라인'},{time:'17:00',name:'수상 액티비티',note:'카약·수상자전거'},{time:'19:30',name:'야외 BBQ',note:'와규 직접 구워먹기',isMeal:true}]},{label:'2일차',theme:'서핑 & 수상스포츠',items:[{time:'08:00',name:'서핑 강습',note:'초보자 2시간 레슨'},{time:'11:00',name:'쇼난 비치 산책',note:'도쿄 근교 최대 해변'},{time:'13:00',name:'쉑쉑버거',note:'서퍼들의 성지',isMeal:true},{time:'14:30',name:'제트스키 & 웨이크보드',note:'사전 예약 필수'},{time:'17:00',name:'에노시마 비경',note:'동굴 탐험 & 석양'},{time:'19:30',name:'해산물 BBQ',note:'바닷가 야외',isMeal:true}]},{label:'3일차',theme:'골프 & 사이클링',items:[{time:'07:00',name:'후지산 뷰 골프',note:'36홀 · 그린피 12,000엔~'},{time:'12:30',name:'클럽하우스 런치',note:'온천 입욕권 포함',isMeal:true},{time:'14:30',name:'스포츠 클라이밍',note:'올림픽 레거시 센터'},{time:'17:00',name:'아라카와 강변 사이클링',note:'40km 코스'},{time:'19:30',name:'스포츠 바 디너',note:'경기 관람 + 생맥주',isMeal:true}]}] },
  culture:  { days: [{ label:'1일차',theme:'박물관 & 미술관',items:[{time:'09:00',name:'도쿄 국립박물관',note:'한국어 오디오가이드 무료'},{time:'11:30',name:'국립서양미술관',note:'세계문화유산 건축물'},{time:'13:00',name:'우에노 정통 양식',note:'1920년대 창업 돈카츠',isMeal:true},{time:'14:30',name:'모리 미술관',note:'53층 현대미술관 + 전경'},{time:'17:00',name:'국립신미술관',note:'물결 외관 건축 명소'},{time:'19:30',name:'롯폰기 비스트로',note:'예술지구 저녁',isMeal:true}]},{label:'2일차',theme:'전통 공연 & 건축',items:[{time:'10:00',name:'가부키자 공연',note:'단막 티켓 2,000엔~'},{time:'12:30',name:'긴자 도시락 전문점',note:'100년 역사',isMeal:true},{time:'14:00',name:'메이지 신궁 가이드',note:'한국어 가이드 무료'},{time:'16:00',name:'근대건축 스트리트',note:'르코르뷔지에 영향'},{time:'18:00',name:'아사쿠사 야간 조명',note:'라이트업 센소지'},{time:'19:30',name:'전통 장어 덮밥',note:'창업 130년 노포',isMeal:true}]},{label:'3일차',theme:'서점 & 문화공간',items:[{time:'10:00',name:'다이칸야마 츠타야',note:'세계에서 가장 아름다운 서점'},{time:'12:00',name:'스타벅스 리저브',note:'서점 속 프리미엄 커피',isMeal:true},{time:'13:30',name:'나카메구로 갤러리',note:'인디 갤러리 10여 개'},{time:'15:30',name:'야나카 긴자 레트로',note:'1950년대 상점가'},{time:'17:30',name:'도쿄 예술대학 미술관',note:'무료 상설 전시'},{time:'19:30',name:'노포 이자카야',note:'예술가 단골 50년 역사',isMeal:true}]}] },
  photo:    { days: [{ label:'1일차',theme:'인스타 성지 순례',items:[{time:'06:00',name:'시오도메 여명 촬영',note:'일출 30분 전 도착'},{time:'08:30',name:'감성 브런치카페',note:'SNS 인기 카페',isMeal:true},{time:'10:00',name:'메이지 신궁 대문',note:'삼나무 터널 역광 포토'},{time:'11:30',name:'우라하라 골목',note:'숨겨진 벽화 & 무드등'},{time:'13:30',name:'포토제닉 카페',note:'알록달록 인테리어',isMeal:true},{time:'15:00',name:'시부야 스크램블 루프탑',note:'교차로 위에서 내려다보기'},{time:'17:30',name:'오다이바 레인보우 야경',note:'자유의 여신상 야경'},{time:'19:30',name:'야경 뷰 레스토랑',note:'도쿄 베이 전망',isMeal:true}]},{label:'2일차',theme:'감성 필름 카메라',items:[{time:'09:00',name:'시모키타자와 감성 거리',note:'인디 뮤직 & 빈티지'},{time:'11:00',name:'필름 카메라 갤러리',note:'아날로그 중고 카메라'},{time:'13:00',name:'레트로 카레집',note:'낡은 인테리어 포토제닉',isMeal:true},{time:'14:30',name:'에비스 가든 플레이스',note:'프랑스 고성 양식'},{time:'16:30',name:'나카메구로 골든아워',note:'강변 반영샷'},{time:'19:00',name:'루프탑 바 디너',note:'야경 + 칵테일',isMeal:true}]},{label:'3일차',theme:'비경 & 아트',items:[{time:'09:00',name:'팀랩 플래닛',note:'디지털 아트 수면 거울'},{time:'11:30',name:'도요스 무지개 다리',note:'현지인만 아는 스팟'},{time:'13:00',name:'쇼와 감성 찻집',note:'드라마 배경으로 유명',isMeal:true},{time:'14:30',name:'아사쿠사 초롱 터널',note:'시간대별 조명 다름'},{time:'16:30',name:'야나카 공원묘지 황혼',note:'고양이 천국'},{time:'19:00',name:'스카이트리 전망 레스토랑',note:'360도 야경 · 예약',isMeal:true}]}] },
  night:    { days: [{ label:'1일차',theme:'바 호핑 & 재즈 클럽',items:[{time:'12:00',name:'느긋한 브런치',note:'늦잠 후 느긋하게',isMeal:true},{time:'14:00',name:'다이칸야마 낮 산책',note:'에너지 충전'},{time:'17:00',name:'해피아워 루프탑 바',note:'칵테일 반값 17~19시'},{time:'19:00',name:'나카메구로 비스트로',note:'강변 와인 & 파스타',isMeal:true},{time:'21:00',name:'롯폰기 재즈 클럽',note:'50년 역사 라이브 바'},{time:'23:00',name:'긴자 바 호핑',note:'위스키 하이볼 성지'}]},{label:'2일차',theme:'야시장 & 야경 크루즈',items:[{time:'13:00',name:'해장 라멘',note:'전날 음주 회복',isMeal:true},{time:'15:00',name:'아사쿠사 산책',note:'한산한 낮 아사쿠사'},{time:'17:30',name:'스미다강 야경 크루즈',note:'해질녘 출발 맥주'},{time:'19:30',name:'아사쿠사 야시장',note:'야키소바·타코야키',isMeal:true},{time:'21:30',name:'신주쿠 골든가이',note:'300여 개 미니 바'},{time:'23:30',name:'가부키초 라이브뮤직',note:'심야 인디밴드 공연'}]},{label:'3일차',theme:'클럽 & 올나이트',items:[{time:'14:00',name:'숙취 해소 돈코쓰',note:'정통 라멘',isMeal:true},{time:'16:00',name:'시부야 레코드 숍',note:'중고 레코드 & CD'},{time:'18:00',name:'야키토리 이자카야',note:'든든하게',isMeal:true},{time:'20:30',name:'도쿄 클럽 (아게하/WOMB)',note:'EDM·테크노 드레스코드 확인'},{time:'01:00',name:'심야 라멘 & 귀가',note:'새벽 야타이 마무리'}]}] },
}
const MOCK_RESULTS_DEFAULT = MOCK_RESULTS.food

/* ─── 호주 전용 폴백 (시연용) ─────────────────────────── */
const AUSTRALIA_CITIES = new Set(['호주','시드니','멜버른','골드코스트','케언즈','울루루','브리즈번'])

const MOCK_AUSTRALIA = {
  nature: { days: [
    { label: '1일차', theme: '시드니 하버 & 본다이 코스탈 워크', items: [
      { time: '08:00', name: '서큘러 키 도착', note: '오팔 카드 충전 · 하버 전경 감상' },
      { time: '09:00', name: '오페라하우스 외관 투어', note: '가이드 투어 45달러 · 한국어 오디오 가이드 제공' },
      { time: '10:30', name: '하버 브리지 도보 산책', note: '브리지 위 도보 무료 · 항구 파노라마 뷰' },
      { time: '12:30', name: '더 록스 마켓 점심', note: '현지 푸드 트럭 · 피시앤칩스 20달러', isMeal: true },
      { time: '14:30', name: '본다이 비치', note: '버스 333번 · 서핑 강습 99달러 또는 자유 수영' },
      { time: '16:30', name: '본다이~쿠지 코스탈 워크', note: '6km 절벽 해안 산책로 무료 · 왕복 2시간' },
      { time: '19:00', name: '달링 하버 저녁', note: '항구 뷰 레스토랑 · 토요일 밤 불꽃놀이 무료', isMeal: true },
    ]},
    { label: '2일차', theme: '블루 마운틴 세 자매 바위', items: [
      { time: '07:30', name: '센트럴역 출발', note: '블루마운틴 라인 기차 편도 13달러 · 약 2시간' },
      { time: '09:30', name: '에코 포인트 도착', note: '세 자매 바위(Three Sisters) 전망 · 무료 입장' },
      { time: '10:30', name: '시닉 레일웨이 탑승', note: '세계에서 가장 가파른 철도 · 편도 16달러' },
      { time: '12:30', name: '카툼바 카페 점심', note: '블루마운틴 유기농 카페 · 브런치 25달러', isMeal: true },
      { time: '14:00', name: '시닉 스카이웨이 곤돌라', note: '270m 높이 협곡 위 · 왕복 31달러' },
      { time: '16:00', name: '제이미슨 밸리 전망대', note: '협곡 일몰 포인트 · 무료' },
      { time: '19:30', name: '시드니 CBD 귀환 · 저녁', note: '차이나타운 딤섬 15달러', isMeal: true },
    ]},
    { label: '3일차', theme: '타롱가 동물원 & 맨리 해변', items: [
      { time: '09:00', name: '서큘러 키 페리 출발', note: '타롱가 동물원행 페리 12분 · 오팔 카드' },
      { time: '09:30', name: '타롱가 동물원', note: '코알라·캥거루·왈라비 직접 만남 · 성인 47달러' },
      { time: '12:30', name: '동물원 카페 점심', note: '항구 뷰 야외 카페 · 25달러', isMeal: true },
      { time: '14:30', name: '맨리 페리 이동', note: '서큘러 키→맨리 30분 · 하버 크루즈 경험 · 7.35달러' },
      { time: '15:30', name: '맨리 비치 & 코스탈 워크', note: '맨리 코스탈 워크 10km · 숨은 해변 탐방' },
      { time: '18:00', name: '맨리 선셋 뷰', note: '서부 해안 일몰 감상 포인트' },
      { time: '19:30', name: '맨리 씨푸드 저녁', note: '갓잡은 생선 그릴 · 35달러', isMeal: true },
    ]},
  ]},

  food: { days: [
    { label: '1일차', theme: '시드니 미식 — 피시마켓부터 파인다이닝까지', items: [
      { time: '07:30', name: '시드니 피시 마켓', note: '남반구 최대 수산물 시장 · 생굴 1다스 24달러', isMeal: true },
      { time: '10:00', name: '서리힐스 스페셜티 카페', note: '플랫화이트 발상지 · 빌스(Bills) 스크램블 에그 유명' },
      { time: '12:30', name: '더 록스 마켓 점심', note: '현지 길거리 음식 · 타코·파에야 15달러', isMeal: true },
      { time: '14:30', name: '뉴타운 카페 투어', note: '독립 카페 밀집 구역 · 마켓 레인 커피 추천' },
      { time: '17:00', name: '달링허스트 와인바', note: '호주산 내추럴 와인 · 해피아워 17~19시' },
      { time: '19:30', name: '시드니 오페라하우스 Bennelong', note: '미슐랭급 · 1인 150달러 · 사전 예약 필수', isMeal: true },
    ]},
    { label: '2일차', theme: '멜버른 커피 & 퀸 빅토리아 마켓', items: [
      { time: '08:00', name: '디그레이브스 스트리트 카페', note: '멜버른 최고의 커피 골목 · 플랫화이트 5달러', isMeal: true },
      { time: '09:30', name: '퀸 빅토리아 마켓 오전 장', note: '1878년 개장 · 신선 과일·치즈·육포 구입' },
      { time: '12:00', name: '마켓 내 핫독 & 소시지', note: '현지인 단골 스탠드 · 8달러', isMeal: true },
      { time: '13:30', name: '피츠로이 브런치 카페', note: '세인트 알리(St. Ali) 시그니처 브런치 28달러', isMeal: true },
      { time: '15:30', name: '사우스뱅크 초콜릿 투어', note: '벨기에 초콜릿 숍 · 테이스팅 20달러' },
      { time: '19:00', name: '멜버른 야라강변 레스토랑', note: '강변 야경 파스타 · 40달러', isMeal: true },
    ]},
    { label: '3일차', theme: '골드코스트 해변 브런치 & 씨푸드', items: [
      { time: '08:30', name: '버리 헤즈 브런치 카페', note: '해변 뷰 아보카도 토스트 · 22달러', isMeal: true },
      { time: '10:30', name: '서퍼스 파라다이스 카페 투어', note: '카비 스트리트 일대 스페셜티 카페 3곳' },
      { time: '12:30', name: '브로드비치 씨푸드 레스토랑', note: '킹 크랩·새우 플래터 · 2인 80달러', isMeal: true },
      { time: '14:30', name: '내추럴 브리지 와이너리', note: '힌터랜드 와이너리 · 시음 20달러' },
      { time: '17:00', name: '해변 바베큐', note: '공공 바베큐 그릴 무료 · 마트에서 재료 구입' },
      { time: '19:30', name: '서퍼스 파라다이스 야시장', note: '매주 수·금·토 · 스트리트 푸드 10달러~', isMeal: true },
    ]},
  ]},

  activity: { days: [
    { label: '1일차', theme: '본다이 서핑 & 하버 브리지 클라이밍', items: [
      { time: '08:00', name: '본다이 서핑 강습', note: "Let's Go Surfing · 2시간 그룹 레슨 99달러" },
      { time: '11:00', name: '본다이 비치 자유 수영', note: '라이프가드 감시 구역 · 안전' },
      { time: '13:00', name: '본다이 비치 카페 점심', note: '바다 뷰 버거 · 25달러', isMeal: true },
      { time: '15:00', name: '시드니 하버 카약', note: '서큘러 키 출발 · 2시간 투어 90달러' },
      { time: '18:00', name: 'BridgeClimb 선셋', note: '하버 브리지 정상(134m) · 선셋 클라이밍 350달러' },
      { time: '20:30', name: '서큘러 키 야경 디너', note: '오페라하우스 야경 감상하며 식사', isMeal: true },
    ]},
    { label: '2일차', theme: '그레이트 배리어 리프 다이빙', items: [
      { time: '07:00', name: '케언즈 리프 플릿 터미널 출발', note: 'Great Adventures 투어 · 체험 다이빙 포함 180달러' },
      { time: '09:30', name: '아우터 리프 도착', note: '스노클링 2시간 · 산호초·열대어 감상' },
      { time: '12:00', name: '선상 점심', note: '뷔페 포함 · 투어 패키지에 포함', isMeal: true },
      { time: '13:00', name: '체험 스쿠버다이빙', note: '강사 동행 · 30~40분 수중 탐험 · 60달러 추가' },
      { time: '15:00', name: '두 번째 스노클링 포인트', note: '다른 산호초 구역 · 거북이 출몰 빈번' },
      { time: '17:30', name: '케언즈 귀항 & 저녁', note: '에스플러네이드 씨푸드 레스토랑 · 40달러', isMeal: true },
    ]},
    { label: '3일차', theme: '골드코스트 테마파크 & 서핑', items: [
      { time: '09:00', name: '워너 브라더스 무비 월드 입장', note: 'DC 히어로 라이드 · 1일권 120달러' },
      { time: '10:00', name: '배트맨 어드벤처 라이드', note: '대기 줄 적은 오전 공략 필수' },
      { time: '13:00', name: '무비 월드 레스토랑', note: '테마 버거 · 20달러', isMeal: true },
      { time: '15:00', name: '씨월드 돌고래 쇼', note: '옆 파크 이동 · 콤보 패스 이용' },
      { time: '17:30', name: '서퍼스 파라다이스 해변 서핑', note: '저녁 파도 · 보드 렌탈 30달러/시간' },
      { time: '20:00', name: '카비 스트리트 디너', note: '서퍼스 파라다이스 중심 레스토랑 · 35달러', isMeal: true },
    ]},
  ]},

  rest: { days: [
    { label: '1일차', theme: '멜버른 세인트 킬다 & 커피 힐링', items: [
      { time: '10:00', name: '멜버른 레이트 체크인', note: '세인트 킬다 해변 인근 부티크 호텔' },
      { time: '11:00', name: '세인트 킬다 비치 산책', note: '조용한 해변 · 피크닉 분위기' },
      { time: '13:00', name: '아크란드 스트리트 케이크 카페', note: '세인트 킬다 명물 케이크 숍 · 15달러', isMeal: true },
      { time: '15:00', name: '리틀 펭귄 서식지 방문', note: '세인트 킬다 부두 · 야생 리틀 펭귄 무료 관찰 (일몰 후)' },
      { time: '17:00', name: 'NGV 갤러리 관람', note: '호주 최대 미술관 · 상설 전시 무료' },
      { time: '19:30', name: '사우스뱅크 강변 저녁', note: '야라강 뷰 이탈리안 · 45달러', isMeal: true },
    ]},
    { label: '2일차', theme: '야라 밸리 와이너리 & 스파', items: [
      { time: '09:30', name: '야라 밸리 와이너리 출발', note: '멜버른에서 1시간 · 투어 버스 이용 편리' },
      { time: '11:00', name: '도마인 샨동 와이너리', note: '스파클링 와인 명가 · 시음 25달러' },
      { time: '13:00', name: '와이너리 레스토랑 런치', note: '제철 코스 메뉴 · 55달러', isMeal: true },
      { time: '15:00', name: '힐링 스파 & 마사지', note: 'Peninsula Hot Springs · 1시간 코스 120달러' },
      { time: '17:30', name: '야라 밸리 선셋 뷰', note: '포도밭 너머 일몰 · 무료' },
      { time: '19:30', name: '멜버른 귀환 · 저녁', note: '피츠로이 타파스 바 · 40달러', isMeal: true },
    ]},
    { label: '3일차', theme: '시드니 로얄 보태닉 가든 & 슬로우 데이', items: [
      { time: '09:00', name: '로얄 보태닉 가든 아침 산책', note: '30헥타르 무료 공원 · 하버 뷰 최고' },
      { time: '10:30', name: '가든 카페 브런치', note: '가든 내 카페 · 아보카도 토스트 22달러', isMeal: true },
      { time: '12:30', name: '미세스 맥콰리 포인트', note: '오페라하우스+하버브리지 동시 뷰 · 무료' },
      { time: '14:00', name: '서큘러 키 페리 산책', note: '페리 타고 하버 한 바퀴 · 오팔 카드' },
      { time: '16:00', name: '더 록스 카페 휴식', note: '애프터눈 티 · 빈티지 분위기 카페' },
      { time: '19:00', name: '오페라하우스 야경 디너', note: '야외 바 · 캐주얼 식사 + 야경 감상', isMeal: true },
    ]},
  ]},
}

/* ──────────────────────────────────────────── 유틸 */
function randomCode() { return Math.random().toString(36).slice(2, 7).toUpperCase() }
function formatWon(n) { return n >= 1000000 ? `${(n / 10000).toFixed(0)}만원` : `${n.toLocaleString()}원` }

const MOCK_FRIENDS = [
  { name: '지민', styles: ['맛집 탐방', '카페 투어', '포토 스팟'] },
  { name: '수현', styles: ['쇼핑', '문화 · 역사', '미술관 · 갤러리'] },
]

/* ──────────────────────────────────────────── StyleSelector */
function StyleSelector({ selected, onChange, customStyles, onCustomAdd, onCustomRemove, customInput, onCustomInput }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const filtered = query.trim()
    ? STYLE_LIBRARY.map(cat => ({ ...cat, items: cat.items.filter(i => i.label.includes(query)) })).filter(c => c.items.length > 0)
    : STYLE_LIBRARY

  const toggle = l => onChange(selected.includes(l) ? selected.filter(s => s !== l) : [...selected, l])

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onCustomAdd()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 직접 입력 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">직접 입력</p>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={customInput}
            onChange={e => onCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="원하는 여행 스타일 입력 후 Enter (예: 해변 피크닉, 현지 시장 구경...)"
            className="flex-1 h-10 px-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 focus:bg-white transition-all placeholder:text-zinc-400"
          />
          <button
            onClick={onCustomAdd}
            disabled={!customInput.trim()}
            className="h-10 px-4 rounded-lg text-sm font-semibold transition-all bg-zinc-900 text-white disabled:bg-zinc-200 disabled:text-zinc-400 hover:bg-zinc-700"
          >
            추가
          </button>
        </div>

        {/* 직접 입력 태그들 */}
        {customStyles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {customStyles.map(s => (
              <span key={s} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 text-white">
                {s}
                <button onClick={() => onCustomRemove(s)} className="opacity-60 hover:opacity-100 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 태그 검색 + 선택 */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">추천 태그 선택</p>

        {/* 선택된 태그 */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.map(tag => {
              const meta = STYLE_LIBRARY.flatMap(c => c.items).find(i => i.label === tag)
              return (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 text-white">
                  {meta?.emoji} {tag}
                  <button onClick={() => toggle(tag)} className="opacity-60 hover:opacity-100 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="태그 검색"
            className="w-full h-9 pl-9 pr-8 text-sm bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
          />
          {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"><X className="w-3.5 h-3.5" /></button>}
        </div>

        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto">
          {filtered.map(cat => (
            <div key={cat.category}>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">{cat.category}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map(item => {
                  const on = selected.includes(item.label)
                  return (
                    <button key={item.label} onClick={() => toggle(item.label)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                        on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                      }`}>
                      <span>{item.emoji}</span>{item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-zinc-400 text-center py-4">검색 결과가 없어요</p>}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   LANDING
════════════════════════════════════════════ */
function Landing({ onStart }) {
  const tags = ['시드니', '멜버른', '골드코스트', '케언즈', '도쿄', '파리', '발리', '싱가포르', '바르셀로나', '뉴욕']
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B0F1A' }}>
      {/* 배경 glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }} />
      </div>

      <div className="relative flex-1 max-w-lg mx-auto w-full px-6 pt-24 pb-16 flex flex-col">
        {/* 헤더 라벨 */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-full">
            <Sparkles className="w-3 h-3" /> AI 여행 플래너
          </span>
        </div>

        {/* 헤드라인 */}
        <div className="mb-10">
          <h1 className="text-5xl font-black text-white leading-[1.1] mb-4">
            어디든,<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #60A5FA, #818CF8)' }}>
              AI와 함께
            </span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            취향·예산·인원만 알려주면<br />
            최적의 여행 일정을 만들어드려요
          </p>
        </div>

        {/* 목적지 태그 */}
        <div className="flex flex-wrap gap-2 mb-10">
          {tags.map(t => (
            <span key={t} className="text-xs font-medium text-zinc-500 border border-zinc-800 rounded-full px-3 py-1 hover:border-zinc-600 hover:text-zinc-300 transition-colors cursor-default">
              {t}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onStart}
          className="group flex items-center justify-between w-full bg-white text-zinc-900 font-bold text-base py-4 px-6 rounded-2xl transition-all hover:bg-zinc-100 active:scale-95"
          style={{ boxShadow: '0 0 40px rgba(37,99,235,0.2)' }}>
          <span>여행 일정 만들기</span>
          <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* 피처 */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: <Calendar className="w-4 h-4" />, label: '맞춤 일정' },
            { icon: <MapPin className="w-4 h-4" />,  label: '동선 최적화' },
            { icon: <Users className="w-4 h-4" />,   label: '그룹 플래닝' },
          ].map(f => (
            <div key={f.label} className="rounded-xl p-3 text-center border border-zinc-800 bg-zinc-900/50">
              <div className="flex justify-center mb-1.5 text-zinc-500">{f.icon}</div>
              <p className="text-xs text-zinc-500 font-medium">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   WIZARD — 6단계 폼
════════════════════════════════════════════ */
const STEP_META = [
  { label: '여행 방식', icon: <Users className="w-4 h-4" /> },
  { label: '여행 기간', icon: <Calendar className="w-4 h-4" /> },
  { label: '목적지',   icon: <MapPin className="w-4 h-4" /> },
  { label: '예산',     icon: <DollarSign className="w-4 h-4" /> },
  { label: '스타일',   icon: <Sparkles className="w-4 h-4" /> },
  { label: '강도',     icon: <Zap className="w-4 h-4" /> },
]
const TOTAL_STEPS = 6

function TravelFormWizard({ onSubmit, onBack }) {
  const [step, setStep]                     = useState(0)
  const [travelType, setTravelType]         = useState('')
  const [adults, setAdults]                 = useState(2)
  const [children, setChildren]             = useState(0)
  const [startDate, setStartDate]           = useState('')
  const [endDate, setEndDate]               = useState('')
  const [calTarget, setCalTarget]           = useState(null)
  const [continent, setContinent]           = useState('')
  const [country, setCountry]               = useState('')
  const [mustVisit, setMustVisit]           = useState('')
  const [budget, setBudget]                 = useState('')
  const [selectedStyles, setSelectedStyles] = useState([])
  const [customStyles, setCustomStyles]     = useState([])
  const [customStyleInput, setCustomStyleInput] = useState('')
  const [difficulty, setDifficulty]         = useState('')

  const nights = startDate && endDate
    ? Math.max(0, Math.floor((new Date(endDate) - new Date(startDate)) / 86400000)) : 0
  const continentData  = CONTINENTS.find(c => c.key === continent)
  const selectedBudget = BUDGET_OPTIONS.find(b => b.key === budget)
  const totalEstimate  = selectedBudget && nights > 0 ? selectedBudget.dayRate * nights : null

  const addCustomStyle = () => {
    const val = customStyleInput.trim()
    if (val && !customStyles.includes(val)) {
      setCustomStyles(p => [...p, val])
      setCustomStyleInput('')
    }
  }
  const removeCustomStyle = s => setCustomStyles(p => p.filter(x => x !== s))

  const allStyles = [...selectedStyles, ...customStyles]

  const canNext = [
    travelType !== '',
    startDate !== '' && endDate !== '',
    continent !== '' || country.trim() !== '',
    budget !== '',
    allStyles.length > 0,
    difficulty !== '',
  ]

  const goBack = () => step === 0 ? onBack() : setStep(s => s - 1)
  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
    else onSubmit({
      travelType,
      adults: travelType === 'solo' ? 1 : adults,
      children: travelType === 'solo' ? 0 : children,
      startDate, endDate, nights, continent, country, mustVisit, budget,
      styles: allStyles,
      difficulty,
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── 상단 헤더 */}
      <div className="border-b border-zinc-100">
        <div className="max-w-lg mx-auto px-5 pt-4 pb-3 flex items-center gap-4">
          <button onClick={goBack}
            className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 text-zinc-600" />
          </button>

          {/* progress segments */}
          <div className="flex-1 flex gap-1">
            {STEP_META.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{
                  background: i < step ? '#059669' : i === step ? '#2563EB' : '#E4E4E7'
                }} />
            ))}
          </div>

          <span className="text-xs text-zinc-400 font-mono flex-shrink-0 w-8 text-right">{step + 1}/{TOTAL_STEPS}</span>
        </div>
        <div className="max-w-lg mx-auto px-5 pb-3 flex items-center gap-2">
          <span className="text-zinc-400">{STEP_META[step].icon}</span>
          <span className="text-sm font-semibold text-zinc-700">{STEP_META[step].label}</span>
        </div>
      </div>

      {/* ── 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-8 pb-4">

          {/* ── Step 0: 여행 방식 ── */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 mb-1.5">여행 방식을 선택하세요</h2>
                <p className="text-zinc-500 text-sm">여행 형태에 따라 일정 구성 방식이 달라져요</p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  {
                    key: 'solo', label: '혼자 여행',
                    desc: '나만의 취향대로 자유롭게',
                    icon: '🧳',
                  },
                  {
                    key: 'group', label: '그룹 여행',
                    desc: '초대 링크로 모두의 선호도를 합쳐 생성',
                    icon: '✈️',
                  },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setTravelType(opt.key)}
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                      travelType === opt.key
                        ? 'border-zinc-900 bg-zinc-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      travelType === opt.key ? 'bg-zinc-900' : 'bg-zinc-100'
                    }`}>
                      <span style={{ filter: travelType === opt.key ? 'brightness(2)' : 'none' }}>{opt.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${travelType === opt.key ? 'text-zinc-900' : 'text-zinc-800'}`}>{opt.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{opt.desc}</p>
                    </div>
                    {/* 라디오 인디케이터 */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      travelType === opt.key ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                    }`}>
                      {travelType === opt.key && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {travelType === 'group' && (
                <div className="border border-zinc-200 rounded-xl p-5">
                  <p className="text-sm font-bold text-zinc-800 mb-4">인원 구성</p>
                  {[
                    { label: '성인',   sub: '만 13세 이상', val: adults,   set: setAdults,   min: 2 },
                    { label: '어린이', sub: '만 2~12세',    val: children, set: setChildren, min: 0 },
                  ].map(({ label, sub, val, set, min }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-zinc-800">{label}</p>
                        <p className="text-xs text-zinc-400">{sub}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => set(v => Math.max(min, v - 1))}
                          className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors">
                          <Minus className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                        <span className="text-base font-bold text-zinc-900 w-5 text-center">{val}</span>
                        <button onClick={() => set(v => Math.min(10, v + 1))}
                          className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors">
                          <Plus className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: 기간 ── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 mb-1.5">언제 떠나시나요?</h2>
                <p className="text-zinc-500 text-sm">출발일과 귀국일을 선택해주세요</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '출발일', value: startDate, onClick: () => setCalTarget('start'), disabled: false },
                  { label: '귀국일', value: endDate,   onClick: () => startDate && setCalTarget('end'), disabled: !startDate },
                ].map(({ label, value, onClick, disabled }) => (
                  <button key={label} onClick={onClick} disabled={disabled}
                    className={`flex flex-col items-start px-4 py-5 rounded-xl border-2 text-left transition-all ${
                      value    ? 'border-zinc-900 bg-zinc-50' :
                      disabled ? 'border-zinc-100 bg-zinc-50 opacity-40 cursor-not-allowed' :
                               'border-zinc-200 hover:border-zinc-400 bg-white'
                    }`}>
                    <span className="text-xs text-zinc-400 font-semibold mb-2">{label}</span>
                    <span className={`text-sm font-bold ${value ? 'text-zinc-900' : 'text-zinc-300'}`}>
                      {value || '날짜 선택'}
                    </span>
                  </button>
                ))}
              </div>

              {nights > 0 && (
                <div className="flex items-center gap-3 bg-zinc-50 rounded-xl px-5 py-4 border border-zinc-200">
                  <Calendar className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  <div>
                    <p className="text-base font-black text-zinc-900">{nights}박 {nights + 1}일</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{startDate} — {endDate}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: 목적지 ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 mb-1.5">어디로 가시나요?</h2>
                <p className="text-zinc-500 text-sm">대륙을 선택하거나 나라를 직접 입력하세요</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CONTINENTS.map(c => (
                  <button key={c.key} onClick={() => { setContinent(continent === c.key ? '' : c.key); setCountry('') }}
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 text-xs font-semibold transition-all ${
                      continent === c.key ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                    }`}>
                    <span className="text-xl">{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              {continentData && (
                <div className="flex flex-wrap gap-1.5">
                  {continentData.countries.map(c => (
                    <button key={c} onClick={() => setCountry(country === c ? '' : c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        country === c ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}

              <input type="text" value={country} onChange={e => { setCountry(e.target.value); setContinent('') }}
                placeholder="직접 입력 (예: 포르투갈, 쿠바, 모로코...)"
                className="w-full h-11 px-4 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 transition-all"
              />

              {country.trim() !== '' && (
                <div className="rounded-xl border border-zinc-200 p-4">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                    꼭 가보고 싶은 곳 <span className="text-zinc-400 font-normal normal-case">(선택)</span>
                  </label>
                  <input type="text" value={mustVisit} onChange={e => setMustVisit(e.target.value)}
                    placeholder={`${country}에서 방문하고 싶은 장소`}
                    className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900 transition-all bg-zinc-50"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1.5">입력한 장소를 일정에 우선 배치해드려요</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: 예산 ── */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 mb-1.5">예산 범위를 선택하세요</h2>
                <p className="text-zinc-500 text-sm">1인 기준, 항공·숙소 포함 예상 금액이에요</p>
              </div>

              <div className="flex flex-col gap-2">
                {BUDGET_OPTIONS.map(b => {
                  const est = nights > 0 ? b.dayRate * nights : null
                  return (
                    <button key={b.key} onClick={() => setBudget(b.key)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        budget === b.key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                        budget === b.key ? 'bg-zinc-900' : 'bg-zinc-100'
                      }`}>
                        <span style={{ filter: budget === b.key ? 'brightness(2)' : 'none' }}>{b.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-bold text-zinc-900">{b.label}</p>
                          <p className="text-xs text-zinc-400">{b.sub}</p>
                        </div>
                        {est && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {nights}일 기준 약 {formatWon(est)} ~ {formatWon(est * 1.3)}
                          </p>
                        )}
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        budget === b.key ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                      }`}>
                        {budget === b.key && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 4: 스타일 ── */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 mb-1.5">어떤 여행을 원하세요?</h2>
                <p className="text-zinc-500 text-sm">직접 입력하거나 태그를 선택해주세요</p>
              </div>
              <StyleSelector
                selected={selectedStyles}
                onChange={setSelectedStyles}
                customStyles={customStyles}
                onCustomAdd={addCustomStyle}
                onCustomRemove={removeCustomStyle}
                customInput={customStyleInput}
                onCustomInput={setCustomStyleInput}
              />
            </div>
          )}

          {/* ── Step 5: 강도 ── */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 mb-1.5">여행 강도를 선택하세요</h2>
                <p className="text-zinc-500 text-sm">피로도에 맞게 일정 밀도를 조절해드려요</p>
              </div>

              <div className="flex flex-col gap-2">
                {DIFFICULTY_OPTIONS.map((d, i) => (
                  <button key={d.key} onClick={() => setDifficulty(d.key)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      difficulty === d.key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}>
                    {/* 강도 인디케이터 바 */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      {[0,1,2,3].map(j => (
                        <div key={j} className={`w-1 rounded-full transition-all ${
                          j <= i
                            ? difficulty === d.key ? 'bg-zinc-900' : 'bg-zinc-400'
                            : 'bg-zinc-200'
                        }`} style={{ height: `${12 + j * 4}px` }} />
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900">{d.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{d.sub}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      difficulty === d.key ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                    }`}>
                      {difficulty === d.key && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 하단 버튼 */}
      <div className="border-t border-zinc-100 px-5 py-4 bg-white">
        <div className="max-w-lg mx-auto">
          <button onClick={goNext} disabled={!canNext[step]}
            className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              canNext[step] ? 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}>
            {step < TOTAL_STEPS - 1
              ? <><span>다음 단계</span><ChevronRight className="w-4 h-4" /></>
              : <><Sparkles className="w-4 h-4" /><span>일정 생성하기</span></>
            }
          </button>
        </div>
      </div>

      {calTarget === 'start' && (
        <CalendarPicker value={startDate} minDate={new Date().toISOString().split('T')[0]}
          onChange={date => { setStartDate(date); setEndDate(''); setCalTarget('end') }}
          onClose={() => setCalTarget(null)} />
      )}
      {calTarget === 'end' && (
        <CalendarPicker value={endDate} minDate={startDate} rangeStart={startDate}
          onChange={date => { setEndDate(date); setCalTarget(null) }}
          onClose={() => setCalTarget(null)} />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════
   GROUP INVITE
════════════════════════════════════════════ */
function GroupInvite({ roomCode, friends, tripInfo, onProceed }) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `${window.location.origin}/ai-travel?room=${roomCode}`
  const dest = tripInfo?.country || CONTINENTS.find(c => c.key === tripInfo?.continent)?.label || '목적지'

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-5 pt-14 pb-10 max-w-lg mx-auto w-full">
      <div className="mb-7">
        <h2 className="text-2xl font-black text-zinc-900 mb-1">친구 초대</h2>
        <p className="text-zinc-500 text-sm">링크를 공유하면 친구들이 각자 선호도를 입력할 수 있어요</p>
      </div>

      {tripInfo && (
        <div className="bg-zinc-900 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            {CONTINENTS.find(c => c.key === tripInfo.continent)?.emoji || '🌍'}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{dest} 여행</p>
            <p className="text-xs text-zinc-400">{tripInfo.nights}박 {tripInfo.nights + 1}일 · 성인 {tripInfo.adults}명</p>
          </div>
        </div>
      )}

      <div className="border border-zinc-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-600">초대 링크</span>
          <code className="ml-auto text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">#{roomCode}</code>
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2.5">
          <span className="flex-1 text-xs text-zinc-500 font-mono truncate">{inviteUrl}</span>
          <button onClick={copyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all flex-shrink-0 ${
              copied ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-700'
            }`}>
            {copied ? <><Check className="w-3 h-3" /> 복사됨</> : <><Copy className="w-3 h-3" /> 복사</>}
          </button>
        </div>
      </div>

      <div className="border border-zinc-200 rounded-xl p-4 flex-1 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-zinc-900">참여 현황</span>
          <span className="text-xs text-zinc-400">{friends.length}명 응답 완료</span>
        </div>
        <div className="flex items-center gap-3 py-3 border-b border-zinc-100">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-sm">나</div>
          <span className="text-sm text-zinc-800 font-medium flex-1">주최자</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">완료</span>
        </div>
        {friends.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
            <span className="text-xs text-zinc-400 mt-1">친구들이 응답을 작성하고 있어요</span>
          </div>
        ) : friends.map((f, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-zinc-100 last:border-0">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-white">
              {f.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-800">{f.name}</p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {f.styles.slice(0, 3).map(s => (
                  <span key={s} className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">완료</span>
          </div>
        ))}
      </div>

      <button onClick={onProceed} disabled={friends.length === 0}
        className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
          friends.length > 0 ? 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
        }`}>
        {friends.length > 0 ? `${friends.length}명 응답 완료 · 일정 생성` : '응답을 기다리는 중...'}
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════
   FRIEND JOIN FORM
════════════════════════════════════════════ */
function FriendJoinForm({ roomCode }) {
  const [name, setName]                     = useState('')
  const [budget, setBudget]                 = useState('')
  const [selectedStyles, setSelectedStyles] = useState([])
  const [customStyles, setCustomStyles]     = useState([])
  const [customStyleInput, setCustomStyleInput] = useState('')
  const [continent, setContinent]           = useState('')
  const [done, setDone]                     = useState(false)

  const addCustomStyle = () => {
    const val = customStyleInput.trim()
    if (val && !customStyles.includes(val)) { setCustomStyles(p => [...p, val]); setCustomStyleInput('') }
  }
  const allStyles = [...selectedStyles, ...customStyles]
  const canSubmit = name.trim() && budget && allStyles.length > 0

  if (done) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center">
        <Check className="w-7 h-7 text-white" strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-xl font-black text-zinc-900 mb-1.5">입력 완료!</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">주최자가 일정을 생성하면<br />모두에게 결과를 공유해드려요</p>
      </div>
      <code className="text-xs bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg font-mono">방 코드: #{roomCode}</code>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-5 pt-12 pb-20 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5">
          <Link className="w-3.5 h-3.5" />
          <span>초대 링크로 접속 · 방 코드 <code className="font-mono font-bold text-zinc-900">#{roomCode}</code></span>
        </div>
        <div>
          <h2 className="text-2xl font-black text-zinc-900 mb-1">여행 선호도 입력</h2>
          <p className="text-zinc-500 text-sm">당신의 취향을 알려주면 AI가 모두를 위한 일정을 만들어요</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">이름</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="이름 또는 닉네임"
            className="w-full h-11 px-4 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">예산</label>
          <div className="grid grid-cols-3 gap-2">
            {BUDGET_OPTIONS.map(b => (
              <button key={b.key} onClick={() => setBudget(b.key)}
                className={`py-3 rounded-xl border-2 text-center transition-all ${
                  budget === b.key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}>
                <p className="text-base mb-1">{b.emoji}</p>
                <p className={`text-xs font-bold ${budget === b.key ? 'text-zinc-900' : 'text-zinc-700'}`}>{b.label}</p>
                <p className={`text-[10px] mt-0.5 ${budget === b.key ? 'text-zinc-600' : 'text-zinc-400'}`}>{b.sub}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">여행 스타일</label>
          <StyleSelector
            selected={selectedStyles} onChange={setSelectedStyles}
            customStyles={customStyles} onCustomAdd={addCustomStyle}
            onCustomRemove={s => setCustomStyles(p => p.filter(x => x !== s))}
            customInput={customStyleInput} onCustomInput={setCustomStyleInput}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">가고 싶은 곳 (선택)</label>
          <div className="grid grid-cols-3 gap-2">
            {CONTINENTS.map(c => (
              <button key={c.key} onClick={() => setContinent(continent === c.key ? '' : c.key)}
                className={`py-3 rounded-xl border-2 text-center text-xs font-semibold transition-all ${
                  continent === c.key ? 'border-zinc-900 bg-zinc-50 text-zinc-900' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                }`}>
                <p className="text-xl mb-1">{c.emoji}</p>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => canSubmit && setDone(true)} disabled={!canSubmit}
          className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            canSubmit ? 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
          }`}>
          <Check className="w-4 h-4" /> 입력 완료
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   LOADING
════════════════════════════════════════════ */
const LOADING_MSGS = ['목적지 정보 분석', '관광 명소 선별', '동선 최적화', '맛집 추천', '일정 완성']

function Loading({ info, onDone }) {
  const [step, setStep] = useState(0)
  const [error, setError] = useState(null)
  const dest = info.country || CONTINENTS.find(c => c.key === info.continent)?.label || '목적지'

  useEffect(() => {
    const t = setInterval(() => setStep(prev => Math.min(prev + 1, LOADING_MSGS.length - 1)), 900)

    apiPost('/ai-travel/generate', info)
      .then(json => {
        clearInterval(t)
        setStep(LOADING_MSGS.length - 1)
        setTimeout(() => onDone(json.data), 600)
      })
      .catch(err => {
        clearInterval(t)
        setError(err.message)
      })

    return () => clearInterval(t)
  }, [])

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-6" style={{ background: '#0B0F1A' }}>
      <div className="text-center">
        <p className="text-white font-bold mb-2">일정 생성에 실패했어요</p>
        <p className="text-red-400 text-sm mb-6">{error}</p>
        <button onClick={() => onDone(null)} className="text-zinc-400 underline text-sm hover:text-zinc-200 transition-colors">
          돌아가기
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-12"
      style={{ background: '#0B0F1A' }}>
      {/* 심플 스피너 */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
      </div>

      <div className="text-center w-full max-w-xs">
        <h2 className="text-xl font-black text-white mb-1">일정 생성 중</h2>
        <p className="text-zinc-500 text-sm mb-8">{dest} · {info.nights}박 {info.nights + 1}일</p>

        <div className="flex flex-col gap-3">
          {LOADING_MSGS.map((msg, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-400 ${
                i < step ? 'bg-emerald-500' : i === step ? 'bg-blue-500' : 'bg-zinc-800'
              }`}>
                {i < step && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className={`text-sm text-left transition-colors duration-300 ${
                i < step ? 'text-emerald-400' : i === step ? 'text-white font-medium' : 'text-zinc-700'
              }`}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   TRAVEL CHAT DRAWER (페르소나 챗봇)
════════════════════════════════════════════ */
const PERSONA_DEFAULTS = {
  '호주':       { name: 'Matey',    emoji: '🦘', greeting: "G'day! 호주 여행이라면 뭐든 물어봐~ No worries!" },
  '시드니':     { name: 'Matey',    emoji: '🦘', greeting: "G'day mate! 시드니 현지인 Matey야. 뭐든 물어봐!" },
  '멜버른':     { name: 'Matey',    emoji: '☕', greeting: "G'day! 멜버른 커피는 세계 최고야. 뭐가 궁금해?" },
  '골드코스트': { name: 'Matey',    emoji: '🏄', greeting: "No worries! 골드코스트 서퍼 Matey야~ 꿀팁 알려줄게!" },
  '케언즈':     { name: 'Matey',    emoji: '🤿', greeting: "G'day! 그레이트 배리어 리프 다이버 Matey야. 물어봐!" },
  '울루루':     { name: 'Matey',    emoji: '🪨', greeting: "No worries! 레드센터 Matey야. 뭐든 알려줄게!" },
  '브리즈번':   { name: 'Matey',    emoji: '🐨', greeting: "G'day! 브리즈번 로컬 Matey야~ 뭐든 물어봐!" },
  '일본':       { name: 'Yuki',     emoji: '⛩️', greeting: '안녕하세요! 일본 가이드 유키입니다. 무엇이든 물어보세요.' },
  '도쿄':       { name: 'Yuki',     emoji: '🗼', greeting: '안녕하세요! 도쿄 로컬 유키입니다. 뭐든 도움드릴게요!' },
  '프랑스':     { name: 'Sophie',   emoji: '🗼', greeting: 'Bonjour! 파리 현지인 Sophie예요. 뭐든 물어보세요~' },
  '이탈리아':   { name: 'Marco',    emoji: '🏛️', greeting: 'Ciao! 이탈리아 가이드 Marco입니다. 뭐든 알려드려요!' },
  '스페인':     { name: 'Isabella', emoji: '💃', greeting: '¡Hola! 스페인 현지인 Isabella야. 뭐든 물어봐!' },
  '태국':       { name: 'Nam',      emoji: '🌴', greeting: 'Sawasdee! 태국 가이드 Nam이에요. 무엇이든 물어보세요!' },
}
const DEFAULT_PERSONA_FB = { name: 'Trip AI', emoji: '✈️', greeting: '안녕하세요! 여행에 대해 무엇이든 물어보세요!' }

function TravelChatDrawer({ destination }) {
  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [apiPersona, setApiPersona] = useState(null)
  const bottomRef = useRef(null)

  const basePersona = PERSONA_DEFAULTS[destination] || DEFAULT_PERSONA_FB
  const persona     = apiPersona || basePersona

  const handleToggle = () => {
    if (!open && msgs.length === 0) {
      setMsgs([{ role: 'bot', text: basePersona.greeting, isGreeting: true }])
    }
    setOpen(v => !v)
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput('')

    const next = [...msgs, { role: 'user', text: userText }]
    setMsgs(next)
    setLoading(true)

    try {
      const history = next
        .slice(0, -1)
        .filter(m => !m.isGreeting)
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }))

      const res = await apiPost('/ai-travel/chat', { message: userText, history, destination })

      if (res.persona && !apiPersona) setApiPersona(res.persona)
      setMsgs(prev => [...prev, { role: 'bot', text: res.reply }])
    } catch {
      setMsgs(prev => [...prev, { role: 'bot', text: '죄송해요, 잠시 후 다시 시도해주세요.' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  return (
    <>
      {/* FAB 버튼 */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 z-40"
        style={{ background: open ? '#18181B' : '#2563EB' }}
        title={open ? '닫기' : `${persona.name}에게 물어보기`}
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <MessageCircle className="w-5 h-5 text-white" />
        }
      </button>

      {/* 채팅 드로어 */}
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 flex flex-col bg-white rounded-t-2xl border-t border-zinc-200"
          style={{ height: '70vh', maxWidth: '512px', margin: '0 auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}
        >
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-xl">{persona.emoji}</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-zinc-900">{persona.name}</p>
              <p className="text-xs text-zinc-400">{destination} 현지 가이드</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-zinc-400">온라인</span>
            </div>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-sm flex-shrink-0">{persona.emoji}</div>
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-zinc-100 text-zinc-800 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* 타이핑 인디케이터 */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-sm flex-shrink-0">{persona.emoji}</div>
                <div className="bg-zinc-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(j => (
                      <div key={j} className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="px-4 py-3 border-t border-zinc-100 flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={`${persona.name}에게 물어보기...`}
              className="flex-1 h-10 px-4 text-sm bg-zinc-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ════════════════════════════════════════════
   RESULT
════════════════════════════════════════════ */
function Result({ info, planData, onReset }) {
  const [activeDay, setActiveDay] = useState(0)
  const dest = info.country || CONTINENTS.find(c => c.key === info.continent)?.label || '여행'
  const theme = getDominantTheme(info.styles ?? [])
  const isAustralia = AUSTRALIA_CITIES.has(info.country || '') || AUSTRALIA_CITIES.has(info.continent || '')
  const mockPool = isAustralia ? MOCK_AUSTRALIA : MOCK_RESULTS
  const fallback = mockPool[theme] ?? (isAustralia ? MOCK_AUSTRALIA.nature : MOCK_RESULTS_DEFAULT)
  const source = planData ?? fallback
  const days = source.days.slice(0, info.nights + 1)
  const day = days[activeDay]
  const diffLabel  = DIFFICULTY_OPTIONS.find(d => d.key === info.difficulty)
  const budgetLabel = BUDGET_OPTIONS.find(b => b.key === info.budget)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 상단 트립 카드 */}
      <div className="px-5 pt-14 pb-6 border-b border-zinc-100">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-xs font-semibold text-emerald-600">일정이 생성되었습니다</span>
          </div>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-2xl flex-shrink-0">
              {CONTINENTS.find(c => c.key === info.continent)?.emoji || '🌍'}
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900">{dest} 여행</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                {info.startDate} — {info.endDate} · {info.nights}박 {info.nights + 1}일
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md font-medium">
              성인 {info.adults}명{info.children > 0 ? ` · 어린이 ${info.children}명` : ''}
            </span>
            {budgetLabel && (
              <span className="text-[11px] bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md font-medium">
                {budgetLabel.emoji} {budgetLabel.label}
              </span>
            )}
            {diffLabel && (
              <span className="text-[11px] bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md font-medium">
                {diffLabel.label}
              </span>
            )}
            {info.mustVisit && (
              <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium">
                📍 {info.mustVisit}
              </span>
            )}
            {info.styles?.slice(0, 3).map(s => (
              <span key={s} className="text-[11px] bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-md font-medium">{s}</span>
            ))}
          </div>

          <button onClick={onReset} className="mt-4 text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline underline-offset-2">
            다시 만들기
          </button>
        </div>
      </div>

      {/* 일차 탭 */}
      <div className="px-5 pt-4 pb-3 flex gap-2 max-w-lg mx-auto w-full border-b border-zinc-100">
        {days.map((d, i) => (
          <button key={i} onClick={() => setActiveDay(i)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeDay === i ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}>
            {d.label}
          </button>
        ))}
      </div>

      {/* 타임라인 */}
      <div className="flex-1 px-5 py-5 max-w-lg mx-auto w-full pb-28">
        <p className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wider">{day.theme}</p>
        {day.items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0 w-9">
              <div className={`w-2.5 h-2.5 rounded-full mt-3.5 flex-shrink-0 ${
                item.isMeal ? 'bg-orange-400' : 'bg-zinc-300'
              }`} />
              {i < day.items.length - 1 && <div className="w-px flex-1 bg-zinc-100 mt-1" />}
            </div>
            <div className={`flex-1 mb-3 rounded-xl p-4 border ${
              item.isMeal
                ? 'bg-orange-50 border-orange-100'
                : 'bg-white border-zinc-100'
            }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p className="text-[11px] font-mono text-zinc-400 mb-1">{item.time}</p>
              <p className={`text-sm font-bold mb-1 ${item.isMeal ? 'text-orange-900' : 'text-zinc-900'}`}>{item.name}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{item.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 페르소나 챗봇 */}
      <TravelChatDrawer destination={dest} />
    </div>
  )
}

/* ════════════════════════════════════════════
   MAIN
════════════════════════════════════════════ */
export default function AiTravelPage() {
  const [searchParams] = useSearchParams()
  const roomParam = searchParams.get('room')

  const [view, setView]         = useState('landing')
  const [roomCode]              = useState(randomCode)
  const [friends, setFriends]   = useState([])
  const [tripInfo, setTripInfo] = useState(null)
  const [planData, setPlanData] = useState(null)

  useEffect(() => {
    if (view !== 'group-invite') return
    const t1 = setTimeout(() => setFriends([MOCK_FRIENDS[0]]), 2500)
    const t2 = setTimeout(() => setFriends([MOCK_FRIENDS[0], MOCK_FRIENDS[1]]), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [view])

  if (roomParam) return <FriendJoinForm roomCode={roomParam} />

  const handleFormSubmit = info => {
    setTripInfo(info)
    if (info.travelType === 'group') setView('group-invite')
    else setView('loading')
  }
  const handleReset = () => { setTripInfo(null); setFriends([]); setPlanData(null); setView('landing') }

  return (
    <div>
      {view === 'landing'      && <Landing onStart={() => setView('form')} />}
      {view === 'form'         && <TravelFormWizard onSubmit={handleFormSubmit} onBack={() => setView('landing')} />}
      {view === 'group-invite' && <GroupInvite roomCode={roomCode} friends={friends} tripInfo={tripInfo} onProceed={() => setView('loading')} />}
      {view === 'loading'      && <Loading info={tripInfo} onDone={data => { if (data) setPlanData(data); setView('result') }} />}
      {view === 'result'       && <Result info={tripInfo} planData={planData} onReset={handleReset} />}
    </div>
  )
}
