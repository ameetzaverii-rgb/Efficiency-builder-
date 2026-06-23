import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getActiveChallenges, getLearnerByUserId } from '@/lib/skillbond/supabase-db'
import { formatCents, daysUntil } from '@/lib/skillbond/utils'
import { SKILL_VERTICALS } from '@/lib/skillbond/types'
import Link from 'next/link'

export default async function BrowseChallenges() {
  const { userId } = await auth()
  if (!userId) redirect('/skillbond/learner/login')

  const learner = await getLearnerByUserId(userId)
  if (!learner) redirect('/skillbond/learner/onboarding')

  const challenges = await getActiveChallenges()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-indigo-700 text-lg">SkillBond</span>
        <Link href="/skillbond/learner/dashboard" className="text-sm text-gray-600 hover:text-gray-800">← Dashboard</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Open challenges</h1>
          <span className="text-sm text-gray-400">{challenges.length} available</span>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No active challenges right now. Check back soon!</div>
        ) : (
          <div className="grid gap-4">
            {challenges.map(challenge => {
              const days = daysUntil(challenge.deadline)
              const vertical = SKILL_VERTICALS.find(v => v.value === challenge.skill_vertical)
              return (
                <div key={challenge.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-full">
                          {vertical?.label ?? challenge.skill_vertical}
                        </span>
                        {days <= 3 && (
                          <span className="text-xs bg-red-100 text-red-600 font-medium px-2.5 py-1 rounded-full">
                            {days}d left
                          </span>
                        )}
                      </div>
                      <h2 className="font-semibold text-gray-900 text-lg mb-1">{challenge.title}</h2>
                      <div className="text-sm text-gray-500">
                        {(challenge as { sb_platforms?: { name: string } }).sb_platforms?.name} · {days > 0 ? `${days} days remaining` : 'Deadline passed'}
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-indigo-600">{formatCents(challenge.reward_cents)}</div>
                      <div className="text-xs text-gray-400 mb-3">reward</div>
                      <Link href={`/skillbond/learner/challenges/${challenge.id}`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors block text-center">
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
