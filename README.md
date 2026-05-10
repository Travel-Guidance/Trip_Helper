# 폰가이즈 (PhoneGuides)

> 핸드폰 하나로 떠나는 여행 — 항공권 검색부터 AI 일정 생성까지

폰가이즈는 혼자 여행을 계획할 때 막막함을 해소해주는 여행 플랫폼입니다.  
항공권 검색·예약, 좌석 선택, eSIM 구매, 숙소 검색, 투어·액티비티, AI 맞춤 일정 생성을 하나의 흐름으로 제공합니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **항공권 검색** | 출발지·목적지·날짜·승객 수 기반 실시간 검색, 최저가 목적지 추천 |
| **좌석 선택** | Duffel 좌석맵 조회 및 유료/무료 좌석 선택 |
| **예약 생성** | 승객 정보 입력 후 테스트 예약 생성 및 확인 메일 발송 |
| **eSIM** | 국가·기간·데이터 플랜 선택 후 활성화 코드 발급 |
| **숙소** | 국가·체크인/체크아웃·인원 기반 숙소 검색 및 상세 조회 |
| **투어·액티비티** | Google Places 기반 투어·티켓 검색 및 상세 조회 |
| **AI 여행 일정 생성** | 목적지·스타일·예산 입력 → RAG + MCP Agent가 맞춤 일정 자동 생성 |

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| **프론트엔드** | React 19, Vite, React Router v7, Tailwind CSS v4 |
| **백엔드** | Node.js, Express |
| **AI** | Gemini 2.5 Flash (LLM), Gemini Embedding-001 |
| **Agent** | 직접 구현한 ReAct Agent 루프 (Gemini Function Calling 기반, 최대 6회 반복) |
| **RAG** | Qdrant (벡터 DB), 직접 구축한 검색·청킹 파이프라인 |
| **MCP** | 직접 구현한 MCP 서버 3개 (지식베이스, 웹검색, 경로) |
| **항공권** | Duffel API |
| **숙소** | Hotelbeds API |
| **지도** | Google Maps Embed API, Distance Matrix API |
| **메일** | SMTP (Gmail / Naver) |
| **DB** | MySQL 8, Redis 7 |

---

## 프로젝트 구조

```
air/
├── docker-compose.yml
├── frontend/
│   └── src/
│       ├── api/            # apiClient, flightApi, accommodationApi 등
│       ├── components/
│       ├── pages/
│       └── styles/
└── backend/
    ├── config/
    ├── controllers/
    ├── data/
    │   └── knowledge/      # RAG 원본 데이터 (JSON)
    ├── domains/
    │   └── aiTravel/       # promptBuilder, responseParser
    ├── mcp-servers/        # knowledgeBaseServer, webSearchServer, routeServer
    ├── middlewares/
    ├── models/
    │   └── schema.sql
    ├── rag/                # embed, chunk, store, retrieval 등
    ├── routes/
    ├── scripts/
    │   └── ingest.js       # 벡터 임베딩 스크립트
    ├── services/
    │   ├── agentService.js # ReAct Agent 루프
    │   ├── mcpClient.js    # MCP 클라이언트
    │   ├── mcpTools.js     # Gemini Function Calling 툴 정의
    │   └── ragService.js   # RAG 검색 서비스
    └── index.js
```

---

## 로컬 개발 환경 세팅

### 사전 준비

- **Node.js** v18 이상
- **Docker Desktop** 설치 및 실행 중

### 1. 클론 및 의존성 설치

```bash
git clone [repo주소]
cd air

cd backend && npm install
cd ../frontend && npm install
```

### 2. 환경변수 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 열어 아래 항목을 발급받아 채웁니다.

| 환경변수 | 발급처 |
|----------|--------|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) |
| `DUFFEL_ACCESS_TOKEN` | [app.duffel.com](https://app.duffel.com) |
| `TAVILY_API_KEY` | [app.tavily.com](https://app.tavily.com) |
| `RAPIDAPI_KEY` | [rapidapi.com](https://rapidapi.com) |
| 이메일 관련 | Gmail 앱 비밀번호 또는 Naver SMTP |

> MySQL, Redis, Qdrant 관련 값은 `.env.example` 기본값 그대로 사용 가능합니다.

#### Google Maps API 활성화 항목

Google Cloud Console → APIs & Services에서 아래 두 가지를 활성화해야 합니다.

- **Maps Embed API** — 지도 iframe 표시
- **Distance Matrix API** — 일정 간 이동시간 조회

### 3. Docker로 인프라 실행

```bash
# 프로젝트 루트에서
docker compose up -d mysql redis qdrant
```

MySQL은 컨테이너 최초 실행 시 `backend/models/schema.sql`을 자동으로 적용합니다.

### 4. 벡터 DB 초기화 (RAG 데이터 세팅)

```bash
cd backend
npm run seed:vector
```

`data/knowledge/` 폴더의 JSON 파일을 읽어 Gemini로 임베딩을 생성하고 Qdrant에 저장합니다.  
**처음 한 번만 실행**하면 됩니다. `GEMINI_API_KEY`가 설정되어 있어야 합니다.

### 5. 서버 실행

터미널 1 — 백엔드:

```bash
cd backend && npm run dev
```

터미널 2 — 프론트엔드:

```bash
cd frontend && npm run dev
```

| 서비스 | 주소 |
|--------|------|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api-docs |

---

## AI 여행 일정 생성 구조

```
사용자 입력 (목적지, 기간, 예산, 스타일)
        │
        ▼
  RAG 검색 (Qdrant)
  목적지 관련 지식 벡터 검색
        │
        ▼
  ReAct Agent 루프 (최대 6회)
  ┌─────────────────────────┐
  │  Gemini 2.5 Flash       │
  │  ↓ Function Calling     │
  │  MCP 툴 실행            │
  │  ├─ 지식베이스 검색      │
  │  ├─ 웹 검색 (Tavily)    │
  │  └─ 경로 조회           │
  │  ↑ 결과 반환            │
  └─────────────────────────┘
        │
        ▼
  JSON 일정 파싱 및 반환
        │
        ▼
  프론트엔드 일정 뷰 렌더링
  (Google Maps + 이동시간 표시)
```

---

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

---

## 배포

1. Docker Compose로 MySQL, Redis, Qdrant를 서버에 띄웁니다.
2. `npm run seed:vector`로 벡터 데이터를 초기화합니다.
3. 백엔드를 배포하고 URL을 확인합니다.
4. 프론트엔드 환경변수 `VITE_API_BASE`에 백엔드 URL을 입력합니다.
5. 프론트엔드를 배포합니다.
6. 백엔드 `.env`의 `FRONTEND_URL`을 프론트엔드 URL로 업데이트 후 재시작합니다.

```env
# backend/.env
BACKEND_URL=https://your-backend.example.com
FRONTEND_URL=https://your-frontend.example.com

# frontend/.env (또는 배포 환경변수)
VITE_API_BASE=https://your-backend.example.com
```

> `VITE_API_BASE`에는 `/api`를 붙이지 않습니다. 프론트 코드가 자동으로 `/api`를 붙입니다.
