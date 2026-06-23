import { SignIn } from '@clerk/nextjs'

export default function PlatformLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Platform Portal</h1>
          <p className="text-gray-500 mt-2">Sign in to manage your challenges</p>
        </div>
        <SignIn routing="hash" forceRedirectUrl="/skillbond/platform/dashboard" />
      </div>
    </div>
  )
}
