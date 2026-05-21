import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 pt-24 pb-20 max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
          Your resume is getting filtered out before anyone reads it.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-neutral-500 max-w-xl">
          Land the Interview tailors your resume to each job posting — so you
          beat the ATS and stand out to the hiring manager.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center">
          <Show when="signed-out">
            <SignUpButton fallbackRedirectUrl="/dashboard/history">
              <button className="bg-primary text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer">
                Tailor My Resume
              </button>
            </SignUpButton>
            <SignInButton fallbackRedirectUrl="/dashboard/history">
              <button className="text-sm font-medium px-6 py-3 text-neutral-500 hover:text-black transition-colors cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="bg-primary text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
            >
              Go to Dashboard
            </Link>
          </Show>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 border-t border-neutral-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">
            How it works
          </h2>
          <ol className="grid sm:grid-cols-3 gap-10">
            <li className="flex flex-col gap-3">
              <span className="text-5xl font-bold text-neutral-100 select-none">
                01
              </span>
              <h3 className="font-semibold">Upload your resume</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Drop in your existing resume as a PDF, DOCX, or paste it
                directly.
              </p>
            </li>
            <li className="flex flex-col gap-3">
              <span className="text-5xl font-bold text-neutral-100 select-none">
                02
              </span>
              <h3 className="font-semibold">Paste the job posting</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Copy the full job description from any job board.
              </p>
            </li>
            <li className="flex flex-col gap-3">
              <span className="text-5xl font-bold text-neutral-100 select-none">
                03
              </span>
              <h3 className="font-semibold">Download your tailored resume</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Get a resume matched to the role — ready to submit.
              </p>
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
}
