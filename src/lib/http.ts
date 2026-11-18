export function requestIsSecure(request: Request) {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return new URL(request.url).protocol === "https:";
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) {
  return Response.json({ error: { code, message, fields } }, { status });
}

export function wantsJson(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  return type.includes("application/json");
}

export function sameOriginRedirect(request: Request, path: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto = protoHeader?.split(",")[0]?.trim() || new URL(request.url).protocol.replace(":", "");
  const base = host ? `${proto}://${host}` : request.url;
  return new URL(path, base);
}
