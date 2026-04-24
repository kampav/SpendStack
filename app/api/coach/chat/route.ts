import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { anthropic } from '@/lib/anthropic/client';
import type { CoachMessage } from '@/types';

const SYSTEM_PROMPT = `You are a friendly, encouraging UK banking and personal finance coach inside the SpendStack app.

Guidelines:
- Keep responses concise (2-4 sentences max)
- Focus on practical, actionable advice
- Use British English and GBP (£)
- Reference the SpendStack points/tiers system when relevant
- Never give regulated financial advice — always suggest consulting an FCA-authorised adviser for investments, mortgages, or pensions
- Be warm, positive, and motivating`;

async function verifyToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const token = authHeader.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    await verifyToken(req);
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = (await req.json()) as { messages: CoachMessage[] };
  const { messages } = body;

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
}
