"use client";
import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import { MarkdownPane } from '@/components/outputs/Pane';

type Mode = 'translate'|'summarize'|'detect'|'free';

export default function SessionPage(props: any) {
  const sessionId: string = props?.params?.id ?? '';
  const [modelA, setModelA] = useState('gpt-4o-mini');
  const [modelB, setModelB] = useState('gpt-4o-mini');
  const [modeA, setModeA] = useState<Mode>('summarize');
  const [modeB, setModeB] = useState<Mode>('translate');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLangA, setTargetLangA] = useState('ja');
  const [targetLangB, setTargetLangB] = useState('en');
  const [autoRun, setAutoRun] = useState(true);
  const [inputText, setInputText] = useState('');
  const [outA, setOutA] = useState('');
  const [outB, setOutB] = useState('');
  const [runningA, setRunningA] = useState(false);
  const [runningB, setRunningB] = useState(false);

  async function runGenerate(pane: 1|2) {
    const model = pane === 1 ? modelA : modelB;
    const mode: Mode = pane === 1 ? modeA : modeB;
    const targetLang = pane === 1 ? targetLangA : targetLangB;
    const setter = pane === 1 ? setOutA : setOutB;
    const setRunning = pane === 1 ? setRunningA : setRunningB;
    setRunning(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, pane, mode, model, sourceLang, targetLang, inputText, options: { summaryPreset: 'meeting-notes' } })
      });
      if (res.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let agg = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          // naive SSE parse (data: ...\n\n)
          chunk.split('\n\n').forEach(line => {
            const m = line.match(/^data: (.*)$/m);
            if (m) { agg += m[1]; setter(agg); }
          });
        }
      } else {
        const json = await res.json();
        setter(json.result_md || '');
      }
    } finally {
      setRunning(false);
    }
  }

  const debouncedA = useMemo(() => debounce(() => runGenerate(1), 500), [modelA, modeA, sourceLang, targetLangA, sessionId]);
  const debouncedB = useMemo(() => debounce(() => runGenerate(2), 500), [modelB, modeB, sourceLang, targetLangB, sessionId]);

  useEffect(() => {
    if (autoRun) debouncedA();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, modelA, modeA, sourceLang, targetLangA, autoRun]);
  useEffect(() => {
    if (autoRun) debouncedB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, modelB, modeB, sourceLang, targetLangB, autoRun]);

  return (
    <div className="flex flex-col h-dvh">
      <header className="border-b p-3 gap-3 flex items-center justify-between">
        <div className="font-semibold">Memo · Translate · Summarize</div>
        <div className="flex items-center gap-2 text-sm">
          <label>Model A</label>
          <select className="border px-2 py-1 rounded" value={modelA} onChange={e=>setModelA(e.target.value)}>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
          </select>
          <label>Mode A</label>
          <select className="border px-2 py-1 rounded" value={modeA} onChange={e=>setModeA(e.target.value as Mode)}>
            <option value="translate">Translate</option>
            <option value="summarize">Summarize</option>
            <option value="detect">Detect</option>
            <option value="free">Free</option>
          </select>
          <label>Out-1 Lang</label>
          <input className="border px-2 py-1 rounded w-16" value={targetLangA} onChange={e=>setTargetLangA(e.target.value)} />
          <div className="w-4"/>
          <label>Model B</label>
          <select className="border px-2 py-1 rounded" value={modelB} onChange={e=>setModelB(e.target.value)}>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
          </select>
          <label>Mode B</label>
          <select className="border px-2 py-1 rounded" value={modeB} onChange={e=>setModeB(e.target.value as Mode)}>
            <option value="translate">Translate</option>
            <option value="summarize">Summarize</option>
            <option value="detect">Detect</option>
            <option value="free">Free</option>
          </select>
          <label>Out-2 Lang</label>
          <input className="border px-2 py-1 rounded w-16" value={targetLangB} onChange={e=>setTargetLangB(e.target.value)} />
          <div className="w-4"/>
          <label>Source</label>
          <input className="border px-2 py-1 rounded w-16" value={sourceLang} onChange={e=>setSourceLang(e.target.value)} />
          <label className="ml-2 flex items-center gap-1"><input type="checkbox" checked={autoRun} onChange={e=>setAutoRun(e.target.checked)} /> Auto-Run</label>
        </div>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1 min-h-0">
        <section className="border-r p-3 flex flex-col min-h-0">
          <div className="text-sm font-medium mb-2">Input</div>
          <textarea
            value={inputText}
            onChange={e=>setInputText(e.target.value)}
            className="flex-1 resize-none border rounded p-2 font-mono text-sm"
            placeholder="ここにテキストを入力（MVP：Tiptapは後続で差し替え）"
          />
          <div className="mt-2 flex gap-2">
            <button className="border rounded px-3 py-1" onClick={()=>runGenerate(1)} disabled={runningA}>Generate A (⌘Enter)</button>
            <button className="border rounded px-3 py-1" onClick={()=>runGenerate(2)} disabled={runningB}>Generate B</button>
          </div>
        </section>
        <section className="border-r p-3 min-h-0 overflow-auto">
          <div className="text-sm font-medium mb-2">Output A</div>
          <MarkdownPane content={outA} />
        </section>
        <section className="p-3 min-h-0 overflow-auto">
          <div className="text-sm font-medium mb-2">Output B</div>
          <MarkdownPane content={outB} />
        </section>
      </main>
      <footer className="border-t p-2 text-xs flex items-center justify-between">
        <div>Session: {sessionId}</div>
        <div>変更は自動保存（MVP）、Tokens/Costは生成時に表示予定</div>
      </footer>
    </div>
  );
}
