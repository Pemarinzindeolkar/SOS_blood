import nodemailer from "nodemailer";

// Email goes through SMTP and SMS through Twilio. If a provider isn't
// configured, the message is skipped with a warning in the server logs.
// In development the full message is printed so you can still click its links.

function skipped(channel: "email" | "sms", to: string, body: string) {
  if (process.env.NODE_ENV === "production") {
    console.warn(`[notify] ${channel} provider not configured, skipped message to ${to}`);
  } else {
    console.info(`[notify] ${channel} provider not configured. Message to ${to}:\n${body}\n`);
  }
}

export function appUrl(path: string) {
  // RENDER_EXTERNAL_URL is set automatically on Render.
  const base = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";
  return new URL(path, base).toString();
}

export async function sendEmail(to: string, subject: string, text: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  if (!SMTP_HOST) return skipped("email", to, `${subject}\n\n${text}`);

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, text });
  } catch (error) {
    console.error(`[notify] email to ${to} failed:`, error);
  }
}

export async function sendSms(to: string, body: string) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: authToken, TWILIO_FROM: from } = process.env;
  if (!sid || !authToken || !from) return skipped("sms", to, body);

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });
    if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
  } catch (error) {
    console.error(`[notify] SMS to ${to} failed:`, error);
  }
}
