'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { SKILL_VERTICALS } from '@/lib/skillbond/types'

export default function LearnerOnboarding() {
  const { user } = useUser()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', country: '', skill_tags: [] as string[] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      skill_tags: f.skill_tags.includes(tag) ? f.skill_tags.filter(t => t !== tag) : [...f.skill_tags, tag],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/skillbond/learner/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.emailAddresses[0]?.emailAddress,
          ...form,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.push('/skillbond/learner/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Set up your profile</h1>
        <p className="text-gray-500 mb-6">Help platforms find the right challenges for you</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. India, USA, Nigeria" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skill interests</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_VERTICALS.map(v => (
                <button key={v.value} type="button" onClick={() => toggleTag(v.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    form.skill_tags.includes(v.value) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:border-indigo-300'
                  }`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors">
            {loading ? 'Saving…' : 'Start browsing challenges →'}
          </button>
        </form>
      </div>
    </div>
  )
}
