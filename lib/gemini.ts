// Threadly - Gemini API wrapper
// All Gemini API calls live here; prompts live in lib/prompts.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  MeetingAnalysis,
  PatternInsight,
  Meeting,
  MeetingWithItems,
  ExportFormat,
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

// ---------------------------------------------------------
// Utility: strip markdown fences before JSON.parse
// ---------------------------------------------------------

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
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
    const cleaned = stripMarkdownFences(text);
    const parsed = JSON.parse(cleaned) as MeetingAnalysis;
    return parsed;
  } catch {
    throw new Error(
      `Failed to parse Gemini response as JSON. Raw response: ${text.slice(0, 200)}`
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
    const cleaned = stripMarkdownFences(text);
    const parsed = JSON.parse(cleaned) as PatternInsight[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error(
      `Failed to parse insights response as JSON. Raw: ${text.slice(0, 200)}`
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
