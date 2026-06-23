import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChallengeById, getPlatformByUserId, getSubmissionsByChallenge } from '@/lib/skillbond/supabase-db'
import { formatCents, formatDate } from '@/lib/skillbond/utils'
import PublishButton from './PublishButton'

export default async function ChallengeDetail({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/skillbond/platform/login')

  const [platform, challenge] = await Promise.all([
    getPlatformByUserId(userId),
    getChallengeById(params.id),
  ])
  if (!platform || !challenge) redirect('/skillbond/platform/dashboard')
  if (challenge.platform_id !== platform.id) redirect('/skillbond/platform/dashboard')

  const submissions = await getSubmissionsByChallenge(challenge.id)
  const passed = submissions.filter(s => s.status === 'passed').length
  const failed = submissions.filter(s => s.status === 'failed').length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <span className="font-bold text-indigo-700">SkillBond</span>
        <span className="text-gray-400 mx-2">/</span>
        <a href="/skillbond/platform/dashboard" className="text-gray-500 hover:text-gray-700">Dashboard</a>
        <span className="text-gray-400 mx-2">/</span>
        <span className="text-gray-900">{challenge.title}</span>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                challenge.status === 'active' ? 'bg-green-100 text-green-700' :
                challenge.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                'bg-orange-100 text-orange-700'
              }`}>{challenge.status}</span>
            </div>
            <div className="text-sm text-gray-500">
              {challenge.skill_vertical.replace('_', ' ')} · {formatCents(challenge.reward_cents)} reward · Deadline {formatDate(challenge.deadline)}
            </div>
          </div>
          {challenge.status === 'draft' && (
            <PublishButton challengeId={challenge.id} platformId={platform.id} rewardCents={challenge.reward_cents} maxSubmissions={challenge.max_submissions} />
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total submissions', value: submissions.length },
            { label: 'Passed', value: passed },
            { label: 'Failed', value: failed },
            { label: 'Pending', value: submissions.length - passed - failed },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Submissions</h2>
          </div>
          {submissions.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No submissions yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {submissions.map(sub => (
                <div key={sub.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{(sub as { sb_learners?: { name: string } }).sb_learners?.name ?? 'Learner'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(sub.submitted_at)}</div>
                    {sub.ai_score !== null && (
                      <div className="text-xs text-gray-500 mt-0.5">AI score: {(sub.ai_score * 100).toFixed(0)}% · confidence {((sub.ai_confidence ?? 0) * 100).toFixed(0)}%</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={sub.submission_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">View →</a>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      sub.status === 'passed' ? 'bg-green-100 text-green-700' :
                      sub.status === 'failed' ? 'bg-red-100 text-red-700' :
                      sub.status === 'grading' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{sub.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
