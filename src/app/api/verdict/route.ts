// src/app/api/verdict/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTrackOrThrow } from '@/lib/curriculum';
import { runVerdict } from '@/lib/gemini';
import { checkRateLimit } from '@/lib/rate-limit';
import type { VerdictRequestBody } from '@/types/argument';

const MAX_ARGUMENT_LENGTH = 5000;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 });
    }

    const body = (await req.json()) as VerdictRequestBody;
    const { trackId, revisedArgument } = body;

    if (!trackId || !revisedArgument || !revisedArgument.trim()) {
      return NextResponse.json({ error: 'trackId and a non-empty revisedArgument are required.' }, { status: 400 });
    }
    if (revisedArgument.length > MAX_ARGUMENT_LENGTH) {
      return NextResponse.json({ error: `Argument exceeds ${MAX_ARGUMENT_LENGTH} characters.` }, { status: 400 });
    }

    const track = getTrackOrThrow(trackId);

    let result;
    try {
      result = await runVerdict(track, revisedArgument);
    } catch {
      return NextResponse.json({ error: 'Verdict service is temporarily unavailable.' }, { status: 502 });
    }

    return NextResponse.json(
      {
        revisedScore: result.revisedScore,
        sourceCitation: track.fact.citation, // from the registry, never model-generated
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected server error.' }, { status: 500 });
  }
}
