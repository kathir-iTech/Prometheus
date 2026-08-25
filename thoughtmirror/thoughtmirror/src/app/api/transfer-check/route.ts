import { GoogleGenAI, Type } from "@google/genai";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    correctness: {
      type: Type.STRING,
      enum: ["correct", "partially_correct", "incorrect"],
    },
    feedback: { type: Type.STRING },
  },
  required: ["correctness", "feedback"],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, context, answer } = body;

    if (!question || !context || !answer) {
      return new Response(
        JSON.stringify({ error: "Question, context, and answer are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const ai = new GoogleGenAI();

    const SYSTEM_INSTRUCTION = `Evaluate the student's answer to a transfer question. The student has just completed an improved rescan on ThoughtMirror, showing they corrected their understanding.

    Question: ${question}

    Context (from the original explanation): ${context}

    Student's answer: ${answer}

    Evaluate whether the student's answer demonstrates genuine application of the corrected understanding to a new scenario, or if it's just memorized recall of their original paragraph.

    Return a JSON object with:
    - "correctness": "correct", "partially_correct", or "incorrect"
    - "feedback": one concise sentence giving a hint or affirmation — DO NOT give the answer or repeat the question. If incorrect, give a gentle hint toward the right principle. If correct, give a brief affirmation. Keep it to one sentence.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Evaluate this student answer. Be concise.`,
        config: {
          responseMimeType: "application/json",
          responseSchema,
          systemInstruction: SYSTEM_INSTRUCTION,
          httpOptions: { retryOptions: { attempts: 1 } },
        },
      });

      let result: Record<string, unknown> = { correctness: "incorrect" as const, feedback: "Unable to evaluate." };

      if ((response as any).text) {
        try {
          result = JSON.parse(response.text);
        } catch {
          result = { correctness: "incorrect", feedback: "Unable to parse evaluation." };
        }
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (geminiError: unknown) {
      console.error("[transfer-check] Gemini API error:", geminiError);
      return new Response(
        JSON.stringify({ error: "Failed to evaluate transfer answer" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: unknown) {
    console.error("[transfer-check] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}