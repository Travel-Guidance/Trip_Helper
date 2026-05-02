const mailer = require('../config/mailer');

function genBookingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = 'AIR';
  for (let i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

async function sendBookingEmail({ to, passengerName, bookingRef, slices, totalAmount, totalCurrency }) {
  if (!mailer) return;

  const flightRows = slices.map((slice, i) => {
    const first = slice.segments?.[0];
    const last = slice.segments?.[slice.segments.length - 1];
    const label = slices.length > 1 ? (i === 0 ? '가는 편' : '오는 편') : '항공편';
    const dep = first?.departing_at
      ? new Date(first.departing_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '-';
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">${label}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;">
          ${first?.origin?.iata_code || ''} → ${last?.destination?.iata_code || ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:13px;">${dep}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Apple SD Gothic Neo',Malgun Gothic,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1A56DB,#1e40af);padding:32px 36px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">✈️</div>
      <div style="color:#fff;font-size:22px;font-weight:800;">예약이 완료되었습니다</div>
      <div style="color:rgba(255,255,255,0.75);font-size:14px;margin-top:6px;">테스트용 예약번호가 발급되었습니다</div>
    </div>
    <div style="padding:32px 36px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:12px;color:#9ca3af;margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;">예약 번호</div>
        <div style="font-size:32px;font-weight:900;color:#1A56DB;letter-spacing:4px;font-family:monospace;">${bookingRef}</div>
      </div>
      <div style="background:#f9fafb;border-radius:10px;padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:12px;">안녕하세요, ${passengerName}님 👋</div>
        <div style="font-size:13px;color:#6b7280;line-height:1.7;">
          예약해 주셔서 감사합니다. 위 예약번호를 꼭 저장해 두세요.<br>
          본 이메일은 <strong>테스트 환경</strong>에서 발송된 이메일로, 실제 항공권이 발급되지 않습니다.
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600;">구분</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600;">구간</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#9ca3af;font-weight:600;">출발</th>
          </tr>
        </thead>
        <tbody>${flightRows}</tbody>
      </table>
      <div style="margin-top:20px;text-align:right;">
        <div style="font-size:12px;color:#9ca3af;">총 결제금액</div>
        <div style="font-size:20px;font-weight:800;color:#1A56DB;">
          ${Number(totalAmount).toLocaleString('ko-KR')}${totalCurrency === 'KRW' ? '원' : ' ' + totalCurrency}
        </div>
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #f3f4f6;">
      <div style="font-size:12px;color:#9ca3af;">Bong's 폰가이즈 예약 시스템 · 테스트 환경</div>
    </div>
  </div>
</body>
</html>`;

  await mailer.sendMail({
    from: `"Bong's 폰가이즈" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[Bong's 폰가이즈] 예약번호 ${bookingRef} — 테스트 예약이 완료되었습니다`,
    html,
  });
}

async function sendESimEmail({ email, code, countries, totalPrice }) {
  if (!mailer) return;

  const countryRows = (countries || []).map(c => {
    const cfg = c.config || {};
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${c.flag || ''} ${c.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">
          ${cfg.type === 'local' ? '로컬망' : '로밍망'} · ${cfg.days || 0}일 · ${cfg.plan?.name || ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;text-align:right;">
          ${(cfg.plan?.price || 0).toLocaleString('ko-KR')}원
        </td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Apple SD Gothic Neo',Malgun Gothic,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1A56DB,#1e40af);padding:32px 36px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">📱</div>
      <div style="color:#fff;font-size:22px;font-weight:800;">eSIM 구매가 완료되었습니다</div>
      <div style="color:rgba(255,255,255,0.75);font-size:14px;margin-top:6px;">테스트용 활성화 코드가 발급되었습니다</div>
    </div>
    <div style="padding:32px 36px;">
      <div style="background:#f0f4ff;border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px;">
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">eSIM 활성화 코드</div>
        <div style="font-size:22px;font-weight:800;letter-spacing:2px;color:#1A56DB;font-family:monospace;">${code}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;">국가</th>
            <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;">플랜</th>
            <th style="padding:10px 12px;text-align:right;font-size:13px;color:#6b7280;font-weight:600;">금액</th>
          </tr>
        </thead>
        <tbody>${countryRows}</tbody>
      </table>
      <div style="text-align:right;font-size:16px;font-weight:700;color:#1A56DB;margin-bottom:24px;">
        총 ${(totalPrice || 0).toLocaleString('ko-KR')}원
      </div>
      <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;">📋 eSIM 설치 방법</div>
        <ol style="margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:1.8;">
          <li>기기 설정 → 이동통신 → eSIM 추가</li>
          <li>QR 코드 스캔 또는 위 활성화 코드 수동 입력</li>
          <li>설치 완료 후 여행지 도착 시 자동 연결</li>
        </ol>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 36px;text-align:center;font-size:12px;color:#9ca3af;">
      테스트 모드 · Bong's 폰가이즈 eSIM
    </div>
  </div>
</body>
</html>`;

  await mailer.sendMail({
    from: `"Bong's 폰가이즈 eSIM" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `eSIM 활성화 코드 발급 완료 - ${code}`,
    html,
  });
}

module.exports = { genBookingRef, sendBookingEmail, sendESimEmail };
