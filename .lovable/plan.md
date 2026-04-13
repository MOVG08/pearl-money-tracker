

## Plan: Profiles, Default Accounts, Translations, and General Balance

### 1. Fix account type translations
- Add translation keys for account types to `LanguageContext.tsx`
- Update `ACCOUNT_TYPES` in `database.ts` to use translation keys
- Use `t()` in `AccountsPage.tsx` for labels

### 2. Add default accounts on signup
- In `DataContext.tsx`, initialize with two default accounts: "Efectivo" (cash, $0) and "Banco" (bank, $0)

### 3. Show general balance in Dashboard overview
- In `DataContext.tsx`, compute a single aggregated balance across all accounts (sum of all account balances adjusted by transactions)
- Display this general balance in the existing balance card on `DashboardPage.tsx` — no per-account breakdown

### 4. Add Profile (counterparty) data model
- Add `Profile` interface to `database.ts`: `{ id, user_id, name, type: 'person' | 'business', created_at, updated_at }`
- Add `profile_id` field to `Transaction` interface

### 5. Add profile management to DataContext
- Add `profiles` state, `addProfile` function, expose in context

### 6. Update Transaction form
- Add profile selector with search/filter dropdown
- Inline "quick create profile" option
- If no profiles exist, show prompt to create one
- Include `profile_id` in transaction submission

### 7. Update transaction display
- Show profile name on transaction cards in `TransactionsPage.tsx` and `DashboardPage.tsx`

### 8. Add all new translation keys
- Profile-related strings in both Spanish and English

### Files to modify
- `src/contexts/LanguageContext.tsx` — translations
- `src/types/database.ts` — Profile type, update Transaction, ACCOUNT_TYPES
- `src/contexts/DataContext.tsx` — profiles, default accounts, general balance
- `src/components/TransactionForm.tsx` — profile selector
- `src/pages/TransactionsPage.tsx` — show profile on cards
- `src/pages/DashboardPage.tsx` — general balance, profile on recent tx
- `src/pages/AccountsPage.tsx` — translated account type labels

