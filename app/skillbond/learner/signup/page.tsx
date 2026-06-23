import { SignUp } from '@clerk/nextjs'

export default function LearnerSignup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Join SkillBond</h1>
          <p className="text-gray-500 mt-2">Complete challenges and get paid for your skills</p>
        </div>
        <SignUp routing="hash" forceRedirectUrl="/skillbond/learner/onboarding" />
      </div>
    </div>
  )
}
