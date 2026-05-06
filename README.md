# 폰가이즈 (PhoneGuides)

> 핸드폰 하나로 떠나는 여행 — 항공권 검색부터 AI 일정 생성까지

폰가이즈는 혼자 여행을 계획할 때 막막함을 해소해주는 여행 플랫폼입니다.  
항공권 검색·예약, 좌석 선택, eSIM 구매, 숙소 검색, 투어·액티비티, AI 맞춤 일정 생성을 하나의 흐름으로 제공합니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| **항공권 검색** | 출발지·목적지·날짜·승객 수 기반 실시간 검색, 최저가 목적지 추천 |
| **좌석 선택** | Duffel 좌석맵 조회 및 유료/무료 좌석 선택 |
| **예약 생성** | 승객 정보 입력 후 테스트 예약 생성 및 확인 메일 발송 |
| **eSIM** | 국가·기간·데이터 플랜 선택 후 활성화 코드 발급 |
| **숙소** | 국가·체크인/체크아웃·인원 기반 숙소 검색 및 상세 조회 |
| **투어·액티비티** | Google Places 기반 투어·티켓 검색 및 상세 조회 |
| **AI 여행 일정 생성** | 여행 스타일 태그 선택 → 테마에 맞는 일정 자동 생성, 그룹 초대 링크 지원 |

## 기술 스택

| 영역 | 스택 |
|------|------|
| **프론트엔드** | React 19, Vite 8, React Router v7, Tailwind CSS v4, Lucide React |
| **백엔드** | Node.js, Express |
| **항공권** | Duffel API |
| **숙소** | Hotelbeds API |
| **투어·지도** | Google Maps / Places API |
| **메일** | SMTP (예약 확인 메일) |

## 프로젝트 구조

```text
air/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── data/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   └── index.js
└── frontend/
    └── src/
        ├── api/            # API 클라이언트 (flightApi, seatApi, accommodationApi, esimApi, tourApi)
        ├── components/
        │   ├── common/     # SearchBar, CalendarPicker, AirportModal, FlightCard
        │   ├── layout/     # Navbar, BottomNav, Header
        │   ├── main/       # HeroSection, CTASection, Footer, MusicPlayer
        │   ├── accommodation/
        │   └── esim/
        ├── pages/          # Home, AiTravelPage, SearchResults, BookingForm, SeatSelection 등
        ├── store/          # Context API 전역 상태
        ├── hooks/
        └── styles/
```

## 외부 API 설정

### Duffel API
항공권 검색, 오퍼 조회, 주문 생성, 좌석맵 조회에 사용합니다.

1. `https://app.duffel.com` 에서 계정을 생성합니다.
2. Settings > API Keys > Create test key 로 테스트 키를 발급합니다.
3. `backend/.env` 의 `DUFFEL_ACCESS_TOKEN` 에 입력합니다.

### Hotelbeds API
숙소 검색, 숙소 상세 정보 조회, 예약 가능 여부 확인에 사용합니다.

### Google Maps / Places API
투어 검색, 장소 상세 정보, 지도 임베드 URL 생성에 사용합니다.

### Email SMTP
항공권/eSIM/숙소 예약 확인 메일 발송에 사용합니다. 필요하지 않으면 이메일 관련 환경변수를 비워도 서버는 실행됩니다.

## 환경변수

```bash
# 백엔드
cd backend && cp .env.example .env

# 프론트엔드
cd frontend && cp .env.example .env
```

로컬 개발에서는 `frontend/.env`의 `VITE_API_BASE`를 비워두면 Vite dev server가 `/api` 요청을 `http://localhost:3001`로 프록시합니다.

배포 시에는 실제 주소를 입력합니다.

```env
# frontend/.env
VITE_API_BASE=https://your-backend.example.com

# backend/.env
BACKEND_URL=https://your-backend.example.com
FRONTEND_URL=https://your-frontend.example.com
```

`VITE_API_BASE`에는 `/api`를 붙이지 않습니다. 프론트 코드가 자동으로 `/api`를 붙입니다.

## 설치 및 실행

```bash
# 의존성 설치
cd backend && npm install
cd ../frontend && npm install
```

터미널 1 (백엔드):
```bash
cd backend && npm run dev
```

터미널 2 (프론트엔드):
```bash
cd frontend && npm run dev
```

| 서비스 | 주소 |
|--------|------|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api-docs |

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

## AI 여행 일정 생성

### 플로우

```
시작하기 클릭
    │
    ▼
혼자 여행 / 친구들이랑?
    │
    ├─ 혼자 ─────────────────────────────────────────────┐
    │                                                     │
    └─ 친구들이랑                                          │
         │                                                │
         ▼                                                │
    초대 링크 생성 (?room=CODE)                            │
    친구들이 링크 접속 → 각자 스타일 입력                   │
    모두 완료 대기                                         │
         │                                                │
         └─────────────────────────────────────────────► ▼
                                                   여행 정보 폼
                                             (기간·인원·예산·스타일·목적지)
                                                          │
                                                          ▼
                                                    생성 중 애니메이션
                                                          │
                                                          ▼
                                                 스타일 태그 기반 일정 결과
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

## 배포

1. AWS에 백엔드를 먼저 배포합니다.
2. 백엔드 URL을 확인합니다.
3. Vercel 프론트엔드 환경변수 `VITE_API_BASE`에 백엔드 URL을 입력합니다.
4. Vercel에 프론트엔드를 배포합니다.
5. 프론트엔드 URL을 백엔드 `FRONTEND_URL`에 입력한 뒤 백엔드를 재시작합니다.
