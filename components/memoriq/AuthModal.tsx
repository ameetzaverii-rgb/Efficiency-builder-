"use client";

import { useState } from "react";
import { signInWithEmail } from "@/lib/memoriq-auth";

type Props = {
  onClose: () => void;
  redirectMessage?: string;
};

export default function AuthModal({ onClose, redirectMessage }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#0f0f1a] border border-white/10 rounded-3xl w-full max-w-sm p-8 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white text-xl leading-none"
        >
          ×
        </button>

        {!sent ? (
          <>
            <div className="text-center space-y-2">
              <div className="text-4xl">🏆</div>
              <h2 className="text-xl font-black">Sign in to Play</h2>
              <p className="text-white/40 text-sm">
                {redirectMessage ?? "Create a free account to track your XP, badges, and draw entries."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none focus:border-yellow-500/60 transition-colors"
                autoFocus
                required
              />
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-base hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send Magic Link →"}
              </button>
            </form>

            <p className="text-white/20 text-xs text-center">
              No password needed · Check your email after submitting
            </p>
          </>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">📬</div>
            <h2 className="text-xl font-black">Check your email</h2>
            <p className="text-white/40 text-sm">
              We sent a magic link to <span className="text-white font-semibold">{email}</span>.
              Click it to sign in and your XP will be saved.
            </p>
            <button
              onClick={onClose}
              className="text-white/30 text-sm hover:text-white/60 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
