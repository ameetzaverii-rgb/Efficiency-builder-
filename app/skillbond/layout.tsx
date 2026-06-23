import { ClerkProvider } from '@clerk/nextjs'

export default function SkillBondLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ClerkProvider>
  )
}
