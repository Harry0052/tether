import { describe, expect, test } from "vitest";
import { formatUtc } from "./time";

describe("formatUtc", () => {
  test("labels the instant as UTC without throwing", () => {
    const value = formatUtc("2026-11-18T15:04:00.000Z", "en");
    expect(value).toContain("2026");
    expect(value).toContain("UTC");
    expect(value).toContain("15:04");
  });
});