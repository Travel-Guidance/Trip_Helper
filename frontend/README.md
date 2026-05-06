# 폰가이즈 (PhoneGuides)

> 핸드폰 하나로 떠나는 여행 — 항공권 검색부터 AI 일정 생성까지

## 소개

폰가이즈는 혼자 여행을 계획할 때 막막함을 해소해주는 여행 플랫폼입니다.  
항공권 검색, eSIM, 숙소, 투어·액티비티, AI 맞춤 일정 생성을 하나의 앱에서 제공합니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| **항공권 검색** | 출발지·목적지·날짜 조건으로 실시간 항공권 검색, 실시간 최저가 목적지 추천 |
| **eSIM** | 국가별 eSIM 상품 조회 및 구매 플로우 |
| **숙소** | 목적지·날짜 기반 숙소 검색 및 상세 조회 |
| **투어·액티비티** | 현지 투어·티켓 상품 목록 및 상세 |
| **AI 여행 일정 생성** | 여행 스타일 태그 선택 → AI가 테마에 맞는 일정 자동 생성, 그룹 여행 초대 링크 지원 |

## 기술 스택

- **React 19** + **Vite 8**
- **React Router v7** (SPA 라우팅)
- **Tailwind CSS v4**
- **Lucide React** (아이콘)
- **React Compiler** (babel-plugin-react-compiler)

## 프로젝트 구조

```
frontend/
├── src/
│   ├── api/                # API 클라이언트 모듈
│   │   ├── apiClient.js    # Axios 기반 공통 클라이언트
│   │   ├── flightApi.js    # 항공권 API
│   │   ├── seatApi.js      # 좌석 선택 API
│   │   ├── accommodationApi.js
│   │   ├── esimApi.js
│   │   └── tourApi.js
│   ├── components/
│   │   ├── common/         # 공용 컴포넌트
│   │   │   ├── SearchBar.jsx       # 항공권 검색 폼
│   │   │   ├── CalendarPicker.jsx  # 날짜 선택 (range 지원)
│   │   │   ├── AirportInput.jsx
│   │   │   ├── AirportModal.jsx
│   │   │   └── FlightCard.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx          # 상단 네비게이션
│   │   │   ├── Header.jsx
│   │   │   └── BottomNav.jsx       # 모바일 하단 탭
│   │   ├── main/
│   │   │   ├── HeroSection.jsx     # 메인 히어로 (이미지 슬라이드 + 폰 목업)
│   │   │   ├── CTASection.jsx      # AI 여행 가이드 CTA 카드
│   │   │   ├── FeaturesSection.jsx
│   │   │   ├── ServicesSection.jsx
│   │   │   ├── StepsSection.jsx
│   │   │   ├── MusicPlayer.jsx
│   │   │   └── Footer.jsx
│   │   ├── accommodation/
│   │   └── esim/
│   ├── pages/
│   │   ├── Home.jsx                # 메인 홈 (실시간 최저가 목적지)
│   │   ├── AiTravelPage.jsx        # AI 여행 일정 생성 페이지
│   │   ├── SearchResults.jsx       # 항공권 검색 결과
│   │   ├── BookingForm.jsx         # 예약 정보 입력
│   │   ├── SeatSelection.jsx       # 좌석 선택
│   │   ├── Confirmation.jsx        # 예약 완료
│   │   ├── Accommodation.jsx
│   │   ├── AccSearchResults.jsx
│   │   ├── AccommodationDetail.jsx
│   │   ├── AccommodationConfirmation.jsx
│   │   ├── ESimPage.jsx
│   │   ├── TourTicket.jsx
│   │   ├── TourTicketDetail.jsx
│   │   ├── LoginPage.jsx
│   │   └── MainPage.jsx
│   ├── store/              # Context API 전역 상태
│   ├── hooks/              # 커스텀 훅
│   └── styles/             # 글로벌 CSS
└── package.json
```

## AI 여행 일정 생성 플로우

```
시작하기 클릭
    │
    ▼
혼자 여행 / 친구들이랑?
    │
    ├─ 혼자 ──────────────────────────────────────────────┐
    │                                                      │
    └─ 친구들이랑                                           │
         │                                                 │
         ▼                                                 │
    초대 링크 생성 (?room=CODE)                             │
    친구들이 링크 접속 → 각자 스타일 입력                    │
    모두 완료 대기                                          │
         │                                                 │
         └──────────────────────────────────────────────► ▼
                                                    여행 정보 폼
                                              (기간·인원·예산·스타일·목적지)
                                                           │
                                                           ▼
                                                     생성 중 애니메이션
                                                           │
                                                           ▼
                                                  스타일 태그 기반 일정 결과
                                               (음식/자연/쇼핑/액티비티 등 테마 분기)
```

### 여행 스타일 → 일정 테마 매핑

선택한 태그 중 가장 많이 선택된 테마가 일정 결과를 결정합니다.

| 테마 | 대표 태그 |
|------|-----------|
| `food` | 맛집 탐방, 카페 투어, 파인다이닝, 야시장 |
| `nature` | 자연 힐링, 등산·트레킹, 일출·일몰, 국립공원 |
| `rest` | 온천·스파, 해변·바다, 리조트·풀빌라, 마사지 |
| `shopping` | 쇼핑, 명품·패션, 로컬 마켓, 면세 쇼핑 |
| `activity` | 서핑·수상스포츠, 스카이다이빙, 스쿠버다이빙, 번지점프 |
| `culture` | 문화·역사, 박물관, 미술관·갤러리, 사원·성지 |
| `photo` | 포토 스팟, 인스타 감성 |
| `night` | 나이트라이프, 현지 술 문화, 야경 감상 |

## 시작하기

```bash
cd frontend
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173` 에서 실행됩니다.

```bash
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # ESLint 검사
```

## 라우팅

| 경로 | 페이지 |
|------|--------|
| `/home` | 메인 홈 |
| `/ai-travel` | AI 여행 일정 생성 |
| `/search` | 항공권 검색 결과 |
| `/booking` | 항공권 예약 |
| `/seat-selection` | 좌석 선택 |
| `/confirmation` | 예약 완료 |
| `/accommodation` | 숙소 검색 |
| `/esim` | eSIM |
| `/tour-ticket` | 투어·액티비티 |
| `/login` | 로그인 |
