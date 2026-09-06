// Server-only utilities. Never import this module into a client component.
const windows = new Map<string, { count: number; until: number }>();
export function guard(request: Request, max = 25) {
  const origin = request.headers.get('origin');
  const host = new URL(request.url).host;
  if (origin) {
    try {
      if (new URL(origin).host !== host)
        return Response.json(
          { error: 'Please use the game’s own conversation field.' },
          { status: 403 },
        );
    } catch {
      return Response.json(
        { error: 'Invalid request origin.' },
        { status: 403 },
      );
    }
  } else if (request.headers.get('sec-fetch-site') === 'cross-site')
    return Response.json(
      { error: 'Cross-site requests are not allowed.' },
      { status: 403 },
    );
  const id =
    (request.headers.get('cf-connecting-ip') || 'local') +
    new URL(request.url).pathname;
  const now = Date.now();
  if (windows.size > 1000)
    for (const [key, v] of windows) if (v.until < now) windows.delete(key);
  const bucket = windows.get(id);
  if (!bucket || bucket.until < now)
    windows.set(id, { count: 1, until: now + 60000 });
  else {
    if (bucket.count >= max)
      return Response.json(
        { error: 'A moment to breathe. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    bucket.count++;
  }
  return null;
}
export function apiKey() {
  return process.env.OPENAI_API_KEY || '';
}
export function privateJSON(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
