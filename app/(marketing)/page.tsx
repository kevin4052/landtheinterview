import { Show, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Reveal } from "@/app/components/editorial/Reveal";
import { FigureCounter } from "@/app/components/editorial/FigureCounter";

const btnSolid =
  "inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[2px] border border-forest bg-forest px-[30px] py-4 text-[15px] font-semibold text-paper transition-colors hover:border-ink hover:bg-ink group";
const btnLine =
  "inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-[2px] border border-forest bg-transparent px-[30px] py-4 text-[15px] font-semibold text-forest transition-colors hover:bg-forest hover:text-paper";

function PrimaryCta({ label = "Get started — it's free" }: { label?: string }) {
  return (
    <>
      <Show when="signed-out">
        <SignUpButton fallbackRedirectUrl="/dashboard">
          <button className={btnSolid}>
            {label}{" "}
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={btnSolid}>
          Go to your dashboard{" "}
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>
      </Show>
    </>
  );
}

const marqueeItems = [
  "Tailored to every posting",
  "Built from your full history",
  "Engineered to beat the ATS",
  "Interview-ready in seconds",
];

const entries = [
  {
    no: "i.",
    title: "Tailored to each posting",
    body: "Paste a job posting and we study its language, its priorities, its must-haves. Your résumé is re-composed to lead with precisely what this role is looking for — never a generic draft.",
  },
  {
    no: "ii.",
    title: "Drawn from your whole history",
    body: "Record every role once. We keep a complete account of your career and select the accomplishments that fit — so the right line is always at hand, for any application.",
  },
  {
    no: "iii.",
    title: "Engineered for the filters",
    body: "Clean, parseable structure and a candid keyword-match score. We surface the gaps before you submit, so no algorithm quietly sets your application aside.",
  },
];

const figures = [
  { value: 3.2, suffix: "×", decimals: 1, caption: "More callbacks than a generic résumé" },
  { value: 92, suffix: "%", decimals: 0, caption: "Clear the ATS parse check on first pass" },
  { value: 28, suffix: "s", decimals: 0, caption: "From job posting to a tailored draft" },
  { value: 120, suffix: "k", decimals: 0, caption: "Résumés composed and counting" },
];

