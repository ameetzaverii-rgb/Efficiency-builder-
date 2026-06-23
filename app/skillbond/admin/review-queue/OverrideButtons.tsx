'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OverrideButtons({ submissionId }: { submissionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'pass' | 'fail' | null>(null)

  async function override(verdict: 'passed' | 'failed') {
    setLoading(verdict === 'passed' ? 'pass' : 'fail')
    try {
      await fetch(`/api/skillbond/admin/override/${submissionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2 ml-auto">
      <button onClick={() => override('passed')} disabled={!!loading}
        className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
        {loading === 'pass' ? '…' : 'Pass'}
      </button>
      <button onClick={() => override('failed')} disabled={!!loading}
        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
        {loading === 'fail' ? '…' : 'Fail'}
      </button>
    </div>
  )
}
