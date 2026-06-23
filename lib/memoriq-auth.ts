"use client";

import { getBrowserClient } from "./supabase";

export async function signInWithEmail(email: string) {
  const sb = getBrowserClient();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/memorabilia`,
    },
  });
  return { error };
}

export async function signOut() {
  const sb = getBrowserClient();
  await sb.auth.signOut();
}

export async function getSession() {
  const sb = getBrowserClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getProfile(userId: string) {
  const sb = getBrowserClient();
  const { data } = await sb
    .from("memoriq_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

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
  const sb = getBrowserClient();

  // Save attempt row
  await sb.from("memoriq_attempts").insert({
    user_id: userId,
    item_id: itemId,
    score_pct: scorePct,
    xp_earned: xpEarned,
    correct,
    total,
    qualified,
    badges,
  });

  // Update profile totals
  const profile = await getProfile(userId);
  if (!profile) return;

  const mergedBadges = Array.from(new Set([...(profile.badges ?? []), ...badges]));

  await sb
    .from("memoriq_profiles")
    .update({
      total_xp: (profile.total_xp ?? 0) + xpEarned,
      badges: mergedBadges,
      challenges_completed: (profile.challenges_completed ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function getLeaderboard(itemId: string) {
  const sb = getBrowserClient();
  const { data } = await sb
    .from("memoriq_leaderboard")
    .select("*")
    .eq("item_id", itemId)
    .order("best_xp", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function updateUsername(userId: string, username: string) {
  const sb = getBrowserClient();
  await sb
    .from("memoriq_profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("id", userId);
}
