// ── Brevo API email service  ──

const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const fromName = process.env.FROM_NAME || "GolfGives";

  if (!apiKey) throw new Error("BREVO_API_KEY missing in env");
  if (!fromEmail) throw new Error("FROM_EMAIL missing in env");

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error("Brevo API error:", data);
      throw new Error(data?.message || `Brevo API failed: ${resp.status}`);
    }

    console.log("Email sent:", { to, messageId: data?.messageId });
    return data;
  } catch (err) {
    // never crash server on email failure
    console.error("Email send failed:", err.message);
  }
};

// ── subscription confirmation ──
export const sendSubscriptionConfirmation = async (
  userEmail,
  userName,
  plan,
) => {
  await sendEmail({
    to: userEmail,
    subject: "Welcome to GolfGives — Subscription Confirmed!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#10b981;">Welcome to GolfGives, ${userName}!</h2>
        <p>Your <strong>${plan}</strong> subscription is now active.</p>
        <p>You can now:</p>
        <ul>
          <li>Enter your Stableford golf scores</li>
          <li>Participate in monthly prize draws</li>
          <li>Support your chosen charity</li>
        </ul>
        <a href="${process.env.FRONTEND_URL}/dashboard"
          style="background:#10b981;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
};

// ── draw results to all participants ──
export const sendDrawResults = async (
  userEmail,
  userName,
  drawMonth,
  drawNumbers,
  matched,
) => {
  await sendEmail({
    to: userEmail,
    subject: `GolfGives Draw Results — ${drawMonth}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#10b981;">Monthly Draw Results</h2>
        <p>Hi ${userName}, the results for <strong>${drawMonth}</strong> are in!</p>
        <p><strong>Winning Numbers:</strong> ${drawNumbers.join(", ")}</p>
        <p><strong>Your Matches:</strong> ${matched}</p>
        ${
          matched >= 3
            ? `<p style="color:#10b981;font-weight:bold;">🎉 Congratulations! You won! Check your dashboard to upload proof.</p>`
            : `<p>Better luck next month! Keep entering your scores to stay in the draw.</p>`
        }
        <a href="${process.env.FRONTEND_URL}/dashboard"
          style="background:#10b981;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          View Dashboard
        </a>
      </div>
    `,
  });
};

// ── winner alert with proof upload instructions ──
export const sendWinnerAlert = async (
  userEmail,
  userName,
  matchType,
  prizeAmount,
) => {
  await sendEmail({
    to: userEmail,
    subject: "🏆 You Won! Upload Your Proof — GolfGives",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#10b981;">Congratulations ${userName}!</h2>
        <p>You matched <strong>${matchType} numbers</strong> in this month's draw!</p>
        <p><strong>Prize Amount: $${prizeAmount}</strong></p>
        <p>To claim your prize upload a screenshot of your scores from the golf platform.</p>
        <ol>
          <li>Go to your Dashboard</li>
          <li>Click on Winnings</li>
          <li>Upload your proof screenshot</li>
          <li>Wait for admin verification</li>
        </ol>
        <a href="${process.env.FRONTEND_URL}/dashboard"
          style="background:#10b981;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Upload Proof Now
        </a>
      </div>
    `,
  });
};

// ── proof approved — payout in progress ──
export const sendProofApproved = async (userEmail, userName, prizeAmount) => {
  await sendEmail({
    to: userEmail,
    subject: "✅ Proof Approved — Payout In Progress",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#10b981;">Proof Approved!</h2>
        <p>Hi ${userName}, your proof has been verified successfully.</p>
        <p><strong>Prize Amount: $${prizeAmount}</strong></p>
        <p>Your payout is now being processed. You will receive it shortly.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard"
          style="background:#10b981;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          View Dashboard
        </a>
      </div>
    `,
  });
};

// ── proof rejected with admin reason ──
export const sendProofRejected = async (userEmail, userName, adminNotes) => {
  await sendEmail({
    to: userEmail,
    subject: "❌ Proof Rejected — GolfGives",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#ef4444;">Proof Not Accepted</h2>
        <p>Hi ${userName}, unfortunately your proof submission was not accepted.</p>
        ${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ""}
        <p>Please re-upload a valid screenshot of your scores and try again.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard"
          style="background:#10b981;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Re-upload Proof
        </a>
      </div>
    `,
  });
};
