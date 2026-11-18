const hiddenKeys = new Set(["password", "token", "authorization", "cookie", "secret"]);

export function logEvent(level: "info" | "error", event: string, fields: Record<string, unknown> = {}) {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (hiddenKeys.has(key.toLowerCase())) continue;
    safe[key] = value;
  }
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...safe });
  if (level === "error") console.error(line);
  else console.info(line);
}
