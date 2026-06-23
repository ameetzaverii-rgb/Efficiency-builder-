"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ITEMS, BADGES, getRarityConfig } from "@/lib/memorabilia-data";

type Phase = "intro" | "question" | "result" | "final";

type QuestionResult = {
  correct: boolean;
  timeLeft: number;
  pointsEarned: number;
  streak: number;
};

function XPPopup({ xp, visible }: { xp: number; visible: boolean }) {
  return (
    <div
      className={`fixed top-24 right-6 bg-yellow-400 text-black font-black px-4 py-2 rounded-full text-lg transition-all duration-500 z-50 pointer-events-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      +{xp} XP ⚡
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  const labels: Record<number, string> = {
    2: "🔥 x2",
    3: "🔥 x3 ON FIRE",
    4: "🌊 x4 UNSTOPPABLE",
    5: "⚡ x5 LEGENDARY",
  };
  const label = labels[Math.min(streak, 5)] || `⚡ x${streak} GODLIKE`;
  return (
    <div className="inline-flex items-center gap-1 bg-orange-500/20 border border-orange-500/40 rounded-full px-3 py-1 animate-bounce">
      <span className="text-orange-400 font-black text-sm">{label} STREAK</span>
    </div>
  );
}

function ProgressDots({ total, current, results }: { total: number; current: number; results: QuestionResult[] }) {
  return (
    <div className="flex gap-1.5 items-center justify-center">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < results.length;
        const isCurrent = i === current;
        const wasCorrect = isDone ? results[i].correct : null;
        return (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              isCurrent
                ? "w-6 h-2 bg-white animate-pulse"
                : isDone
                ? wasCorrect
                  ? "w-2 h-2 bg-emerald-400"
                  : "w-2 h-2 bg-red-400"
                : "w-2 h-2 bg-white/20"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function ChallengePage() {
  const { id } = useParams();
  const router = useRouter();
  const item = ITEMS.find((i) => i.id === id);

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [xpPopup, setXpPopup] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const rarity = item ? getRarityConfig(item.rarity) : null;
  const question = item?.challenge.questions[currentQ];

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const triggerXP = useCallback((xp: number) => {
    setXpPopup(xp);
    setShowXpPopup(true);
    setTimeout(() => setShowXpPopup(false), 1500);
  }, []);

  const handleAnswer = useCallback(
    (optionIndex: number | null) => {
      if (!question || answered) return;
      clearTimer();
      setAnswered(true);
      setSelected(optionIndex);

      const isCorrect = optionIndex === question.correct;
      const newStreak = isCorrect ? streak + 1 : 0;
      const streakMultiplier = isCorrect ? Math.min(newStreak, 3) : 1;
      const timeBonus = optionIndex !== null ? Math.floor(timeLeft * 5) : 0;
      const earned = isCorrect ? question.points * streakMultiplier + timeBonus : 0;

      setStreak(newStreak);
      if (earned > 0) {
        setTotalXP((prev) => prev + earned);
        triggerXP(earned);
      }

      const result: QuestionResult = {
        correct: isCorrect,
        timeLeft,
        pointsEarned: earned,
        streak: newStreak,
      };

      const newResults = [...results, result];
      setResults(newResults);

      // Badge checks
      const badges = [...earnedBadges];
      if (newResults.length === 1 && isCorrect && !badges.includes("first-win")) badges.push("first-win");
      if (newStreak === 3 && !badges.includes("streak-3")) badges.push("streak-3");
      if (newStreak === 5 && !badges.includes("streak-5")) badges.push("streak-5");
      if (timeLeft > 10 && isCorrect && !badges.includes("speed-demon")) badges.push("speed-demon");
      setEarnedBadges(badges);

      setTimeout(() => {
        if (currentQ + 1 < (item?.challenge.questions.length ?? 0)) {
          setCurrentQ((prev) => prev + 1);
          setSelected(null);
          setAnswered(false);
          setPhase("question");
        } else {
          setPhase("final");
        }
      }, 1200);
    },
    [question, answered, streak, timeLeft, results, earnedBadges, item, currentQ, triggerXP]
  );

  // Timer
  useEffect(() => {
    if (phase !== "question" || answered || !question) return;
    setTimeLeft(question.timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          handleAnswer(null); // timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [currentQ, phase]);

  if (!item || !rarity) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center text-white">
        <p>Item not found</p>
      </div>
    );
  }

  const totalPossible = item.challenge.questions.reduce((s, q) => s + q.points * 3, 0);
  const scorePct = results.length
    ? Math.round((results.filter((r) => r.correct).length / results.length) * 100)
    : 0;
  const qualified =
    results.length === item.challenge.questions.length &&
    scorePct >= item.challenge.minScoreToQualify;

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-8">
          <div>
            <span className="text-7xl">{item.image}</span>
          </div>
          <div>
            <p className={`text-xs font-black tracking-widest uppercase ${rarity.text} mb-2`}>
              {rarity.label} CHALLENGE
            </p>
            <h1 className="text-4xl font-black mb-2">{item.challenge.title}</h1>
            <p className="text-white/40">{item.challenge.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "📝", label: `${item.challenge.questions.length} Questions` },
              { icon: "⏱", label: "15–20s Per Question" },
              { icon: "🎯", label: `${item.challenge.minScoreToQualify}% to Qualify` },
              { icon: "⚡", label: `Up to ${item.xpReward} XP` },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="bg-white/[0.04] border border-white/5 rounded-xl p-3 flex items-center gap-2 text-sm text-white/60"
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setPhase("question")}
              className={`w-full py-4 rounded-2xl bg-gradient-to-r ${rarity.gradient} text-black font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-transform`}
            >
              BEGIN CHALLENGE
            </button>
            <button
              onClick={() => router.push(`/memorabilia/${item.id}`)}
              className="w-full py-3 text-white/30 text-sm hover:text-white/60 transition-colors"
            >
              ← Back to item
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FINAL ─────────────────────────────────────────────────────────────────
  if (phase === "final") {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Result header */}
          <div>
            <div className="text-7xl mb-4">{qualified ? "🏆" : "😔"}</div>
            <h1 className="text-4xl font-black mb-2">
              {qualified ? "You Qualified!" : "Better Luck Next Time"}
            </h1>
            <p className="text-white/40">
              {qualified
                ? "You're now in the draw. Winner announced when challenge closes."
                : `You needed ${item.challenge.minScoreToQualify}% to qualify. Try again!`}
            </p>
          </div>

          {/* Score card */}
          <div className={`bg-white/[0.04] border ${rarity.border} rounded-3xl p-6 space-y-4`}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Score</p>
                <p className={`text-3xl font-black ${qualified ? rarity.text : "text-red-400"}`}>
                  {scorePct}%
                </p>
              </div>
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Correct</p>
                <p className="text-3xl font-black text-white">
                  {correctCount}/{item.challenge.questions.length}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">XP Earned</p>
                <p className="text-3xl font-black text-yellow-400">⚡{totalXP}</p>
              </div>
            </div>

            {/* Answer breakdown */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{r.correct ? "✅" : "❌"}</span>
                    <span className="text-white/50 truncate max-w-[180px]">
                      Q{i + 1}: {item.challenge.questions[i].question.slice(0, 40)}…
                    </span>
                  </div>
                  <span className={`font-bold ${r.correct ? "text-emerald-400" : "text-red-400"}`}>
                    {r.correct ? `+${r.pointsEarned}` : "0"} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges earned */}
          {earnedBadges.length > 0 && (
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Badges Earned</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {earnedBadges.map((bid) => {
                  const badge = BADGES.find((b) => b.id === bid);
                  if (!badge) return null;
                  return (
                    <div
                      key={bid}
                      className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
                    >
                      <span>{badge.icon}</span>
                      <span className="text-white text-xs font-semibold">{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {qualified ? (
              <div className={`w-full py-4 rounded-2xl bg-gradient-to-r ${rarity.gradient} text-black font-black text-lg`}>
                🎉 YOU'RE IN THE DRAW
              </div>
            ) : (
              <button
                onClick={() => {
                  setPhase("intro");
                  setCurrentQ(0);
                  setResults([]);
                  setStreak(0);
                  setTotalXP(0);
                  setEarnedBadges([]);
                  setAnswered(false);
                  setSelected(null);
                }}
                className={`w-full py-4 rounded-2xl bg-gradient-to-r ${rarity.gradient} text-black font-black text-lg hover:scale-[1.02] transition-transform`}
              >
                TRY AGAIN →
              </button>
            )}
            <button
              onClick={() => router.push("/memorabilia")}
              className="w-full py-3 text-white/30 text-sm hover:text-white/60 transition-colors"
            >
              Browse More Items →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION ──────────────────────────────────────────────────────────────
  if (!question) return null;

  const timerPct = (timeLeft / question.timeLimit) * 100;
  const timerColor = timerPct > 50 ? "bg-emerald-400" : timerPct > 25 ? "bg-yellow-400" : "bg-red-400";
  const timerUrgent = timerPct <= 25;

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <XPPopup xp={xpPopup} visible={showXpPopup} />

      {/* Top bar */}
      <div className="border-b border-white/5 bg-black/40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-sm">
              Q {currentQ + 1}/{item.challenge.questions.length}
            </span>
            <ProgressDots
              total={item.challenge.questions.length}
              current={currentQ}
              results={results}
            />
          </div>
          <div className="flex items-center gap-3">
            <StreakBadge streak={streak} />
            <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
              <span className="text-yellow-400 text-sm font-black">⚡{totalXP}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-white/5">
        <div
          className={`h-full ${timerColor} transition-all duration-1000 ease-linear ${timerUrgent ? "animate-pulse" : ""}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Timer display */}
          <div className="flex items-center justify-between">
            <div className={`text-5xl font-mono font-black transition-colors ${timerUrgent ? "text-red-400 animate-pulse" : "text-white/30"}`}>
              {String(timeLeft).padStart(2, "0")}
            </div>
            <div className="text-right">
              <p className="text-white/20 text-xs uppercase tracking-wider">Points</p>
              <p className={`text-lg font-black ${rarity.text}`}>{question.points}</p>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white/[0.04] border border-white/5 rounded-3xl p-8">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-3">
              Question {currentQ + 1}
            </p>
            <h2 className="text-2xl font-black leading-snug">{question.question}</h2>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option, i) => {
              let state: "default" | "correct" | "wrong" | "missed" = "default";
              if (answered) {
                if (i === question.correct) state = "correct";
                else if (i === selected && selected !== question.correct) state = "wrong";
              }

              const stateStyles = {
                default: "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20 cursor-pointer",
                correct: "bg-emerald-500/20 border-emerald-500/60",
                wrong: "bg-red-500/20 border-red-500/60",
                missed: "bg-white/[0.04] border-white/10 opacity-40",
              };

              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => handleAnswer(i)}
                  className={`border rounded-2xl p-4 text-left transition-all duration-200 ${stateStyles[state]}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                        state === "correct"
                          ? "bg-emerald-500 text-white"
                          : state === "wrong"
                          ? "bg-red-500 text-white"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {state === "correct" ? "✓" : state === "wrong" ? "✗" : String.fromCharCode(65 + i)}
                    </div>
                    <span className={`font-semibold ${state === "correct" ? "text-emerald-300" : state === "wrong" ? "text-red-300" : "text-white"}`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {answered && (
            <div
              className={`text-center py-3 rounded-2xl font-black text-lg transition-all ${
                selected === question.correct
                  ? "text-emerald-400"
                  : selected === null
                  ? "text-white/40"
                  : "text-red-400"
              }`}
            >
              {selected === question.correct
                ? streak > 1
                  ? `🔥 CORRECT + ${streak}x STREAK!`
                  : "✅ CORRECT!"
                : selected === null
                ? "⏰ TIME'S UP!"
                : "❌ WRONG"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
