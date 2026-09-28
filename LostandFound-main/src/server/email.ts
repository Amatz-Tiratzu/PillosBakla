import nodemailer from 'nodemailer';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  adminName?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  mode: 'gmail_api' | 'smtp' | 'resend' | 'brevo' | 'test_stream' | 'ethereal';
  error?: string;
}

const getGmailApiConfig = () => ({
  clientId: process.env.GMAIL_CLIENT_ID?.trim() || '',
  clientSecret: process.env.GMAIL_CLIENT_SECRET?.trim() || '',
  refreshToken: process.env.GMAIL_REFRESH_TOKEN?.trim() || '',
  user: process.env.GMAIL_USER?.trim() || process.env.MAIL_USERNAME?.trim() || '',
});

const encodeBase64Url = (value: string) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const encodeMimeHeader = (value: string) => `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;

async function sendViaGmailApi(options: SendMailOptions, fromAddress: string): Promise<SendMailResult> {
  const config = getGmailApiConfig();
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || `Google OAuth returned HTTP ${tokenResponse.status}`);
  }

  const htmlBody = options.html || `<div style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6;">${options.text}</div>`;
  const mimeMessage = [
    `From: ${fromAddress}`,
    `To: ${options.to}`,
    `Subject: ${encodeMimeHeader(options.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="ifound-boundary"',
    '',
    '--ifound-boundary',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    options.text,
    '',
    '--ifound-boundary',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
    '',
    '--ifound-boundary--',
  ].join('\r\n');

  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(config.user)}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodeBase64Url(mimeMessage) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `Gmail API returned HTTP ${response.status}`);
  }

  return { success: true, messageId: payload.id, mode: 'gmail_api' };
}

export function getSmtpStatus() {
  const host = process.env.MAIL_SERVER || process.env.SMTP_HOST || '';
  const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.MAIL_USERNAME || process.env.SMTP_USER || '';
  const password = process.env.MAIL_PASSWORD || process.env.SMTP_PASSWORD || '';
  const senderName = process.env.MAIL_SENDER_NAME || 'I FOUND Admin';
  const from = process.env.SMTP_FROM || (user ? `"${senderName}" <${user}>` : '"I FOUND Admin" <support@ifound.org>');
  const gmailApiConfig = getGmailApiConfig();
  const hasGmailApi = Boolean(gmailApiConfig.clientId && gmailApiConfig.clientSecret && gmailApiConfig.refreshToken && gmailApiConfig.user);
  const hasResendApiKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasBrevoApiKey = Boolean(process.env.BREVO_API_KEY?.trim());

  return {
    configured: Boolean(hasGmailApi || hasResendApiKey || hasBrevoApiKey || (host && user && password)),
    provider: hasGmailApi ? 'gmail_api' : hasResendApiKey ? 'resend' : hasBrevoApiKey ? 'brevo' : 'smtp',
    hasHost: Boolean(host && host.trim().length > 0),
    host,
    port,
    from,
    hasUser: Boolean(user && user.trim().length > 0),
    hasPassword: Boolean(password),
    hasGmailApi,
    hasResendApiKey,
    hasBrevoApiKey,
  };
}

export async function sendEmailService(options: SendMailOptions): Promise<SendMailResult> {
  const smtpStatus = getSmtpStatus();
  const fromAddress = smtpStatus.from;
  const gmailApiConfig = getGmailApiConfig();
  const hasGmailApi = Boolean(gmailApiConfig.clientId && gmailApiConfig.clientSecret && gmailApiConfig.refreshToken && gmailApiConfig.user);
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();

  if (hasGmailApi) {
    try {
      return await sendViaGmailApi(
        options,
        `"${process.env.MAIL_SENDER_NAME || 'I FOUND Admin'}" <${gmailApiConfig.user}>`,
      );
    } catch (err: any) {
      console.error('Gmail API email dispatch error:', err);
      return { success: false, error: err.message || 'Gmail API request failed', mode: 'gmail_api' };
    }
  }

  if (!resendApiKey && !brevoApiKey && smtpStatus.hasHost && (!smtpStatus.hasUser || !smtpStatus.hasPassword)) {
    return {
      success: false,
      error: 'SMTP is configured incompletely. Set MAIL_USERNAME and MAIL_PASSWORD in .env.',
      mode: 'smtp',
    };
  }

  const htmlBody = options.html || `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
      <div style="border-bottom: 2px solid #22c55e; padding-bottom: 12px; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">I FOUND</span>
        <span style="font-size: 13px; color: #6b7280; margin-left: 8px;">Discover. Connect. Reclaim.</span>
      </div>
      <div style="white-space: pre-wrap; line-height: 1.6; font-size: 15px; color: #374151;">${options.text}</div>
      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0 16px;" />
      <div style="font-size: 12px; color: #9ca3af; line-height: 1.4;">
        This is an official administrative notice sent from the <strong>I FOUND</strong> Lost & Found Management System by ${options.adminName || 'System Administrator'}.<br />
        Please do not reply directly if this message was sent from an unmonitored address.
      </div>
    </div>
  `;

  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: process.env.MAIL_SENDER_NAME || 'Admin',
            email: process.env.MAIL_USERNAME,
          },
          to: [{ email: options.to }],
          subject: options.subject,
          textContent: options.text,
          htmlContent: htmlBody,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || `Brevo API returned HTTP ${response.status}`);
      }
      return { success: true, messageId: payload.messageId, mode: 'brevo' };
    } catch (err: any) {
      console.error('Brevo email dispatch error:', err);
      return { success: false, error: err.message || 'Brevo API request failed', mode: 'brevo' };
    }
  }

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM?.trim() || fromAddress,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: htmlBody,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || payload.error || `Resend API returned HTTP ${response.status}`);
      }

      return {
        success: true,
        messageId: payload.id,
        mode: 'resend',
      };
    } catch (err: any) {
      console.error('Resend email dispatch error:', err);
      return {
        success: false,
        error: err.message || 'Resend API request failed',
        mode: 'resend',
      };
    }
  }

  if (smtpStatus.configured) {
    try {
      const smtpTransportOptions = {
        host: smtpStatus.host,
        port: smtpStatus.port,
        secure: smtpStatus.port === 465,
        family: 4,
        auth: (process.env.MAIL_USERNAME || process.env.SMTP_USER) ? {
          user: process.env.MAIL_USERNAME || process.env.SMTP_USER,
          pass: process.env.MAIL_PASSWORD || process.env.SMTP_PASSWORD || '',
        } : undefined,
      } as any;
      const transporter = nodemailer.createTransport(smtpTransportOptions);

      const info = await transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: htmlBody,
      });

      return {
        success: true,
        messageId: info.messageId,
        mode: 'smtp',
      };
    } catch (err: any) {
      console.error('SMTP email dispatch error:', err);
      return {
        success: false,
        error: err.message || 'SMTP connection failed',
        mode: 'smtp',
      };
    }
  } else {
    // When SMTP_HOST is not configured in .env, use JSON / Stream transporter
    // so development preview remains fully testable without throwing unhandled exceptions.
    try {
      const transporter = nodemailer.createTransport({
        jsonTransport: true,
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: htmlBody,
      });

      console.log('Test dispatch delivered to backend transport:', info.messageId);

      return {
        success: true,
        messageId: `preview-${Date.now()}`,
        mode: 'test_stream',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unable to send email. Please try again.',
        mode: 'test_stream',
      };
    }
  }
}
