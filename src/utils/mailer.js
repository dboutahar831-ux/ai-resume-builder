const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendVerificationCode(to, code) {
  if (!resend) {
    console.log(`\n[DEV] Verification code for ${to}: ${code}\n`);
    return;
  }

  await resend.emails.send({
    from: 'ResumeAI <onboarding@resend.dev>',
    to,
    subject: 'Your ResumeAI verification code',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:16px;">
        <div style="background:#4f46e5;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
          <span style="color:white;font-size:20px;">✉</span>
        </div>
        <h2 style="color:#111827;margin:0 0 8px;">Verify your email</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Use the code below to complete your ResumeAI registration. It expires in 15 minutes.</p>
        <div style="background:#fff;border:2px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:40px;font-weight:700;letter-spacing:14px;color:#4f46e5;">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0;">If you didn't create a ResumeAI account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationCode };
