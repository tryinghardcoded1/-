import { getAI, SchemaType } from "@firebase/ai-logic";
import { adminDb } from "@/lib/firebase/admin";
import { PH_SCAM_ANALYSIS_PROMPT } from "@/lib/verification/prompts";
import type { VerificationResult } from "@/types/verification";

const ai = getAI({
  apiKey: process.env.FIREBASE_WEB_API_KEY!,
  model: "gemini-3.1-flash-lite-preview",
});

function normalizeIdentity(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function verifySellerIdentity(params: {
  identityInput: string;
  context?: string;
}): Promise<VerificationResult> {
  const normalizedKey = normalizeIdentity(params.identityInput);

  const blacklisted = await adminDb
    .collection("global_blacklist")
    .where("normalizedKey", "==", normalizedKey)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (!blacklisted.empty) {
    const reason = blacklisted.docs[0].data().reason ?? "Matched approved blacklist entry";
    return {
      trustScore: 1,
      verdict: "LIKELY_SCAM",
      reasoning: [reason],
      source: "blacklist",
    };
  }

  const response = await ai.generate({
    prompt: `${PH_SCAM_ANALYSIS_PROMPT}\n\nIdentity Input: ${params.identityInput}\nContext: ${params.context ?? "N/A"}`,
    responseFormat: {
      type: SchemaType.OBJECT,
      properties: {
        trustScore: { type: SchemaType.NUMBER },
        verdict: { type: SchemaType.STRING },
        reasoning: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ["trustScore", "verdict", "reasoning"],
    },
  });

  const parsed = response.output as VerificationResult;
  return {
    ...parsed,
    trustScore: Math.max(1, Math.min(10, parsed.trustScore)),
    source: "gemini",
  };
}