const steps = [
  {
    no: "I.",
    title: "Paste the posting",
    body: "A URL or the full description will do. We extract the requirements, the keywords, and the seniority the role expects.",
  },
  {
    no: "II.",
    title: "We compose your résumé",
    body: "Your career meets the posting. A focused, ATS-ready draft arrives in seconds, accompanied by a live match score.",
  },
  {
    no: "III.",
    title: "Refine, then apply",
    body: "Edit any line by hand, export to PDF or DOCX, and submit knowing you'll clear the filters.",
  },
];

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: null,
    description: "Five tailored résumés, composed start to finish.",
    features: ["5 lifetime Tailor operations", "Full profile management", "Download as PDF or DOCX"],
    featured: false,
  },
  {
    name: "Mid",
    price: "$5",
    period: "/ month",
    description: "For a steady, deliberate job search.",
    features: ["20 Tailor operations per month", "Everything in Free", "Priority support"],
    featured: false,
  },
  {
    name: "Pro",
    price: "$20",
    period: "/ month",
    description: "Full measure for a significant move.",
    features: ["Unlimited Tailor operations", "Everything in Mid", "Early access to new features"],
    featured: true,
  },
] as const;

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="pb-[70px] pt-[26px]">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="mb-[30px] flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            <span>The tailored résumé</span>
            <span className="h-px w-14 bg-line-ink" />
            <span>Est. for your next role</span>
          </div>
          <div className="grid items-end gap-12 md:grid-cols-[1.18fr_0.82fr] md:gap-16">
            <div>
              <h1 className="font-serif text-[56px] font-normal leading-[0.98] tracking-[-0.02em] md:text-[86px]">
                The résumé,
                <br />
                rewritten for
                <br />
                the <em className="italic text-forest">role.</em>
              </h1>
              <div className="mb-[26px] mt-10 h-px bg-line-ink" />
              <p className="max-w-[460px] font-serif text-[22px] leading-[1.5] text-ink-soft">
                <span className="float-left pr-3 pt-1.5 font-serif text-[62px] font-medium leading-[0.78] text-forest">
                  E
                </span>
                very posting asks for something specific. Land the Interview reads it, draws from
                your entire career, and composes a résumé made to clear the filters — and hold a
                recruiter&apos;s attention.
              </p>
              <div className="mt-[34px] flex flex-wrap items-center gap-[18px]">
                <PrimaryCta />
                <a href="#method" className={btnLine}>
                  Read the method
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-[22px] text-[13px] text-muted">
                <span className="flex items-center gap-2">
                  <span className="text-moss">✦</span> First résumé free
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-moss">✦</span> No credit card
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-moss">✦</span> PDF &amp; DOCX
                </span>
              </div>
            </div>

            {/* Editorial résumé specimen */}
            <Reveal>
              <div className="relative border border-line-ink bg-card p-[30px] pb-[34px] shadow-[14px_16px_0_-2px_var(--paper-2),14px_16px_0_-1px_var(--line-ink)]">
                <span className="absolute -top-[11px] right-[22px] bg-paper px-2.5 text-[11px] uppercase tracking-[0.18em] text-muted">
                  Specimen
                </span>
                <div className="font-serif text-[30px] font-medium leading-none tracking-[-0.01em]">
                  Eleanor Hartley
                </div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                  Senior Product Manager
                </div>
                <div className="my-[18px] h-px bg-line-ink" />
                <div className="mb-2.5 text-[10.5px] uppercase tracking-[0.2em] text-muted">
                  Profile · tailored
                </div>
                <div className="mb-[7px] h-[7px] w-full rounded-[1px] bg-[#cfc8b6]" />
                <div className="mb-[7px] h-[7px] w-[94%] rounded-[1px] bg-[#e7e1d2]" />
                <div className="mb-[7px] h-[7px] w-[80%] rounded-[1px] bg-[#e7e1d2]" />
                <div className="my-[18px] h-px bg-line-ink" />
                <div className="mb-2.5 text-[10.5px] uppercase tracking-[0.2em] text-muted">
                  Matched competencies
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Roadmap strategy", "Experimentation", "SQL", "Go-to-market"].map((tag) => (
                    <span
                      key={tag}
                      className="border-b border-moss pb-px font-serif text-[13px] italic text-forest"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-[22px] flex items-baseline gap-2.5 border-t border-line-ink pt-4">
                  <b className="font-serif text-[40px] font-medium leading-none text-forest">94</b>
                  <span className="text-xs uppercase leading-tight tracking-[0.14em] text-muted">
                    Keyword
                    <br />
                    match score
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-line-ink py-[18px]">
        <div className="flex w-max animate-marquee gap-14 whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-14 font-serif text-xl italic text-muted after:text-xs after:not-italic after:text-moss after:content-['✦']"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Method / features */}
      <section className="py-[92px]" id="method">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <Reveal className="mb-14 grid items-baseline gap-4 md:grid-cols-[auto_1fr] md:gap-10">
            <div className="font-serif text-[22px] italic text-moss">№ 01</div>
            <h2 className="max-w-[720px] font-serif text-4xl font-normal leading-[1.04] tracking-[-0.02em] md:text-5xl">
              Three principles behind a résumé that{" "}
              <em className="italic text-forest">actually lands.</em>
            </h2>
          </Reveal>
          <div className="grid border-t border-ink md:grid-cols-3">
            {entries.map((entry) => (
              <Reveal
                key={entry.no}
                className="border-b border-line-ink px-8 pb-[38px] pt-[34px] transition-colors hover:bg-paper-2 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <div className="font-serif text-[17px] italic text-moss">{entry.no}</div>
                <h3 className="mt-4 font-serif text-[27px] font-medium leading-[1.1] tracking-[-0.01em]">
                  {entry.title}
                </h3>
                <p className="mt-3.5 text-[15px] leading-[1.62] text-ink-soft">{entry.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Figures */}
      <section className="bg-forest text-paper" id="figures">
        <div className="mx-auto max-w-[1200px] px-6 py-[84px] sm:px-10">
          <div className="mb-11 font-serif text-[22px] italic text-[#c8d8c5]">By the numbers</div>
          <div className="grid grid-cols-2 gap-9 md:grid-cols-4">
            {figures.map((fig) => (
              <Reveal key={fig.caption} className="border-t border-paper/30 pt-[22px]">
                <FigureCounter
                  value={fig.value}
                  suffix={fig.suffix}
                  decimals={fig.decimals}
                  className="font-serif text-5xl font-normal leading-[0.9] tracking-[-0.02em] md:text-[64px]"
                />
                <div className="mt-3.5 max-w-[220px] text-sm leading-normal text-[#bdcdba]">
                  {fig.caption}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Method steps */}
      <section className="py-[92px]">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <Reveal className="mb-14 grid items-baseline gap-4 md:grid-cols-[auto_1fr] md:gap-10">
            <div className="font-serif text-[22px] italic text-moss">№ 02</div>
            <h2 className="max-w-[720px] font-serif text-4xl font-normal leading-[1.04] tracking-[-0.02em] md:text-5xl">
              From posting to interview-ready,{" "}
              <em className="italic text-forest">in three movements.</em>
            </h2>
          </Reveal>
          <div className="border-t border-ink">
            {steps.map((step) => (
              <Reveal
                key={step.no}
                className="grid items-baseline gap-3 border-b border-line-ink py-[34px] transition-[padding] duration-200 hover:pl-3.5 md:grid-cols-[120px_1fr_1.1fr] md:gap-10"
              >
                <div className="font-serif text-[30px] italic text-moss">{step.no}</div>
                <h3 className="font-serif text-[28px] font-medium tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="text-[15.5px] text-ink-soft">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pb-[92px]" id="pricing">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <Reveal className="mb-14 grid items-baseline gap-4 md:grid-cols-[auto_1fr] md:gap-10">
            <div className="font-serif text-[22px] italic text-moss">№ 03</div>
            <h2 className="max-w-[720px] font-serif text-4xl font-normal leading-[1.04] tracking-[-0.02em] md:text-5xl">
              Begin without charge.{" "}
              <em className="italic text-forest">Subscribe when the search is on.</em>
            </h2>
          </Reveal>
          <Reveal className="grid border border-ink md:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col border-b border-line-ink px-[34px] pb-[38px] pt-10 transition-colors md:border-b-0 md:border-r md:last:border-r-0 ${
                  tier.featured ? "bg-paper-2" : ""
                }`}
              >
                <div className="font-serif text-[22px] italic text-forest">{tier.name}</div>
                <div className="mb-1.5 mt-[18px] font-serif text-[58px] font-normal leading-none tracking-[-0.02em]">
                  {tier.price}{" "}
                  {tier.period && (
                    <small className="font-sans text-[15px] font-medium text-muted">
                      {tier.period}
                    </small>
                  )}
                </div>
                <div className="min-h-[42px] text-sm text-ink-soft">{tier.description}</div>
                <ul className="mb-7 mt-6 flex flex-1 flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="relative pl-[22px] text-[14.5px] leading-[1.45] text-ink-soft before:absolute before:left-0 before:text-moss before:content-['—']"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <Show when="signed-out">
                  <SignUpButton fallbackRedirectUrl="/dashboard">
                    <button
                      className={`${tier.featured ? btnSolid : btnLine} w-full justify-center px-[22px] py-3 text-sm`}
                    >
                      {tier.featured ? "Get started — it's free" : "Get started"}
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link
                    href="/pricing"
                    className={`${tier.featured ? btnSolid : btnLine} w-full justify-center px-[22px] py-3 text-sm`}
                  >
                    See pricing
                  </Link>
                </Show>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Closing */}
      <section className="pb-[110px] pt-10 text-center">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
          <div className="mb-6 font-serif text-xl italic text-moss">✦ ✦ ✦</div>
          <h2 className="mx-auto max-w-[880px] font-serif text-[40px] font-normal leading-[1.02] tracking-[-0.025em] md:text-[64px]">
            The right résumé is the <em className="italic text-forest">shortest distance</em> to
            the interview.
          </h2>
          <div className="mt-[38px] flex justify-center">
            <PrimaryCta />
          </div>
          <div className="mt-5 text-[13px] text-muted">
            Tailor your first résumé free — no credit card required.
          </div>
        </div>
      </section>
    </main>
  );
}
