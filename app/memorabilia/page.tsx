"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ITEMS, getRarityConfig, getTimeRemaining, type MemorabiliaItem } from "@/lib/memorabilia-data";
import UserBar from "@/components/memoriq/UserBar";

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
    </span>
  );
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [t, setT] = useState(getTimeRemaining(endsAt));
  useEffect(() => {
    const id = setInterval(() => setT(getTimeRemaining(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const p = (n: number) => String(n).padStart(2, "0");
  const urgent = t.days === 0 && t.hours < 6;
  return (
    <div className={`flex items-center gap-1 font-mono text-xs font-bold tracking-wider ${urgent ? "text-red-400" : "text-white/50"}`}>
      {t.days > 0 && <span>{t.days}d </span>}
      <span>{p(t.hours)}:{p(t.minutes)}:{p(t.seconds)}</span>
    </div>
  );
}

const RARITY_GLOW: Record<string, string> = {
  legendary: "rgba(245,166,35,0.15)",
  epic: "rgba(167,139,250,0.15)",
  rare: "rgba(96,165,250,0.15)",
};

const CATEGORY_LABEL: Record<string, string> = {
  cricket: "Cricket",
  football: "Football",
  tennis: "Tennis",
  film: "Film",
  music: "Music",
};

function ItemCard({ item }: { item: MemorabiliaItem }) {
  const r = getRarityConfig(item.rarity);
  const fill = Math.min((item.spotsUsed / item.totalSpots) * 100, 100);
  const spotsLeft = item.totalSpots - item.spotsUsed;
  const urgent = fill > 75;

  return (
    <Link href={`/memorabilia/${item.id}`} className="group block">
      <div
        className="relative rounded-2xl overflow-hidden border border-white/[0.07] transition-all duration-500 hover:border-white/20 hover:-translate-y-1"
        style={{
          background: `linear-gradient(160deg, #0E0E14 0%, #12121A 100%)`,
          boxShadow: `0 0 0 0 ${RARITY_GLOW[item.rarity]}`,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${RARITY_GLOW[item.rarity]}, 0 0 0 1px rgba(255,255,255,0.1)`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${RARITY_GLOW[item.rarity]}`;
        }}
      >
        {/* Rarity bar */}
        <div className={`h-[2px] w-full bg-gradient-to-r ${r.gradient}`} />

        {/* Visual area */}
        <div className="relative h-52 flex items-center justify-center overflow-hidden"
          style={{ background: `radial-gradient(ellipse at center, ${RARITY_GLOW[item.rarity]} 0%, transparent 70%)` }}
        >
          <span className="text-[90px] animate-float select-none">{item.image}</span>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-lg ${r.bg} ${r.text} border ${r.border}`}>
              {r.label}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="text-[10px] text-white/40 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/[0.06]">
              {CATEGORY_LABEL[item.category]}
            </span>
          </div>

          {/* Est value */}
          <div className="absolute bottom-3 left-3">
            <p className="text-[10px] text-white/30 mb-0.5">Est. Value</p>
            <p className={`text-sm font-black ${r.text}`}>{item.estimatedValue}</p>
          </div>
          <div className="absolute bottom-3 right-3 text-right">
            <p className="text-[10px] text-white/30 mb-0.5">XP Reward</p>
            <p className="text-sm font-black text-amber-400">⚡ {item.xpReward}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-white/30 uppercase mb-1">{item.celebrity}</p>
            <h3 className="text-[17px] font-black leading-snug text-white">{item.title}</h3>
          </div>

          {/* Spots progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className={`text-[11px] font-semibold ${urgent ? "text-red-400" : "text-white/30"}`}>
                {urgent ? `⚠ Only ${(100 - fill).toFixed(0)}% spots left` : `${item.spotsUsed.toLocaleString()} participants`}
              </span>
              <Countdown endsAt={item.endsAt} />
            </div>
            <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${urgent ? "bg-red-400" : "bg-emerald-400"}`}
                style={{ width: `${fill}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className={`w-full py-3 rounded-xl bg-gradient-to-r ${r.gradient} text-black font-black text-sm text-center tracking-wide transition-all duration-200 group-hover:opacity-90 group-hover:scale-[1.01]`}>
            TAKE THE CHALLENGE
          </div>
        </div>
      </div>
    </Link>
  );
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "cricket", label: "Cricket" },
  { key: "football", label: "Football" },
  { key: "tennis", label: "Tennis" },
  { key: "film", label: "Film" },
  { key: "music", label: "Music" },
];

export default function MemorabiliaHome() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? ITEMS : ITEMS.filter(i => i.category === filter);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.05]"
        style={{ background: "rgba(6,6,8,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/memorabilia" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-sm"
              style={{ background: "linear-gradient(135deg, #FFD07A, #F5A623)" }}>
              M
            </div>
            <div className="leading-none">
              <div className="font-black text-base tracking-tight">MEMORIQ</div>
              <div className="text-[9px] tracking-[0.2em] text-white/20 font-medium">WIN WHAT MATTERS</div>
            </div>
          </Link>
          <UserBar />
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #F5A623 0%, transparent 70%)", filter: "blur(40px)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8">
            <LiveDot />
            <span className="text-emerald-400 text-xs font-semibold tracking-wider">3 LIVE CHALLENGES</span>
          </div>

          <h1 className="text-[clamp(40px,8vw,80px)] font-black leading-[0.92] tracking-tight mb-6">
            Own a Piece<br />
            <span className="gold-text">of Legend</span>
          </h1>

          <p className="text-white/40 text-lg max-w-lg mx-auto leading-relaxed">
            Test your knowledge. Beat the clock. Win authenticated memorabilia
            from the greatest moments in sport and culture.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-12">
            {[
              { v: "11,253", l: "Challengers" },
              { v: "3", l: "Live Items" },
              { v: "$250K+", l: "In Play" },
            ].map(({ v, l }) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-black text-white">{v}</div>
                <div className="text-white/25 text-xs mt-0.5 tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                filter === f.key
                  ? "bg-white text-black"
                  : "bg-white/[0.05] text-white/40 hover:bg-white/[0.08] hover:text-white/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(item => <ItemCard key={item.id} item={item} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-white/20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-semibold">No items in this category yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] py-8 text-center">
        <p className="text-white/15 text-xs tracking-wider">
          All items authenticated by third-party specialists · Skill-based competition · Free to enter
        </p>
      </div>
    </div>
  );
}
