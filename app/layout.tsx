import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Memo · Translate · Summarize',
  description: 'Collaborative memo, translation and summarization tool',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

