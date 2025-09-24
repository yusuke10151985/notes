import { buildPrompt } from '@/lib/prompt';
import { callLLM } from '@/lib/ai';
import { checkRate } from '@/lib/rate-limit';

export const runtime = 'edge';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '';
  const rate = checkRate(ip);
  if (!rate.ok) return new Response('Too Many Requests', { status: 429 });

  const { sessionId, pane, mode, model, sourceLang, targetLang, inputText, options, freePrompt } = await req.json();

  if (!inputText || !model || !mode) {
    return new Response('Bad Request', { status: 400 });
  }

  const { system, user } = buildPrompt({ mode, sourceLang, targetLang, inputText, options, freePrompt });

  const supportsStream = String(model).startsWith('gpt-');
  if (supportsStream) {
    const llmStream = await callLLM({ model, system, user, stream: true }) as ReadableStream<Uint8Array>;
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const reader = llmStream.getReader();
        (async () => {
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(encoder.encode(`data: ${new TextDecoder().decode(value)}\n\n`));
            }
            controller.close();
          } catch (e) { controller.error(e); }
        })();
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }});
  }

  const { text } = await callLLM({ model, system, user, stream: false }) as any;
  const payload = { result_md: text, pane, model, mode, sessionId };
  return Response.json(payload);
}

