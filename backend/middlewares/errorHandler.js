function errorHandler(err, req, res, next) {
  const duffelErrors = err.errors;
  if (duffelErrors?.length) {
    const first = duffelErrors[0];
    console.error(`[${req.method} ${req.path}] Duffel error: ${first.code} - ${first.message}`);
    return res.status(500).json({ error: `${first.code}: ${first.message}` });
  }
  const message = err.message || '서버 오류가 발생했습니다';
  console.error(`[${req.method} ${req.path}] Error: ${message}`);
  res.status(err.status || 500).json({ error: message });
}

module.exports = errorHandler;
