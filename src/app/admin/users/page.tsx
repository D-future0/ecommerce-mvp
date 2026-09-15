export const dynamic = "force-dynamic";

import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export default async function AdminUsersPage() {
  await connectToDatabase();
  const users = await User.find({}).select("name email role createdAt isDeactivated").sort({ createdAt: -1 }).lean();

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm text-ink">All app users</h2>
        <span className="text-xs uppercase tracking-[0.14em] text-stone">{users.length} total</span>
      </div>

      <div className="mt-6 overflow-hidden rounded border border-line bg-white/70">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sand text-xs uppercase tracking-[0.12em] text-stone">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={String(user._id)} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3 text-ink">{user.name || "Unnamed user"}</td>
                  <td className="px-4 py-3 text-stone">{user.email}</td>
                  <td className="px-4 py-3 text-stone">{user.role}</td>
                  <td className="px-4 py-3">
                    <span className={user.isDeactivated ? "text-red-700" : "text-emerald-700"}>
                      {user.isDeactivated ? "Deactivated" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone">
                    {new Date(user.createdAt).toLocaleDateString("en-NG", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && <p className="mt-6 text-sm text-stone">No users yet.</p>}
    </div>
  );
}
