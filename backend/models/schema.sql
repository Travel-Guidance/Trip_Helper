-- Trip Helper DB Schema
-- Docker 컨테이너 초기화 시 자동 실행됨

SET NAMES utf8mb4;
SET time_zone = '+09:00';

-- ─── 사용자 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── 여행 방 (그룹 플래닝) ────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_rooms (
  id           BIGINT       AUTO_INCREMENT PRIMARY KEY,
  room_code    VARCHAR(10)  NOT NULL UNIQUE,
  host_user_id BIGINT,
  continent    VARCHAR(50),
  country      VARCHAR(100),
  start_date   DATE,
  end_date     DATE,
  nights       INT          DEFAULT 1,
  budget       VARCHAR(20),
  difficulty   VARCHAR(20),
  adults       INT          DEFAULT 1,
  children     INT          DEFAULT 0,
  status       ENUM('waiting','generating','done') DEFAULT 'waiting',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── 그룹 참여자 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_participants (
  id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
  room_id    BIGINT       NOT NULL,
  name       VARCHAR(100) NOT NULL,
  budget     VARCHAR(20),
  styles     JSON,
  continent  VARCHAR(50),
  completed  BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES travel_rooms(id) ON DELETE CASCADE
);

-- ─── 생성된 여행 일정 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_plans (
  id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
  room_id     BIGINT,
  user_id     BIGINT,
  destination VARCHAR(200),
  plan_data   JSON         NOT NULL,
  budget      VARCHAR(20),
  nights      INT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES travel_rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)        ON DELETE SET NULL
);

-- ─── 여행 중 활동 로그 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_logs (
  id         BIGINT    AUTO_INCREMENT PRIMARY KEY,
  plan_id    BIGINT    NOT NULL,
  day_index  INT       NOT NULL,
  item_index INT       NOT NULL,
  visited    BOOLEAN   DEFAULT FALSE,
  actual_cost DECIMAL(10,2),
  note       TEXT,
  photo_url  VARCHAR(500),
  logged_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
);

-- ─── 지출 내역 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id          BIGINT      AUTO_INCREMENT PRIMARY KEY,
  plan_id     BIGINT      NOT NULL,
  category    ENUM('food','transport','entrance','shopping','accommodation','other') NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  currency    VARCHAR(10) DEFAULT 'KRW',
  description VARCHAR(255),
  spent_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
);

-- ─── 여행 사진/메모 (타임라인용) ─────────────────────────
CREATE TABLE IF NOT EXISTS travel_memories (
  id         BIGINT        AUTO_INCREMENT PRIMARY KEY,
  plan_id    BIGINT        NOT NULL,
  day_index  INT           NOT NULL,
  photo_url  VARCHAR(500),
  caption    VARCHAR(500),
  location   VARCHAR(200),
  taken_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE CASCADE
);

-- ─── Vector DB 시드 데이터 색인 추적 ─────────────────────
CREATE TABLE IF NOT EXISTS knowledge_seeds (
  id           BIGINT        AUTO_INCREMENT PRIMARY KEY,
  destination  VARCHAR(100)  NOT NULL,
  category     VARCHAR(50),
  content      TEXT          NOT NULL,
  qdrant_id    VARCHAR(100),
  embedded_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
