const { sendESimEmail } = require('../services/emailService');

async function purchaseEsim(req, res) {
  const { email, countries, totalPrice, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: '필수 값 누락' });

  sendESimEmail({ email, code, countries, totalPrice })
    .catch(err => console.error('eSIM email error:', err.message));

  res.json({ ok: true, code });
}

module.exports = { purchaseEsim };
