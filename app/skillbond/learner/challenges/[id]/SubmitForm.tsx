'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmitForm({ challengeId, learnerId }: { challengeId: string; learnerId: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ submission_url: '', reflection_text: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/skillbond/learner/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId, ...form }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Submit your work</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Work URL *</label>
          <input
            required
            type="url"
            value={form.submission_url}
            onChange={e => setForm(f => ({ ...f, submission_url: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://docs.google.com/... or GitHub link or Notion link"
          />
          <p className="text-xs text-gray-400 mt-1">Accepted: Google Doc, GitHub repo, Notion page, PDF link</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reflection (optional)</label>
          <textarea
            value={form.reflection_text}
            onChange={e => setForm(f => ({ ...f, reflection_text: e.target.value }))}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="What approach did you take? What would you do differently?"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors">
          {loading ? 'Submitting…' : 'Submit for grading →'}
        </button>
        <p className="text-xs text-gray-400 text-center">Your submission will be graded by AI within 24 hours. Results and any reward appear in your wallet.</p>
      </form>
    </div>
  )
}
