'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { SKILL_VERTICALS } from '@/lib/skillbond/types'

const DEFAULT_RUBRIC = {
  dimensions: [
    { id: 'd1', name: 'Problem understanding', description: 'Does the submission correctly identify and scope the problem?', weight: 0.25, scoring_guide: { '0': 'Not addressed', '1': 'Partially addressed', '2': 'Mostly correct', '3': 'Excellent' } },
    { id: 'd2', name: 'Solution quality', description: 'Is the proposed solution well-reasoned and practical?', weight: 0.35, scoring_guide: { '0': 'No solution', '1': 'Weak solution', '2': 'Good solution', '3': 'Excellent solution' } },
    { id: 'd3', name: 'Communication', description: 'Is the work clearly presented and well-structured?', weight: 0.25, scoring_guide: { '0': 'Hard to follow', '1': 'Somewhat clear', '2': 'Clear', '3': 'Excellent presentation' } },
    { id: 'd4', name: 'Originality', description: 'Does the submission show independent thinking?', weight: 0.15, scoring_guide: { '0': 'Generic', '1': 'Some original ideas', '2': 'Good originality', '3': 'Highly original' } },
  ],
  pass_threshold: 0.65,
  confidence_threshold: 0.75,
}

export default function NewChallenge() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    skill_vertical: 'ai_literacy',
    reward_dollars: '50',
    max_submissions: '100',
    deadline: '',
    brief_description: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/skillbond/platform/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          title: form.title,
          skill_vertical: form.skill_vertical,
          reward_cents: Math.round(parseFloat(form.reward_dollars) * 100),
          max_submissions: parseInt(form.max_submissions),
          deadline: new Date(form.deadline).toISOString(),
          brief_description: form.brief_description,
          rubric_json: DEFAULT_RUBRIC,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/skillbond/platform/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <span className="font-bold text-indigo-700">SkillBond</span>
        <span className="text-gray-400 mx-2">/</span>
        <span className="text-gray-600">New Challenge</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a challenge</h1>
        <p className="text-gray-500 mb-8">Define the skill task and reward. Escrow is reserved when you publish.</p>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Challenge title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Audit a business process and write an AI adoption brief"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill vertical *</label>
            <select
              value={form.skill_vertical}
              onChange={e => setForm(f => ({ ...f, skill_vertical: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SKILL_VERTICALS.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reward (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  required
                  type="number"
                  min="10"
                  max="1000"
                  value={form.reward_dollars}
                  onChange={e => setForm(f => ({ ...f, reward_dollars: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max submissions *</label>
              <input
                required
                type="number"
                min="1"
                value={form.max_submissions}
                onChange={e => setForm(f => ({ ...f, max_submissions: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
            <input
              required
              type="datetime-local"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Challenge brief *</label>
            <textarea
              required
              value={form.brief_description}
              onChange={e => setForm(f => ({ ...f, brief_description: e.target.value }))}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe the task learners need to complete, what they should deliver, and any constraints…"
            />
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-700">
            <strong>Escrow note:</strong> Creating a challenge does not immediately lock escrow. Funds are reserved when you publish the challenge to learners.
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating…' : 'Create challenge (draft)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
