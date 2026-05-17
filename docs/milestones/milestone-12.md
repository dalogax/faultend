# Milestone 12: GitHub OAuth & Email-Based Account Linking

**Status:** In Progress  
**Target Branch:** `feature/github-oauth`  
**Last Updated:** May 17, 2026  

---

## Overview

This milestone adds **GitHub OAuth login** alongside the existing Google OAuth, implementing **email-based account linking** so users who log in with either provider (using the same email) are recognized as the same user. This prevents duplicate accounts and provides a seamless multi-provider authentication experience.

---

## Goals

1. **GitHub OAuth** — Add GitHub as a second login provider
2. **Email-Based Account Linking** — Same email across providers = same user account
3. **Provider-Agnostic User Storage** — Decouple user identity from specific OAuth providers
4. **Backward Compatibility** — Existing Google users continue to work without disruption

---

## Database Changes

### New Table: `user_oauth_providers`

Replaces the provider-specific column approach with a normalized junction table:

```sql
CREATE TABLE user_oauth_providers (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(20) NOT NULL,  -- 'google', 'github'
  provider_id VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

CREATE INDEX idx_user_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX idx_user_oauth_providers_provider ON user_oauth_providers(provider, provider_id);
```

### Migration Strategy

Existing `users.google_id` data will be migrated into the new table. The `google_id` column will be retained for backward compatibility but no longer used for lookups.

---

## Authentication Flow

### Login Flow (Both Providers)

```
User clicks "Sign in with [Provider]"
    ↓
OAuth handshake (Google or GitHub)
    ↓
Passport strategy callback receives profile
    ↓
Extract email from profile
    ↓
Check if user exists with this email
    ├─ YES → Link provider to existing user (if not already linked)
    └─ NO  → Create new user, link provider
    ↓
Regenerate session, store userId
    ↓
Redirect to app
```

### Security Considerations

- **Email Verification**: Only link accounts when the provider confirms email verification
  - Google: Always verified (guaranteed by Google)
  - GitHub: Check `profile.emails[0].verified` flag
- **Account Takeover Prevention**: Without verification checks, an attacker could create a GitHub account with someone else's email and gain access to their account
- **Existing Users**: Current Google users will be transparently migrated on their next login

---

## Files to Modify

### Backend

| File | Changes |
|------|---------|
| `db/schema.sql` | Add `user_oauth_providers` table, indexes |
| `src/storage/users.js` | Add `findUserByEmail()`, `findUserByProvider()`, `linkProvider()`, update `createUser()` |
| `src/auth/passport.js` | Add GitHub strategy, update Google strategy to use email-based linking |
| `src/auth/routes.js` | Add `/github` and `/github/callback` routes |
| `package.json` | Add `passport-github2` dependency |
| `.env.example` | Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` |

### Frontend

| File | Changes |
|------|---------|
| `public/app.html` | Add "Sign in with GitHub" button |
| `public/js/auth.js` | Update `getLoginUrl()` to support both providers |

---

## Environment Variables

```bash
# GitHub OAuth (https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

Callback URL format: `https://app.{ROOT_DOMAIN}/api/auth/github/callback`

---

## Testing Checklist

- [ ] GitHub login creates new user when email doesn't exist
- [ ] Google login still works for existing users
- [ ] Same email via different providers links to same account
- [ ] Provider data stored correctly in `user_oauth_providers`
- [ ] Frontend shows both login buttons
- [ ] Session/auth middleware still works
- [ ] All existing tests pass

---

## Rollback Plan

If issues arise:
1. Revert branch changes
2. Database: `user_oauth_providers` table can be dropped; `users.google_id` still contains data
3. No user data loss — users table is untouched

---

## Future Considerations

- Add "unlink provider" feature in user settings
- Support additional OAuth providers (Microsoft, Apple, etc.)
- Add password-based login as fallback
