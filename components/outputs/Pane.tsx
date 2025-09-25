"use client";
import { useMemo } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkBreaks from 'remark-breaks';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

export function MarkdownPane({ content }: { content: string }) {
  const html = useMemo(() => {
    try {
      const file = unified()
        .use(remarkParse)
        .use(remarkBreaks) // 改行(\n)を <br> として扱う
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeStringify)
        .processSync(content || '');
      return String(file);
    } catch {
      return content;
    }
  }, [content]);
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
