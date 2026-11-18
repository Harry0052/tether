import { randomUUID } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import type { TetherDb } from "@/lib/db/client";
import { capabilityGrants, invitations, tasks, trustedRelations, users } from "@/lib/db/schema";
import { addDays, nowIso } from "@/lib/time";
import { viewTask } from "@/lib/tasks/service";
import { checkInviteToken, issueInviteToken } from "@/lib/trust/tokens";

export const INVITE_INVALID = "This invitation link is not valid.";

const DAY_CHOICES = [1, 7, 30] as const;
export type InviteDays = (typeof DAY_CHOICES)[number];

export function isInviteDays(value: number): value is InviteDays {
  return DAY_CHOICES.some((day) => day === value);
}

function activeGrantsForPair(db: TetherDb, ownerId: string, helperId: string) {
  return db
    .select()
    .from(capabilityGrants)
    .where(
      and(
        eq(capabilityGrants.ownerId, ownerId),
        eq(capabilityGrants.helperId, helperId),
        isNull(capabilityGrants.revokedAt),
        gt(capabilityGrants.expiresAt, nowIso()),
      ),
    )
    .all();
}

export function createInvitation(db: TetherDb, ownerId: string, taskId: string, days: InviteDays) {
  const view = viewTask(db, ownerId, taskId);
  if (!view || view.role !== "owner" || view.task.origin !== "user") {
    return { ok: false as const, status: 404, code: "not_available", message: "This checklist is not available to you." };
  }
  const invitationId = randomUUID();
  const issued = issueInviteToken(invitationId);
  const createdAt = nowIso();
  const expiresAt = addDays(createdAt, days);
  db.insert(invitations)
    .values({
      id: invitationId,
      ownerId,
      taskId,
      tokenHash: issued.tokenHash,
      scope: "suggest",
      expiresAt,
      usedAt: null,
      usedBy: null,
      revokedAt: null,
      createdAt,
    })
    .run();
  const metadata = recordAudit(db, {
    taskId,
    actorId: ownerId,
    type: "invitation_created",
    metadata: { scope: "suggest", days, invitationId },
  });
  return { ok: true as const, token: issued.token, expiresAt, invitationId, metadata };
}

function loadInvite(db: TetherDb, token: string) {
  const checked = checkInviteToken(token);
  if (!checked.ok) return null;
  const invite = db
    .select()
    .from(invitations)
    .where(and(eq(invitations.id, checked.invitationId), eq(invitations.tokenHash, checked.tokenHash)))
    .get();
  if (!invite || invite.usedAt || invite.revokedAt || invite.expiresAt <= nowIso()) return null;
  return invite;
}

export function previewInvitation(db: TetherDb, token: string) {
  const invite = loadInvite(db, token);
  if (!invite) return { ok: false as const, message: INVITE_INVALID };
  const owner = db.select().from(users).where(eq(users.id, invite.ownerId)).get();
  const task = db.select().from(tasks).where(eq(tasks.id, invite.taskId)).get();
  if (!owner || !task) return { ok: false as const, message: INVITE_INVALID };
  return {
    ok: true as const,
    ownerName: owner.displayName,
    taskTitle: task.title,
    taskId: task.id,
    expiresAt: invite.expiresAt,
    scope: "suggest" as const,
  };
}

export function acceptInvitation(db: TetherDb, helperId: string, token: string) {
  const invite = loadInvite(db, token);
  if (!invite) return { ok: false as const, status: 400, code: "invite_invalid", message: INVITE_INVALID };
  if (invite.ownerId === helperId) {
    return {
      ok: false as const,
      status: 409,
      code: "owner",
      message: "You already own this checklist.",
      taskId: invite.taskId,
    };
  }
  const acceptedAt = nowIso();
  try {
    db.transaction((tx) => {
      const claimed = tx
        .update(invitations)
        .set({ usedAt: acceptedAt, usedBy: helperId })
        .where(and(eq(invitations.id, invite.id), isNull(invitations.usedAt), isNull(invitations.revokedAt)))
        .run();
      if (claimed.changes !== 1) throw new Error("used");
      const relation = tx
        .select()
        .from(trustedRelations)
        .where(and(eq(trustedRelations.ownerId, invite.ownerId), eq(trustedRelations.helperId, helperId)))
        .get();
      if (!relation) {
        tx.insert(trustedRelations)
          .values({
            id: randomUUID(),
            ownerId: invite.ownerId,
            helperId,
            status: "active",
            createdAt: acceptedAt,
            revokedAt: null,
          })
          .run();
      } else {
        tx.update(trustedRelations)
          .set({ status: "active", revokedAt: null })
          .where(eq(trustedRelations.id, relation.id))
          .run();
      }
      tx.insert(capabilityGrants)
        .values({
          id: randomUUID(),
          ownerId: invite.ownerId,
          helperId,
          taskId: invite.taskId,
          invitationId: invite.id,
          scope: "suggest",
          expiresAt: invite.expiresAt,
          revokedAt: null,
          createdAt: acceptedAt,
        })
        .run();
    });
  } catch {
    return { ok: false as const, status: 400, code: "invite_invalid", message: INVITE_INVALID };
  }
  recordAudit(db, {
    taskId: invite.taskId,
    actorId: helperId,
    type: "invitation_accepted",
    metadata: { scope: "suggest", invitationId: invite.id },
  });
  return { ok: true as const, taskId: invite.taskId };
}

