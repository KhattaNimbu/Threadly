// Threadly - Gemini API wrapper
// All Gemini API calls live here; prompts live in lib/prompts.ts

import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import type {
  ActionItemInput,
  MeetingAnalysis,
  PatternInsight,
  Meeting,
  MeetingWithItems,
  ExportFormat,
  Priority,
  Sentiment,
} from './types';
import {
  PROCESS_TRANSCRIPT,
  GENERATE_INSIGHTS,
  ASK_HISTORY,
  FORMAT_EXPORT,
} from './prompts';

// ---------------------------------------------------------
// Client initialization
// ---------------------------------------------------------

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
}

function getEmbeddingModelName(): string {
  return process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001';
}

function getEmbeddingApiVersion(): string {
  return process.env.GEMINI_EMBEDDING_API_VERSION ?? 'v1';
}

// ---------------------------------------------------------
// Utility: strip markdown fences before JSON.parse
// ---------------------------------------------------------

export function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function isPriority(value: unknown): value is Priority {
  return value === 'high' || value === 'medium' || value === 'low';
}

function isSentiment(value: unknown): value is Sentiment {
  return value === 'productive' || value === 'tense' || value === 'unclear' || value === 'routine';
}

function asStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${fieldName} must be an array of strings`);
  }

  return value;
}

function parseActionItem(value: unknown, index: number): ActionItemInput {
  if (!value || typeof value !== 'object') {
    throw new Error(`action_items[${index}] must be an object`);
  }

  const item = value as Record<string, unknown>;

  if (typeof item.title !== 'string' || item.title.trim().length === 0) {
    throw new Error(`action_items[${index}].title must be a non-empty string`);
  }

  if (item.assignee !== null && item.assignee !== undefined && typeof item.assignee !== 'string') {
    throw new Error(`action_items[${index}].assignee must be a string or null`);
  }

  if (item.due_date !== null && item.due_date !== undefined && typeof item.due_date !== 'string') {
    throw new Error(`action_items[${index}].due_date must be a string or null`);
  }

  if (!isPriority(item.priority)) {
    throw new Error(`action_items[${index}].priority must be high, medium, or low`);
  }

  return {
    title: item.title.trim(),
    assignee: item.assignee ?? null,
    due_date: item.due_date ?? null,
    priority: item.priority,
  };
}

export function parseMeetingAnalysis(text: string): MeetingAnalysis {
  const cleaned = stripMarkdownFences(text);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;

  if (typeof parsed.title !== 'string' || parsed.title.trim().length === 0) {
    throw new Error('title must be a non-empty string');
  }

  if (typeof parsed.summary !== 'string' || parsed.summary.trim().length === 0) {
    throw new Error('summary must be a non-empty string');
  }

  if (typeof parsed.duration_estimate !== 'string' || parsed.duration_estimate.trim().length === 0) {
    throw new Error('duration_estimate must be a non-empty string');
  }

  if (!isSentiment(parsed.sentiment)) {
    throw new Error('sentiment must be one of productive, tense, unclear, or routine');
  }

  if (typeof parsed.follow_up_meeting_needed !== 'boolean') {
    throw new Error('follow_up_meeting_needed must be a boolean');
  }

  const actionItemsRaw = Array.isArray(parsed.action_items) ? parsed.action_items : null;

  if (!actionItemsRaw) {
    throw new Error('action_items must be an array');
  }

  return {
    title: parsed.title.trim(),
    summary: parsed.summary.trim(),
    decisions: asStringArray(parsed.decisions, 'decisions'),
    action_items: actionItemsRaw.map(parseActionItem),
    participants: asStringArray(parsed.participants, 'participants'),
    topics: asStringArray(parsed.topics, 'topics'),
    duration_estimate: parsed.duration_estimate.trim(),
    sentiment: parsed.sentiment,
    follow_up_meeting_needed: parsed.follow_up_meeting_needed,
  };
}

export function parsePatternInsights(text: string): PatternInsight[] {
  const cleaned = stripMarkdownFences(text);
  const parsed = JSON.parse(cleaned) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Insights response must be an array');
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`insights[${index}] must be an object`);
    }

    const insight = item as Record<string, unknown>;
    const allowedTypes = ['recurring_topic', 'ownership_gap', 'meeting_health', 'risk'];

    if (!allowedTypes.includes(String(insight.type))) {
      throw new Error(`insights[${index}].type is invalid`);
    }

    if (typeof insight.title !== 'string' || typeof insight.description !== 'string') {
      throw new Error(`insights[${index}] must include string title and description`);
    }

    return {
      type: insight.type as PatternInsight['type'],
      title: insight.title,
      description: insight.description,
      meetings_affected: asStringArray(insight.meetings_affected, `insights[${index}].meetings_affected`),
    };
  });
}

// ---------------------------------------------------------
// 1. Analyse a meeting transcript
// ---------------------------------------------------------

export async function analyseMeeting(
  transcript: string
): Promise<MeetingAnalysis> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });

  const prompt = PROCESS_TRANSCRIPT(transcript);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return parseMeetingAnalysis(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new Error(
      `Failed to parse Gemini response as JSON. ${reason}. Raw response: ${text.slice(0, 200)}`
    );
  }
}

// ---------------------------------------------------------
// 2. Generate cross-meeting pattern insights
// ---------------------------------------------------------

export async function generateInsights(
  meetings: Meeting[]
): Promise<PatternInsight[]> {
  if (meetings.length < 2) {
    return [];
  }

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });

  const prompt = GENERATE_INSIGHTS(meetings);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return parsePatternInsights(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new Error(
      `Failed to parse insights response as JSON. ${reason}. Raw: ${text.slice(0, 200)}`
    );
  }
}

// ---------------------------------------------------------
// 3. Stream an answer about meeting history
// ---------------------------------------------------------

export async function streamAskHistory(
  question: string,
  meetings: MeetingWithItems[]
): Promise<ReadableStream<Uint8Array>> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });

  const prompt = ASK_HISTORY(question, meetings);
  const streamResult = await model.generateContentStream(prompt);

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// ---------------------------------------------------------
// 4. Format meeting for export (Notion / Slack / Email)
// ---------------------------------------------------------

export async function formatMeetingExport(
  meeting: MeetingWithItems,
  format: ExportFormat
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });

  const prompt = FORMAT_EXPORT(meeting, format);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function embedText(
  text: string,
  options?: {
    taskType?: TaskType;
    title?: string;
  }
): Promise<number[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel(
    { model: getEmbeddingModelName() },
    { apiVersion: getEmbeddingApiVersion() }
  );

  const response = await model.embedContent({
    content: {
      role: 'user',
      parts: [{ text }],
    },
    taskType: options?.taskType,
    title: options?.title,
  });

  return response.embedding.values;
}
