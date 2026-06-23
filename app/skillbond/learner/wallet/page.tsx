import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getLearnerByUserId, getTransactionsByLearner } from '@/lib/skillbond/supabase-db'
import { formatCents, formatDate } from '@/lib/skillbond/utils'
import WithdrawButton from './WithdrawButton'

export default async function WalletPage() {
  const { userId } = await auth()
  if (!userId) redirect('/skillbond/learner/login')

  const learner = await getLearnerByUserId(userId)
  if (!learner) redirect('/skillbond/learner/onboarding')

  const transactions = await getTransactionsByLearner(learner.id)

  const typeLabels: Record<string, string> = {
    reward_release: 'Reward received',
    withdrawal: 'Withdrawal',
    escrow_deposit: 'Escrow deposit',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-indigo-700 text-lg">SkillBond</span>
        <a href="/skillbond/learner/dashboard" className="text-sm text-gray-600 hover:text-gray-800">← Dashboard</a>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">Available balance</div>
            <div className="text-4xl font-bold text-gray-900">{formatCents(learner.wallet_balance_cents)}</div>
          </div>
          {learner.wallet_balance_cents >= 1000 && (
            <WithdrawButton learnerId={learner.id} balance={learner.wallet_balance_cents} />
          )}
        </div>

        {learner.wallet_balance_cents < 1000 && learner.wallet_balance_cents > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-700">
            Minimum withdrawal is $10.00. You need {formatCents(1000 - learner.wallet_balance_cents)} more.
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Transaction history</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map(tx => (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{typeLabels[tx.type] ?? tx.type}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(tx.created_at)}</div>
                  </div>
                  <div className={`font-semibold ${tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === 'withdrawal' ? '-' : '+'}{formatCents(tx.amount_cents)}
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
