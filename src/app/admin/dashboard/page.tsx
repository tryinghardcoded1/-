import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { approveBlacklist } from "@/app/admin/dashboard/actions";

// Replace with your auth/session integration (e.g. Firebase Auth session cookie)
async function getCurrentSession() {
  return { uid: "TODO", role: "admin" as const };
}

export default async function AdminDashboardPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") redirect("/");

  const reportsSnap = await adminDb.collection("scam_reports").orderBy("createdAt", "desc").limit(100).get();
  const reports = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Admin Scam Reports</h1>
      <div className="space-y-4">
        {reports.map((report: any) => (
          <form key={report.id} action={approveBlacklist.bind(null, report.id, session.uid)} className="rounded-lg border p-4">
            <p><strong>Name:</strong> {report.suspectName ?? "N/A"}</p>
            <p><strong>ID:</strong> {report.suspectId ?? "N/A"}</p>
            <p><strong>Details:</strong> {report.details ?? "N/A"}</p>
            <p><strong>Status:</strong> {report.status ?? "pending"}</p>
            <button className="mt-3 rounded bg-red-600 px-3 py-2 text-white" type="submit" disabled={report.status === "approved"}>
              Approve Blacklist
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
