"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ITEMS, getRarityConfig, getTimeRemaining } from "@/lib/memorabilia-data";

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [time, setTime] = useState(getTimeRemaining(endsAt));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeRemaining(endsAt)), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex gap-2 items-center">
      {[
        { v: time.days, l: "D" },
        { v: time.hours, l: "H" },
        { v: time.minutes, l: "M" },
        { v: time.seconds, l: "S" },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <div className="bg-black/60 border border-white/10 rounded px-2 py-1 min-w-[36px] text-center">
            <span className="text-white font-mono font-bold text-sm">{pad(v)}</span>
          </div>
          <span className="text-white/30 text-[9px] mt-0.5">{l}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100);
  const urgent = pct > 75;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/40">
        <span>{used.toLocaleString()} entered</span>
        <span>{total.toLocaleString()} spots</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-400" : "bg-emerald-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {urgent && (
        <p className="text-red-400 text-[10px] font-semibold animate-pulse">
          ⚠ Filling fast — {Math.round(100 - pct)}% spots left
        </p>
      )}
    </div>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  cricket: "🏏",
  football: "⚽",
  tennis: "🎾",
  film: "🎬",
  music: "🎵",
};

export default function MemorabiliaHome() {
  const [filter, setFilter] = useState<string>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categories = ["all", ...Array.from(new Set(ITEMS.map((i) => i.category)))];
  const filtered = filter === "all" ? ITEMS : ITEMS.filter((i) => i.category === filter);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-black font-black text-sm">
              M
            </div>
            <div>
              <h1 className="font-black text-lg leading-none tracking-tight">MEMORIQ</h1>
              <p className="text-white/30 text-[10px] tracking-widest">WIN WHAT MATTERS</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <span className="text-yellow-400 text-sm">⚡</span>
              <span className="text-white font-bold text-sm">1,240 XP</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-bold">
              U
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-400 text-xs font-semibold tracking-wider">LIVE CHALLENGES OPEN</span>
        </div>
        <h2 className="text-5xl font-black mb-4 leading-none">
          Win{" "}
          <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
            Icons
          </span>
          <br />
          of History
        </h2>
        <p className="text-white/40 text-lg max-w-xl mx-auto">
          Prove your knowledge. Beat the clock. Own a piece of sporting legend.
          <br />
          No auctions. No luck. Pure skill.
        </p>
      </div>

      {/* Stats bar */}
      <div className="max-w-6xl mx-auto px-4 mb-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Challenges", value: "3", icon: "🔥" },
            { label: "Total Participants", value: "11,253", icon: "👥" },
            { label: "Items Won This Month", value: "7", icon: "🏆" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center"
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-white/30 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === cat
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat !== "all" && CATEGORY_ICONS[cat]}
              {cat === "all" ? "All Items" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const rarity = getRarityConfig(item.rarity);
            const isHovered = hoveredId === item.id;
            return (
              <Link
                key={item.id}
                href={`/memorabilia/${item.id}`}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative bg-white/[0.03] border ${rarity.border} rounded-3xl overflow-hidden transition-all duration-300 ${
                  isHovered ? `shadow-2xl ${rarity.glow} scale-[1.02]` : "hover:scale-[1.01]"
                }`}
              >
                {/* Rarity gradient top bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${rarity.gradient}`} />

                {/* Item visual */}
                <div
                  className={`relative h-48 flex items-center justify-center ${rarity.bg} overflow-hidden`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${rarity.gradient} opacity-5`}
                  />
                  <span className="text-8xl filter drop-shadow-lg">{item.image}</span>
                  <div
                    className={`absolute top-3 left-3 ${rarity.bg} ${rarity.border} border rounded-full px-2 py-0.5`}
                  >
                    <span className={`text-[10px] font-black tracking-widest ${rarity.text}`}>
                      {rarity.label}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 border border-white/10 rounded-full px-2 py-0.5">
                    <span className="text-[10px] text-white/60">
                      {CATEGORY_ICONS[item.category]} {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-white/40 text-xs font-semibold tracking-wider uppercase">
                      {item.celebrity}
                    </p>
                    <h3 className="text-white font-black text-xl leading-tight mt-0.5">
                      {item.title}
                    </h3>
                    <p className="text-white/30 text-sm mt-1 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-white/30 text-xs">Est. Value</p>
                      <p className={`font-black ${rarity.text}`}>{item.estimatedValue}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/30 text-xs">XP Reward</p>
                      <p className="text-yellow-400 font-black">⚡ {item.xpReward}</p>
                    </div>
                  </div>

                  <ProgressBar used={item.spotsUsed} total={item.totalSpots} />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/30 text-[10px] mb-1">ENDS IN</p>
                      <CountdownTimer endsAt={item.endsAt} />
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl bg-gradient-to-r ${rarity.gradient} text-black font-black text-sm group-hover:scale-105 transition-transform`}
                    >
                      CHALLENGE →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-white/20 text-sm">
            All items are authenticated by third-party specialists · Skill-based competition · Equal entry for all participants
          </p>
        </div>
      </div>
    </div>
  );
}
