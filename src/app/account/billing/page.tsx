export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { BillingAddressForm } from "@/components/BillingAddressForm";
import { parseBillingAddress } from "@/lib/user-data";

export default async function BillingAddressPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  await connectToDatabase();
  const user = await User.findUnique({ where: { id: session.user.id } });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-stone">Billing</p>
        <h1 className="mt-2 font-serif text-3xl">Billing address</h1>
      </div>

      <BillingAddressForm
        initial={
          parseBillingAddress(user?.billingAddress ?? null) ?? {
            label: "Billing",
            line1: "",
            line2: "",
            city: "",
            state: "",
            country: "Nigeria",
            phone: "",
          }
        }
      />
    </main>
  );
}
