'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WithdrawButton({ learnerId, balance }: { learnerId: string; balance: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function withdraw() {
    if (!confirm(`Withdraw $${(balance / 100).toFixed(2)} to your connected bank/PayPal?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/skillbond/learner/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={withdraw} disabled={loading}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors">
        {loading ? 'Processing…' : 'Withdraw →'}
      </button>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
