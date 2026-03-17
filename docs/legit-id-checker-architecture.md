# Legit ID Checker — Production Architecture (Next.js + Firebase)

## 1) Project Layout

```txt
src/
  app/
    (public)/
      page.tsx
    admin/dashboard/
      page.tsx
      actions.ts
    api/verify/route.ts
  components/
    auth/auth-form.tsx
  lib/
    firebase/
      client.ts
      admin.ts
      ai-logic.ts
    verification/
      prompts.ts
  types/
    verification.ts
firestore.rules
```

## 2) Firebase Data Model

- `profiles/{uid}`
  - `displayName`, `email`, `role` (`user|admin`), `createdAt`
  - `searchHistory` subcollection (`profile/{uid}/searchHistory/{searchId}`)
- `global_blacklist/{docId}`
  - `normalizedKey`, `rawInput`, `category`, `reason`, `status` (`active|disabled`), `approvedBy`, `approvedAt`
- `scam_reports/{reportId}`
  - `reporterUid`, `suspectName`, `suspectId`, `evidenceUrl`, `details`, `status` (`pending|approved|rejected`), `createdAt`
- `search_logs/{logId}` (server-write only)
  - `uid`, `query`, `result`, `createdAt`

## 3) Separation: Public vs Admin

- **Public Searches**
  - Call `/api/verify`.
  - Reads only approved blacklist entries and runs Gemini analysis for non-blacklisted input.
  - Stores search history only under the current user profile.
- **Admin Management**
  - `/admin/dashboard` is server-protected and role-gated.
  - Admin can list `scam_reports` and approve to `global_blacklist`.
  - Approval done via server action using Firebase Admin SDK.

## 4) Vercel Deployment Notes

- Use server runtime for all privileged operations (Admin SDK + AI calls).
- Keep Firebase client SDK only in browser components.
- Use env vars:
  - `NEXT_PUBLIC_FIREBASE_*`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_WEB_API_KEY`
- Prefer region-localized Firebase project (`asia-southeast1`) for PH latency.
