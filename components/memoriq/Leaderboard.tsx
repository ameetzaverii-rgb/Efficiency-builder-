"use client";

import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/memoriq-auth";

type Row = {
  user_id: string;
  username: string;
  best_xp: number;
  best_score: number;
  qualified: boolean;
  attempts: number;
};

type Props = {
  itemId: string;
  currentUserId?: string;
  rarityText: string;
  rarityBorder: string;
};

export default function Leaderboard({ itemId, currentUserId, rarityText, rarityBorder }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(itemId).then((data) => {
      setRows(data as Row[]);
      setLoading(false);
    });
  }, [itemId]);

  const medals = ["🥇", "🥈", "🥉"];

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">
        No entries yet — be the first to qualify!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const isMe = row.user_id === currentUserId;
        return (
          <div
            key={row.user_id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              isMe
                ? `${rarityBorder} bg-white/[0.06]`
                : "border-white/5 bg-white/[0.02]"
            }`}
          >
            <span className="text-lg w-6 text-center shrink-0">
              {medals[i] ?? <span className="text-white/20 font-mono text-sm">{i + 1}</span>}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm truncate ${isMe ? "text-white" : "text-white/70"}`}>
                  {row.username}
                </span>
                {isMe && (
                  <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    YOU
                  </span>
                )}
                {row.qualified && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    ✓ IN DRAW
                  </span>
                )}
              </div>
              <p className="text-white/20 text-xs">{row.attempts} attempt{row.attempts !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-black text-sm ${rarityText}`}>⚡{row.best_xp}</p>
              <p className="text-white/30 text-xs">{row.best_score}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
