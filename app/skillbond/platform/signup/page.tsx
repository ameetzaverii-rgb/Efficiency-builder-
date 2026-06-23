import { SignUp } from '@clerk/nextjs'

export default function PlatformSignup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Join as a Platform</h1>
          <p className="text-gray-500 mt-2">Post skill challenges and find verified talent</p>
        </div>
        <SignUp routing="hash" afterSignUpUrl="/skillbond/platform/onboarding" />
      </div>
    </div>
  )
}
