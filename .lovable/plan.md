

## Plan: Credit card as source account, billing cycle reset, "bank" profile type

### 1. Transaction form — unified source account picker

In `TransactionForm.tsx`, remove the separate "Cargar a tarjeta" toggle. Rename the current account section label to **"Cuenta de origen"**. Render two visual groups inside the same picker:

- **Cuenta** — list of regular accounts
- **Crédito** — list of credit accounts (shown right below)

Selecting a regular account → save with `account_id` set, `credit_account_id` null.
Selecting a credit account → save with `credit_account_id` set, `account_id` null.

For income/transfer types, only regular accounts are shown (credit accounts are expense-only as source).

### 2. Billing cycle logic in `DataContext.tsx`

Update `getCreditAccountBalance`:

- Add `cycleSpent` (replaces `monthlySpent` semantics) computed against a **billing cycle window** derived from `cut_off_date`:
  - If today's day ≤ cut-off day → window = `(prev cut-off + 1 day) … (this month's cut-off)`
  - If today's day > cut-off day → window = `(this cut-off + 1 day) … (next month's cut-off)`
- Charges in window, excluding `card_payment` category, sum into `cycleSpent`.
- Fallback to calendar month when `cut_off_date` is missing or account is not a TDC.
- `totalSpent` continues to net all charges minus payments across all time (payments still reduce it).
- Card payments do NOT affect `cycleSpent` (already naturally excluded). ✓

Update consumers:
- `AccountsPage.tsx` progress bar → uses `cycleSpent`
- `CreditAccountDetailPage.tsx` → uses `cycleSpent` for progress and labels

### 3. Profile type "bank"

- `src/types/database.ts`: union → `'person' | 'business' | 'bank'`; add `{ value: 'bank', labelKey: 'profileType.bank', icon: '🏦' }` to `PROFILE_TYPES`.
- `src/contexts/LanguageContext.tsx`: add `profileType.bank` (es: "Banco", en: "Bank").
- `src/pages/ProfilesPage.tsx`: state union; replace hardcoded ternary icon with lookup from `PROFILE_TYPES`.
- `src/pages/ProfileDetailPage.tsx`: same lookup.

`profiles.type` is free text in the DB → no migration.

### 4. Required DB migration

```sql
ALTER TABLE public.transactions ALTER COLUMN account_id DROP NOT NULL;
```

### Files modified

- `src/components/TransactionForm.tsx`
- `src/contexts/DataContext.tsx`
- `src/types/database.ts`
- `src/contexts/LanguageContext.tsx`
- `src/pages/ProfilesPage.tsx`
- `src/pages/ProfileDetailPage.tsx`
- `src/pages/AccountsPage.tsx`
- `src/pages/CreditAccountDetailPage.tsx`
- `src/pages/TransactionsPage.tsx` — show credit account name when `account_id` is null

