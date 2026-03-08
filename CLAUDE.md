# CLAUDE.md

## Project Overview

**Return Tracker Pro** — A web app for tracking product returns, refunds, and shipping status.
Built with Lovable. UI generated externally, refined and extended locally with Claude Code.

## Tech Stack

- **React 18** + **TypeScript 5.8** (strict null checks, non-strict mode)
- **Vite 5** with SWC plugin for fast compilation
- **Tailwind CSS 3** + **shadcn/ui** (Radix primitives, slot-based composition)
- **Supabase** (auth, Postgres database with RLS, Deno edge functions)
- **TanStack React Query 5** (server state, caching, mutations)
- **React Router DOM 6** (client-side routing, lazy-loaded pages)
- **React Hook Form** + **Zod** (forms and validation)
- **Recharts** (dashboard charts)
- **Sonner** (toast notifications)
- **Lucide React** (icons)
- **date-fns** (date formatting/manipulation)
- **Vitest** + **Testing Library** (unit/component testing)

## Project Structure

```
src/
  App.tsx                 → Root component: providers, routing, lazy loading
  main.tsx                → Entry point: global error handlers, render
  index.css               → Tailwind directives + CSS custom properties (design tokens)
  components/
    ui/                   → shadcn/ui primitives (55 files — do NOT edit directly)
    layout/
      AppSidebar.tsx      → Navigation sidebar (131 lines)
      DashboardLayout.tsx → Page wrapper with sidebar (43 lines)
    dashboard/
      StatsCard.tsx       → Statistics display card (51 lines)
      ReturnCard.tsx      → Individual return card with status badge (143 lines)
    returns/
      AddReturnDialog.tsx → Form dialog to create a return (278 lines) ⚠️
      AddTrackingDialog.tsx → Add tracking info dialog (151 lines)
      ReturnDetailsDialog.tsx → Return details view (202 lines) ⚠️
      TrackingDetails.tsx → Tracking event timeline (93 lines)
    connections/
      ScannedEmailsPanel.tsx → Gmail scanned emails display (158 lines)
    ErrorBoundary.tsx     → React error boundary (53 lines)
    NavLink.tsx           → Sidebar navigation link (28 lines)
  hooks/
    useAuth.tsx           → Auth context: user, session, signIn/signUp/signOut (79 lines)
    useReturns.tsx        → Returns CRUD queries/mutations + dashboard stats (153 lines)
    useGmailConnection.tsx → Gmail OAuth (linkIdentity), email scanning, return detection (~400 lines) ⚠️
    useTracking.tsx       → Shipment tracking query/mutation (71 lines)
    use-mobile.tsx        → Mobile breakpoint detection at 768px (19 lines)
  integrations/
    supabase/
      client.ts           → Supabase client instance (auto-generated — do not edit)
      types.ts            → Generated database types (auto-generated — do not edit)
  lib/
    types.ts              → App-level type definitions (Return, Tracking, Profile, etc.)
    utils.ts              → cn() utility for Tailwind class merging
    logger.ts             → Structured logging utility (console-only for now)
  pages/
    Index.tsx             → Redirects to Dashboard
    Auth.tsx              → Sign in / sign up forms (199 lines)
    Dashboard.tsx         → Overview with stats cards and return list (144 lines)
    ActiveReturns.tsx     → Returns currently in transit (63 lines)
    AwaitingRefund.tsx    → Delivered items awaiting refund (58 lines)
    CompletedReturns.tsx  → Refunded returns (56 lines)
    Connections.tsx       → Gmail integration setup and email scanning (306 lines) ⚠️
    Notifications.tsx     → Notification list (105 lines)
    Settings.tsx          → User preferences (122 lines)
    NotFound.tsx          → 404 page (28 lines)
  test/
    setup.ts              → Vitest setup (matchMedia polyfill)
    example.test.ts       → Placeholder test
supabase/
  config.toml             → Supabase project configuration
  functions/
    gmail-auth/           → DEPRECATED — no longer called (replaced by linkIdentity)
    gmail-callback/       → DEPRECATED — no longer called (replaced by linkIdentity)
    gmail-scan/           → Scans Gmail for return-related emails (~1140 lines)
    track-shipment/       → Fetches carrier tracking status (302 lines)
  migrations/             → Database schema migrations (3 files)
```

> ⚠️ = Exceeds the 150-line component guideline; candidate for refactoring.

## Application Architecture

### Provider Tree (App.tsx)

```
ErrorBoundary
  └─ QueryClientProvider
       └─ TooltipProvider
            └─ Sonner (toast layer)
                 └─ BrowserRouter
                      └─ AuthProvider
                           └─ AppRoutes (Suspense + lazy-loaded pages)
```

### Routing

All pages are lazy-loaded via `React.lazy()`. Protected routes redirect unauthenticated users to `/auth`.

| Path | Page | Auth Required |
|------|------|:---:|
| `/auth` | Auth | No |
| `/` | Dashboard | Yes |
| `/returns/active` | ActiveReturns | Yes |
| `/returns/awaiting` | AwaitingRefund | Yes |
| `/returns/completed` | CompletedReturns | Yes |
| `/notifications` | Notifications | Yes |
| `/connections` | Connections | Yes |
| `/settings` | Settings | Yes |
| `*` | NotFound | No |

