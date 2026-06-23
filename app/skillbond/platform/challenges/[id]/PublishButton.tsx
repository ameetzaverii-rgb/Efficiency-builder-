'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function PublishButton({ challengeId, platformId, rewardCents, maxSubmissions }: {
  challengeId: string
  platformId: string
  rewardCents: number
  maxSubmissions: number
}) {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalNeeded = rewardCents * maxSubmissions

  async function publish() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/skillbond/platform/challenges/${challengeId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={publish}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
      >
        {loading ? 'Publishing…' : 'Publish challenge'}
      </button>
      <div className="text-xs text-gray-400 mt-1">Requires {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalNeeded / 100)} escrow</div>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  )
}
