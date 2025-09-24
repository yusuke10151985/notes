export const runtime = 'edge';

export async function PATCH(req: Request) {
  // スタブ: 本番は Supabase Server Client で upsert。
  const body = await req.json();
  if (!Array.isArray(body)) return new Response('Bad Request', { status: 400 });
  return Response.json({ ok: true, count: body.length });
}

