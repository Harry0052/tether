import { describe, expect, test } from "vitest";
import { sameOriginRedirect } from "./http";

describe("sameOriginRedirect", () => {
  test("uses the host the browser called, not an internal localhost url", () => {
    const request = new Request("http://localhost:3000/api/profile", {
      headers: { host: "127.0.0.1:3000" },
    });
    expect(sameOriginRedirect(request, "/settings?saved=1").href).toBe(
      "http://127.0.0.1:3000/settings?saved=1",
    );
  });
});
