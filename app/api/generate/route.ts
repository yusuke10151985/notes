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
    return Response.json({ error: 'bad_request', message: 'Required fields: inputText, model, mode' }, { status: 400 });
  }

  // Env guard: require proper API key by provider
  const isOpenAI = String(model).startsWith('gpt-');
  const isGemini = String(model).startsWith('gemini-');
  if (isOpenAI && !process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'config_missing', message: 'OPENAI_API_KEY is not set in environment' }, { status: 400 });
  }
  if (isGemini && !process.env.GOOGLE_API_KEY) {
    return Response.json({ error: 'config_missing', message: 'GOOGLE_API_KEY is not set in environment' }, { status: 400 });
  }

  const { system, user } = buildPrompt({ mode, sourceLang, targetLang, inputText, options, freePrompt });

  // E2E mode: synthetic SSE stream (no external API)
  if (options?.e2eSSE) {
    const content = `# OK\nmode=${mode}, target=${targetLang}\n\n${inputText}`;
    const lines = content.split('\n');
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let i = 0;
        const tick = () => {
          if (i >= lines.length) {
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(`data: ${lines[i++]}\n\n`));
          setTimeout(tick, 10);
        };
        tick();
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  const supportsStream = isOpenAI;

  // Force JSON fallback when requested
  if (supportsStream && options?.forceJSON) {
    const { text } = await (await callLLM({ model, system, user, stream: false })) as any;
    return Response.json({ result_md: text, pane, model, mode, sessionId });
  }
  if (supportsStream) {
    const llmStream = await callLLM({ model, system, user, stream: true }) as ReadableStream<Uint8Array>;
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const reader = llmStream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        (async () => {
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split(/\n/);
              buffer = lines.pop() ?? '';
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                const payload = trimmed.slice(5).trim(); // after 'data:'
                if (payload === '[DONE]') continue;
                try {
                  const json = JSON.parse(payload);
                  const delta = json?.choices?.[0]?.delta?.content;
                  if (typeof delta === 'string' && delta.length) {
                    // SSE仕様: 複数行は data: を行ごとに
                    const lines = String(delta).split('\n');
                    for (const l of lines) controller.enqueue(encoder.encode(`data: ${l}\n`));
                    controller.enqueue(encoder.encode(`\n`));
                  }
                } catch {
                  // ignore non-JSON heartbeat lines
                }
              }
            }
            // flush any remaining buffer (best-effort)
            if (buffer) {
              try {
                const json = JSON.parse(buffer.replace(/^data:\s*/, ''));
                const delta = json?.choices?.[0]?.delta?.content;
                if (typeof delta === 'string' && delta.length) {
                  controller.enqueue(new TextEncoder().encode(`data: ${delta}\n\n`));
                }
              } catch {}
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
