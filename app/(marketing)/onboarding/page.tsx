import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { profileIsComplete } from "@/lib/db/profile";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const complete = await profileIsComplete();
  if (complete) redirect("/dashboard");

  const user = await currentUser();
  const initialName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initialEmail = user?.emailAddresses[0]?.emailAddress ?? "";

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <OnboardingForm initialName={initialName} initialEmail={initialEmail} />
    </main>
  );
}
