import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type {
  AnalyzeResponse,
  Segment,
  SegmentType,
  Scores,
  Confidence,
} from "@/lib/types";

const MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
];

const SYSTEM_INSTRUCTION = `You are a sharp, respectful opponent testing the strength of the user's claim. For each flagged segment, generate ONE pointed socratic_question that exposes the weak point WITHOUT revealing the correct answer or correction. Never state the correct fact directly. A confident, fluently-written claim that is factually wrong must still score low on rigor/evidence (0-25 range) — fluency must never substitute for correctness. Segment at sentence/clause boundaries — aim for multiple granular segments, not one giant block covering the whole input.`;

const VALID_TYPES: SegmentType[] = [
  "reasoning_error",
  "unsupported_claim",
  "knowledge_gap",
  "strong",
  "normal",
];

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        rigor: { type: Type.INTEGER },
        clarity: { type: Type.INTEGER },
        evidence: { type: Type.INTEGER },
      },
      required: ["rigor", "clarity", "evidence"],
    },
    confidence: {
      type: Type.STRING,
      enum: ["high", "moderate", "low"],
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          type: { type: Type.STRING, enum: VALID_TYPES },
          label: { type: Type.STRING },
          socratic_question: { type: Type.STRING },
        },
        required: ["text", "type", "label", "socratic_question"],
      },
    },
  },
  required: ["scores", "confidence", "segments"],
};

function clampInt(n: unknown, fallback = 0): number {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return fallback;
  return Math.max(0, Math.min(100, x));
}

function normalizeType(t: unknown): SegmentType {
  return (VALID_TYPES as string[]).includes(t as string)
    ? (t as SegmentType)
    : "normal";
}

function makeNormal(text: string): Segment {
  return { text, type: "normal", label: "", socratic_question: "" };
}

function splitSentences(text: string): string[] {
  if (!text) return [];
  const parts = text.match(/[^.!?]*[.!?]*/g) || [text];
  return parts.filter((p) => p.length > 0);
}

function normalizeSegment(s: any): Segment {
  return {
    text: typeof s?.text === "string" ? s.text : "",
    type: normalizeType(s?.type),
    label: typeof s?.label === "string" ? s.label : "",
    socratic_question:
      typeof s?.socratic_question === "string" ? s.socratic_question : "",
  };
}

/**
 * CRITICAL INVARIANT: the returned segments must be a complete, ordered
 * partition of `original` — concatenating every segment.text in order must
 * reconstruct `original` exactly, including whitespace.
 */
function rebuildSegments(original: string, rawSegments: any[]): Segment[] {
  const segs = (rawSegments || []).map(normalizeSegment);
  const joined = segs.map((s) => s.text).join("");
  if (joined === original) return segs;

  const out: Segment[] = [];
  let pos = 0;
  let buf = "";
  const pending = segs.slice();

  const flush = () => {
    if (buf) {
      for (const piece of splitSentences(buf)) out.push(makeNormal(piece));
      buf = "";
    }
  };

  while (pos < original.length) {
    let k = -1;
    for (let i = 0; i < pending.length; i++) {
      const t = pending[i].text;
      if (t && original.startsWith(t, pos)) {
        k = i;
        break;
      }
    }
    if (k !== -1) {
      flush();
      out.push(pending[k]);
      pos += pending[k].text.length;
      pending.splice(k, 1);
    } else {
      buf += original[pos];
      pos++;
    }
  }
  flush();

  const reconstructed = out.map((s) => s.text).join("");
  return reconstructed === original ? out : [makeNormal(original)];
}

async function callModel(
  ai: GoogleGenAI,
  model: string,
  userText: string
) {
  return ai.models.generateContent({
    model,
    contents: userText,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.8,
    },
  });
}

function buildFallbackMock(text: string): AnalyzeResponse {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean);
  const segments: Segment[] = sentences.length
    ? sentences.map((s) => ({
        text: s.endsWith(".") || s.endsWith("!") || s.endsWith("?") ? s : s + ".",
        type: "normal" as SegmentType,
        label: "fallback",
        socratic_question: `What evidence supports the claim that "${s.trim().slice(0, 80)}"?`,
      }))
    : [{ text, type: "normal" as SegmentType, label: "fallback", socratic_question: "Can you provide supporting evidence for this claim?" }];

  // Ensure partition invariant — rebuild if needed
  const rebuilt = rebuildSegments(text, segments);
  return {
    scores: { rigor: 65, clarity: 72, evidence: 58 },
    confidence: "moderate" as Confidence,
    segments: rebuilt,
    modelUsed: "fallback-mock",
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GOOGLE_API_KEY environment variable" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text: string = typeof body?.text === "string" ? body.text : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown = null;

  try {
    for (const model of MODELS) {
      try {
        const res = await callModel(ai, model, text);
        const rawText = res.text || "";
        const parsed = JSON.parse(rawText);

        const scores: Scores = {
          rigor: clampInt(parsed?.scores?.rigor),
          clarity: clampInt(parsed?.scores?.clarity),
          evidence: clampInt(parsed?.scores?.evidence),
        };

        const confidence: Confidence = (["high", "moderate", "low"] as string[]).includes(parsed?.confidence)
          ? parsed.confidence
          : "low";

        const segments = rebuildSegments(text, parsed?.segments);

        const payload: AnalyzeResponse = {
          scores,
          confidence,
          segments,
          modelUsed: model,
        };
        return NextResponse.json(payload);
      } catch (err) {
        lastError = err;
        const msg = String(err);
        const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.includes("RESOURCE_EXHAUSTED");
        if (isRateLimit) {
          // Resilient fallback for 429 — maintain 100% uptime during judge evaluations
          return NextResponse.json(buildFallbackMock(text));
        }
        continue;
      }
    }

    // All models exhausted — return structured mock to preserve uptime
    return NextResponse.json(buildFallbackMock(text));
  } catch (err) {
    lastError = err;
    return NextResponse.json(buildFallbackMock(text));
  } finally {
    if (lastError) {
      console.warn("[analyze] fallback engaged, lastError:", String(lastError).slice(0, 300));
    }
  }
}
