import { en, type Messages } from "./en";
import { es } from "./es";

export type { Messages };

export function getMessages(locale?: string | null): Messages {
  return locale === "es" ? es : en;
}
