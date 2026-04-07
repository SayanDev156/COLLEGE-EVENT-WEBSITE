const nodemailer = require("nodemailer");

const mailProvider = String(process.env.MAIL_PROVIDER || "smtp").toLowerCase();

const hasSmtpConfig =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_PORT) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);

const transporter =
  mailProvider === "smtp" && hasSmtpConfig
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    : null;

function createMailgunAuthHeader() {
  const apiKey = process.env.MAILGUN_API_KEY || process.env.SMTP_PASS;

  if (!apiKey) {
    return null;
  }

  return `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`;
}

async function sendMail({ to, subject, html }) {
  if (mailProvider === "mailgun") {
    const domain = process.env.MAILGUN_DOMAIN;
    const from = process.env.MAIL_FROM || "noreply@localhost";
    const authorization = createMailgunAuthHeader();

    if (!domain || !authorization) {
      return { skipped: true, reason: "Mailgun is not configured." };
    }

    const body = new URLSearchParams({
      from,
      to,
      subject,
      html
    });

    if (String(process.env.MAILGUN_TEST_MODE).toLowerCase() === "true") {
      body.set("o:testmode", "yes");
    }

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Mailgun send failed: ${response.status} ${responseText}`);
    }

    return { skipped: false, provider: "mailgun" };
  }

  if (!transporter) {
    return { skipped: true, reason: "SMTP is not configured." };
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html
  });

  return { skipped: false, provider: "smtp" };
}

function registrationEmailTemplate(name, track) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a2b42">
      <h2>CampusFest 2026 Registration Confirmed</h2>
      <p>Hi ${name},</p>
      <p>Your registration has been successfully received for <strong>${track}</strong>.</p>
      <p>We are excited to host you at CampusFest 2026. Please keep this email for your records.</p>
      <p>Regards,<br/>CampusFest Organizing Committee</p>
    </div>
  `;
}

function reminderEmailTemplate(name, eventDate) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a2b42">
      <h2>Reminder: CampusFest Starts in 24 Hours</h2>
      <p>Hi ${name},</p>
      <p>This is a reminder that CampusFest 2026 starts on <strong>${eventDate}</strong>.</p>
      <p>Please arrive 30 minutes early for smooth check-in.</p>
      <p>See you there,<br/>CampusFest Organizing Committee</p>
    </div>
  `;
}

module.exports = {
  sendMail,
  registrationEmailTemplate,
  reminderEmailTemplate
};
