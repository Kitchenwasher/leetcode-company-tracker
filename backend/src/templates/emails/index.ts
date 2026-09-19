export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}

const emailLayout = (title: string, contentHtml: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #080d1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }
    .container { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
    .card { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header-bar { height: 4px; background: linear-gradient(90deg, #f59e0b, #6366f1, #10b981); }
    .body { padding: 36px 32px; }
    .logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .logo-badge { background: #6366f1; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
    h1 { font-size: 22px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.5px; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 10px; margin: 12px 0 24px 0; text-align: center; }
    .otp-box { background: #1e293b; border: 1px dashed #334155; border-radius: 10px; padding: 16px; text-align: center; font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; margin: 16px 0; }
    .footer { padding: 24px 32px; background-color: #090e1a; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b; }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header-bar"></div>
      <div class="body">
        <div class="logo">
          <span>LeetTracker</span>
          <span class="logo-badge">PRO</span>
        </div>
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin-bottom: 8px;">Sent by LeetTracker Pro • The Technical Interview Command Center</p>
        <p style="margin: 0;">659 Companies • 3,399 Verified Questions • C++ Solutions</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const getWelcomeVerificationEmail = (
  name: string,
  verifyUrl: string,
  otpCode: string
): EmailTemplateResult => {
  const content = `
    <h1>Welcome to LeetTracker Pro, ${name}!</h1>
    <p>You have taken the first step toward mastering your dream company's coding interviews. Please verify your email address to activate all platform features.</p>
    
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    </div>

    <p style="font-size: 13px; text-align: center; margin-bottom: 8px;">Or use this 6-digit confirmation code:</p>
    <div class="otp-box">${otpCode}</div>

    <p style="font-size: 12px; color: #64748b;">If you didn't create this account, you can safely ignore this email.</p>
  `;

  return {
    subject: `Welcome to LeetTracker Pro! Confirm your email (${otpCode})`,
    html: emailLayout('Verify your email', content),
    text: `Welcome to LeetTracker Pro, ${name}!\n\nVerify your email here: ${verifyUrl}\nOr use confirmation code: ${otpCode}`,
  };
};

export const getPasswordResetEmail = (
  name: string,
  resetUrl: string
): EmailTemplateResult => {
  const content = `
    <h1>Password Reset Request</h1>
    <p>Hi ${name}, we received a request to reset the password for your LeetTracker Pro account.</p>
    <p>Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset My Password</a>
    </div>

    <p style="font-size: 12px; color: #64748b;">If you didn't request a password reset, you can ignore this email. Your current password remains secure.</p>
  `;

  return {
    subject: `Reset your LeetTracker Pro password`,
    html: emailLayout('Reset your password', content),
    text: `Hi ${name},\n\nReset your password using this link (expires in 1 hour):\n${resetUrl}`,
  };
};

export const getSubscriptionReceiptEmail = (
  name: string,
  planName: string,
  amount: string
): EmailTemplateResult => {
  const content = `
    <h1>You are now a PRO Candidate! 🏆</h1>
    <p>Hi ${name}, thank you for subscribing to <strong>${planName}</strong> (${amount}).</p>
    <p>All Pro capabilities have been permanently unlocked on your account:</p>
    <ul style="color: #cbd5e1; font-size: 14px; line-height: 1.8; margin-bottom: 24px;">
      <li>⚡ <strong>Unlimited Mock Interview Simulations</strong> with 45-min countdown timers</li>
      <li>🧠 <strong>Anki Active Recall SRS Deck Exporter</strong> (.csv)</li>
      <li>🎨 <strong>Interactive In-Browser Whiteboard Canvas</strong></li>
      <li>💻 <strong>In-Browser C++ Sandbox Runner</strong> with custom test cases</li>
      <li>📅 <strong>Company Milestone Prep Planner</strong></li>
    </ul>

    <div style="text-align: center;">
      <a href="http://localhost:3000" class="btn">Launch Pro Workspace</a>
    </div>
  `;

  return {
    subject: `Payment Confirmed: Welcome to LeetTracker Pro!`,
    html: emailLayout('Subscription Confirmed', content),
    text: `Hi ${name},\n\nYour subscription to ${planName} (${amount}) is confirmed! Access your Pro workspace here: http://localhost:3000`,
  };
};

export const getStreakReminderEmail = (
  name: string,
  currentStreak: number,
  dailyGoal: number,
  remaining: number
): EmailTemplateResult => {
  const content = `
    <h1>Don't lose your ${currentStreak}-day streak! 🔥</h1>
    <p>Hi ${name}, you are currently on a <strong>${currentStreak}-day interview prep streak</strong>!</p>
    <p>Your daily goal is ${dailyGoal} problems. You only need <strong>${remaining} more problem${remaining > 1 ? 's' : ''}</strong> today to maintain your momentum.</p>

    <div style="text-align: center;">
      <a href="http://localhost:3000" class="btn">Solve Daily Problem</a>
    </div>
  `;

  return {
    subject: `🔥 Keep your ${currentStreak}-day streak alive on LeetTracker Pro!`,
    html: emailLayout('Streak Reminder', content),
    text: `Hi ${name},\n\nKeep your ${currentStreak}-day streak alive! Solve ${remaining} more problem today: http://localhost:3000`,
  };
};
