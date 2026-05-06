# End-to-End Test Plan: Login → Gmail Scan → Save Returns

## What I already verified (no clicks required)

| Step | Status | Notes |
|---|---|---|
| `/auth` page renders | Works | Email/password + Google + Apple buttons all present |
| Email/password sign-in | Works | You're already signed in as `pjcooley7@gmail.com` |
| Google managed sign-in button | Wired | Uses `lovable.auth.signInWithOAuth("google")` |
| Apple managed sign-in button | Wired | Same flow as Google |
| Dashboard loads with returns | Works | Shows 1 active + 1 awaiting refund (H&M) — leftover test data |
| `/connections` page renders | Works | Both Gmail + Bank cards visible |
| Gmail edge functions deployed | Yes | `gmail-auth` booted 1 min ago, `gmail-callback` & `gmail-scan` deployed |
| `connected_accounts` table | Empty | No Gmail connection currently saved for any user |
| Required secrets present | Yes | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TRACKINGMORE_API_KEY` all set |

## Known gap I spotted while reading the code

`supabase/functions/gmail-callback/index.ts` hardcodes the post-OAuth redirect to `https://id-preview--...lovable.app`. If you start the Gmail connect flow from any other origin (the `lovableproject.com` sandbox preview, or the published `refund-angel.lovable.app`), Google will send you back to the wrong domain after consent — you'll end up on the preview instead of where you started. We should make this dynamic before the live test, or at least be aware of it.

## The live test we need you to run

The Google OAuth consent screen requires real human clicks on `accounts.google.com` (third-party domain, no sandbox access), so the actual Gmail connect step must be done by you. I'll watch the logs and DB in real time.

### Steps

1. **You**: On the published app (`refund-angel.lovable.app`) or the preview, sign out and sign back in with **Google** (managed) to verify that flow end-to-end.
2. **You**: Go to **Connected Accounts** → click **Connect Gmail**.
3. **You**: Complete the Google consent screen (grant `gmail.readonly`).
4. **Me**: Verify a row appeared in `connected_accounts` with `is_active=true` and a non-null `refresh_token_encrypted`.
5. **You**: Pick a scan range (try **Last 30 days**) and click **Scan Emails**.
6. **Me**: Tail `gmail-scan` edge logs, confirm it returns scanned emails + detected returns, and check the `ScannedEmailsPanel` populates.
7. **You**: For one detected return, confirm vendor + click **Save**.
8. **Me**: Verify a new row in `returns` and that the dashboard reflects it.

For each step I'll report exactly what worked and what didn't, and we'll fix issues as they surface (most likely candidates: callback redirect URL, scan timeouts on large mailboxes, vendor detection misses).

## Two small fixes I'd recommend doing before the live test

1. **Make `gmail-callback` redirect dynamic** — pass the origin through OAuth `state` so users are returned to whichever domain they started from (preview vs. published vs. custom domain).
2. **Clear leftover test data** — the H&M returns currently on your dashboard look like seed data from earlier; deleting them gives you a clean baseline so any new returns from the scan are obviously new.

Approve this and I'll switch to build mode, apply the two fixes, then walk you through the live test step by step.
