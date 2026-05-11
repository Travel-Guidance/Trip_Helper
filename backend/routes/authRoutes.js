const { Router } = require('express');

const router = Router();

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_PROFILE_URL = 'https://kapi.kakao.com/v2/user/me';

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function getKakaoRedirectUri() {
  return process.env.KAKAO_REDIRECT_URI || `${getFrontendUrl()}/auth/kakao/callback`;
}

router.get('/auth/kakao/start', (req, res) => {
  const clientId = process.env.KAKAO_CLIENT_ID || '4416539a7e84ede4a15b526950b906a2';
  if (!clientId) {
    return res.status(500).json({ error: 'KAKAO_CLIENT_ID가 설정되지 않았습니다.' });
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
    const clientId = process.env.KAKAO_CLIENT_ID || '4416539a7e84ede4a15b526950b906a2';
    if (!code || !clientId) {
      return res.status(400).json({ error: '카카오 인증 코드가 없습니다.' });
    }

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
      return res.status(502).json({ error: '카카오 토큰을 가져오지 못했습니다.' });
    }

    const token = await tokenRes.json();
    const profileRes = await fetch(KAKAO_PROFILE_URL, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!profileRes.ok) {
      return res.status(502).json({ error: '카카오 프로필을 가져오지 못했습니다.' });
    }

    const profile = await profileRes.json();
    const nickname = profile.kakao_account?.profile?.nickname || profile.properties?.nickname;
    res.json({ userName: nickname || '' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
