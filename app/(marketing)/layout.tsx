import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

const navLinkCls =
  "relative text-sm font-medium text-ink-soft tracking-wide after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-forest after:transition-all after:duration-300 hover:after:w-full"

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 font-serif text-[22px] font-semibold tracking-tight">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-forest font-serif text-base font-semibold italic text-forest">
        L
      </span>
      Land the Interview
    </Link>
  )
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line-ink bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-6 sm:px-10">
          <Brand />
          <nav className="hidden items-center gap-9 md:flex">
            <Link href="/#method" className={navLinkCls}>The Method</Link>
            <Link href="/#figures" className={navLinkCls}>Results</Link>
            <Link href="/pricing" className={navLinkCls}>Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <SignInButton>
                <button className="cursor-pointer text-sm font-medium text-ink-soft transition-colors hover:text-ink">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="cursor-pointer whitespace-nowrap rounded-[2px] border border-forest bg-forest px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-ink hover:bg-ink">
                  Get started — it&apos;s free
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:block"
              >
                Dashboard
              </Link>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-ink py-10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-5 px-6 sm:px-10">
          <Brand />
          <nav className="flex gap-7 text-[13px] text-ink-soft">
            <Link href="/#method" className="hover:text-ink">The Method</Link>
            <Link href="/#figures" className="hover:text-ink">Results</Link>
            <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          </nav>
          <div className="text-xs uppercase tracking-[0.1em] text-muted">
            MMXXVI · Land the Interview
          </div>
        </div>
      </footer>
    </>
  )
}
