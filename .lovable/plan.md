

## Plan: Connect App to Supabase (Auth + Database)

### Overview
Replace all mock/in-memory data with a real Supabase backend. Install the Supabase client, wire up authentication, and replace DataContext with hooks that perform CRUD against Supabase tables.

### Prerequisites
The user must create these tables in their Supabase project (or they may already exist):

```text
accounts (id uuid PK default gen_random_uuid(), user_id uuid references auth.users(id), name text, type text, currency text, balance numeric, icon text, color text, created_at timestamptz default now(), updated_at timestamptz default now())

profiles (id uuid PK default gen_random_uuid(), user_id uuid references auth.users(id), name text, type text, created_at timestamptz default now(), updated_at timestamptz default now())

transactions (id uuid PK default gen_random_uuid(), user_id uuid references auth.users(id), account_id uuid references accounts(id), profile_id uuid references profiles(id), type text, amount numeric, category text, notes text, date date, created_at timestamptz default now(), updated_at timestamptz default now())

transaction_edits (id uuid PK default gen_random_uuid(), transaction_id uuid references transactions(id) on delete cascade, field text, old_value text, new_value text, edited_at timestamptz default now())
```

RLS must be enabled on all tables with policies restricting to `auth.uid() = user_id`.

### Changes

**1. Install `@supabase/supabase-js` and create client**
- Add dependency
- Create `src/integrations/supabase/client.ts` initializing with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars

**2. Rewrite `AuthContext.tsx` with real Supabase Auth**
- Use `supabase.auth.signInWithPassword`, `signUp`, `signOut`
- Listen to `onAuthStateChange` for session state
- Set `loading` properly while session resolves
- Map Supabase user to the existing `User` interface

**3. Rewrite `DataContext.tsx` to use Supabase queries**
- On mount (when user is authenticated), fetch accounts, profiles, and transactions from Supabase filtered by user
- `addTransaction` → `supabase.from('transactions').insert(...)`
- `updateTransaction` → `supabase.from('transactions').update(...)` + insert into `transaction_edits`
- `deleteTransaction` → `supabase.from('transactions').delete(...)`
- `addAccount` → `supabase.from('accounts').insert(...)`
- `addProfile` / `deleteProfile` → same pattern
- Fetch transactions with joins: `.select('*, account:accounts(*), profile:profiles(*)')` to include related data
- Remove all mock/default data creation
- `getAccountBalance` computes from fetched transactions
- `getEditHistory` fetches from `transaction_edits` table

**4. Add `.env` file with Supabase credentials**
- `VITE_SUPABASE_URL=https://rhomjoyzfwghhvzxnloy.supabase.co`
- `VITE_SUPABASE_ANON_KEY=eyJhbGci...`

**5. Update `TransactionForm.tsx`**
- No structural changes needed — it already calls context functions
- Ensure `account_id` and `profile_id` are passed through correctly

**6. Update consuming pages**
- Add loading states while data is being fetched
- Handle errors with toast notifications

### Files to create/modify
- `src/integrations/supabase/client.ts` — new file, Supabase client init
- `src/contexts/AuthContext.tsx` — real auth
- `src/contexts/DataContext.tsx` — real CRUD
- `.env` — Supabase credentials (VITE_ prefixed)
- Pages (minor) — loading/error states

### Technical notes
- All queries filter by `user_id = auth.uid()` via RLS
- Transactions fetched with `select('*, account:accounts(*), profile:profiles(*)')` for related data
- Edit history stored in `transaction_edits` table, inserted alongside updates

