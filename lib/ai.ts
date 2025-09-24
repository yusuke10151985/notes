export type AIModel = 'gpt-4o-mini'|'gpt-4o'|'gemini-2.0-flash';

export async function callLLM(opts: {
  model: AIModel; system: string; user: string; stream?: boolean;
}): Promise<ReadableStream<Uint8Array>|{ text: string, usage?: any }>
{
  const { model, system, user, stream } = opts;
  if (String(model).startsWith('gpt-')) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = { model, stream: !!stream, messages: [{role:'system', content: system},{role:'user', content:user}] };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY!}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (stream) return res.body!;
    const json = await res.json();
    return { text: json.choices?.[0]?.message?.content ?? '', usage: json.usage };
  }
  // Gemini (non-stream baseline)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY!}`;
  const body = { contents: [{ role:'user', parts:[{text: `${system}\n\n${user}`}]}] };
  const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text).join('') ?? '';
  return { text };
}

