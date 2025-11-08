# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an admin dashboard application built with:
- **Backend**: Convex (database, server logic, authentication)
- **Frontend**: React 19 + Vite
- **UI**: shadcn/ui components + Tailwind CSS 4
- **Auth**: Convex Auth with custom admin signup flow using secret codes

## Development Commands

### Starting Development
```bash
npm run dev
# Runs frontend (Vite) and backend (Convex) in parallel
# Opens browser automatically and Convex dashboard
```

### Individual Services
```bash
npm run dev:frontend  # Vite dev server only
npm run dev:backend   # Convex dev only
```

### Building and Quality Checks
```bash
npm run build    # TypeScript compile + Vite build
npm run lint     # TypeScript check + ESLint
npm run preview  # Preview production build
```

## Architecture

### Backend Structure (Convex)

All backend code lives in `/convex` directory with **file-based routing**:

- `schema.ts` - Database schema with table definitions and indexes
- `auth.ts` - Convex Auth configuration with custom Password provider
- `adminAuth.ts` - Admin-specific authentication (secret code validation)
- `myFunctions.ts` - Example queries/mutations (getCurrentUser, etc.)
- `http.ts` - HTTP endpoint definitions

**Key Convex Patterns:**
- Always use the **new function syntax** with validators:
  ```typescript
  export const myQuery = query({
    args: { userId: v.id("users") },
    returns: v.object({ name: v.string() }),
    handler: async (ctx, args) => { ... }
  });
  ```
- Use `api` object for public functions, `internal` for internal functions
- Function references: `api.myFunctions.getCurrentUser` (not direct function calls)
- Call functions with `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction`

### Frontend Structure (React + Vite)

```
src/
├── App.tsx                    # Main app with auth flow routing
├── main.tsx                   # React entry point
├── app/
│   └── dashboard/page.tsx     # Main dashboard page content
├── components/
│   ├── Dashboard.tsx          # Dashboard layout wrapper
│   ├── login-form.tsx         # shadcn login-03 block
│   ├── signup-form.tsx        # shadcn signup-02 block (custom)
│   ├── app-sidebar.tsx        # App navigation sidebar
│   ├── site-header.tsx        # Site header component
│   └── ui/                    # shadcn/ui components
```

### Authentication Flow

1. **Unauthenticated**: Shows `AuthFlow` component that switches between login/signup
2. **Signup Process**:
   - User enters: firstName, lastName, email, password, admin secret code
   - Frontend validates secret code via `adminAuth.validateSecretCode` mutation
   - If valid, calls Convex Auth Password provider to create account
   - `auth.ts` profile function automatically sets admin fields (role, isPeopleManager, teamLead)
3. **Authenticated**: Shows `Dashboard` component with sidebar layout

### Database Schema

**users table** (extends Convex Auth base schema):
- Standard auth fields: `name`, `email`, `image`, `emailVerificationTime`, `phone`, `isAnonymous`
- Custom admin fields: `firstName`, `lastName`, `role`, `isPeopleManager`, `teamLead`
- Index: `by_email` on `email` field

**numbers table** (example table):
- `value: v.number()`

### Environment Variables

**CRITICAL**: `ADMIN_SECRET_CODE` must be set in **Convex Cloud Dashboard**, NOT in `.env.local`:

1. Go to https://dashboard.convex.dev
2. Select project → Settings → Environment Variables
3. Add: `ADMIN_SECRET_CODE = your-secret-code`
4. Changes apply immediately (no redeploy needed)

This variable is accessed in `convex/adminAuth.ts` via `process.env.ADMIN_SECRET_CODE`.

## Convex Development Guidelines

### Function Registration
- Public: `query`, `mutation`, `action` (exposed to clients)
- Internal: `internalQuery`, `internalMutation`, `internalAction` (server-only)
- **Always** include `args` and `returns` validators
- If no return value, use `returns: v.null()`

### Database Operations
- Queries: Use indexes with `.withIndex()` instead of `.filter()` for performance
- Default ordering: ascending by `_creationTime`
- Use `.order("desc")` or `.order("asc")` to specify order
- Delete: Collect results first, then iterate and call `ctx.db.delete(id)`
- Update: `ctx.db.patch()` for partial updates, `ctx.db.replace()` for full replacement

### Type Safety
- Import types from `convex/_generated/dataModel`: `Doc<"users">`, `Id<"users">`
- Be strict with ID types: use `Id<"users">` not `string`
- Use `as const` for string literals in discriminated unions
- When calling functions in same file, add type annotation to work around circularity:
  ```typescript
  const result: string = await ctx.runQuery(api.example.f, { name: "Bob" });
  ```

### Getting Current User
```typescript
import { getAuthUserId } from "@convex-dev/auth/server";

const userId = await getAuthUserId(ctx);
if (userId === null) return null;
const user = await ctx.db.get(userId);
```

## Frontend Development Guidelines

### Component Patterns
- Uses shadcn/ui components extensively (see `src/components/ui/`)
- React 19 features available (use hooks, concurrent features)
- Client components marked with `"use client"` directive

### Convex React Integration
```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// In component:
const data = useQuery(api.myFunctions.getCurrentUser);
const addNumber = useMutation(api.myFunctions.addNumber);
```

### Styling
- Tailwind CSS 4 with @tailwindcss/vite plugin
- shadcn/ui uses CSS variables for theming
- Dark mode support via `next-themes`

## Testing Admin Signup

1. Set `ADMIN_SECRET_CODE` in Convex dashboard
2. Run `npm run dev`
3. Click "Sign up as Admin"
4. Fill form with correct secret code
5. Verify user created with `role: "admin"` in Convex dashboard

## Important Notes

- This codebase follows the **Convex guidelines** in `.cursor/rules/convex_rules.mdc` - always reference that file for Convex-specific best practices
- Admin signup uses server-side secret code validation for security
- All admin users default to `isPeopleManager: "No"` and `teamLead: null`
- The app uses shadcn blocks (login-03, signup-02) extensively - maintain this design system
- File-based routing in Convex: `convex/myFunctions.ts` → `api.myFunctions.functionName`
