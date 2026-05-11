# 스키마 정리

## 현재 사용 중인 테이블

백엔드 라우트/서비스에서 실제로 사용하는 테이블:

- `users`: 이메일/카카오 인증
- `flight_bookings`: 내 정보 페이지용 항공권 예약 내역
- `stay_bookings`: 내 정보 페이지용 숙소 예약 내역
- `travel_plans`: AI가 생성한 여행 일정 저장

## 미사용 / 향후 기능용 테이블

`backend/models/schema.sql`에 정의되어 있지만 현재 예약/내 정보 흐름에서는 사용하지 않는 테이블:

- `travel_rooms`
- `room_participants`
- `travel_logs`
- `expenses`
- `travel_memories`
- `knowledge_seeds`

`travel_rooms`는 `travel_plans.room_id`의 외래 키 참조 대상이라 테이블 자체는 생성됨. 협업 플래닝을 실제 DB 저장 기능으로 구현할 경우, 관련 라우트/서비스 코드를 이 테이블들 옆으로 이동할 것. 그렇지 않을 경우, 별도 마이그레이션에서 `travel_plans`의 `room_id` 컬럼을 제거.

## 벡터 스토어

RAG 지식 데이터는 MySQL이 아닌 Qdrant에 저장됨. `knowledge_seeds` 테이블은 향후 데이터 주입/감사 추적용으로 예약되어 있으며, 현재 `npm run seed:vector`에서 쓰지 않음.
