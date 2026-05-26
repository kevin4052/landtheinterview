import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UpgradeButton } from "@/app/components/UpgradeButton";

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
    <main className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground">Simple pricing</h1>
        <p className="mt-3 text-neutral-500">Start free. Upgrade when you need more.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl border p-6 flex flex-col gap-4 ${
              "highlight" in tier && tier.highlight
                ? "border-primary bg-primary/5 shadow-md"
                : "border-neutral-200 bg-white"
            }`}
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground">{tier.name}</h2>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                <span className="text-sm text-neutral-500">/{tier.period}</span>
              </div>
            </div>

            <ul className="flex-1 space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-neutral-600">
                  <span className="mt-0.5 text-primary font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {"cta" in tier && tier.cta && "plan" in tier ? (
              userId ? (
                <UpgradeButton
                  plan={tier.plan}
                  label={tier.cta}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                />
              ) : (
                <Link
                  href="/sign-up"
                  className="block w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white text-center hover:bg-primary-hover transition-colors"
                >
                  Get started
                </Link>
              )
            ) : (
              <div className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-500 text-center">
                Current plan
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
