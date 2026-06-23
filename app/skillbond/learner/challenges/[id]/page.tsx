import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getChallengeById, getLearnerByUserId, getSubmissionsByLearner } from '@/lib/skillbond/supabase-db'
import { formatCents, daysUntil } from '@/lib/skillbond/utils'
import SubmitForm from './SubmitForm'

export default async function ChallengeView({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/skillbond/learner/login')

  const [learner, challenge] = await Promise.all([
    getLearnerByUserId(userId),
    getChallengeById(params.id),
  ])
  if (!learner) redirect('/skillbond/learner/onboarding')
  if (!challenge || challenge.status !== 'active') redirect('/skillbond/learner/challenges')

  const mySubmissions = await getSubmissionsByLearner(learner.id)
  const alreadySubmitted = mySubmissions.some(s => s.challenge_id === challenge.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-indigo-700 text-lg">SkillBond</span>
        <a href="/skillbond/learner/challenges" className="text-sm text-gray-600 hover:text-gray-800">← All challenges</a>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-full">
                {challenge.skill_vertical.replace('_', ' ')}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">{challenge.title}</h1>
              <p className="text-sm text-gray-500">{daysUntil(challenge.deadline)} days remaining to submit</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{formatCents(challenge.reward_cents)}</div>
              <div className="text-xs text-gray-400">upon passing</div>
            </div>
          </div>

          {challenge.rubric_json && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">How you&apos;ll be graded</h3>
              <div className="space-y-2">
                {challenge.rubric_json.dimensions.map(dim => (
                  <div key={dim.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{dim.name}</span>
                    <span className="text-gray-400">({Math.round(dim.weight * 100)}%)</span>
                    <span className="text-gray-500 text-xs">{dim.description}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Pass threshold: {Math.round(challenge.rubric_json.pass_threshold * 100)}% · Graded by AI
              </div>
            </div>
          )}
        </div>

        {alreadySubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-green-700 font-semibold mb-1">Submission received</div>
            <p className="text-green-600 text-sm">Your work is being graded. Results appear in your dashboard within 24 hours.</p>
          </div>
        ) : (
          <SubmitForm challengeId={challenge.id} learnerId={learner.id} />
        )}
      </div>
    </div>
  )
}
