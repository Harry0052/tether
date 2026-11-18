const forbiddenKeys = new Set([
  "password",
  "passwordhash",
  "passcode",
  "pin",
  "secret",
  "token",
  "authorization",
  "cookie",
  "session",
  "ssn",
  "cvv",
]);

export function redactText(value: string) {
  return value
    .replace(/\b(password|passcode|pin|secret|ssn|cvv)\b\s*[:=]?\s*\S+/gi, "$1 [redacted]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[redacted number]");
}

export function redactMetadata(metadata: Record<string, string | number>) {
  const safe: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (forbiddenKeys.has(key.toLowerCase())) continue;
    safe[key] = typeof value === "string" ? redactText(value) : value;
  }
  return safe;
}
