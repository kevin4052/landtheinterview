import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UpgradeButton } from "@/app/components/UpgradeButton";

const btnSolid =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border border-forest bg-forest px-[22px] py-3 text-sm font-semibold text-paper transition-colors hover:border-ink hover:bg-ink disabled:opacity-50";
const btnLine =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border border-forest bg-transparent px-[22px] py-3 text-sm font-semibold text-forest transition-colors hover:bg-forest hover:text-paper disabled:opacity-50";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["5 lifetime Tailor operations", "Full profile management", "Download as PDF or DOCX"],
    cta: null,
  },
  {
    name: "Mid",
    price: "$5",
    period: "per month",
    plan: "mid" as const,
    features: ["20 Tailor operations per month", "Everything in Free", "Priority support"],
    cta: "Upgrade to Mid",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$20",
    period: "per month",
    plan: "pro" as const,
    features: ["Unlimited Tailor operations", "Everything in Mid", "Early access to new features"],
    cta: "Upgrade to Pro",
    highlight: true,
  },
] as const;

export default async function PricingPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-20 sm:px-10">
      <div className="mb-14">
        <div className="mb-7 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
          <span>Pricing</span>
          <span className="h-px w-14 bg-line-ink" />
          <span>Plain terms</span>
        </div>
        <h1 className="max-w-[720px] font-serif text-4xl font-normal leading-[1.04] tracking-[-0.02em] md:text-5xl">
          Begin without charge.{" "}
          <em className="italic text-forest">Subscribe when the search is on.</em>
        </h1>
      </div>

      <div className="grid border border-ink md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col border-b border-line-ink px-[34px] pb-[38px] pt-10 md:border-b-0 md:border-r md:last:border-r-0 ${
              "highlight" in tier && tier.highlight ? "bg-paper-2" : ""
            }`}
          >
            <div className="font-serif text-[22px] italic text-forest">{tier.name}</div>
            <div className="mb-1.5 mt-[18px] font-serif text-[58px] font-normal leading-none tracking-[-0.02em]">
              {tier.price}{" "}
              <small className="font-sans text-[15px] font-medium text-muted">
                / {tier.period}
              </small>
            </div>

            <ul className="mb-7 mt-6 flex flex-1 flex-col gap-3">
              {tier.features.map((f) => (
                <li
                  key={f}
                  className="relative pl-[22px] text-[14.5px] leading-[1.45] text-ink-soft before:absolute before:left-0 before:text-moss before:content-['—']"
                >
                  {f}
                </li>
              ))}
            </ul>

            {"cta" in tier && tier.cta && "plan" in tier ? (
              userId ? (
                <UpgradeButton
                  plan={tier.plan}
                  label={tier.cta}
                  className={tier.highlight ? btnSolid : btnLine}
                />
              ) : (
                <Link href="/sign-up" className={tier.highlight ? btnSolid : btnLine}>
                  Get started
                </Link>
              )
            ) : (
              <div className="w-full rounded-[2px] border border-line-ink px-[22px] py-3 text-center text-sm font-medium text-muted">
                Current plan
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
