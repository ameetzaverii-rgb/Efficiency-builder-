import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { RubricJson } from '@/lib/skillbond/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

async function fetchSubmissionText(url: string): Promise<string> {
  try {
    // For MVP: attempt to fetch text from the URL directly
    // In production, use Unstructured.io for PDFs, GitHub API for repos, etc.
    if (url.includes('github.com')) {
      // Convert github.com URL to raw content for README
      const raw = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
      const res = await fetch(raw)
      if (res.ok) return await res.text()
    }
    const res = await fetch(url)
    if (res.ok) {
      const text = await res.text()
      return text.slice(0, 8000) // cap at 8k chars
    }
    return `[Submission URL: ${url}]`
  } catch {
    return `[Submission URL: ${url} — could not fetch content]`
  }
}

export async function POST(req: NextRequest) {
  try {
    const { submission_id } = await req.json()
    const db = getAdmin()

    const { data: submission } = await db
      .from('sb_submissions')
      .select('*, sb_challenges(rubric_json, skill_vertical, reward_cents, platform_id)')
      .eq('id', submission_id)
      .single()

    if (!submission) return new NextResponse('Submission not found', { status: 404 })

    const challenge = (submission as { sb_challenges?: { rubric_json: RubricJson; skill_vertical: string; reward_cents: number; platform_id: string } }).sb_challenges
    if (!challenge?.rubric_json) {
      // No rubric — auto-pass for demo purposes
      await db.from('sb_submissions').update({ status: 'passed', ai_score: 0.80, ai_confidence: 0.90, graded_at: new Date().toISOString() }).eq('id', submission_id)
      return NextResponse.json({ verdict: 'passed', score: 0.80 })
    }

    const submissionText = await fetchSubmissionText(submission.submission_url)
    const rubric: RubricJson = challenge.rubric_json

    const prompt = `You are a rigorous skills assessor for ${challenge.skill_vertical}.
You grade work samples against structured rubrics.
You MUST respond only in valid JSON matching the schema provided.
You MUST NOT be lenient — the reward paid depends on honest grading.

RUBRIC:
${JSON.stringify(rubric, null, 2)}

SUBMISSION:
${submissionText}

TASK: Score this submission on each rubric dimension.
Return JSON exactly matching:
{
  "dimension_scores": [{"id": "d1", "score": 0-3, "rationale": "string"}],
  "overall_score": 0.0-1.0,
  "confidence": 0.0-1.0,
  "verdict": "pass" or "fail",
  "feedback": "string"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    let parsed: {
      overall_score: number
      confidence: number
      verdict: string
      feedback: string
      dimension_scores: unknown[]
    }
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? content.text)
    } catch {
      throw new Error('Could not parse AI response as JSON')
    }

    const score = parsed.overall_score ?? 0
    const confidence = parsed.confidence ?? 0
    const verdict = score >= rubric.pass_threshold ? 'passed' : 'failed'

    let status: string
    if (confidence >= rubric.confidence_threshold) {
      status = verdict
    } else if (confidence >= 0.50) {
      status = 'human_review'
    } else {
      status = 'human_review'
    }

    await db.from('sb_submissions').update({
      status,
      ai_score: score,
      ai_confidence: confidence,
      ai_verdict: parsed.feedback,
      graded_at: new Date().toISOString(),
    }).eq('id', submission_id)

    // Release reward if passed with high confidence
    if (status === 'passed') {
      const TAKE_RATE = 0.15
      const learnerAmount = Math.round(challenge.reward_cents * (1 - TAKE_RATE))

      const { data: learner } = await db.from('sb_learners').select('wallet_balance_cents').eq('id', submission.learner_id).single()
      if (learner) {
        await db.from('sb_learners').update({ wallet_balance_cents: learner.wallet_balance_cents + learnerAmount }).eq('id', submission.learner_id)
        await db.from('sb_transactions').insert({
          type: 'reward_release',
          learner_id: submission.learner_id,
          challenge_id: submission.challenge_id,
          submission_id: submission.id,
          amount_cents: learnerAmount,
        })
      }
    }

    return NextResponse.json({ verdict: status, score, confidence })
  } catch (err) {
    console.error('Grading error:', err)
    return new NextResponse(String(err), { status: 500 })
  }
}
