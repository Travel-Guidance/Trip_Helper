'use strict';

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

module.exports = function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    }
  } catch {
    // 유효하지 않은 토큰은 무시 — 비로그인 사용자처럼 처리
  }
  next();
};
