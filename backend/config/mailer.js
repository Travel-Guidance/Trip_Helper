const nodemailer = require('nodemailer');

function createMailer() {
  const smtpUser = process.env.EMAIL_NAVER_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_NAVER_PASS || process.env.EMAIL_PASS;
  if (!smtpUser || !smtpPass) return null;

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
  });
}

const mailer = createMailer();

module.exports = mailer;
