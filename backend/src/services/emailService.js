const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendOtpEmail(toEmail, name, otp) {
  await transporter.sendMail({
    from: `"Inventory System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your email — Inventory System',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1d4ed8;margin-bottom:8px">Verify your email</h2>
        <p style="color:#374151">Hi ${name},</p>
        <p style="color:#374151">Use the code below to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:16px;background:#f3f4f6;border-radius:6px;margin:20px 0;color:#111827">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(toEmail, name, resetLink) {
  await transporter.sendMail({
    from: `"Inventory System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your password — Inventory System',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1d4ed8;margin-bottom:8px">Reset your password</h2>
        <p style="color:#374151">Hi ${name},</p>
        <p style="color:#374151">Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
        <a href="${resetLink}" style="display:block;width:fit-content;margin:20px auto;padding:12px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:13px">Or paste this link in your browser:<br>${resetLink}</p>
        <p style="color:#6b7280;font-size:13px">If you didn't request a password reset, ignore this email.</p>
      </div>
    `,
  });
}

async function sendInviteEmail(toEmail, inviterName, orgName, role, inviteLink) {
  await transporter.sendMail({
    from: `"Inventory System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `You're invited to join ${orgName} on Inventory System`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="color:#1d4ed8;margin-bottom:8px">You've been invited!</h2>
        <p style="color:#374151"><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong>.</p>
        <p style="color:#374151">Click the button below to set up your account. This link expires in <strong>48 hours</strong>.</p>
        <a href="${inviteLink}" style="display:block;width:fit-content;margin:20px auto;padding:12px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
          Accept Invitation
        </a>
        <p style="color:#6b7280;font-size:13px">Or paste this link in your browser:<br>${inviteLink}</p>
        <p style="color:#6b7280;font-size:13px">If you weren't expecting this invite, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendInviteEmail };
