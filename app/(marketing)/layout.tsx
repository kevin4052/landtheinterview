import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex justify-between items-center px-6 h-16 border-b border-neutral-100">
        <span className="font-semibold text-sm tracking-tight">Land the Interview</span>
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
              <button className="bg-primary text-white rounded-lg font-medium text-sm px-4 py-2 cursor-pointer hover:bg-primary-hover transition-colors">
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>
      {children}
    </>
  )
}
