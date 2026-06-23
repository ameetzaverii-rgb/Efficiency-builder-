import { getHumanReviewQueue } from '@/lib/skillbond/supabase-db'
import { formatDate } from '@/lib/skillbond/utils'
import OverrideButtons from './OverrideButtons'

export default async function ReviewQueue() {
  const queue = await getHumanReviewQueue()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <span className="font-bold text-indigo-700">SkillBond Admin</span>
        <span className="text-gray-400 mx-2">/</span>
        <span className="text-gray-600">Human Review Queue</span>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <span className="text-sm text-gray-400">{queue.length} submissions pending</span>
        </div>

        {queue.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400">
            Queue is empty — all submissions auto-graded ✓
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map(sub => (
              <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{(sub as { sb_challenges?: { title: string } }).sb_challenges?.title}</div>
                    <div className="text-sm text-gray-500">
                      by {(sub as { sb_learners?: { name: string; email: string } }).sb_learners?.name} · Submitted {formatDate(sub.submitted_at)}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sub.status === 'appealed' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {sub.status}
                  </span>
                </div>

                {sub.ai_score !== null && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
                    <div className="text-gray-600">AI score: <strong>{(sub.ai_score * 100).toFixed(0)}%</strong> · Confidence: <strong>{((sub.ai_confidence ?? 0) * 100).toFixed(0)}%</strong></div>
                    {sub.ai_verdict && <div className="text-gray-500 text-xs mt-1">{sub.ai_verdict}</div>}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <a href={sub.submission_url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">View submission →</a>
                  <OverrideButtons submissionId={sub.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
