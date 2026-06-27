import { TaskType } from '@google/generative-ai';
import type { ActionItemInput, MeetingAnalysis, MeetingWithItems } from './types';
import { createServerSupabase } from './supabase/server';
import { embedText } from './gemini';

interface MeetingSearchResult extends MeetingWithItems {
  similarity: number;
}

function summarizeActionItems(actionItems: ActionItemInput[]): string {
  if (actionItems.length === 0) {
    return 'None';
  }

  return actionItems
    .map((item) => {
      const parts = [item.title];

      if (item.assignee) {
        parts.push(`owner: ${item.assignee}`);
      }

      if (item.due_date) {
        parts.push(`due: ${item.due_date}`);
      }

      parts.push(`priority: ${item.priority}`);

      return parts.join(' | ');
    })
    .join('\n');
}

export function buildMeetingSearchDocument(params: {
  transcript: string;
  analysis: MeetingAnalysis;
}): string {
  const { transcript, analysis } = params;
  const transcriptSnippet = transcript.trim().slice(0, 6000);

  return [
    `Title: ${analysis.title}`,
    `Summary: ${analysis.summary}`,
    `Decisions: ${analysis.decisions.join('; ') || 'None'}`,
    `Topics: ${analysis.topics.join('; ') || 'None'}`,
    `Participants: ${analysis.participants.join('; ') || 'None'}`,
    `Duration Estimate: ${analysis.duration_estimate}`,
    `Sentiment: ${analysis.sentiment}`,
    `Follow Up Needed: ${analysis.follow_up_meeting_needed ? 'yes' : 'no'}`,
    `Action Items:\n${summarizeActionItems(analysis.action_items)}`,
    `Transcript:\n${transcriptSnippet}`,
  ].join('\n\n');
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export async function generateMeetingSearchEmbedding(params: {
  transcript: string;
  analysis: MeetingAnalysis;
}): Promise<number[]> {
  const document = buildMeetingSearchDocument(params);

  return embedText(document, {
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: params.analysis.title,
  });
}

export async function findRelevantMeetingsForQuestion(params: {
  userId: string;
  question: string;
  fallbackLimit?: number;
  matchCount?: number;
}): Promise<MeetingWithItems[]> {
  const { userId, question, fallbackLimit = 10, matchCount = 6 } = params;
  const supabase = createServerSupabase();

  const fallbackQuery = async (): Promise<MeetingWithItems[]> => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*, action_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(fallbackLimit);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as MeetingWithItems[];
  };

  try {
    const questionEmbedding = await embedText(question, {
      taskType: TaskType.RETRIEVAL_QUERY,
    });

    const { data, error } = await supabase.rpc('match_meetings_by_embedding', {
      p_user_id: userId,
      p_query_embedding: toVectorLiteral(questionEmbedding),
      p_match_count: matchCount,
    });

    if (error) {
      console.error('Semantic meeting search RPC failed, falling back to recent meetings:', error);
      return fallbackQuery();
    }

    const semanticMatches = (data ?? []) as MeetingSearchResult[];

    if (semanticMatches.length === 0) {
      return fallbackQuery();
    }

    return semanticMatches;
  } catch (error) {
    console.error('Semantic meeting search failed, falling back to recent meetings:', error);
    return fallbackQuery();
  }
}
