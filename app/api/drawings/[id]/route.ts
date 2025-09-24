export const runtime = 'edge';

// NOTE: MVPでは擬似的に空データを返すのみ。Supabase連携は後続で差し替え。

export async function GET(_: Request, ctx: any) {
  const params = ctx?.params && typeof ctx.params.then === 'function' ? await ctx.params : ctx.params;
  return Response.json({ id: params?.id, state: {} });
}

export async function PUT(req: Request, ctx: any) {
  const params = ctx?.params && typeof ctx.params.then === 'function' ? await ctx.params : ctx.params;
  const state = await req.json();
  // 実装では Supabase に upsert
  return Response.json({ id: params?.id, ok: true, size: JSON.stringify(state).length });
}
