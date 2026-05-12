'use strict';

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const JWT_EXPIRES = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ── 이메일 회원가입 ────────────────────────────────────────
router.post('/auth/signup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: '이메일, 비밀번호, 닉네임을 모두 입력하세요.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND provider = ?',
      [email, 'email']
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, name, password_hash, provider) VALUES (?, ?, ?, ?)',
      [email, name, passwordHash, 'email']
    );

    const user = { id: result.insertId, email, name, provider: 'email' };
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// ── 이메일 로그인 ──────────────────────────────────────────
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND provider = ?',
      [email, 'email']
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const dbUser = rows[0];
    const valid = await bcrypt.compare(password, dbUser.password_hash || '');
    if (!valid) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = { id: dbUser.id, email: dbUser.email, name: dbUser.name, provider: 'email' };
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// ── 내 정보 조회 (JWT 검증) ───────────────────────────────
router.get('/auth/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ user: { id: payload.id, email: payload.email, name: payload.name } });
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
});

// ── 카카오 OAuth ───────────────────────────────────────────
const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_PROFILE_URL = 'https://kapi.kakao.com/v2/user/me';

function getKakaoClientId() {
  return (process.env.KAKAO_CLIENT_ID || '').trim();
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function getKakaoRedirectUri() {
  return process.env.KAKAO_REDIRECT_URI || `${getFrontendUrl()}/auth/kakao/callback`;
}

router.get('/auth/kakao/start', (req, res) => {
  const clientId = getKakaoClientId();
  if (!clientId) {
    return res.status(500).json({
      error: 'Kakao login is not configured.',
      detail: 'Set KAKAO_CLIENT_ID in backend/.env to your Kakao REST API key.',
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getKakaoRedirectUri(),
    response_type: 'code',
  });
  res.redirect(`${KAKAO_AUTH_URL}?${params.toString()}`);
});

router.get('/auth/kakao/profile', async (req, res, next) => {
  try {
    const { code } = req.query;
    const clientId = getKakaoClientId();
    if (!code) {
      return res.status(400).json({ error: '카카오 인증 코드가 없습니다.' });
    }
    if (!clientId) {
      return res.status(500).json({
        error: 'Kakao login is not configured.',
        detail: 'Set KAKAO_CLIENT_ID in backend/.env to your Kakao REST API key.',
      });
    }

    // 1. 액세스 토큰 발급
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: getKakaoRedirectUri(),
      code,
    });
    if (process.env.KAKAO_CLIENT_SECRET) {
      tokenParams.set('client_secret', process.env.KAKAO_CLIENT_SECRET);
    }

    const tokenRes = await fetch(KAKAO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: tokenParams,
    });
    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[Kakao] token exchange failed', tokenRes.status, errBody);
      return res.status(502).json({
        error: 'Failed to exchange Kakao authorization code for an access token.',
        detail: errBody,
        hint: 'Check that KAKAO_CLIENT_ID is the Kakao REST API key, KAKAO_CLIENT_SECRET matches if client secret is enabled, and KAKAO_REDIRECT_URI exactly matches the Kakao console redirect URI.',
        redirectUri: getKakaoRedirectUri(),
      });
    }
    const kakaoToken = await tokenRes.json();

    // 2. 프로필 조회
    const profileParams = new URLSearchParams({
      property_keys: JSON.stringify([
        'properties.nickname',
        'kakao_account.profile',
        'kakao_account.email',
      ]),
    });
    const profileRes = await fetch(KAKAO_PROFILE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kakaoToken.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: profileParams,
    });
    if (!profileRes.ok) {
      return res.status(502).json({ error: '카카오 프로필을 가져오지 못했습니다.' });
    }
    const profile = await profileRes.json();

    const kakaoId = String(profile.id);
    const nickname =
      profile.kakao_account?.profile?.nickname ||
      profile.properties?.nickname ||
      '카카오 사용자';
    const email = profile.kakao_account?.email || null;

    // 3. DB에 사용자 찾기 or 생성
    let [rows] = await pool.query(
      'SELECT * FROM users WHERE provider = ? AND provider_id = ?',
      ['kakao', kakaoId]
    );

    let dbUser;
    if (rows.length > 0) {
      dbUser = rows[0];
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (email, name, provider, provider_id) VALUES (?, ?, ?, ?)',
        [email, nickname, 'kakao', kakaoId]
      );
      dbUser = { id: result.insertId, email, name: nickname };
    }

    const user = { id: dbUser.id, email: dbUser.email, name: dbUser.name, provider: 'kakao' };
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
