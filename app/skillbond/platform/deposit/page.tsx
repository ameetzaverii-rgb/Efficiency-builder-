'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function DepositPage() {
  const { user } = useUser()
  const router = useRouter()
  const [amount, setAmount] = useState('1000')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/skillbond/platform/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, amount_cents: Math.round(parseFloat(amount) * 100) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      if (data.url) window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Add escrow funds</h1>
        <p className="text-gray-500 text-sm mb-6">Funds will be held in escrow and reserved when you publish challenges.</p>

        <form onSubmit={handleDeposit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="100"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['500', '1000', '5000'].map(preset => (
              <button key={preset} type="button" onClick={() => setAmount(preset)}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${amount === preset ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                ${preset}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            Processed securely via Stripe. Funds appear in your escrow balance immediately after payment.
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors">
            {loading ? 'Redirecting to Stripe…' : `Deposit $${amount} →`}
          </button>
        </form>
      </div>
    </div>
  )
}
