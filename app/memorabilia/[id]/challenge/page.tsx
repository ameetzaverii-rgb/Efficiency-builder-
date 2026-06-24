"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ITEMS, BADGES, getRarityConfig } from "@/lib/memorabilia-data";
import { auth } from "@/lib/firebase";
import { saveAttempt } from "@/lib/memoriq-auth";
import AuthModal from "@/components/memoriq/AuthModal";
import Leaderboard from "@/components/memoriq/Leaderboard";

type Phase = "intro" | "question" | "final";
type QResult = { correct: boolean; timeLeft: number; pointsEarned: number; streak: number };

const RARITY_GLOW: Record<string, string> = {
  legendary: "#F5A623",
  epic: "#A78BFA",
  rare: "#60A5FA",
};

export default function ChallengePage() {
  const { id } = useParams();
  const router = useRouter();
  const item = ITEMS.find(i => i.id === id);

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<QResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [xpPop, setXpPop] = useState<{ val: number; key: number } | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUserId(auth.currentUser?.uid ?? null);
  }, []);

  const r = item ? getRarityConfig(item.rarity) : null;
  const question = item?.challenge.questions[currentQ];

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const handleAnswer = useCallback((optIdx: number | null) => {
    if (!question || answered) return;
    clearTimer();
    setAnswered(true);
    setSelected(optIdx);

    const isCorrect = optIdx === question.correct;
    const newStreak = isCorrect ? streak + 1 : 0;
    const mult = isCorrect ? Math.min(newStreak, 3) : 1;
    const timeBonus = optIdx !== null ? Math.floor(timeLeft * 5) : 0;
    const earned = isCorrect ? question.points * mult + timeBonus : 0;

    setStreak(newStreak);
    if (earned > 0) {
      setTotalXP(p => p + earned);
      setXpPop({ val: earned, key: Date.now() });
      setTimeout(() => setXpPop(null), 1400);
    }

    const result: QResult = { correct: isCorrect, timeLeft, pointsEarned: earned, streak: newStreak };
    const newResults = [...results, result];
    setResults(newResults);

    const badges = [...earnedBadges];
    if (newResults.length === 1 && isCorrect && !badges.includes("first-win")) badges.push("first-win");
    if (newStreak === 3 && !badges.includes("streak-3")) badges.push("streak-3");
    if (newStreak === 5 && !badges.includes("streak-5")) badges.push("streak-5");
    if (timeLeft > 10 && isCorrect && !badges.includes("speed-demon")) badges.push("speed-demon");
    setEarnedBadges(badges);

    setTimeout(() => {
      if (currentQ + 1 < (item?.challenge.questions.length ?? 0)) {
        setCurrentQ(p => p + 1);
        setSelected(null);
        setAnswered(false);
        setPhase("question");
      } else {
        setPhase("final");
      }
    }, 1100);
  }, [question, answered, streak, timeLeft, results, earnedBadges, item, currentQ]);

  useEffect(() => {
    if (phase !== "question" || answered || !question) return;
    setTimeLeft(question.timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearTimer(); handleAnswer(null); return 0; }
        return p - 1;
      });
    }, 1000);
    return clearTimer;
  }, [currentQ, phase]);

  if (!item || !r) return null;

  const accentColor = RARITY_GLOW[item.rarity];
  const totalQ = item.challenge.questions.length;
  const correctCount = results.filter(r => r.correct).length;
  const scorePct = results.length ? Math.round((correctCount / results.length) * 100) : 0;
  const qualified = results.length === totalQ && scorePct >= item.challenge.minScoreToQualify;

  // Save on final
  if (phase === "final" && !saved && userId) {
    setSaved(true);
    saveAttempt({ userId, itemId: item.id, scorePct, xpEarned: totalXP, correct: correctCount, total: totalQ, qualified, badges: earnedBadges });
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        {/* Item preview */}
        <div className="text-center">
          <div className="text-8xl mb-4 animate-float inline-block">{item.image}</div>
          <p className={`text-xs font-black tracking-widest uppercase ${r.text} mb-1`}>{r.label} CHALLENGE</p>
          <h1 className="text-3xl font-black text-white">{item.challenge.title}</h1>
          <p className="text-white/35 mt-2 text-sm leading-relaxed">{item.challenge.description}</p>
        </div>

        {/* Rules */}
        <div className="rounded-2xl p-5 border border-white/[0.06] space-y-3" style={{ background: "#0E0E14" }}>
          {[
            { icon: "📝", text: `${totalQ} questions, themed around ${item.celebrity}` },
            { icon: "⏱", text: "15–20 seconds per question" },
            { icon: "🔥", text: "Streak multipliers boost your score" },
            { icon: "🎯", text: `Hit ${item.challenge.minScoreToQualify}%+ to enter the draw` },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-white/50">
              <span className="text-base w-5 text-center">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button onClick={() => setPhase("question")}
            className="w-full py-4 rounded-xl font-black text-black text-lg tracking-wide transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, #FFD07A, #F5A623, #C17D0E)` }}>
            BEGIN →
          </button>
          <button onClick={() => router.push(`/memorabilia/${item.id}`)}
            className="w-full py-3 text-white/25 text-sm hover:text-white/50 transition-colors">
            ← Back to item
          </button>
        </div>
      </div>
    </div>
  );

  // ── FINAL ────────────────────────────────────────────────────────────────
  if (phase === "final") return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--bg)" }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} redirectMessage="Sign in to save your score and appear on the leaderboard." />}

      <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
        {/* Result hero */}
        <div className="text-center py-8 rounded-2xl border border-white/[0.06]"
          style={{
            background: qualified
              ? `radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.12) 0%, #0E0E14 60%)`
              : "#0E0E14"
          }}>
          <div className="text-6xl mb-3">{qualified ? "🏆" : "😔"}</div>
          <h1 className="text-3xl font-black text-white mb-1">
            {qualified ? "You Qualified!" : "Not Quite"}
          </h1>
          <p className="text-white/35 text-sm">
            {qualified
              ? "You're in the draw. Winner announced when challenge closes."
              : `Need ${item.challenge.minScoreToQualify}% to qualify. You got ${scorePct}%.`}
          </p>
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Score", value: `${scorePct}%`, color: qualified ? "text-amber-400" : "text-red-400" },
            { label: "Correct", value: `${correctCount}/${totalQ}`, color: "text-white" },
            { label: "XP Earned", value: `⚡${totalXP}`, color: "text-amber-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center rounded-xl py-4 border border-white/[0.06]" style={{ background: "#0E0E14" }}>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-white/25 text-[10px] mt-1 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Answer breakdown */}
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: "#0E0E14" }}>
          <div className="px-5 py-3 border-b border-white/[0.04]">
            <p className="text-[10px] font-bold tracking-widest text-white/25 uppercase">Breakdown</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {results.map((res, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${res.correct ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {res.correct ? "✓" : "✗"}
                  </span>
                  <span className="text-white/40 text-sm truncate max-w-[200px]">Q{i + 1}</span>
                </div>
                <span className={`text-sm font-bold ${res.correct ? "text-emerald-400" : "text-white/20"}`}>
                  {res.correct ? `+${res.pointsEarned}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-widest text-white/25 uppercase mb-3">Badges Earned</p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map(bid => {
                const badge = BADGES.find(b => b.id === bid);
                if (!badge) return null;
                return (
                  <div key={bid} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm">
                    <span>{badge.icon}</span>
                    <span className="text-white/60 font-semibold text-xs">{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sign in nudge */}
        {!userId && (
          <button onClick={() => setShowAuth(true)}
            className="w-full py-3 rounded-xl border border-white/[0.08] text-white/40 text-sm hover:text-white/70 hover:border-white/20 transition-all">
            🔐 Sign in to save your score & leaderboard rank
          </button>
        )}

        {/* Leaderboard */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-white/25 uppercase mb-3">Leaderboard</p>
          <Leaderboard itemId={item.id} currentUserId={userId ?? undefined} rarityText={r.text} rarityBorder={r.border} />
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {qualified ? (
            <div className="w-full py-4 rounded-xl text-center font-black text-lg"
              style={{ background: "linear-gradient(135deg, #FFD07A, #F5A623, #C17D0E)", color: "#000" }}>
              🎉 YOU'RE IN THE DRAW
            </div>
          ) : (
            <button onClick={() => {
              setPhase("intro"); setCurrentQ(0); setResults([]); setStreak(0);
              setTotalXP(0); setEarnedBadges([]); setAnswered(false); setSelected(null); setSaved(false);
            }}
              className="w-full py-4 rounded-xl font-black text-black text-base hover:opacity-90 hover:scale-[1.01] transition-all"
              style={{ background: "linear-gradient(135deg, #FFD07A, #F5A623, #C17D0E)" }}>
              TRY AGAIN →
            </button>
          )}
          <button onClick={() => router.push("/memorabilia")}
            className="w-full py-3 text-white/25 text-sm hover:text-white/50 transition-colors">
            Browse more items →
          </button>
        </div>
      </div>
    </div>
  );

  // ── QUESTION ──────────────────────────────────────────────────────────────
  if (!question) return null;
  const timerPct = (timeLeft / question.timeLimit) * 100;
  const urgent = timerPct <= 30;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* XP popup */}
      {xpPop && (
        <div key={xpPop.key}
          className="fixed top-20 right-5 z-50 pointer-events-none animate-xp-pop font-black text-xl px-4 py-2 rounded-full"
          style={{ background: "#F5A623", color: "#000" }}>
          +{xpPop.val} XP
        </div>
      )}

      {/* Top bar */}
      <div className="border-b border-white/[0.05] px-4 py-3" style={{ background: "rgba(6,6,8,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: totalQ }).map((_, i) => {
              const done = i < results.length;
              const cur = i === currentQ;
              const ok = done ? results[i].correct : null;
              return (
                <div key={i} className={`rounded-full transition-all duration-300 ${
                  cur ? "w-5 h-2 bg-white" :
                  done ? ok ? "w-2 h-2 bg-emerald-400" : "w-2 h-2 bg-red-400" :
                  "w-2 h-2 bg-white/10"
                }`} />
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Streak */}
            {streak >= 2 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                <span className="text-orange-400 text-xs font-black">🔥 ×{streak}</span>
              </div>
            )}
            {/* XP */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 text-xs font-black">⚡ {totalXP}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-[3px]" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${timerPct}%`,
            background: urgent ? "#F87171" : accentColor,
          }} />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">

          {/* Timer + question number */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Question {currentQ + 1} of {totalQ}</p>
              <p className="text-xs text-white/30">{question.points} pts base · ×{Math.min(streak + 1, 3)} streak</p>
            </div>
            <div className={`text-4xl font-mono font-black tabular-nums transition-colors ${urgent ? "text-red-400" : "text-white/20"}`}
              style={!urgent ? { color: accentColor } : {}}>
              {String(timeLeft).padStart(2, "0")}
            </div>
          </div>

          {/* Question text */}
          <div className="rounded-2xl p-6 border border-white/[0.06]" style={{ background: "#0E0E14" }}>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">{question.question}</h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((opt, i) => {
              let bg = "#0E0E14";
              let border = "border-white/[0.07]";
              let text = "text-white/70";
              let icon = String.fromCharCode(65 + i);
              let iconBg = "bg-white/[0.06] text-white/30";

              if (answered) {
                if (i === question.correct) {
                  bg = "rgba(16,185,129,0.08)";
                  border = "border-emerald-500/40";
                  text = "text-emerald-300";
                  icon = "✓";
                  iconBg = "bg-emerald-500 text-white";
                } else if (i === selected) {
                  bg = "rgba(239,68,68,0.08)";
                  border = "border-red-500/40";
                  text = "text-red-300";
                  icon = "✗";
                  iconBg = "bg-red-500 text-white";
                }
              }

              return (
                <button key={i} disabled={answered} onClick={() => handleAnswer(i)}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${border} text-left transition-all duration-200 ${!answered ? "hover:border-white/20 hover:bg-white/[0.04] active:scale-[0.98] cursor-pointer" : "cursor-default"}`}
                  style={{ background: bg }}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all ${iconBg}`}>
                    {icon}
                  </span>
                  <span className={`font-semibold text-sm leading-snug transition-colors ${text}`}>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Answer feedback */}
          {answered && (
            <div className="text-center animate-slide-up">
              {selected === question.correct ? (
                <p className="text-emerald-400 font-black text-lg">
                  {streak > 1 ? `🔥 CORRECT! ×${streak} STREAK!` : "✅ CORRECT!"}
                </p>
              ) : selected === null ? (
                <p className="text-white/30 font-bold">⏰ Time's up</p>
              ) : (
                <p className="text-red-400 font-black">✗ Wrong — answer was {question.options[question.correct]}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
