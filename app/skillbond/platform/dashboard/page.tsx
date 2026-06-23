import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChallengesByPlatform, getPlatformByUserId } from '@/lib/skillbond/supabase-db'
import { formatCents, formatDate, daysUntil } from '@/lib/skillbond/utils'
import Link from 'next/link'

export default async function PlatformDashboard() {
  const { userId } = await auth()
  if (!userId) redirect('/skillbond/platform/login')

  const platform = await getPlatformByUserId(userId)
  if (!platform) redirect('/skillbond/platform/onboarding')

  const challenges = await getChallengesByPlatform(platform.id)
  const active = challenges.filter(c => c.status === 'active')
  const totalEscrowed = challenges.reduce((sum, c) => sum + c.escrow_reserved_cents, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-indigo-700">SkillBond</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 font-medium">{platform.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/skillbond/platform/deposit" className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            + Add Escrow
          </Link>
          <Link href="/skillbond/platform/challenges/new" className="text-sm bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
            New Challenge
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Escrow Balance', value: formatCents(platform.escrow_balance_cents), sub: 'available to deploy' },
            { label: 'Escrowed in Challenges', value: formatCents(totalEscrowed), sub: 'locked' },
            { label: 'Active Challenges', value: active.length.toString(), sub: 'live now' },
            { label: 'Total Challenges', value: challenges.length.toString(), sub: 'all time' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your Challenges</h2>
            <Link href="/skillbond/platform/challenges/new" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              + New challenge
            </Link>
          </div>
          {challenges.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 mb-4">No challenges yet</p>
              <Link href="/skillbond/platform/challenges/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
                Create your first challenge
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {challenges.map(challenge => (
                <Link key={challenge.id} href={`/skillbond/platform/challenges/${challenge.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">{challenge.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {challenge.skill_vertical.replace('_', ' ')} · {formatCents(challenge.reward_cents)} reward · {daysUntil(challenge.deadline)} days left
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      challenge.status === 'active' ? 'bg-green-100 text-green-700' :
                      challenge.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {challenge.status}
                    </span>
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
