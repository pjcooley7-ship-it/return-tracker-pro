# CONVENTIONS.md
# Paste this into Lovable Project Knowledge or reference from ManusAI prompts.

## Project: Return Tracker Pro

## Folder Structure
Follow this structure strictly. Do not create new top-level directories.

```
src/
  components/
    ui/           → shadcn/ui primitives only
    layout/       → Shell components (sidebar, header, page wrapper)
    dashboard/    → Dashboard-specific components
    returns/      → Return management components
    connections/  → External service connection components
  hooks/          → Custom React hooks (one hook per file)
  integrations/   → Supabase client and generated types
  lib/            → Shared types, utilities, constants
  pages/          → One file per route
  test/           → Test files mirroring src/ structure
supabase/
  functions/      → One directory per edge function
```

## Code Style

### Components
- Use named exports, not default exports
- Keep components under 150 lines — split if larger
- One component per file
- Props must have explicit TypeScript interfaces
- Use Tailwind classes for styling — no inline styles, no CSS modules
- Use shadcn/ui components from src/components/ui/ — do not create custom primitives

### Data Fetching
- Use TanStack React Query for all server state
- Define queries and mutations in custom hooks (src/hooks/)
- Never use raw useEffect for fetching data
- Use Supabase client from src/integrations/supabase/client.ts
- Invalidate queries after mutations — use specific query keys, not broad invalidation

### Forms
- Use React Hook Form with Zod schemas for validation
- Define Zod schemas next to the form component or in lib/
- Show validation errors inline using FormMessage from shadcn/ui

### State Management
- Server state: React Query
- Auth state: useAuth context (src/hooks/useAuth.tsx)
- Local UI state: useState / useReducer
- No global state library — keep state close to where it's used

### TypeScript
- Use explicit types for all props, function parameters, and return values
- Avoid `any` — use `unknown` with type guards if needed
- Define shared types in src/lib/types.ts
- Database types are generated in src/integrations/supabase/types.ts

### Error Handling
- Use Sonner toast for user-facing errors: `import { toast } from 'sonner'`
- Log errors to console with context: `console.error('[ComponentName]:', error)`
- Handle loading and error states in every component that fetches data
- Edge functions must return proper HTTP status codes with error messages

### Edge Functions (Supabase)
- Use `Deno.serve()` (not the deprecated `serve()` import)
- Always validate Authorization header
- Use service role client only when necessary — prefer user's JWT
- Return JSON responses with consistent shape: `{ data, error }`
- Handle CORS with OPTIONS preflight

## Commits
- One logical change per commit
- Use descriptive commit messages: "Add return status filter" not "Changes"
- Do not bundle unrelated features in a single commit

## Security
- Never expose API keys or secrets in client code
- Use environment variables for all secrets (VITE_ prefix for client-accessible)
- Encrypt tokens before storing in the database
- Validate all user input server-side in edge functions
- Use Supabase RLS — never bypass on the client

## Accessibility
- All interactive elements must be keyboard accessible
- Form inputs must have associated labels
- Use ARIA attributes on custom interactive components
- Color must not be the only indicator of state — use icons or text too
