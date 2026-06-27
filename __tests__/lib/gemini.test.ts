import { parseMeetingAnalysis, parsePatternInsights, stripMarkdownFences } from '@/lib/gemini';

describe('lib/gemini parsing helpers', () => {
  it('strips fenced json responses', () => {
    expect(stripMarkdownFences('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it('parses a valid meeting analysis payload', () => {
    const analysis = parseMeetingAnalysis(`{
      "title": "Weekly Sync",
      "summary": "Reviewed milestones.",
      "decisions": ["Ship on Friday"],
      "action_items": [
        {
          "title": "Send update",
          "assignee": "Ava",
          "due_date": "2026-07-01",
          "priority": "high"
        }
      ],
      "participants": ["Ava", "Sam"],
      "topics": ["Launch"],
      "duration_estimate": "30 minutes",
      "sentiment": "productive",
      "follow_up_meeting_needed": false
    }`);

    expect(analysis.title).toBe('Weekly Sync');
    expect(analysis.action_items[0]?.priority).toBe('high');
  });

  it('rejects invalid meeting analysis shape', () => {
    expect(() =>
      parseMeetingAnalysis(`{
        "title": "Broken",
        "summary": "No action item priorities.",
        "decisions": [],
        "action_items": [{ "title": "Missing priority" }],
        "participants": [],
        "topics": [],
        "duration_estimate": "15 minutes",
        "sentiment": "productive",
        "follow_up_meeting_needed": false
      }`)
    ).toThrow('action_items[0].priority');
  });

  it('parses pattern insights arrays', () => {
    const insights = parsePatternInsights(`[
      {
        "type": "risk",
        "title": "Delayed approvals",
        "description": "Approvals repeatedly slip.",
        "meetings_affected": ["m1", "m2"]
      }
    ]`);

    expect(insights).toHaveLength(1);
    expect(insights[0]?.type).toBe('risk');
  });
});
