# Password Auth + Invite Link Flow

## Summary

Replace email verification code login with password login. Add invite link flow so invited users can onboard without email delivery.

## Two Problems to Fix

1. **Auth flow**: Switch to password-based login (email code flow is broken due to Resend free tier)
2. **Vercel build error**: `Module not found: Can't resolve '@/generated/prisma/client'` — need `prisma generate` in build script

---

## Changes

### 1. Fix Vercel build error

**File: `package.json`**
- Change `"build": "next build"` → `"build": "prisma generate && next build"`

### 2. Schema: Add `token` field to WorkspaceInvite

**File: `prisma/schema.prisma`**
- Add `token String @unique @default(cuid())` to `WorkspaceInvite` model
- This token powers the invite link

### 3. New API: Accept invite (`/api/auth/accept-invite/route.ts`)

- `POST { token, name, password }`
- Finds the invite by token
- Creates user with hashed password (or updates existing user's password)
- Converts invite into a `WorkspaceMember`
- Deletes the invite
- Returns success (client then logs in with credentials)

### 4. New page: Accept invite (`/invite/[token]/page.tsx`)

- Server component that looks up invite by token
- Shows: "You've been invited to [workspace] by [owner]"
- Renders a form: name + password + confirm password
- On submit → calls accept-invite API → auto signs in → redirects to `/`

### 5. Update login form to use password

**File: `src/components/login-form.tsx`**
- Replace the code-based flow with email + password fields
- Add a "Sign in" button that calls `signIn("credentials", { email, password })`
- Add link to register page for new users without invites

### 6. Update invite API to return/show link instead of sending email

**File: `src/app/api/workspace/invite/route.ts`**
- Remove Resend email send (no longer needed)
- Return the invite with its token in the response

**File: `src/components/team-page.tsx`**
- After creating an invite, show a copyable invite link: `{origin}/invite/{token}`
- Add a "Copy link" button next to pending invites

### 7. Update workspace GET to check pending invites on login

**File: `src/app/api/workspace/route.ts`**
- No change needed — the accept-invite endpoint handles member creation directly

### 8. Settings: Allow existing user to set/change password

**File: `src/app/settings/page.tsx`** (or a new section)
- Add a "Set password" / "Change password" form
- API: `POST /api/auth/set-password` — requires auth session, sets hashed password on user

### 9. Clean up (optional, low priority)

- Remove `/api/auth/send-code/route.ts` (dead code)
- Remove `/api/auth/verify-code/route.ts` (dead code)
- Remove `resend` from the send-code path (keep it only if still needed for other emails)

---

## Migration

After schema change, run:
```
npx prisma db push
```
(or create a migration)

## File list (new/modified)

| Action | File |
|--------|------|
| Modify | `package.json` — add prisma generate to build |
| Modify | `prisma/schema.prisma` — add token to WorkspaceInvite |
| Modify | `src/components/login-form.tsx` — password login |
| Modify | `src/app/api/workspace/invite/route.ts` — remove email, return token |
| Modify | `src/components/team-page.tsx` — show copy link |
| Create | `src/app/api/auth/accept-invite/route.ts` |
| Create | `src/app/invite/[token]/page.tsx` |
| Create | `src/components/accept-invite-form.tsx` |
| Create | `src/app/api/auth/set-password/route.ts` |
| Modify | `src/app/api/auth/register/route.ts` — also check for pending invites and auto-join workspace |
