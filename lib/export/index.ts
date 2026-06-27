import type { MeetingWithItems } from '@/lib/types';
import { sendMeetingExportEmail } from './email';

export async function exportMeetingToEmail(params: {
  meeting: MeetingWithItems;
  recipientEmail: string;
  content: string;
  formatLabel: string;
}): Promise<{ provider: 'resend'; messageId: string }> {
  const { meeting, recipientEmail, content, formatLabel } = params;

  return sendMeetingExportEmail({
    to: recipientEmail,
    subject: `Threadly export: ${meeting.title} (${formatLabel})`,
    content,
    meeting,
  });
}
