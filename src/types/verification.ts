export type VerificationVerdict = "LIKELY_SCAM" | "SUSPICIOUS" | "LOW_RISK";

export interface VerificationResult {
  trustScore: number; // 1-10
  verdict: VerificationVerdict;
  reasoning: string[];
  source: "blacklist" | "gemini";
}
