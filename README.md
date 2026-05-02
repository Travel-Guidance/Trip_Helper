# 폰가이즈 (PhoneGuyz)

> AI와 함께 떠나는 해외여행 — 핸드폰 하나로 항공권 예약, eSIM 구매, 실시간 여행 가이드까지.

---

## 필요한 외부 API 키

### 1. Duffel API (항공권 검색/예약)

1. [https://app.duffel.com](https://app.duffel.com) 에서 회원가입 (무료)
2. 로그인 후 **Settings → API Keys → Create test key**
3. 키 이름 예: `phoneguyz-dev`
4. 발급된 키 복사 (`duffel_test_...` 형태)

> 테스트 환경이므로 실제 결제·발권은 이루어지지 않습니다.

### 2. Gmail 앱 비밀번호 (예약 확인 이메일 발송)

> 이메일 발송이 필요 없다면 이 단계는 건너뛰어도 됩니다.

1. Google 계정 → **보안** → **2단계 인증** 활성화 (필수)
2. 보안 → **앱 비밀번호** → 앱 선택: `기타(직접 입력)` → 이름: `phoneguyz`
3. 생성된 16자리 앱 비밀번호 복사

---

## 환경변수 설정

`backend/` 폴더에 `.env` 파일을 생성하세요.

```env
DUFFEL_ACCESS_TOKEN=duffel_test_여기에붙여넣기
EMAIL_USER=your@gmail.com
EMAIL_PASS=앱비밀번호16자리
PORT=3001
```

> `EMAIL_USER`, `EMAIL_PASS` 를 비워두면 이메일 발송 없이 서버가 정상 동작합니다.

---

## 패키지 설치

```bash
# 백엔드
cd backend
npm install

# 프론트엔드
cd frontend
npm install
```

---

## 실행 방법

터미널 두 개를 열어 각각 실행하세요.

**터미널 1 — 백엔드**
```bash
cd backend
npm run dev       # 개발 (파일 변경 시 자동 재시작)
# 또는
npm start         # 일반 실행
```

**터미널 2 — 프론트엔드**
```bash
cd frontend
npm run dev
```

| 서버 | 주소 |
|---|---|
| 프론트엔드 | http://localhost:5173 |
| 백엔드 API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api-docs |

---

## 프로젝트 구조

```
air/
├── backend/
│   ├── config/
│   │   ├── duffel.js          # Duffel 클라이언트
│   │   ├── mailer.js          # Nodemailer 설정
│   │   └── swagger.js         # Swagger UI 설정
│   ├── models/
│   │   └── popularDestinations.js  # 인기 여행지 데이터
│   ├── services/
│   │   ├── flightService.js   # Duffel API 호출 (항공권/좌석)
│   │   ├── orderService.js    # 예약 생성 비즈니스 로직
│   │   └── emailService.js    # 이메일 템플릿/발송
│   ├── controllers/
│   │   ├── flightController.js
│   │   ├── orderController.js
│   │   ├── seatController.js
│   │   ├── popularController.js
│   │   └── esimController.js
│   ├── routes/
│   │   ├── flightRoutes.js    # /api/places, /api/search, /api/offers/:id
│   │   ├── orderRoutes.js     # /api/orders
│   │   ├── seatRoutes.js      # /api/seat-maps/:offerId
│   │   ├── popularRoutes.js   # /api/popular
│   │   └── esimRoutes.js      # /api/esim/purchase
│   ├── middlewares/
│   │   └── errorHandler.js    # 글로벌 에러 핸들러
│   └── index.js               # 서버 진입점
│
└── frontend/
    └── src/
        ├── pages/             # 화면 단위 컴포넌트
        ├── components/        # 재사용 UI 컴포넌트
        ├── services/
        │   ├── flightApi.js   # 항공권 API 호출 함수
        │   ├── seatApi.js     # 좌석 API 호출 함수
        │   └── esimApi.js     # eSIM API 호출 함수
        ├── hooks/
        │   ├── useFlightSearch.js  # 항공편 검색 훅
        │   ├── useOffer.js         # 오퍼 조회 훅 (sessionStorage 캐시 포함)
        │   └── useSeatMaps.js      # 좌석 배치도 조회 훅
        ├── store/
        │   └── SearchContext.jsx   # 전역 검색 상태 (tripType 등)
        ├── utils/
        │   └── index.js       # 날짜/가격 포매터, FLAGS 상수
        └── App.jsx
```

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| 항공권 검색 | 출발지·도착지·날짜 입력 → 실시간 항공편 조회 (Duffel API) |
| 좌석 선택 | 세그먼트별 좌석 배치도 표시, 유·무료 좌석 선택 |
| 예약 생성 | 승객 정보 입력 → 예약 완료 + 이메일 발송 |
| eSIM 구매 | 국가·플랜 선택 → 활성화 코드 이메일 발송 |
| 인기 여행지 | 지역별 최저가 항공편 바로가기 |

> 테스트 모드에서 Duffel 주문 생성 실패 시 자동으로 데모 예약번호(AIR + 6자리)를 발급합니다.
