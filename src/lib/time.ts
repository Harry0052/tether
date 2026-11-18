export function nowIso() {
  return new Date().toISOString();
}

export function addDays(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * 24 * 60 * 60 * 1000).toISOString();
}

export function formatUtc(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const formatted = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);
  return `${formatted} UTC`;
}

export function formatDay(day: string, locale: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}