### State Management

- **Server state:** React Query — all data fetching via custom hooks in `src/hooks/`
- **Auth state:** React Context via `useAuth` (wraps Supabase auth)
- **Local UI state:** `useState` / `useReducer` in components
- **No global state library** — keep state close to where it's used

### Key Types (src/lib/types.ts)

- `ReturnStatus`: `'initiated' | 'label_created' | 'in_transit' | 'delivered' | 'awaiting_refund' | 'refunded' | 'disputed'`
- `TrackingStatus`: `'pre_transit' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown'`
- `Return`: Core return record with vendor info, items, status, timestamps, optional tracking
- `Tracking`: Carrier, tracking number, status, history events
- `Profile`: User preferences (refund thresholds, notification settings)
- `ConnectedAccount`: Gmail/Plaid integration records
- `Notification`: User-facing notifications with type discriminator

### Error Handling

- **Global:** `window.onerror` and `onunhandledrejection` handlers in `main.tsx` log via `logger`
- **React:** `ErrorBoundary` wraps the entire app
- **User-facing:** Sonner toasts — `import { toast } from 'sonner'`
- **Logging:** `import { logger } from '@/lib/logger'` — structured console logging with severity levels

## Development Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
npm run test         # Run Vitest tests once
npm run test:watch   # Run Vitest in watch mode
```

## Configuration

- **Path alias:** `@` maps to `./src` (in vite.config.ts and tsconfig.json)
- **TypeScript:** Non-strict mode with `strictNullChecks: true` — see tsconfig.app.json
- **Dev server:** Port 8080, HMR overlay disabled
- **Tailwind:** HSL-based custom color variables, dark mode via class, sidebar theme tokens
- **Supabase env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (in `.env`)

## Conventions

### Exports and Imports

- **Named exports only** for components and hooks
- Exception: page components use `export default` because `React.lazy()` requires it
- Use the `@/` path alias for all imports from `src/`

### Styling

- Tailwind classes for all styling — no inline styles, no CSS modules
- Use shadcn/ui components from `src/components/ui/` — do not modify these directly
- Use `cn()` from `@/lib/utils` to merge conditional Tailwind classes

### Data Fetching

- React Query for all server state — no raw `useEffect` for fetching
- Define queries and mutations in custom hooks (`src/hooks/`)
- Invalidate queries after mutations using specific query keys
- Supabase client from `src/integrations/supabase/client.ts`

### Forms

- React Hook Form + Zod schemas for all form validation
- Define Zod schemas next to the form component or in `lib/`
- Show validation errors inline using `FormMessage` from shadcn/ui

### TypeScript

- Explicit types for props, function parameters, and return values
- Avoid `any` — use `unknown` with type guards if needed
- Shared types in `src/lib/types.ts`
- Database types auto-generated in `src/integrations/supabase/types.ts`

### Components

- One component per file, under 150 lines
- Props must have explicit TypeScript interfaces
- Use Sonner toast for user-facing errors: `import { toast } from 'sonner'`
- Log errors with context: `console.error('[ComponentName]:', error)` or use `logger`

### Edge Functions (Supabase)

- Use `Deno.serve()` (not the deprecated `serve()` import)
- Validate Authorization header
- Prefer user's JWT over service role client
- Return JSON with consistent shape: `{ data, error }`
- Handle CORS with OPTIONS preflight

### Security

- Never expose API keys or secrets in client code
- Use `VITE_` prefix only for client-safe environment variables
- OAuth tokens stored as plaintext in `connected_accounts` (Vault encryption removed — PoC only)
- Validate all user input server-side in edge functions
- Use Supabase RLS — never bypass with service role on the client

### Accessibility

- All interactive elements must be keyboard accessible
- Form inputs must have associated labels
- Use ARIA attributes on custom interactive components
- Color must not be the only indicator of state — use icons or text too

## When Reviewing Generated Code

- Flag unused dependencies and dead code
- Flag accessibility issues (missing ARIA labels, keyboard navigation)
- Flag security concerns (XSS, injection, exposed secrets, unencrypted tokens)
- Flag components over 150 lines that should be split
- Flag inconsistent patterns (mixed error handling, duplicated logic)
- Flag missing TypeScript strictness (`any` casts, missing types)

## When Implementing Features

- Follow existing patterns in the codebase
- Use React Query mutations for all data modifications
- Use Supabase RLS — never bypass with service role on client
- Keep components under 150 lines
- Add Zod validation for any new forms
- Test with Vitest — place tests in `src/test/`

## Known Issues (Tracked)

- **Minimal test coverage** — only 1 placeholder test exists in `src/test/example.test.ts`
- **Status config duplicated** across `ReturnCard`, `ReturnDetailsDialog`, and `TrackingDetails` — should be extracted to a shared config
- **Oversized files** — `AddReturnDialog` (278 lines), `ReturnDetailsDialog` (202 lines), `Connections` page (306 lines), `useGmailConnection` hook (347 lines)
- **Logger not persisting** — `logger.ts` only writes to console; the `error_logs` table exists in migrations but is not wired up client-side
