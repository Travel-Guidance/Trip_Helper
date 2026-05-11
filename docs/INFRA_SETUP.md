# 인프라 설정

## 로컬 Docker 서비스 실행

프로젝트 루트에서 인프라 컨테이너 시작:

```bash
docker compose up -d mysql redis qdrant
```

## 데이터베이스 마이그레이션

MySQL은 Docker volume이 처음 생성될 때만 `backend/models/schema.sql`을 자동 실행함. Volume이 이미 존재하는 경우 아래 명령으로 직접 실행:

```bash
cd backend
npm run db:migrate
```

## RAG 벡터 시드 데이터

Qdrant는 처음에 비어 있음. `GEMINI_API_KEY` 설정 후 호주 중심 RAG 지식 데이터를 주입:

```bash
cd backend
npm run seed:vector
```

## 헬스 체크

백엔드 실행 후:

```text
GET http://localhost:3001/api/health
```

헬스 응답에 MySQL 및 Qdrant 상태가 포함됨. Qdrant가 비어 있으면 `npm run seed:vector` 실행.
