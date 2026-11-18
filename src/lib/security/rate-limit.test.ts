import { describe, expect, test } from "vitest";
import { databaseFrom, openDatabase } from "@/lib/db/client";
import { consumeRateLimit } from "./rate-limit";

describe("rate limit", () => {
  test("blocks the request that passes the fixed window", () => {
    const sqlite = openDatabase(":memory:");
    const db = databaseFrom(sqlite);
    expect(consumeRateLimit(db, "task:user", 2, 60_000)).toBe(true);
    expect(consumeRateLimit(db, "task:user", 2, 60_000)).toBe(true);
    expect(consumeRateLimit(db, "task:user", 2, 60_000)).toBe(false);
    sqlite.close();
  });
});
