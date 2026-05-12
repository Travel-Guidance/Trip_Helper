-- Trip Helper DB Schema
-- Docker 컨테이너 초기화 시 자동 실행됨

SET NAMES utf8mb4;
SET time_zone = '+09:00';

-- ─── 사용자 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NULL,
  provider      VARCHAR(20)  NOT NULL DEFAULT 'email',
  provider_id   VARCHAR(255) NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── 기존 DB 마이그레이션 (컬럼 누락 시 추가) ─────────────
-- 스키마가 이미 존재하는 경우 아래 프로시저가 누락된 컬럼을 추가합니다.
DROP PROCEDURE IF EXISTS _migrate_users;
CREATE PROCEDURE _migrate_users()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'provider'
  ) THEN
    ALTER TABLE users
      ADD COLUMN password_hash VARCHAR(255) NULL,
      ADD COLUMN provider      VARCHAR(20)  NOT NULL DEFAULT 'email',
      ADD COLUMN provider_id   VARCHAR(255) NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'email' AND IS_NULLABLE = 'NO'
  ) THEN
    ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL;
  END IF;
END;
CALL _migrate_users();
DROP PROCEDURE IF EXISTS _migrate_users;

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

-- ─── 포토북 앨범 (여행별 책 단위) ─────────────────────────
-- 책 한 권 = 여행 한 번. title은 화면 상단 대제목, destination은 여행지 표기
CREATE TABLE IF NOT EXISTS photobook_albums (
  id          BIGINT        AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT        NOT NULL,
  plan_id     BIGINT        NULL,               -- travel_plans 연결 (선택)
  title       VARCHAR(200)  NOT NULL,           -- e.g. "Bali Diary"
  destination VARCHAR(200),                     -- e.g. "호주 / Australia"
  cover_image VARCHAR(500),                     -- 커버 이미지 URL
  memo        TEXT,                             -- 앨범 전체 소감
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES travel_plans(id) ON DELETE SET NULL
);

-- ─── 여행 사진/메모 (포토북 페이지 단위) ──────────────────
-- 페이지 한 장 = 이미지 + 소제목 + 본문. sort_order로 책 내 순서 결정
CREATE TABLE IF NOT EXISTS travel_memories (
  id          BIGINT        AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT        NOT NULL,
  album_id    BIGINT        NULL,               -- photobook_albums FK
  plan_id     BIGINT        NULL,               -- travel_plans FK (기존 호환)
  day_index   INT,                              -- 여행 N일차
  sort_order  INT           DEFAULT 0,          -- 앨범 내 페이지 순서
  photo_url   VARCHAR(500),                     -- 사진 URL
  subtitle    VARCHAR(200),                     -- 페이지 소제목 (e.g. "First Morning")
  caption     TEXT,                             -- 본문 설명 텍스트
  location    VARCHAR(200),                     -- 촬영 장소명
  taken_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)             ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES photobook_albums(id)  ON DELETE CASCADE,
  FOREIGN KEY (plan_id)  REFERENCES travel_plans(id)      ON DELETE SET NULL
);

-- ─── 항공권 예약 내역 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS flight_bookings (
  id                BIGINT        AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT        NULL,
  booking_reference VARCHAR(50)   NOT NULL,
  offer_id          VARCHAR(200)  NOT NULL,
  status            VARCHAR(20)   DEFAULT 'confirmed',
  passengers        JSON          NOT NULL,
  slices            JSON,
  total_amount      DECIMAL(12,2),
  total_currency    VARCHAR(10)   DEFAULT 'USD',
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── 숙소 예약 내역 ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS stay_bookings (
  id                BIGINT        AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT        NULL,
  booking_reference VARCHAR(50)   NOT NULL,
  hotel_id          VARCHAR(100),
  hotel_name        VARCHAR(255),
  location          VARCHAR(255),
  check_in          DATE,
  check_out         DATE,
  nights            INT,
  guests            INT           DEFAULT 1,
  total_amount      DECIMAL(12,2),
  total_currency    VARCHAR(10)   DEFAULT 'KRW',
  image_url         VARCHAR(500),
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
