# Plan: Decouple Sign-In from Gmail Scan OAuth

## Goal
- Sign-in via Google: use **Lovable-managed Google OAuth** (no custom client, no verification, no test-user list).
- Gmail mailbox scanning: keep the **custom OAuth client** flow (requires `gmail.readonly` restricted scope), but make it work or fail gracefully without breaking sign-in.

## Why
The current 403 happens because the same custom Google OAuth client (`87500962869-…`) is used for the Gmail scan. Its consent screen is in Testing/unverified state, so Google blocks anyone not listed as a test user. Sign-in itself doesn't need Gmail scopes, so we move it to the managed flow.

## Changes

### 1. Enable Lovable-managed Google sign-in
- Call `configure_social_auth` with `providers: ["google"]` to ensure managed Google is enabled in Lovable Cloud Auth.
- `src/pages/Auth.tsx` already calls `lovable.auth.signInWithOAuth("google", …)` — no code change needed there.

### 2. Gmail scan flow stays separate
- Keep `gmail-auth` / `gmail-callback` edge functions and `useGmailConnection.connectGmail()` exactly as they are. They use the custom `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` secrets and request `gmail.readonly`.
- This means clicking "Connect Gmail" still hits the custom client. To make it actually work, the user must either:
  - **(a)** Add `pjcooley7@gmail.com` (and any other testers) as test users in the Google Cloud Console that owns client `87500962869-…`, **or**
  - **(b)** Provide a different `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` belonging to a project where the user is a test user / the app is verified.

### 3. UX polish on Connections page
- In `src/pages/Connections.tsx`, add a short note next to "Connect Gmail" explaining that mailbox scanning requires extra Google permissions and may show a "not verified" warning during testing. (Pure copy change; no logic change.)

### 4. No changes to:
- `gmail-auth/index.ts`, `gmail-callback/index.ts`, `gmail-scan/index.ts`
- `useGmailConnection.tsx` logic
- DB schema

## Technical Notes
- Sign-in and Gmail-scan use **two different Google OAuth flows** intentionally:
  - Sign-in → managed by Lovable, no Gmail scope, no verification needed.
  - Gmail-scan → custom client, restricted `gmail.readonly` scope, requires test-user listing or full verification.
- The user's existing `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` secrets remain in place and are only consumed by `gmail-auth` / `gmail-callback`.
- Auth.tsx's existing `handleOAuthSignIn('google')` path is the managed flow; nothing to migrate.

## After this plan
You'll be able to sign in with Google immediately (no 403). The "Connect Gmail" button will still 403 until you add yourself as a test user in the Google Cloud Console for client `87500962869-…` — I'll provide step-by-step instructions for that as a follow-up if needed.
