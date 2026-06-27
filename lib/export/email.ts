import type { MeetingWithItems } from '@/lib/types';

interface SendMeetingExportEmailParams {
  to: string;
  subject: string;
  content: string;
  meeting: MeetingWithItems;
}

interface ResendEmailResponse {
  id?: string;
  error?: {
    message?: string;
  };
}

function getRequiredEnv(name: 'RESEND_API_KEY' | 'EXPORT_FROM_EMAIL'): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }

  return value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtmlEmail(meeting: MeetingWithItems, content: string): string {
  const safeTitle = escapeHtml(meeting.title);
  const safeContent = escapeHtml(content).replace(/\n/g, '<br />');

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 720px; margin: 0 auto; padding: 24px;">
      <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px;">Threadly meeting export</p>
      <h1 style="margin: 0 0 20px; font-size: 24px; color: #111827;">${safeTitle}</h1>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
        <div style="white-space: normal; font-size: 14px;">${safeContent}</div>
      </div>
    </div>
  `.trim();
}

export async function sendMeetingExportEmail({
  to,
  subject,
  content,
  meeting,
}: SendMeetingExportEmailParams): Promise<{ provider: 'resend'; messageId: string }> {
  const apiKey = getRequiredEnv('RESEND_API_KEY');
  const from = getRequiredEnv('EXPORT_FROM_EMAIL');
  const replyTo = process.env.EXPORT_REPLY_TO_EMAIL;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo ? [replyTo] : undefined,
      subject,
      text: content,
      html: buildHtmlEmail(meeting, content),
    }),
  });

  const payload = await response.json() as ResendEmailResponse;

  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message ?? 'Failed to send email export');
  }

  return {
    provider: 'resend',
    messageId: payload.id,
  };
}
