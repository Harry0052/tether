import { describe, expect, test } from "vitest";
import { checkInviteToken, issueInviteToken } from "./tokens";

describe("invite tokens", () => {
  test("a signed token checks out and a tampered one does not", () => {
    const invitationId = "11111111-1111-4111-8111-111111111111";
    const issued = issueInviteToken(invitationId);
    expect(checkInviteToken(issued.token)).toMatchObject({ ok: true, invitationId });
    const broken = issued.token.slice(0, -2) + (issued.token.endsWith("a") ? "b" : "a");
    expect(checkInviteToken(broken)).toEqual({ ok: false, reason: "malformed" });
    expect(checkInviteToken("not a token")).toEqual({ ok: false, reason: "malformed" });
  });
});