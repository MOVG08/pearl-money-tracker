

## Plan: Dynamic Account Balances + Editable Transactions with Audit Trail

### Problem
1. Account balances in AccountsPage show only the initial balance set at creation — they don't reflect transactions.
2. Transactions cannot be edited after creation.
3. No modification history is tracked.

### Changes

**1. Compute dynamic account balances**
- In `AccountsPage.tsx`: instead of displaying `acc.balance` (the static initial value), compute each account's effective balance = `acc.balance + income for that account - expenses for that account` using transactions from DataContext.
- This is a display-only change — no data model changes needed.

**2. Add `updateTransaction` to DataContext**
- New function `updateTransaction(id: string, updates: Partial<Transaction>)` that:
  - Finds the transaction by ID
  - Applies the partial updates
  - Sets `updated_at` to current timestamp
  - Appends an entry to a new `transactionHistory` state array

**3. Add Transaction modification history**
- Add a `TransactionEdit` interface to `database.ts`: `{ id, transaction_id, field, old_value, new_value, edited_at }`
- In DataContext, maintain `transactionHistory: TransactionEdit[]` state
- When `updateTransaction` is called, record each changed field as a history entry

**4. Add edit mode to TransactionForm**
- Accept optional `editTransaction` prop with existing transaction data
- Pre-fill all fields when editing
- Submit calls `updateTransaction` instead of `addTransaction`

**5. Add edit button to transaction cards**
- In `TransactionsPage.tsx`: add a pencil/edit icon button next to delete
- Clicking it opens `TransactionForm` pre-filled with that transaction's data
- Show a small "edited" indicator + tooltip/expandable section showing modification history

**6. Add translations**
- Keys: `transactions.edit`, `transactions.edited`, `transactions.history`, `transactions.editedAt`, `transactions.oldValue`, `transactions.newValue`

### Files to modify
- `src/types/database.ts` — add `TransactionEdit` interface
- `src/contexts/DataContext.tsx` — add `updateTransaction`, `transactionHistory` state, compute per-account balances helper
- `src/pages/AccountsPage.tsx` — compute and display dynamic balances
- `src/components/TransactionForm.tsx` — support edit mode
- `src/pages/TransactionsPage.tsx` — add edit button, show edit history
- `src/contexts/LanguageContext.tsx` — new translation keys

