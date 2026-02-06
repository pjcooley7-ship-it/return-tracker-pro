# CLAUDE.md

## Project Overview
**Return Tracker Pro** — A web app for tracking product returns, refunds, and shipping status.
Built with Lovable. UI generated externally, refined and extended locally with Claude Code.

## Tech Stack
- React 18 + TypeScript
- Vite (SWC plugin)
- Tailwind CSS + shadcn/ui (Radix primitives)
- Supabase (auth, database, edge functions)
- TanStack React Query (data fetching/caching)
- React Router DOM (routing)
- React Hook Form + Zod (forms/validation)
- Recharts (charts)
- Vitest (testing)

## Project Structure
```
src/
  components/
    ui/           → shadcn/ui primitives (do not edit directly)
    layout/       → AppSidebar, DashboardLayout
    dashboard/    → StatsCard, ReturnCard
    returns/      → AddReturnDialog, ReturnDetailsDialog, TrackingDetails
    connections/  → ScannedEmailsPanel (Gmail integration)
  hooks/          → useAuth, useReturns, useGmailConnection, useTracking
  integrations/   → Supabase client, generated types
  lib/            → types.ts, utils.ts
  pages/          → Route-level page components
  test/           → Vitest test files
supabase/
  functions/      → Edge functions (gmail-auth, gmail-callback, gmail-scan, track-shipment)
```

## Conventions
- Named exports only (no default exports)
- Tailwind for all styling — no inline styles
- shadcn/ui components from src/components/ui/ — do not modify these directly
- React Query for all server state — no raw useEffect for data fetching
- Supabase client from src/integrations/supabase/client.ts
- Types defined in src/lib/types.ts and src/integrations/supabase/types.ts
- Form validation with Zod schemas
- Toast notifications via Sonner (preferred) — legacy Toaster also present

## When Reviewing Generated Code
- Flag unused dependencies and dead code
- Flag accessibility issues (missing ARIA labels, keyboard navigation)
- Flag security concerns (XSS, injection, exposed secrets, unencrypted tokens)
- Flag components over 150 lines that should be split
- Flag inconsistent patterns (mixed error handling, duplicated logic)
- Flag missing TypeScript strictness (any casts, missing types)

## When Implementing Features
- Follow existing patterns in the codebase
- Use React Query mutations for all data modifications
- Use Supabase RLS — never bypass with service role on client
- Keep components under 150 lines
- Add Zod validation for any new forms
- Test with Vitest — place tests in src/test/

## Known Issues (Tracked)
- OAuth tokens stored unencrypted in connected_accounts table
- TypeScript strict mode disabled (noImplicitAny, strictNullChecks are false)
- Minimal test coverage (1 placeholder test)
- Status config duplicated across ReturnCard, ReturnDetailsDialog, TrackingDetails
- Dual toast systems (Sonner + Toaster) — migrate to Sonner only
