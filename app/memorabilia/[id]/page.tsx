"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ITEMS, getRarityConfig, getTimeRemaining } from "@/lib/memorabilia-data";

function Countdown({ endsAt }: { endsAt: string }) {
  const [t, setT] = useState(getTimeRemaining(endsAt));
  useEffect(() => {
    const id = setInterval(() => setT(getTimeRemaining(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex gap-3">
      {[{ v: t.days, l: "Days" }, { v: t.hours, l: "Hrs" }, { v: t.minutes, l: "Min" }, { v: t.seconds, l: "Sec" }].map(({ v, l }) => (
        <div key={l} className="flex-1 text-center">
          <div className="rounded-xl py-3 font-mono font-black text-2xl text-white"
            style={{ background: "#16161F" }}>
            {p(v)}
          </div>
          <div className="text-[10px] text-white/25 mt-1.5 tracking-wider">{l}</div>
        </div>
      ))}
    </div>
  );
}

const RARITY_GLOW: Record<string, string> = {
  legendary: "rgba(245,166,35,0.2)",
  epic: "rgba(167,139,250,0.2)",
  rare: "rgba(96,165,250,0.2)",
};

export default function ItemDetail() {
  const { id } = useParams();
  const router = useRouter();
  const item = ITEMS.find(i => i.id === id);

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center space-y-4">
          <div className="text-6xl">🔍</div>
          <p className="text-white/40">Item not found</p>
          <Link href="/memorabilia" className="text-amber-400 text-sm underline">Back to vault</Link>
        </div>
      </div>
    );
  }

  const r = getRarityConfig(item.rarity);
  const fill = Math.min((item.spotsUsed / item.totalSpots) * 100, 100);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.05]"
        style={{ background: "rgba(6,6,8,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/memorabilia" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-sm font-medium">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Vault
          </Link>
          <span className="text-white/10">/</span>
          <span className={`text-xs font-bold tracking-wider ${r.text}`}>{r.label}</span>
          <span className="text-white/10">/</span>
          <span className="text-white/50 text-sm truncate">{item.title}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

          {/* LEFT */}
          <div className="space-y-6">

            {/* Hero image card */}
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.07]"
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${RARITY_GLOW[item.rarity]} 0%, #0E0E14 60%)`,
                boxShadow: `0 40px 80px ${RARITY_GLOW[item.rarity]}`
              }}>
              <div className={`h-[2px] bg-gradient-to-r ${r.gradient}`} />
              <div className="flex items-center justify-center py-16">
                <span className="text-[130px] animate-float select-none drop-shadow-2xl">{item.image}</span>
              </div>
              <div className="absolute top-5 left-5">
                <span className={`text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg ${r.bg} ${r.text} border ${r.border}`}>
                  {r.label}
                </span>
              </div>
            </div>

            {/* Title block */}
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/30 uppercase mb-2">{item.celebrity}</p>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight text-white mb-4">{item.title}</h1>
              <p className="text-white/45 leading-relaxed">{item.description}</p>
            </div>

            {/* Story */}
            <div className="rounded-2xl p-6 border border-white/[0.06]" style={{ background: "#0E0E14" }}>
              <p className="text-[11px] font-bold tracking-widest text-white/25 uppercase mb-3">The Story</p>
              <p className="text-white/60 leading-relaxed italic text-[15px]">"{item.story}"</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full border border-white/[0.06] text-white/25">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Authentication */}
            <div className="rounded-2xl p-6 border border-white/[0.06]" style={{ background: "#0E0E14" }}>
              <p className="text-[11px] font-bold tracking-widest text-white/25 uppercase mb-4">Authentication</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "🔐", label: "Certificate of Authenticity" },
                  { icon: "🔬", label: "Third-party verified" },
                  { icon: "📸", label: "Full provenance record" },
                  { icon: "🚚", label: "Insured worldwide shipping" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3 text-sm text-white/40">
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — sticky panel */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">

            {/* Value stats */}
            <div className="rounded-2xl p-5 border border-white/[0.06]" style={{ background: "#0E0E14" }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Est. Value", value: item.estimatedValue, color: r.text },
                  { label: "XP Reward", value: `⚡ ${item.xpReward}`, color: "text-amber-400" },
                  { label: "Winners", value: `${item.winnersCount}`, color: "text-white" },
                  { label: "Questions", value: `${item.challenge.questions.length}`, color: "text-white" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-xl font-black ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Countdown */}
            <div className="rounded-2xl p-5 border border-white/[0.06]" style={{ background: "#0E0E14" }}>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-3">Challenge Closes In</p>
              <Countdown endsAt={item.endsAt} />
            </div>

            {/* Spots */}
            <div className="rounded-2xl p-5 border border-white/[0.06]" style={{ background: "#0E0E14" }}>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] text-white/25 uppercase tracking-wider">Entries</p>
                <p className="text-xs font-bold text-white/50">{item.spotsUsed.toLocaleString()} / {item.totalSpots.toLocaleString()}</p>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all ${fill > 75 ? "bg-red-400" : "bg-emerald-400"}`}
                  style={{ width: `${fill}%` }} />
              </div>
              <p className={`text-xs font-semibold ${fill > 75 ? "text-red-400" : "text-emerald-400"}`}>
                {(item.totalSpots - item.spotsUsed).toLocaleString()} spots remaining
              </p>
            </div>

            {/* Challenge info */}
            <div className={`rounded-2xl p-5 border ${r.border}`}
              style={{ background: `linear-gradient(135deg, #0E0E14 0%, #12121A 100%)` }}>
              <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">The Challenge</p>
              <h3 className={`text-lg font-black mb-2 ${r.text}`}>{item.challenge.title}</h3>
              <p className="text-white/35 text-sm mb-4 leading-relaxed">{item.challenge.description}</p>
              <div className="space-y-2">
                {[
                  { icon: "📝", text: `${item.challenge.questions.length} questions` },
                  { icon: "⏱", text: "15–20 seconds each" },
                  { icon: "🎯", text: `Score ≥${item.challenge.minScoreToQualify}% to qualify` },
                  { icon: "🏆", text: "Qualifiers enter the draw" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm text-white/40">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push(`/memorabilia/${item.id}/challenge`)}
              className={`w-full py-4 rounded-xl font-black text-base text-black tracking-wide transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]`}
              style={{ background: `linear-gradient(135deg, #FFD07A, #F5A623, #C17D0E)` }}
            >
              START CHALLENGE →
            </button>
            <p className="text-white/15 text-[11px] text-center">Free to enter · Skill-based · Equal draw</p>
          </div>
        </div>
      </div>
    </div>
  );
}
