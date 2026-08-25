import { GoogleGenAI, Type } from "@google/genai";

const MODEL_FALLBACK_CHAIN = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
];

// Temporary debug: verify env var loading
console.log(`[analyze] GOOGLE_API_KEY length: ${process.env.GOOGLE_API_KEY?.length || 0}`);

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        rigor: { type: Type.NUMBER },
        clarity: { type: Type.NUMBER },
        evidence: { type: Type.NUMBER },
      },
      required: ["rigor", "clarity", "evidence"],
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: [
              "normal",
              "reasoning_error",
              "knowledge_gap",
              "unsupported_claim",
              "strong",
            ],
          },
          label: { type: Type.STRING },
          socratic_question: { type: Type.STRING },
          grounded: { type: Type.BOOLEAN },
        },
        required: ["text", "type"],
      },
    },
    concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          status: {
            type: Type.STRING,
            enum: ["solid", "gap", "error"],
          },
          relatedTo: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["id", "label", "status"],
      },
    },
    transferQuestion: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        context: { type: Type.STRING }
      },
      required: ["question"]
    }
  },
  required: ["scores", "segments"],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, sourceMaterial, isRescan } = body;

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build source material instructions for the system prompt
    let sourceMaterialInstructions = "";
    if (sourceMaterial && typeof sourceMaterial === "string" && sourceMaterial.trim()) {
      sourceMaterialInstructions = `The student's explanation should be evaluated against the following reference material. Flag a knowledge_gap ONLY when the reference material contains a concept that the student's explanation omits — cite what the source says versus what's missing. If no reference material is provided, evaluate against general subject-matter accuracy as before. Reference material: "${sourceMaterial}"`;
    }

    const ai = new GoogleGenAI();

    const SYSTEM_INSTRUCTION = `Each segments[].text field MUST be a verbatim, contiguous substring of the input text. When all segments[].text values are concatenated in order, they must exactly reconstruct the original input, including all spaces and punctuation. Do not omit or alter any characters, including whitespace between sentences. scores.rigor, scores.clarity, and scores.evidence must each be integers from 0 to 100. socratic_question must be an open, probing question that prompts the student to discover the issue themselves. It must NEVER state, name, or directly reveal the correct term, fact, or conclusion — only ask a question that guides the student toward finding it independently.

CRITICAL: Segment the text at sentence boundaries. Each segment should cover approximately one sentence or one distinct clause. Do NOT merge multiple sentences into a single segment. For a 6-sentence paragraph, return 5-8 segments, not 1-2. Prioritize granularity over brevity in segmentation.

${sourceMaterialInstructions}
Also extract 3-6 key concepts present or implied in the topic. For each, mark status as 'solid' (explanation covers it correctly), 'gap' (missing or incomplete), or 'error' (explanation is wrong about it). Note simple relationships between concepts via relatedTo. Return concepts alongside scores and segments.

If this is a rescan showing improved scores compared to a prior attempt, generate ONE transfer question that tests whether the student can apply their corrected understanding to a NEW, slightly different scenario or example than what they just wrote about — not a repeat of the same explanation. The question should require genuine application of the concept, not memorized recall of their own paragraph. Keep it concise, one question only. Format as a JSON object with "question" and "context" fields. Only include this field if the request has isRescan set to true.`;

    try {
      let response: unknown = null;
      let modelUsed: string | null = null;
      let lastError: unknown = null;
      const chainStart = Date.now();

      for (const model of MODEL_FALLBACK_CHAIN) {
        const attemptStart = Date.now();
        console.log(`[analyze] Trying ${model}...`);
        try {
          response = await ai.models.generateContent({
            model,
            contents: text,
            config: {
              responseMimeType: "application/json",
              responseSchema,
              systemInstruction: SYSTEM_INSTRUCTION,
              // CRITICAL: disable the SDK's built-in retry/backoff. By default
              // @google/genai retries 5x with up to 60s backoff on 429
              // (RESOURCE_EXHAUSTED), which blocks THIS call for 60s+ before
              // our catch runs — that was the cause of the 60+ second hang.
              // With attempts:1 a 429 fails instantly so we fail over to the
              // next model in the chain with no waiting on retryDelay.
              httpOptions: { retryOptions: { attempts: 1 } },
            },
          });
          modelUsed = model;
          console.log(
            `[analyze] Model ${model} succeeded after ${Date.now() - attemptStart}ms`
          );
          break;
} catch (geminiError: unknown) {
          // Fail over to the next model immediately on ANY failure
          // (429/RESOURCE_EXHAUSTED, 404, 400, network, etc.). The SDK retry
          // is disabled above (attempts:1), so a 429 is thrown straight away
          // and we never block on the API's suggested retryDelay here.
          const elapsed = Date.now() - attemptStart;
          const rateLimited = isRateLimitError(geminiError);
          console.error(
            `[analyze] Model ${model} failed after ${elapsed}ms (rateLimit=${rateLimited}). Reason: ${geminiError instanceof Error ? geminiError.message : String(geminiError)}`
          );
          lastError = geminiError;
          continue;
        }
      }

      if (!response) {
        const totalMs = Date.now() - chainStart;
        console.error(
          `[analyze] All ${MODEL_FALLBACK_CHAIN.length} models failed after ${totalMs}ms. Last error:`,
          lastError instanceof Error ? lastError.message : String(lastError)
        );
        const rateLimited = isRateLimitError(lastError);
        return new Response(
          JSON.stringify({
            error: rateLimited
              ? "All available AI models have reached their daily limit (quota exhausted). Please use a fresh API key or try again later."
              : "Failed to analyze text with Gemini AI.",
            details: lastError instanceof Error ? lastError.message : String(lastError),
            allModelsFailed: true,
          }),
          {
            status: rateLimited ? 429 : 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log(
        `[analyze] Served by model: ${modelUsed} (chain total ${Date.now() - chainStart}ms)`
      );

      let result: Record<string, unknown> = { scores: { rigor: 0 as number, clarity: 0 as number, evidence: 0 as number }, segments: [] };

      if ((response as any).text) {
        try {
          result = JSON.parse((response as any).text);
        } catch {
          result = { scores: { rigor: 0, clarity: 0, evidence: 0 }, segments: [] };
        }
      }

      if (result.scores) {
        result.scores = normalizeScores(result.scores);
      }

      // CRITICAL: Ensure segments cover the ENTIRE input text exactly once, in order
      const validated = ensureFullCoverage(text, ((result as any).segments) || [], (result as any).scores);

      const apiResponse: Record<string, unknown> = {
        scores: validated.scores,
        segments: validated.segments,
      };

      // Add transfer question if this is a rescan with improved scores
      if (isRescan && result.transferQuestion) {
        apiResponse.transferQuestion = result.transferQuestion;
      }

      return new Response(JSON.stringify(apiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (geminiError: unknown) {
      // Log the Gemini API error details for debugging
      console.error("[analyze] Gemini API error:", geminiError);
      console.error("[analyze] Gemini API error.message:", geminiError.message);
      console.error("[analyze] Gemini API error.stack:", geminiError.stack);

      return new Response(
        JSON.stringify({
          error: "Failed to analyze text with Gemini AI",
          details: geminiError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: unknown) {
    // Log unexpected errors
    console.error("[analyze] Unexpected error:", error);
    console.error("[analyze] Unexpected error.message:", error.message);
    console.error("[analyze] Unexpected error.stack:", error.stack);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

function isRateLimitError(error: unknown): boolean {
  const status = error?.status ?? error?.code;
  if (status === 429 || status === "429") return true;
  const message = `${error?.message ?? ""}`.toLowerCase();
  return message.includes("resource_exhausted") || message.includes("quota");
}

/**
 * Ensures the segments array is a complete ordered breakdown of the entire input text.
 * Every character of the original text must appear exactly once across all segments,
 * in original order, including "normal" type for all unflagged filler/connecting text.
 *
 * For each model segment, we locate its text verbatim within the remaining unconsumed
 * portion of the original (from the current offset). Gaps before a match are emitted as
 * "normal". If a segment cannot be located verbatim, we fall back to splitting the
 * remaining original text by sentence boundaries, tagging pieces "normal" and reasonably
 * reattaching any discarded segment's type/label to the matching sentence. The end result
 * always concatenates back to the exact original input.
 */
function ensureFullCoverage(original: string, segments: unknown[], scores: unknown): Record<string, unknown> {
  // If no segments, return the whole text as normal
  if (!segments || segments.length === 0) {
    return {
      scores: { rigor: 0, clarity: 0, evidence: 0 },
      segments: [{ text: original, type: "normal" }],
    };
  }

  // Normalize segments: ensure each has text and type
  const normalized = segments
    .map((s: unknown) => ({
      text: s.text != null ? String(s.text) : "",
      type: s.type || "normal",
      label: s.label,
      socratic_question: s.socratic_question,
    }))
    .filter((s: unknown) => s.text.length > 0);

  let offset = 0;
  const checked: Array<{
    text: string;
    type: string;
    label?: string;
    socratic_question?: string | null;
  }> = [];

  const discarded: Array<{ text: string; type: string; label?: string; socratic_question?: string }> = [];

  let fellBack = false;

  for (const seg of normalized) {
    if (fellBack) break;
    if (offset >= original.length) break;

    const remaining = original.substring(offset);
    const idx = remaining.indexOf(seg.text);

    if (idx !== -1) {
      // Any characters before the match are unflagged filler — emit as normal
      if (idx > 0) {
        checked.push({
          text: remaining.substring(0, idx),
          type: "normal",
          label: "normal",
          socratic_question: null,
        });
      }
      checked.push({
        text: seg.text,
        type: seg.type,
        label: seg.label,
        socratic_question: seg.socratic_question,
      });
      offset += idx + seg.text.length;
    } else {
      // Cannot locate verbatim — discard and fall back to sentence splitting
      discarded.push(seg);
      fellBack = true;
      const pieces = splitBySentences(remaining);
      // Try to reasonably reattach discarded flags to the matching sentence piece
      for (const piece of pieces) {
        const match = findBestDiscardedMatch(piece, discarded);
        if (match) {
          checked.push({
            text: piece,
            type: match.type,
            label: match.label,
            socratic_question: match.socratic_question,
          });
          // consume the match so it isn't applied twice
          discarded.splice(discarded.indexOf(match), 1);
        } else {
          checked.push({
            text: piece,
            type: "normal",
            label: "normal",
            socratic_question: null,
          });
        }
      }
      offset = original.length;
    }
  }

  // If there's remaining text after all segments, append as normal
  if (offset < original.length) {
    checked.push({
      text: original.substring(offset),
      type: "normal",
      label: "normal",
      socratic_question: null,
    });
  }

  // Map flagged segments to ensure label and socratic_question are present
  const resultSegments = checked.map((s) => {
    const result: Record<string, unknown> = { text: s.text, type: s.type };
    if (s.type !== "normal") {
      result.label = s.label || getLabel(s.type);
      result.socratic_question = s.socratic_question || getSocraticQuestion(s.type);
    }
    return result;
  });

  return {
    scores: scores || { rigor: 0, clarity: 0, evidence: 0 },
    segments: resultSegments,
  };
}

/**
 * Splits text into sentence pieces, each ending with its period and any following
 * whitespace, so the concatenation of all pieces exactly equals the input.
 */
function splitBySentences(text: string): string[] {
  const pieces: string[] = [];
  const len = text.length;
  let i = 0;
  while (i < len) {
    const dot = text.indexOf(".", i);
    if (dot === -1) {
      pieces.push(text.substring(i));
      break;
    }
    let j = dot + 1;
    while (j < len && /\s/.test(text[j])) j++;
    pieces.push(text.substring(i, j));
    i = j;
  }
  return pieces.filter((p) => p.length > 0);
}

const REATTACH_MIN_OVERLAP = 0.5;

type DiscardedSegment = {
  text: string;
  type: string;
  label?: string;
  socratic_question?: string;
};

function tokenizeWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9']+/)
      .filter((t) => t.length > 0)
  );
}

/**
 * Finds the discarded segment that best corresponds to a sentence piece, using
 * first a strict substring containment check and then a fuzzy word-overlap check.
 * Returns null when no segment overlaps meaningfully with the piece.
 */
function findBestDiscardedMatch(
  piece: string,
  discarded: DiscardedSegment[]
): DiscardedSegment | null {
  const pieceTokens = tokenizeWords(piece);
  if (pieceTokens.size === 0) return null;

  let best: DiscardedSegment | null = null;
  let bestScore = 0;

  for (const d of discarded) {
    if (!d.text) continue;

    if (piece.includes(d.text)) return d;

    const dTokens = tokenizeWords(d.text);
    if (dTokens.size === 0) continue;

    let hits = 0;
    for (const t of pieceTokens) {
      if (dTokens.has(t)) hits++;
    }

    const score = hits / pieceTokens.size;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }

  return bestScore >= REATTACH_MIN_OVERLAP ? best : null;
}

/**
 * Safety net for the score scale: the model is instructed to return 0-100, but if it
 * ignores that and returns a 0-5 scale, scale up any score <= 5 to the 0-100 range.
 */
function normalizeScores(scores: unknown): unknown {
  const out: Record<string, unknown> = { ...scores };
  for (const key of ["rigor", "clarity", "evidence"]) {
    if (typeof out[key] === "number" && out[key] <= 5) {
      out[key] = Math.round(out[key] * 20);
    }
  }
  return out;
}

function getLabel(type: string): string {
  const map: Record<string, string> = {
    reasoning_error: "Reasoning Error",
    knowledge_gap: "Knowledge Gap",
    unsupported_claim: "Unsupported Claim",
    strong: "Strong Reasoning",
  };
  return map[type] || "Flag";
}

function getSocraticQuestion(type: string): string {
  const questions: Record<string, string> = {
    reasoning_error:
      "What assumption are you making that might not hold in this case?",
    knowledge_gap:
      "What concept or definition is needed to understand this part more deeply?",
    unsupported_claim:
      "What evidence or reasoning supports this claim in your own words?",
    strong:
      "What makes this reasoning particularly effective? Can you articulate the principle behind it?",
  };
  return questions[type] || "How could you strengthen this part?";
}