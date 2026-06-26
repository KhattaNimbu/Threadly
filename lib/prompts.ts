// Threadly - All AI prompts as typed functions
// Keep prompts here; API calls live in lib/gemini.ts

import type { Meeting, ExportFormat, MeetingWithItems } from './types';

// ---------------------------------------------------------
// PROMPT 1: Process a raw meeting transcript
// ---------------------------------------------------------

export function PROCESS_TRANSCRIPT(transcript: string): string {
  const currentYear = new Date().getFullYear();

  return `You are Threadly, an expert meeting analyst. Extract structured, actionable information from the transcript below. Return ONLY valid JSON - no markdown fences, no explanation, no preamble.

Current year for date inference: ${currentYear}

Extraction rules:

  title       -> 5 words max. Specific (e.g. "Q3 mobile roadmap review").
                Never use generic names like "Team meeting".

  summary     -> Exactly 2-3 sentences: what was discussed, what was 
                resolved, any important context. Concrete and specific.

  decisions   -> ONLY definitively decided things, not things discussed.
                Use past tense. Max 5. Empty array [] if none.

  action_items -> Only explicit commitments. Look for: "X will...", 
                "can you handle...", "I'll take care of...", "we need X to..."
                Each item:
                  title     -> Start with action verb. Max 10 words. Specific.
                  assignee  -> Name as in transcript, or null
                  due_date  -> ISO 8601 (YYYY-MM-DD), infer year as ${currentYear}. null if absent.
                  priority  -> "high" = blocking/urgent/due within 2 days
                               "medium" = default
                               "low" = nice-to-have, no pressure

  participants -> Everyone who spoke or was mentioned as present

  topics      -> 3-5 lowercase hyphenated tags. Specific.
                Good: ["product-roadmap", "q3-planning", "mobile-app"]
                Bad:  ["meeting", "work", "team"]

  duration_estimate -> Rough guess from content depth: "~15 minutes", 
                      "~30 minutes", "~1 hour", "~90 minutes"

  sentiment   -> "productive" | "tense" | "unclear" | "routine"

  follow_up_meeting_needed -> true if a follow-up was planned or is clearly needed

Output JSON schema (return ONLY this JSON, nothing else):
{
  "title": string,
  "summary": string,
  "decisions": string[],
  "action_items": [{ "title": string, "assignee": string|null, "due_date": string|null, "priority": "high"|"medium"|"low" }],
  "participants": string[],
  "topics": string[],
  "duration_estimate": string,
  "sentiment": "productive"|"tense"|"unclear"|"routine",
  "follow_up_meeting_needed": boolean
}

TRANSCRIPT:
${transcript}`;
}

// ---------------------------------------------------------
// PROMPT 2: Generate cross-meeting pattern insights
// ---------------------------------------------------------

export function GENERATE_INSIGHTS(meetings: Meeting[]): string {
  if (meetings.length < 2) {
    return '[]';
  }

  const meetingContext = meetings
    .map(
      (m, i) => `${i + 1}. [ID: ${m.id}]
   Title: ${m.title}
   Date: ${new Date(m.met_at).toLocaleDateString()}
   Topics: ${(m.topics ?? []).join(', ')}
   Summary: ${m.summary ?? 'No summary'}
   Decisions: ${(m.decisions ?? []).join('; ') || 'None recorded'}`
    )
    .join('\n\n');

  return `You are Threadly's pattern analysis engine. Surface insights the user has not noticed. Return ONLY a valid JSON array - no markdown fences, no explanation.

Insight types to detect:
  recurring_topic  -> Same subject appearing across multiple meetings without resolution
  ownership_gap    -> Important tasks or decisions with no clear owner
  meeting_health   -> Inefficiency signals (no decisions, overlong, too frequent, same people, recurring agenda items)
  risk             -> Commitment or deadline at risk of being missed or forgotten

Rules:
  - 2 to 4 insights only. Quality over quantity.
  - Every insight must cite specific meeting content.
  - Description: 1-2 sentences, actionable, no waffle.
  - meetings_affected: list of meeting IDs this applies to.
  - Return [] if fewer than 2 meetings.

Output schema (return ONLY this JSON array, nothing else):
[{ "type": string, "title": string, "description": string, "meetings_affected": string[] }]

MEETING DATA:
${meetingContext}`;
}

