const mailer = require('../config/mailer');
const {
  createBookingEmail,
  createESimEmail,
  createStayBookingEmail,
} = require('../templates/emailTemplates');

function genRef(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = prefix;
  for (let i = 0; i < 6; i += 1) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

function genBookingRef() {
  return genRef('PG');
}

function genStayBookingRef() {
  return genRef('STAY');
}

async function sendTemplateEmail({ to, template }) {
  if (!mailer) return false;
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_NAVER_USER || process.env.EMAIL_USER;

  await mailer.sendMail({
    from: `"${template.fromName}" <${fromEmail}>`,
    to,
    subject: template.subject,
    html: template.html,
  });

  return true;
}

async function sendBookingEmail({ to, passengerName, bookingRef, slices, totalAmount, totalCurrency }) {
  return sendTemplateEmail({
    to,
    template: createBookingEmail({ passengerName, bookingRef, slices, totalAmount, totalCurrency }),
  });
}

async function sendESimEmail({ email, code, countries, totalPrice }) {
  return sendTemplateEmail({
    to: email,
    template: createESimEmail({ code, countries, totalPrice }),
  });
}

async function sendStayBookingEmail({
  to,
  guestName,
  bookingRef,
  hotelName,
  location,
  checkIn,
  checkOut,
  nights,
  guests,
  totalPrice,
  currency,
  image,
}) {
  return sendTemplateEmail({
    to,
    template: createStayBookingEmail({
      guestName,
      bookingRef,
      hotelName,
      location,
      checkIn,
      checkOut,
      nights,
      guests,
      totalPrice,
      currency,
      image,
    }),
  });
}

module.exports = {
  genBookingRef,
  genStayBookingRef,
  sendBookingEmail,
  sendESimEmail,
  sendStayBookingEmail,
};
