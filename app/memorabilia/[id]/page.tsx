"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
    <div className="flex gap-3">
      {[
        { v: time.days, l: "Days" },
        { v: time.hours, l: "Hours" },
        { v: time.minutes, l: "Mins" },
        { v: time.seconds, l: "Secs" },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <div className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 min-w-[52px] text-center">
            <span className="text-white font-mono font-black text-2xl">{pad(v)}</span>
          </div>
          <span className="text-white/30 text-[10px] mt-1">{l}</span>
        </div>
      ))}
    </div>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const router = useRouter();
  const item = ITEMS.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-white/40">Item not found</p>
          <Link href="/memorabilia" className="text-yellow-400 underline mt-4 block">Back to all items</Link>
        </div>
      </div>
    );
  }

  const rarity = getRarityConfig(item.rarity);
  const fillPct = Math.min((item.spotsUsed / item.totalSpots) * 100, 100);
  const spotsLeft = item.totalSpots - item.spotsUsed;

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Nav */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/memorabilia" className="text-white/40 hover:text-white transition-colors text-sm">
            ← Back
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/60 text-sm">{item.celebrity}</span>
          <span className="text-white/20">/</span>
          <span className="text-white text-sm font-semibold">{item.title}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: Item details */}
          <div className="lg:col-span-3 space-y-8">
            {/* Item card */}
            <div className={`relative rounded-3xl overflow-hidden border ${rarity.border}`}>
              <div className={`h-1 bg-gradient-to-r ${rarity.gradient}`} />
              <div className={`h-72 flex items-center justify-center ${rarity.bg} relative`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${rarity.gradient} opacity-5`} />
                <span className="text-[120px] filter drop-shadow-2xl">{item.image}</span>
                <div className={`absolute top-4 left-4 ${rarity.bg} ${rarity.border} border rounded-full px-3 py-1`}>
                  <span className={`text-xs font-black tracking-widest ${rarity.text}`}>{rarity.label}</span>
                </div>
              </div>
            </div>

            {/* Story */}
            <div className="space-y-4">
              <div>
                <p className={`text-xs font-black tracking-widest uppercase ${rarity.text} mb-1`}>
                  {item.celebrity}
                </p>
                <h1 className="text-4xl font-black leading-tight">{item.title}</h1>
              </div>
              <p className="text-white/50 text-base leading-relaxed">{item.description}</p>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-2">The Story</p>
                <p className="text-white/70 text-sm leading-relaxed italic">"{item.story}"</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-white/40"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Authentication */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">Authentication</p>
              <div className="space-y-2">
                {[
                  { icon: "🔐", label: "Certificate of Authenticity included" },
                  { icon: "🔬", label: "Third-party verified by specialist authenticators" },
                  { icon: "📸", label: "Provenance photographs and documentation" },
                  { icon: "🚚", label: "Insured worldwide shipping to winner" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3 text-sm text-white/50">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Challenge panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Timer */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">Challenge Closes In</p>
              <CountdownTimer endsAt={item.endsAt} />
            </div>

            {/* Value */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Est. Value</p>
                  <p className={`text-2xl font-black ${rarity.text}`}>{item.estimatedValue}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-1">XP Reward</p>
                  <p className="text-2xl font-black text-yellow-400">⚡ {item.xpReward}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Winners</p>
                  <p className="text-2xl font-black text-white">{item.winnersCount}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Questions</p>
                  <p className="text-2xl font-black text-white">{item.challenge.questions.length}</p>
                </div>
              </div>
            </div>

            {/* Spots */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-2">
                <p className="text-white/30 text-xs uppercase tracking-wider">Spots Filled</p>
                <p className="text-white font-bold text-sm">{item.spotsUsed.toLocaleString()} / {item.totalSpots.toLocaleString()}</p>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${fillPct > 75 ? "bg-red-400" : "bg-emerald-400"}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <p className={`text-xs font-semibold ${fillPct > 75 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                {spotsLeft.toLocaleString()} spots remaining
              </p>
            </div>

            {/* Challenge preview */}
            <div className={`bg-white/[0.03] border ${rarity.border} rounded-2xl p-5`}>
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">The Challenge</p>
              <h3 className={`text-lg font-black mb-1 ${rarity.text}`}>{item.challenge.title}</h3>
              <p className="text-white/40 text-sm mb-4">{item.challenge.description}</p>
              <div className="space-y-2">
                {[
                  { icon: "📝", label: `${item.challenge.questions.length} questions` },
                  { icon: "⏱", label: "15–20 seconds per question" },
                  { icon: "🎯", label: `Score ≥${item.challenge.minScoreToQualify}% to qualify` },
                  { icon: "🏆", label: "Qualifier enters draw — winner announced live" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-white/50">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push(`/memorabilia/${item.id}/challenge`)}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${rarity.gradient} text-black font-black text-lg tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg ${rarity.glow}`}
            >
              START CHALLENGE →
            </button>
            <p className="text-white/20 text-xs text-center">
              Free to enter · Equal draw for all qualifiers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
