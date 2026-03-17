"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export async function approveBlacklist(reportId: string, adminUid: string) {
  const reportRef = adminDb.collection("scam_reports").doc(reportId);
  const report = await reportRef.get();
  if (!report.exists) throw new Error("Report not found");

  const data = report.data()!;
  const normalizedKey = `${data.suspectName ?? ""} ${data.suspectId ?? ""}`.trim().toLowerCase();

  const batch = adminDb.batch();
  batch.set(adminDb.collection("global_blacklist").doc(), {
    normalizedKey,
    rawInput: {
      suspectName: data.suspectName ?? null,
      suspectId: data.suspectId ?? null,
    },
    reason: data.details ?? "Approved from user report",
    category: "user_report",
    status: "active",
    approvedBy: adminUid,
    approvedAt: FieldValue.serverTimestamp(),
    sourceReportId: reportId,
  });

  batch.update(reportRef, {
    status: "approved",
    reviewedBy: adminUid,
    reviewedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}
