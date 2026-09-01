// src/app/api/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTrackOrThrow } from '@/lib/curriculum';
import { runAnalyze } from '@/lib/gemini';
import { checkRateLimit } from '@/lib/rate-limit';
import type { AnalyzeRequestBody } from '@/types/argument';

const MAX_ARGUMENT_LENGTH = 5000;

// Leak guard: checks the MODEL'S generated question against the withheld
// fact's keywords — never the student's own argument text. Excludes any
// keyword the student already used in their own submission (shared
// vocabulary isn't leakage). Triggers only on 2+ distinct keyword hits.
function detectLeak(socraticQuestion: string, factKeywords: string[], studentArgument: string): string[] {
  const studentLower = studentArgument.toLowerCase();
  const questionLower = socraticQuestion.toLowerCase();
  const hits: string[] = [];

  for (const keyword of factKeywords) {
    const alreadyInStudentText = new RegExp(`\\b${keyword}\\b`, 'i').test(studentLower);
    if (alreadyInStudentText) continue; // shared vocabulary, not a leak

    const appearsInQuestion = new RegExp(`\\b${keyword}\\b`, 'i').test(questionLower);
    if (appearsInQuestion) hits.push(keyword);
  }

  return hits;
}

const FALLBACK_QUESTION =
  "What single piece of evidence, if you had it, would most strengthen this part of your argument?";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 });
    }

    const body = (await req.json()) as AnalyzeRequestBody;
    const { trackId, studentArgument } = body;

    if (!trackId || !studentArgument || !studentArgument.trim()) {
      return NextResponse.json({ error: 'trackId and a non-empty studentArgument are required.' }, { status: 400 });
    }
    if (studentArgument.length > MAX_ARGUMENT_LENGTH) {
      return NextResponse.json({ error: `Argument exceeds ${MAX_ARGUMENT_LENGTH} characters.` }, { status: 400 });
    }

    const track = getTrackOrThrow(trackId);

    let result;
    try {
      result = await runAnalyze(track, studentArgument);
    } catch {
      return NextResponse.json({ error: 'Analysis service is temporarily unavailable.' }, { status: 502 });
    }

    const leakHits = detectLeak(result.socraticQuestion, track.fact.keywords, studentArgument);
    if (leakHits.length >= 2) {
      // Don't fail the demo — retry once, then fall back to a safe generic question.
      try {
        const retry = await runAnalyze(track, studentArgument);
        const retryHits = detectLeak(retry.socraticQuestion, track.fact.keywords, studentArgument);
        result = retryHits.length >= 2 ? { ...retry, socraticQuestion: FALLBACK_QUESTION } : retry;
      } catch {
        result = { ...result, socraticQuestion: FALLBACK_QUESTION };
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected server error.' }, { status: 500 });
  }
}
