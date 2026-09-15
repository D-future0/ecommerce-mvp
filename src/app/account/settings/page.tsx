export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AccountSettingsForm } from "@/components/AccountSettingsForm";

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  await connectToDatabase();
  const user = await User.findById(session.user.id).lean();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-stone">Account settings</p>
        <h1 className="mt-2 font-serif text-3xl">Edit profile</h1>
      </div>

      <AccountSettingsForm
        initial={{
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
          mobile: user?.mobile ?? "",
          addresses: user?.addresses ?? [],
          isDeactivated: !!user?.isDeactivated,
        }}
      />
    </main>
  );
}
