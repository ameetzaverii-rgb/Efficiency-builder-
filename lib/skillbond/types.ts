export type KycStatus = 'pending' | 'approved' | 'rejected'
export type ChallengeStatus = 'draft' | 'active' | 'closed' | 'expired'
export type SubmissionStatus = 'submitted' | 'grading' | 'passed' | 'failed' | 'appealed' | 'human_review'
export type TransactionType = 'escrow_deposit' | 'reward_release' | 'listing_fee' | 'platform_refund' | 'withdrawal'

export interface Platform {
  id: string
  name: string
  website: string | null
  escrow_balance_cents: number
  stripe_customer_id: string | null
  kyc_status: KycStatus
  created_at: string
  user_id: string
}

export interface Challenge {
  id: string
  platform_id: string
  title: string
  skill_vertical: string
  brief_url: string | null
  rubric_json: RubricJson | null
  reward_cents: number
  max_submissions: number
  deadline: string
  status: ChallengeStatus
  escrow_reserved_cents: number
  created_at: string
  platform?: Platform
}

export interface RubricDimension {
  id: string
  name: string
  description: string
  weight: number
  scoring_guide: Record<string, string>
}

export interface RubricJson {
  challenge_id: string
  skill_vertical: string
  dimensions: RubricDimension[]
  pass_threshold: number
  confidence_threshold: number
}

export interface Learner {
  id: string
  user_id: string
  email: string
  name: string
  country: string | null
  skill_tags: string[]
  stripe_connect_id: string | null
  wallet_balance_cents: number
  created_at: string
}

export interface Submission {
  id: string
  challenge_id: string
  learner_id: string
  submission_url: string
  reflection_text: string | null
  status: SubmissionStatus
  ai_score: number | null
  ai_confidence: number | null
  ai_verdict: string | null
  human_override: boolean
  submitted_at: string
  graded_at: string | null
  challenge?: Challenge
  learner?: Learner
}

export interface Transaction {
  id: string
  type: TransactionType
  platform_id: string | null
  learner_id: string | null
  challenge_id: string | null
  submission_id: string | null
  amount_cents: number
  stripe_transfer_id: string | null
  created_at: string
}

export const SKILL_VERTICALS = [
  { value: 'ai_literacy', label: 'AI Literacy' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'product_thinking', label: 'Product Thinking' },
] as const

export type SkillVertical = typeof SKILL_VERTICALS[number]['value']
