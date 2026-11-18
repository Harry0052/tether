import { describe, expect, test } from "vitest";
import { redactMetadata, redactText } from "./redact";

describe("redact", () => {
  test("removes a typed password and a card-like number from log text", () => {
    const text = redactText("note password: hunter2 and card 4242 4242 4242 4242");
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("4242");
    expect(text).toContain("password [redacted]");
    expect(text).toContain("[redacted number]");
  });

  test("drops forbidden keys instead of storing them", () => {
    const safe = redactMetadata({ title: "Call Mom", token: "abc", password: "hunter2" });
    expect(safe).toEqual({ title: "Call Mom" });
  });
});
