"use client";

import { useEffect, useState } from "react";
import { getSession, getProfile, signOut, type Profile } from "@/lib/memoriq-auth";
import AuthModal from "./AuthModal";

export default function UserBar() {
  const [user, setUser] = useState<{ $id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    getSession().then((u) => {
      if (u) {
        setUser({ $id: u.$id, email: u.email });
        getProfile(u.$id).then(setProfile);
      }
    });
  }, []);

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuth(true)}
          className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/60 hover:text-white hover:border-white/30 transition-all"
        >
          Sign In
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  return (
    <div className="relative flex items-center gap-3">
      <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1.5">
        <span className="text-yellow-400 text-sm">⚡</span>
        <span className="text-white font-bold text-sm">{(profile?.total_xp ?? 0).toLocaleString()} XP</span>
      </div>

      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-black"
      >
        {(profile?.username ?? user.email)[0].toUpperCase()}
      </button>

      {showMenu && (
        <div className="absolute top-10 right-0 bg-[#0f0f1a] border border-white/10 rounded-2xl p-4 w-56 z-50 space-y-3 shadow-2xl">
          <div>
            <p className="text-white font-semibold text-sm truncate">{profile?.username ?? user.email}</p>
            <p className="text-white/30 text-xs">{profile?.challenges_completed ?? 0} challenges completed</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {(profile?.badges ?? []).slice(0, 4).map((b) => (
              <span key={b} className="bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-[10px] text-white/40">
                {b}
              </span>
            ))}
          </div>
          <button
            onClick={async () => { await signOut(); setUser(null); setProfile(null); setShowMenu(false); }}
            className="w-full text-left text-red-400/60 hover:text-red-400 text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
