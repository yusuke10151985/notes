export type Mode = 'translate'|'summarize'|'detect'|'free';
type SummOpts = { summaryPreset?: string; length?: 'short'|'medium'|'long'; tone?: 'neutral'|'friendly'|'formal' };

export function buildPrompt(params: {
  mode: Mode; sourceLang?: string; targetLang?: string;
  inputText: string; options?: SummOpts; freePrompt?: string;
}) {
  const { mode, sourceLang='auto', targetLang='en', inputText, options, freePrompt } = params;
  const sys = 'You are a precise bilingual editor that outputs clean Markdown. Respect the requested language(s). Keep formatting tight and scannable.';
  if (mode === 'translate') {
    return {
      system: sys,
      user: `Translate the following text from ${sourceLang} to ${targetLang}. Keep semantics faithful. Use Markdown when lists are implied.\n---\n${inputText}`
    };
  }
  if (mode === 'summarize') {
    const { summaryPreset='meeting-notes', length='medium', tone='neutral' } = options ?? {};
    return {
      system: sys,
      user: `Summarize the text in Markdown using the preset "${summaryPreset}".\nRequirements:\n- Title (bold) + one-sentence TL;DR.\n- Bulleted key points (≤7).\n- Highlight names/dates/amounts in **bold**.\n- End with sections: Action Items (owner, due), Open Questions, Next Steps.\nOptions: length=${length}, tone=${tone}, outputLang=${targetLang}\n---\n${inputText}`
    };
  }
  if (mode === 'detect') {
    return { system: sys, user: `Detect the primary language of the text. Return JSON only: {"lang":"xx","name":"…"}\n---\n${inputText}` };
  }
  return {
    system: sys,
    user: `Act on the instruction below and answer in ${targetLang} with Markdown.\n---\n${freePrompt ?? ''}\nContext:\n${inputText}`
  };
}

