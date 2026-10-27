import * as nodemailer from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/**
 * Inbox address from SMTP_USER, used as the default sender and enquiry inbox.
 */
export function mailAccount(): string | undefined {
  return process.env.SMTP_USER;
}

/**
 * True when either Resend (RESEND_API_KEY + MAIL_FROM) or SMTP
 * (SMTP_USER + SMTP_PASSWORD) is configured.
 */
export function isMailConfigured(): boolean {
  return Boolean(resendConfig() || smtpConfig());
}

/**
 * Sends one email. Resend is used when RESEND_API_KEY and MAIL_FROM are set,
 * otherwise SMTP. Throws on failure.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const resend = resendConfig();

  if (resend) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resend.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Resend responded ${response.status}: ${body.slice(0, 300)}`,
      );
    }

    return;
  }

  const smtp = smtpConfig();

  if (!smtp) {
    throw new Error('Email service is not configured.');
  }

  const port = Number(process.env.SMTP_PORT || 465);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure:
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === 'true'
        : port === 465,
    auth: { user: smtp.user, pass: smtp.password },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || smtp.user,
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
  });
}

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  return apiKey && from ? { apiKey, from } : null;
}

function smtpConfig() {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  return user && password ? { user, password } : null;
}
