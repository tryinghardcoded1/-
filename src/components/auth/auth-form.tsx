"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (mode === "register") {
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) await updateProfile(creds.user, { displayName });

        await setDoc(
          doc(db, "profiles", creds.user.uid),
          {
            displayName: displayName || null,
            email,
            role: "user",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-6">
      <h2 className="text-xl font-semibold">{mode === "login" ? "Login" : "Register"}</h2>
      {mode === "register" && (
        <input className="w-full rounded border p-2" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      )}
      <input className="w-full rounded border p-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full rounded border p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-black p-2 text-white" type="submit">{mode === "login" ? "Sign in" : "Create account"}</button>
      <button className="w-full text-sm underline" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
      </button>
    </form>
  );
}
