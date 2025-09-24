# Memo · Translate · Summarize (Spec-based MVP)

このリポジトリは、会議で複数人が同時に使える「左＝入力」「右＝出力×2」レイアウトのメモ・翻訳・要約ツールの最小実装（MVP）です。Next.js 15（App Router, TypeScript）+ TailwindCSS + Supabase + i18n（next-intl）をベースに、AI 実行（OpenAI/Gemini）とリアルタイムの土台を整えています。

本MVPは以下を含みます：
- ページ: `/(session)/[id]`（入力＋出力×2の3カラム。Input は簡易/置換可能、OutputはMarkdown表示）
- API ルート: `/api/generate`, `/api/blocks/bulk`, `/api/drawings/[sessionId]`
- ライブラリ: `lib/ai.ts`, `lib/prompt.ts`, `lib/supabase.ts`
- i18n: `en`, `ja`
- Vercel デプロイ設定（`vercel.json`）と GitHub Actions（`vercel-deploy.yml`）
- Supabase スキーマ（`supabase/schema.sql`）

注意：本コミットは「動く垂直スライス」を重視し、Tiptap/tldraw/Presence 等は最小構成またはスタブです。拡張は TODO を参照してください。

## セットアップ

1) 依存関係インストール

```bash
npm i
```

2) 開発

```bash
npm run dev
```

3) 環境変数

`.env.local` に以下を設定してください。

```
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4) Supabase スキーマ

`supabase/schema.sql` をプロジェクトDBに適用します。RLSは所有者モデルを基本とします。

## デプロイ（Vercel）

2通りあります：

- Vercel ダッシュボードから GitHub リポジトリを接続（推奨）。環境変数を設定すれば自動デプロイします。
- もしくは GitHub Actions を使用（`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` をリポジトリ Secrets に設定）。

## 仕様からの差分（MVP）

- Editor は簡易版（テキストエリア）: Tiptap + ブロックメタはスタブ。差し替え前提の分離設計。
- Presence/DB Changes は Supabase client の初期化と channel スタブのみに留めています。
- 画像貼付/tldraw は API 面の骨子のみ。UI 組み込みは後続。
- Rate Limit は簡易 in-memory（Edge環境では状態保持されない点に留意）。本運用は Upstash 等に置換推奨。

## ライセンス

Private / Internal use.

