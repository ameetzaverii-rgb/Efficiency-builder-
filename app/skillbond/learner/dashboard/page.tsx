import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getLearnerByUserId, getSubmissionsByLearner, getTransactionsByLearner } from '@/lib/skillbond/supabase-db'
import { formatCents, formatDate } from '@/lib/skillbond/utils'
import Link from 'next/link'

export default async function LearnerDashboard() {
  const { userId } = await auth()
  if (!userId) redirect('/skillbond/learner/login')

  const learner = await getLearnerByUserId(userId)
  if (!learner) redirect('/skillbond/learner/onboarding')

  const [submissions, transactions] = await Promise.all([
    getSubmissionsByLearner(learner.id),
    getTransactionsByLearner(learner.id),
  ])

  const earned = transactions.filter(t => t.type === 'reward_release').reduce((s, t) => s + t.amount_cents, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-indigo-700 text-lg">SkillBond</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{learner.name}</span>
          <Link href="/skillbond/learner/challenges" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            Browse challenges
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Wallet balance', value: formatCents(learner.wallet_balance_cents), sub: 'available to withdraw' },
            { label: 'Total earned', value: formatCents(earned), sub: 'all time' },
            { label: 'Submissions', value: submissions.length.toString(), sub: 'challenges attempted' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {learner.wallet_balance_cents > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-indigo-800 font-medium text-sm">You have {formatCents(learner.wallet_balance_cents)} ready to withdraw</span>
            <Link href="/skillbond/learner/wallet" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Withdraw →
            </Link>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your submissions</h2>
            <Link href="/skillbond/learner/challenges" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Find more challenges →
            </Link>
          </div>
          {submissions.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 mb-4">No submissions yet</p>
              <Link href="/skillbond/learner/challenges" className="bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Browse challenges
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {submissions.map(sub => (
                <div key={sub.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{(sub as { sb_challenges?: { title: string; reward_cents: number } }).sb_challenges?.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Submitted {formatDate(sub.submitted_at)}
                      {sub.ai_score !== null && ` · Score: ${(sub.ai_score * 100).toFixed(0)}%`}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    sub.status === 'passed' ? 'bg-green-100 text-green-700' :
                    sub.status === 'failed' ? 'bg-red-100 text-red-700' :
                    sub.status === 'grading' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{sub.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
