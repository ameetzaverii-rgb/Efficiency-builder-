export type ChallengeQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  points: number;
  timeLimit: number; // seconds
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  type: "quiz" | "speed" | "streak";
  questions: ChallengeQuestion[];
  minScoreToQualify: number; // percentage
};

export type MemorabiliaItem = {
  id: string;
  title: string;
  celebrity: string;
  category: "cricket" | "football" | "film" | "music" | "tennis";
  description: string;
  story: string;
  image: string; // emoji placeholder until real images
  rarity: "legendary" | "epic" | "rare";
  estimatedValue: string;
  totalSpots: number;
  spotsUsed: number;
  endsAt: string; // ISO date
  challenge: Challenge;
  winnersCount: number;
  xpReward: number;
  tags: string[];
};

export const ITEMS: MemorabiliaItem[] = [
  {
    id: "sachin-pads",
    title: "Match-Worn Test Pads",
    celebrity: "Sachin Tendulkar",
    category: "cricket",
    description:
      "The actual pads worn by Sachin Tendulkar in his final Test match at Wankhede Stadium, Mumbai, November 2013.",
    story:
      "These pads witnessed the final chapter of the greatest cricket career ever played. 200 Tests, 15,921 runs, 51 centuries — all culminating in Mumbai's emotional farewell. The leather still bears the clay of the Wankhede pitch.",
    image: "🏏",
    rarity: "legendary",
    estimatedValue: "$85,000",
    totalSpots: 5000,
    spotsUsed: 3847,
    endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    xpReward: 500,
    winnersCount: 1,
    tags: ["cricket", "india", "test", "retirement"],
    challenge: {
      id: "sachin-challenge",
      title: "The Tendulkar Test",
      description: "Only true fans pass this. 10 questions. 20 seconds each.",
      type: "quiz",
      minScoreToQualify: 60,
      questions: [
        {
          id: "q1",
          question: "In which year did Sachin Tendulkar make his Test debut?",
          options: ["1987", "1989", "1991", "1993"],
          correct: 1,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q2",
          question: "Against which country did Sachin score his 100th international century?",
          options: ["Australia", "Pakistan", "South Africa", "Bangladesh"],
          correct: 3,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q3",
          question: "What was Sachin's jersey number for India?",
          options: ["10", "99", "45", "1"],
          correct: 0,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q4",
          question: "Which ground hosted Sachin's final Test match?",
          options: ["Eden Gardens", "Lords", "Wankhede", "Chepauk"],
          correct: 2,
          points: 150,
          timeLimit: 15,
        },
        {
          id: "q5",
          question: "How many Test matches did Sachin play in his career?",
          options: ["180", "190", "200", "210"],
          correct: 2,
          points: 150,
          timeLimit: 15,
        },
        {
          id: "q6",
          question: "Sachin scored his first ODI century against which country?",
          options: ["England", "Australia", "Pakistan", "Sri Lanka"],
          correct: 0,
          points: 150,
          timeLimit: 20,
        },
        {
          id: "q7",
          question: "What is Sachin's highest Test score?",
          options: ["241*", "248*", "248", "217"],
          correct: 1,
          points: 200,
          timeLimit: 15,
        },
        {
          id: "q8",
          question: "In which city was Sachin Tendulkar born?",
          options: ["Pune", "Delhi", "Mumbai", "Nagpur"],
          correct: 2,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q9",
          question: "Which bowler dismissed Sachin most often in Tests?",
          options: ["Shane Warne", "Glenn McGrath", "Muttiah Muralitharan", "Wasim Akram"],
          correct: 1,
          points: 200,
          timeLimit: 15,
        },
        {
          id: "q10",
          question: "Sachin's famous 'Desert Storm' innings was played in which city?",
          options: ["Dubai", "Abu Dhabi", "Sharjah", "Riyadh"],
          correct: 2,
          points: 200,
          timeLimit: 15,
        },
      ],
    },
  },
  {
    id: "world-cup-ball",
    title: "2022 World Cup Final Match Ball",
    celebrity: "FIFA World Cup",
    category: "football",
    description:
      "The official Adidas Al Rihla match ball used in the Argentina vs France World Cup Final, Qatar 2022 — the greatest final ever played.",
    story:
      "This ball was in play during Mbappé's hat-trick, Messi's crowning moment, and the most dramatic penalty shootout in World Cup history. 88,966 fans. One ball. One night that changed football forever.",
    image: "⚽",
    rarity: "legendary",
    estimatedValue: "$120,000",
    totalSpots: 8000,
    spotsUsed: 6201,
    endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    xpReward: 600,
    winnersCount: 1,
    tags: ["football", "worldcup", "argentina", "france", "qatar"],
    challenge: {
      id: "worldcup-challenge",
      title: "The Final Whistle",
      description: "Relive the greatest final. 10 questions. Speed matters.",
      type: "speed",
      minScoreToQualify: 60,
      questions: [
        {
          id: "q1",
          question: "What was the score after 90 minutes in the 2022 World Cup Final?",
          options: ["2-2", "3-2", "2-1", "3-3"],
          correct: 0,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q2",
          question: "Who scored France's third goal to make it 3-3?",
          options: ["Giroud", "Mbappé", "Griezmann", "Dembélé"],
          correct: 1,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q3",
          question: "Who saved the decisive penalty in the shootout?",
          options: ["Lloris", "Martínez", "De Paul", "Dibu"],
          correct: 1,
          points: 150,
          timeLimit: 15,
        },
        {
          id: "q4",
          question: "How many goals did Mbappé score in the 2022 final?",
          options: ["2", "3", "1", "4"],
          correct: 1,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q5",
          question: "Which stadium hosted the 2022 World Cup Final?",
          options: ["Al Bayt", "Lusail", "Ahmad Bin Ali", "Education City"],
          correct: 1,
          points: 150,
          timeLimit: 20,
        },
        {
          id: "q6",
          question: "How many World Cup finals had Argentina won before 2022?",
          options: ["1", "2", "3", "0"],
          correct: 1,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q7",
          question: "What was the final penalty shootout score?",
          options: ["4-2", "3-2", "4-3", "5-3"],
          correct: 0,
          points: 200,
          timeLimit: 15,
        },
        {
          id: "q8",
          question: "Messi's goal in the final was his __ th World Cup goal overall",
          options: ["10th", "11th", "13th", "12th"],
          correct: 3,
          points: 200,
          timeLimit: 15,
        },
        {
          id: "q9",
          question: "How many minutes did it take Mbappé to score his hat-trick goals?",
          options: ["Less than 10 mins", "Less than 5 mins", "Less than 2 mins", "Exactly 7 mins"],
          correct: 1,
          points: 200,
          timeLimit: 15,
        },
        {
          id: "q10",
          question: "Who was named Golden Ball (best player) of the 2022 World Cup?",
          options: ["Mbappé", "Messi", "Martínez", "Di María"],
          correct: 1,
          points: 150,
          timeLimit: 20,
        },
      ],
    },
  },
  {
    id: "federer-racket",
    title: "Wimbledon Final Racket",
    celebrity: "Roger Federer",
    category: "tennis",
    description:
      "The Wilson Pro Staff RF97 racket used by Roger Federer in his 8th Wimbledon final, 2017 — defeating Marin Čilić.",
    story:
      "Federer won this final without dropping a single set. This racket was strung at 26.5kg, the exact tension Roger used for grass. It still has the gut strings from that afternoon on Centre Court.",
    image: "🎾",
    rarity: "epic",
    estimatedValue: "$45,000",
    totalSpots: 3000,
    spotsUsed: 1205,
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    xpReward: 400,
    winnersCount: 1,
    tags: ["tennis", "wimbledon", "federer", "grass"],
    challenge: {
      id: "federer-challenge",
      title: "The GOAT Test",
      description: "How well do you know the greatest of all time?",
      type: "quiz",
      minScoreToQualify: 50,
      questions: [
        {
          id: "q1",
          question: "How many Grand Slam titles did Federer win in total?",
          options: ["18", "19", "20", "21"],
          correct: 2,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q2",
          question: "In which country was Roger Federer born?",
          options: ["Germany", "Austria", "Switzerland", "France"],
          correct: 2,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q3",
          question: "How many Wimbledon titles did Federer win?",
          options: ["6", "7", "8", "9"],
          correct: 2,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q4",
          question: "Which racket brand did Federer use throughout his career?",
          options: ["Head", "Babolat", "Wilson", "Prince"],
          correct: 2,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q5",
          question: "Federer's longest streak of consecutive weeks as World No. 1?",
          options: ["187", "237", "302", "237"],
          correct: 1,
          points: 200,
          timeLimit: 15,
        },
        {
          id: "q6",
          question: "Which player beat Federer in his first Wimbledon final appearance?",
          options: ["Agassi", "Sampras", "Hewitt", "Roddick"],
          correct: 1,
          points: 150,
          timeLimit: 20,
        },
        {
          id: "q7",
          question: "What is Roger Federer's middle name?",
          options: ["Karl", "Peter", "Hans", "Werner"],
          correct: 0,
          points: 200,
          timeLimit: 15,
        },
        {
          id: "q8",
          question: "Federer retired from professional tennis in which year?",
          options: ["2021", "2022", "2023", "2024"],
          correct: 1,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q9",
          question: "At which Grand Slam did Federer win his first title?",
          options: ["Australian Open", "Roland Garros", "Wimbledon", "US Open"],
          correct: 2,
          points: 100,
          timeLimit: 20,
        },
        {
          id: "q10",
          question: "Federer's famous 'Shot Heard Round The World' tweener was against which player?",
          options: ["Djokovic", "Roddick", "Nadal", "Soderling"],
          correct: 0,
          points: 200,
          timeLimit: 15,
        },
      ],
    },
  },
];