// ---------------------------------------------------------
// PROMPT 3: Answer a question about meeting history
// ---------------------------------------------------------

export function ASK_HISTORY(
  question: string,
  meetings: MeetingWithItems[]
): string {
  const meetingContext = meetings
    .map((m) => {
      const items = m.action_items
        .map((a) => `    - ${a.title} (assignee: ${a.assignee ?? 'unassigned'}, due: ${a.due_date ?? 'no date'}, ${a.completed ? 'completed' : 'open'})`)
        .join('\n');

      return `Meeting: "${m.title}" (${new Date(m.met_at).toLocaleDateString()})
  Summary: ${m.summary ?? 'No summary'}
  Decisions: ${(m.decisions ?? []).join('; ') || 'None'}
  Action Items:
${items || '    (none)'}`;
    })
    .join('\n\n---\n\n');

  return `You are Threadly's memory assistant. Answer questions about past meetings directly and accurately.

Answer rules:
  - Lead with the answer, not a preamble
  - Reference the meeting name and date when citing information
  - If multiple meetings are relevant, mention each
  - If the answer is not in the context, say: "I couldn't find that in your recent meetings." Do NOT guess.
  - Plain conversational language. Max 4 sentences unless more detail is clearly needed.

MEETING CONTEXT:
${meetingContext}

USER QUESTION: ${question}`;
}

// ---------------------------------------------------------
// PROMPT 4: Format meeting export for different platforms
// ---------------------------------------------------------

export function FORMAT_EXPORT(
  meeting: MeetingWithItems,
  format: ExportFormat
): string {
  const actionItemsText = meeting.action_items
    .map(
      (a) =>
        `${a.title} | Assignee: ${a.assignee ?? 'TBD'} | Due: ${a.due_date ?? 'No date'} | Priority: ${a.priority}`
    )
    .join('\n');

  const meetingData = `Title: ${meeting.title}
Date: ${new Date(meeting.met_at).toLocaleDateString()}
Participants: ${(meeting.participants ?? []).join(', ') || 'Not specified'}
Duration: ${meeting.duration_estimate ?? 'Unknown'}

Summary:
${meeting.summary ?? 'No summary available'}

Decisions Made:
${(meeting.decisions ?? []).map((d) => `- ${d}`).join('\n') || '- None recorded'}

Action Items:
${actionItemsText || '- None'}

Topics: ${(meeting.topics ?? []).join(', ')}`;

  const formatInstructions: Record<ExportFormat, string> = {
    notion: `Convert the meeting data below into Notion-ready Markdown format.
Use ## headers for sections, **bold** for owner names, - [ ] for incomplete tasks, - [x] for completed tasks.
Include all sections: Summary, Decisions, Action Items, Participants.
Return ONLY the formatted Markdown output.`,

    slack: `Convert the meeting data below into a Slack message format.
Use *bold* for headers, - for bullets, max 20 lines total.
Be concise - cut anything not critical.
End with: "Any questions? Reply in thread."
Return ONLY the formatted Slack message.`,

    email: `Convert the meeting data below into a professional plain-text email format.
Use ALLCAPS for section headers (e.g., SUMMARY, DECISIONS, ACTION ITEMS).
Use [ ] for tasks (or [x] if completed). Keep professional tone.
Close with: "Let me know if anything needs updating."
Return ONLY the formatted email body text.`,
  };

  return `${formatInstructions[format]}

MEETING DATA:
${meetingData}`;
}
