"use client";

import {
  sendSignInLinkToEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signInWithEmail(email: string) {
  try {
    await sendSignInLinkToEmail(getFirebaseAuth(), email, {
      url: `${window.location.origin}/auth/callback`,
      handleCodeInApp: true,
    });
    window.localStorage.setItem("memoriqEmail", email);
    return { error: null };
  } catch (e: unknown) {
    return { error: e as Error };
  }
}

export async function completeSignIn() {
  const auth = getFirebaseAuth();
  if (!isSignInWithEmailLink(auth, window.location.href)) return null;
  const email = window.localStorage.getItem("memoriqEmail");
  if (!email) throw new Error("No email found. Please sign in again.");
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem("memoriqEmail");
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(getFirebaseAuth());
}

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

export function getCurrentUser() {
  return getFirebaseAuth().currentUser;
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export type Profile = {
  user_id: string;
  username: string | null;
  total_xp: number;
  badges: string[];
  challenges_completed: number;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "memoriq_profiles", userId));
  return snap.exists() ? (snap.data() as Profile) : null;
}

async function ensureProfile(userId: string): Promise<Profile> {
  const ref = doc(getFirebaseDb(), "memoriq_profiles", userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as Profile;
  const profile: Profile = { user_id: userId, username: null, total_xp: 0, badges: [], challenges_completed: 0 };
  await setDoc(ref, profile);
  return profile;
}

export async function updateUsername(userId: string, username: string) {
  await updateDoc(doc(getFirebaseDb(), "memoriq_profiles", userId), { username });
}

// ── Attempts ──────────────────────────────────────────────────────────────────

export async function saveAttempt({
  userId, itemId, scorePct, xpEarned, correct, total, qualified, badges,
}: {
  userId: string; itemId: string; scorePct: number; xpEarned: number;
  correct: number; total: number; qualified: boolean; badges: string[];
}) {
  await addDoc(collection(getFirebaseDb(), "memoriq_attempts"), {
    user_id: userId, item_id: itemId, score_pct: scorePct, xp_earned: xpEarned,
    correct, total, qualified, badges, created_at: serverTimestamp(),
  });
  const profile = await ensureProfile(userId);
  const mergedBadges = Array.from(new Set([...profile.badges, ...badges]));
  await updateDoc(doc(getFirebaseDb(), "memoriq_profiles", userId), {
    total_xp: profile.total_xp + xpEarned,
    badges: mergedBadges,
    challenges_completed: profile.challenges_completed + 1,
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export type LeaderboardRow = {
  user_id: string; username: string; best_xp: number;
  best_score: number; qualified: boolean; attempts: number;
};

export async function getLeaderboard(itemId: string): Promise<LeaderboardRow[]> {
  try {
    const snap = await getDocs(query(
      collection(getFirebaseDb(), "memoriq_attempts"),
      where("item_id", "==", itemId),
      orderBy("xp_earned", "desc"),
      limit(100)
    ));
    const byUser = new Map<string, LeaderboardRow>();
    for (const d of snap.docs) {
      const data = d.data();
      const existing = byUser.get(data.user_id);
      if (!existing || data.xp_earned > existing.best_xp) {
        byUser.set(data.user_id, {
          user_id: data.user_id, username: "Anonymous",
          best_xp: data.xp_earned, best_score: data.score_pct,
          qualified: data.qualified, attempts: (existing?.attempts ?? 0) + 1,
        });
      } else { existing.attempts += 1; }
    }
    const rows = Array.from(byUser.values()).sort((a, b) => b.best_xp - a.best_xp).slice(0, 20);
    await Promise.all(rows.map(async (row) => {
      const prof = await getProfile(row.user_id);
      if (prof?.username) row.username = prof.username;
    }));
    return rows;
  } catch { return []; }
}