export function revokeGrant(db: TetherDb, ownerId: string, grantId: string) {
  const grant = db.select().from(capabilityGrants).where(eq(capabilityGrants.id, grantId)).get();
  if (!grant || grant.ownerId !== ownerId) {
    return { ok: false as const, status: 404, code: "not_available", message: "That access is not available to you." };
  }
  if (!grant.revokedAt) {
    const revokedAt = nowIso();
    db.update(capabilityGrants).set({ revokedAt }).where(eq(capabilityGrants.id, grant.id)).run();
    if (activeGrantsForPair(db, ownerId, grant.helperId).length === 0) {
      db.update(trustedRelations)
        .set({ status: "revoked", revokedAt })
        .where(and(eq(trustedRelations.ownerId, ownerId), eq(trustedRelations.helperId, grant.helperId)))
        .run();
    }
    recordAudit(db, {
      taskId: grant.taskId,
      actorId: ownerId,
      type: "access_revoked",
      metadata: { grantId: grant.id, scope: grant.scope },
    });
  }
  return { ok: true as const };
}

export function revokeHelper(db: TetherDb, ownerId: string, helperId: string) {
  const grants = db
    .select()
    .from(capabilityGrants)
    .where(and(eq(capabilityGrants.ownerId, ownerId), eq(capabilityGrants.helperId, helperId), isNull(capabilityGrants.revokedAt)))
    .all();
  if (grants.length === 0) {
    return { ok: false as const, status: 404, code: "not_available", message: "That access is not available to you." };
  }
  for (const grant of grants) revokeGrant(db, ownerId, grant.id);
  return { ok: true as const };
}

export function revokeInvitation(db: TetherDb, ownerId: string, invitationId: string) {
  const invite = db.select().from(invitations).where(eq(invitations.id, invitationId)).get();
  if (!invite || invite.ownerId !== ownerId || invite.usedAt) {
    return { ok: false as const, status: 404, code: "not_available", message: "That invitation is not available to you." };
  }
  if (!invite.revokedAt) {
    db.update(invitations).set({ revokedAt: nowIso() }).where(eq(invitations.id, invite.id)).run();
    recordAudit(db, {
      taskId: invite.taskId,
      actorId: ownerId,
      type: "invitation_revoked",
      metadata: { invitationId: invite.id },
    });
  }
  return { ok: true as const };
}

export function listTrust(db: TetherDb, userId: string) {
  const owned = db
    .select()
    .from(trustedRelations)
    .where(and(eq(trustedRelations.ownerId, userId), eq(trustedRelations.status, "active")))
    .all();
  const helpers = owned.flatMap((relation) => {
    const helper = db.select().from(users).where(eq(users.id, relation.helperId)).get();
    if (!helper) return [];
    const grants = activeGrantsForPair(db, userId, relation.helperId).flatMap((grant) => {
      const task = db.select().from(tasks).where(eq(tasks.id, grant.taskId)).get();
      if (!task) return [];
      return [{ id: grant.id, taskId: task.id, taskTitle: task.title, expiresAt: grant.expiresAt, scope: grant.scope }];
    });
    if (grants.length === 0) return [];
    return [{ helperId: helper.id, helperName: helper.displayName, grants }];
  });

  const helping = db
    .select()
    .from(trustedRelations)
    .where(and(eq(trustedRelations.helperId, userId), eq(trustedRelations.status, "active")))
    .all()
    .flatMap((relation) => {
      const owner = db.select().from(users).where(eq(users.id, relation.ownerId)).get();
      if (!owner) return [];
      const grants = activeGrantsForPair(db, relation.ownerId, userId).flatMap((grant) => {
        const task = db.select().from(tasks).where(eq(tasks.id, grant.taskId)).get();
        if (!task) return [];
        return [{ taskId: task.id, taskTitle: task.title, expiresAt: grant.expiresAt }];
      });
      if (grants.length === 0) return [];
      return [{ ownerId: owner.id, ownerName: owner.displayName, grants }];
    });

  const pending = db
    .select()
    .from(invitations)
    .where(and(eq(invitations.ownerId, userId), isNull(invitations.usedAt), isNull(invitations.revokedAt), gt(invitations.expiresAt, nowIso())))
    .all()
    .flatMap((invite) => {
      const task = db.select().from(tasks).where(eq(tasks.id, invite.taskId)).get();
      if (!task) return [];
      return [{ id: invite.id, taskTitle: task.title, expiresAt: invite.expiresAt, scope: invite.scope }];
    });

  return { helpers, helping, pending };
}
