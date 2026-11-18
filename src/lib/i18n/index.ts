import { en, type Messages } from "./en";

export type { Messages };

export function getMessages(): Messages {
  return en;
}
