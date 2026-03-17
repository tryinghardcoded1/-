import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifySellerIdentity } from "@/lib/firebase/ai-logic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const { identityInput, context } = await req.json();

    if (!identityInput || typeof identityInput !== "string") {
      return NextResponse.json({ error: "identityInput is required" }, { status: 400 });
    }

    const result = await verifySellerIdentity({ identityInput, context });

    const batch = adminDb.batch();
    batch.set(
      adminDb.collection("profiles").doc(decoded.uid).collection("searchHistory").doc(),
      {
        query: identityInput,
        result,
        createdAt: FieldValue.serverTimestamp(),
      }
    );
    batch.set(adminDb.collection("search_logs").doc(), {
      uid: decoded.uid,
      query: identityInput,
      result,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Verification failed", details: String(error) }, { status: 500 });
  }
}