export const BADGES = [
  { id: "first-win", label: "First Blood", icon: "🩸", description: "Qualified in your first challenge" },
  { id: "speed-demon", label: "Speed Demon", icon: "⚡", description: "Answered 5 questions with >10s remaining" },
  { id: "perfect-score", label: "Perfect 10", icon: "💯", description: "Got every question right" },
  { id: "streak-3", label: "On Fire", icon: "🔥", description: "3 correct answers in a row" },
  { id: "streak-5", label: "Unstoppable", icon: "🌊", description: "5 correct answers in a row" },
  { id: "scholar", label: "Scholar", icon: "🎓", description: "Completed 3 different challenges" },
];

export function getRarityConfig(rarity: MemorabiliaItem["rarity"]) {
  switch (rarity) {
    case "legendary":
      return {
        label: "LEGENDARY",
        gradient: "from-yellow-500 via-amber-400 to-yellow-600",
        glow: "shadow-yellow-500/50",
        border: "border-yellow-500/60",
        text: "text-yellow-400",
        bg: "bg-yellow-500/10",
      };
    case "epic":
      return {
        label: "EPIC",
        gradient: "from-purple-500 via-violet-400 to-purple-600",
        glow: "shadow-purple-500/50",
        border: "border-purple-500/60",
        text: "text-purple-400",
        bg: "bg-purple-500/10",
      };
    case "rare":
      return {
        label: "RARE",
        gradient: "from-blue-500 via-cyan-400 to-blue-600",
        glow: "shadow-blue-500/50",
        border: "border-blue-500/60",
        text: "text-blue-400",
        bg: "bg-blue-500/10",
      };
  }
}

export function getTimeRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    total: diff,
  };
}
