import { createClient } from '@supabase/supabase-js'
import type { Challenge, Learner, Platform, Submission, Transaction } from './types'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export async function getPlatformByUserId(userId: string): Promise<Platform | null> {
  const { data } = await getClient()
    .from('sb_platforms')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function createPlatform(platform: Omit<Platform, 'id' | 'created_at'>): Promise<Platform> {
  const { data, error } = await getClient()
    .from('sb_platforms')
    .insert(platform)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePlatformEscrow(id: string, delta: number): Promise<void> {
  const { data: platform } = await getClient()
    .from('sb_platforms')
    .select('escrow_balance_cents')
    .eq('id', id)
    .single()
  await getClient()
    .from('sb_platforms')
    .update({ escrow_balance_cents: (platform?.escrow_balance_cents ?? 0) + delta })
    .eq('id', id)
}

export async function getChallengesByPlatform(platformId: string): Promise<Challenge[]> {
  const { data } = await getClient()
    .from('sb_challenges')
    .select('*')
    .eq('platform_id', platformId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const { data } = await getClient()
    .from('sb_challenges')
    .select('*, sb_platforms(name)')
    .eq('status', 'active')
    .gt('deadline', new Date().toISOString())
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getChallengeById(id: string): Promise<Challenge | null> {
  const { data } = await getClient()
    .from('sb_challenges')
    .select('*, sb_platforms(name, website)')
    .eq('id', id)
    .single()
  return data
}

export async function createChallenge(challenge: Omit<Challenge, 'id' | 'created_at'>): Promise<Challenge> {
  const { data, error } = await getClient()
    .from('sb_challenges')
    .insert(challenge)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getLearnerByUserId(userId: string): Promise<Learner | null> {
  const { data } = await getClient()
    .from('sb_learners')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function createLearner(learner: Omit<Learner, 'id' | 'created_at'>): Promise<Learner> {
  const { data, error } = await getClient()
    .from('sb_learners')
    .insert(learner)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getSubmissionsByLearner(learnerId: string): Promise<Submission[]> {
  const { data } = await getClient()
    .from('sb_submissions')
    .select('*, sb_challenges(title, reward_cents, skill_vertical)')
    .eq('learner_id', learnerId)
    .order('submitted_at', { ascending: false })
  return data ?? []
}

export async function getSubmissionsByChallenge(challengeId: string): Promise<Submission[]> {
  const { data } = await getClient()
    .from('sb_submissions')
    .select('*, sb_learners(name, email)')
    .eq('challenge_id', challengeId)
    .order('submitted_at', { ascending: false })
  return data ?? []
}

export async function createSubmission(submission: Omit<Submission, 'id' | 'submitted_at' | 'graded_at' | 'ai_score' | 'ai_confidence' | 'ai_verdict' | 'human_override'>): Promise<Submission> {
  const { data, error } = await getClient()
    .from('sb_submissions')
    .insert({ ...submission, status: 'grading', human_override: false })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getTransactionsByLearner(learnerId: string): Promise<Transaction[]> {
  const { data } = await getClient()
    .from('sb_transactions')
    .select('*')
    .eq('learner_id', learnerId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createTransaction(tx: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
  const { data, error } = await getClient()
    .from('sb_transactions')
    .insert(tx)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getHumanReviewQueue(): Promise<Submission[]> {
  const { data } = await getClient()
    .from('sb_submissions')
    .select('*, sb_challenges(title, rubric_json), sb_learners(name, email)')
    .in('status', ['human_review', 'appealed'])
    .order('submitted_at', { ascending: true })
  return data ?? []
}

export async function overrideSubmission(id: string, verdict: 'passed' | 'failed'): Promise<void> {
  const { error } = await getClient()
    .from('sb_submissions')
    .update({ status: verdict, human_override: true, graded_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
