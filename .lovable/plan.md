# Fix: Google 403 on "Connect Gmail"

## What the error means

The OAuth URL being generated is correct (verified in network logs). The 403 is returned by `accounts.google.com` itself, before any user consent. This is a configuration issue with the Google Cloud OAuth client (`87500962869-...apps.googleusercontent.com`), not with our app code.

## Most likely cause (90%): OAuth consent screen is in Testing mode

Google requires the `gmail.readonly` scope (a "restricted" scope) to either:
- Have the app **verified** by Google (multi-week review process), or
- Be in **Testing** mode with each user explicitly added to the test-user list (max 100 users)

If your project is in Testing mode and `pjcooley7@gmail.com` isn't listed as a test user, Google blocks with exactly the 403 you saw.

## Action for you (no code changes needed first)

Go to Google Cloud Console for the project that owns client ID `87500962869-...`:

1. **APIs & Services → OAuth consent screen**
2. Check **Publishing status**:
   - If **Testing** → scroll to **Test users** → click **+ Add users** → add `pjcooley7@gmail.com` (and any other emails you want to test with) → Save.
   - If **In production** but unverified → you'll see a verification banner; restricted scopes won't work for non-test users until verified.
3. **APIs & Services → Credentials → click your OAuth 2.0 Client ID**
   - Under **Authorized redirect URIs**, confirm this exact URL is listed:
     `https://weluosjthorckfmhjaol.supabase.co/functions/v1/gmail-callback`
   - If missing, add it and Save.
4. **APIs & Services → Library** → confirm **Gmail API** is **Enabled**.

Then retry **Connect Gmail**. The 403 should be gone.

## If that doesn't fix it

Tell me what the OAuth consent screen says (Testing vs In production, User type Internal vs External, any verification warnings), and I'll diagnose further. Possible fallbacks:

- **Switch to Lovable-managed Google OAuth credentials** for sign-in (no Gmail scope, no verification needed) and keep your custom client only for the Gmail-scan flow once test users are added.
- **Reduce scope risk**: `gmail.readonly` is restricted; there's no lighter-weight alternative for reading email content, so verification is the only long-term path for non-test users.

## What I'm NOT changing in code right now

The current `gmail-auth` edge function is generating the right URL with the right scope, redirect URI, and HMAC-signed state. No code change will fix a Google Cloud configuration issue. Once you add the test user, the existing flow should work end-to-end.

Approve this and I'll just monitor — no edits needed unless step 1–4 fails.
