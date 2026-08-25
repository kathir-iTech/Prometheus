import { google } from '@google/genai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Text is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const client = new google({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: text,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          scores: {
            type: 'OBJECT',
            properties: {
              rigor: { type: 'NUMBER' },
              clarity: { type: 'NUMBER' },
              evidence: { type: 'NUMBER' },
            },
            required: ['rigor', 'clarity', 'evidence'],
          },
          segments: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                text: { type: 'STRING' },
                type: {
                  type: 'STRING',
                  enum: [
                    'normal',
                    'reasoning_error',
                    'knowledge_gap',
                    'unsupported_claim',
                    'strong',
                  ],
                },
                label: { type: 'STRING' },
                socratic_question: { type: 'STRING' },
              },
              required: ['text', 'type'],
              additionalProperties: false,
            },
          },
        },
        required: ['scores', 'segments'],
        additionalProperties: false,
      },
    },
  });

  return new Response(
    JSON.stringify(response.text ? JSON.parse(response.text) : {}),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}