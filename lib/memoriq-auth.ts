"use client";

import { account, databases, DB_ID, PROFILES_COL, ATTEMPTS_COL, Query, ID } from "./appwrite";

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signInWithEmail(email: string) {
  try {
    await account.createMagicURLToken(ID.unique(), email, `${window.location.origin}/memorabilia`);
    return { error: null };
  } catch (e: unknown) {
    return { error: e as Error };
  }
}

export async function signOut() {
  try { await account.deleteSession("current"); } catch {}
}

export async function getSession() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export type Profile = {
  $id: string;
  user_id: string;
  username: string | null;
  total_xp: number;
  badges: string[];
  challenges_completed: number;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const res = await databases.listDocuments(DB_ID, PROFILES_COL, [
      Query.equal("user_id", userId),
      Query.limit(1),
    ]);
    return (res.documents[0] as unknown as Profile) ?? null;
  } catch {
    return null;
  }
}

async function ensureProfile(userId: string): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;
  const doc = await databases.createDocument(DB_ID, PROFILES_COL, ID.unique(), {
    user_id: userId,
    username: null,
    total_xp: 0,
    badges: [],
    challenges_completed: 0,
  });
  return doc as unknown as Profile;
}

export async function updateUsername(userId: string, username: string) {
  const profile = await getProfile(userId);
  if (!profile) return;
  await databases.updateDocument(DB_ID, PROFILES_COL, profile.$id, { username });
}

// ── Attempts ──────────────────────────────────────────────────────────────────

export async function saveAttempt({
  userId,
  itemId,
  scorePct,
  xpEarned,
  correct,
  total,
  qualified,
  badges,
}: {
  userId: string;
  itemId: string;
  scorePct: number;
  xpEarned: number;
  correct: number;
  total: number;
  qualified: boolean;
  badges: string[];
}) {
  await databases.createDocument(DB_ID, ATTEMPTS_COL, ID.unique(), {
    user_id: userId,
    item_id: itemId,
    score_pct: scorePct,
    xp_earned: xpEarned,
    correct,
    total,
    qualified,
    badges,
  });

  const profile = await ensureProfile(userId);
  const mergedBadges = Array.from(new Set([...profile.badges, ...badges]));

  await databases.updateDocument(DB_ID, PROFILES_COL, profile.$id, {
    total_xp: profile.total_xp + xpEarned,
    badges: mergedBadges,
    challenges_completed: profile.challenges_completed + 1,
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export type LeaderboardRow = {
  user_id: string;
  username: string;
  best_xp: number;
  best_score: number;
  qualified: boolean;
  attempts: number;
};

export async function getLeaderboard(itemId: string): Promise<LeaderboardRow[]> {
  try {
    const res = await databases.listDocuments(DB_ID, ATTEMPTS_COL, [
      Query.equal("item_id", itemId),
      Query.orderDesc("xp_earned"),
      Query.limit(100),
    ]);

    // Collapse to best attempt per user client-side
    const byUser = new Map<string, LeaderboardRow>();
    for (const doc of res.documents) {
      const d = doc as unknown as {
        user_id: string; xp_earned: number; score_pct: number; qualified: boolean;
      };
      const existing = byUser.get(d.user_id);
      if (!existing || d.xp_earned > existing.best_xp) {
        byUser.set(d.user_id, {
          user_id: d.user_id,
          username: "Anonymous",
          best_xp: d.xp_earned,
          best_score: d.score_pct,
          qualified: d.qualified,
          attempts: (existing?.attempts ?? 0) + 1,
        });
      } else {
        existing.attempts += 1;
      }
    }

    // Fetch usernames
    const rows = Array.from(byUser.values()).sort((a, b) => b.best_xp - a.best_xp).slice(0, 20);
    const userIds = rows.map((r) => r.user_id);
    if (userIds.length) {
      const profiles = await databases.listDocuments(DB_ID, PROFILES_COL, [
        Query.equal("user_id", userIds),
        Query.limit(20),
      ]);
      for (const p of profiles.documents) {
        const prof = p as unknown as Profile;
        const row = byUser.get(prof.user_id);
        if (row && prof.username) row.username = prof.username;
      }
    }

    return rows;
  } catch {
    return [];
  }
}
