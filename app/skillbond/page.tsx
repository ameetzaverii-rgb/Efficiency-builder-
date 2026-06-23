import Link from 'next/link'

export default function SkillBondHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight">SkillBond</span>
          <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-medium">Beta</span>
        </div>
        <div className="flex gap-4 items-center text-sm">
          <Link href="/skillbond/platform/login" className="text-indigo-200 hover:text-white transition-colors">For Platforms</Link>
          <Link href="/skillbond/learner/login" className="text-indigo-200 hover:text-white transition-colors">For Learners</Link>
          <Link href="/skillbond/platform/login" className="bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded-lg font-medium transition-colors">Get Started</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
        <div className="max-w-3xl">
          <div className="inline-block bg-indigo-500/20 text-indigo-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-indigo-500/30">
            Skill demonstration that pays
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Prove your skills.<br />
            <span className="text-indigo-400">Get paid for it.</span>
          </h1>
          <p className="text-xl text-indigo-200 mb-10 leading-relaxed">
            EdTech platforms post real skill challenges with cash rewards.
            Young adults complete micro-projects, AI verifies the work,
            and payouts happen automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/skillbond/learner/signup" className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors">
              Find challenges →
            </Link>
            <Link href="/skillbond/platform/signup" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors border border-white/20">
              Post a challenge
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full text-left">
          {[
            { step: '01', title: 'Platform deposits escrow', desc: 'EdTech platform funds $5K escrow for 100 challenges at $50 each. Money held securely.' },
            { step: '02', title: 'Learner completes work', desc: 'Young adults complete micro-projects in 2–5 days and submit their work sample.' },
            { step: '03', title: 'AI grades, payout fires', desc: 'Our AI verifies against the rubric. Pass → instant payout to learner wallet.' },
          ].map(item => (
            <div key={item.step} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-indigo-400 font-mono text-sm mb-3">{item.step}</div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-indigo-200 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-3 gap-12 text-center">
          {[
            { value: '$0', label: 'Upfront cost to start' },
            { value: '15%', label: 'Take-rate on successful rewards' },
            { value: '48h', label: 'Avg time to payout' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-4xl font-bold text-indigo-300 mb-1">{stat.value}</div>
              <div className="text-sm text-indigo-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
