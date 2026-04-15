

## Plan: Profile deletion guard, transfer clarification, credit accounts system

This is a large feature set spanning 4 areas. Here is a breakdown:

---

### 1. Profile deletion guard
**What**: When deleting a profile that has associated transactions, show an alert dialog instead of deleting.
**How**: In `ProfilesPage.tsx`, before calling `deleteProfile`, check if any transaction has `profile_id === id`. If yes, show an AlertDialog saying "No se puede borrar un perfil con movimientos asignados. Desasigna sus movimientos primero." If no transactions, delete normally.

**Files**: `src/pages/ProfilesPage.tsx`

---

### 2. Transfer clarification in Transactions
**What**: In the transactions list, clarify that "Transferencia" means between own accounts only. If money was sent to another person, it should be recorded as "Gasto". If received from another person, as "Ingreso".
**How**: 
- In `TransactionForm.tsx`, add a label/hint under the transfer type button: "Solo entre cuentas propias" / "Only between own accounts"
- In `TransactionsPage.tsx`, when displaying a transfer, show source → destination account names (e.g. "Banco → Efectivo") to make it clear it's personal

**Files**: `src/components/TransactionForm.tsx`, `src/pages/TransactionsPage.tsx`, `src/contexts/LanguageContext.tsx`

---

### 3. Credit accounts sub-section

**What**: Remove "Tarjeta de crédito" from the regular account type picker. Create a new sub-section in AccountsPage for credit products.

**Database**: New table `credit_accounts`:

```text
credit_accounts (
  id uuid PK default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  credit_type text not null,          -- 'credit_card' | 'mortgage' | 'auto' | 'personal'
  credit_limit numeric default 0,     -- línea de crédito (TDC) or loan amount (others)
  next_payment_date date,
  -- TDC-specific:
  cut_off_date date,
  payment_due_date date,
  min_monthly_spend numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

RLS: `auth.uid() = user_id` for all operations.

**Also**: Add `credit_account_id` column to `transactions` table:
```sql
ALTER TABLE transactions ADD COLUMN credit_account_id uuid REFERENCES credit_accounts(id);
```

This allows charging expenses to a credit card or making payments toward a credit account.

**UI in AccountsPage**:
- Regular accounts section (without credit_card type) stays at top
- Below, a "Tarjetas de crédito y préstamos" section with its own "+ Nuevo" button
- Creation form: name, credit type selector (TDC, Hipoteca, Automotriz, Personal), amount/line, next payment date
- If TDC: extra fields for cut-off date, payment due date, min monthly spend
- Each credit account card shows: name, type, available credit, total spent
- For TDC with min spend: a progress bar showing current month expenses vs minimum

**Credit account detail page** (`/credit-accounts/:id`):
- Shows credit limit, available credit, total spent
- For TDC: cut-off date, payment due date, min spend progress bar
- Transaction history (filtered by `credit_account_id`)

**Balance logic**:
- `available_credit = credit_limit - total_spent_this_period`
- `total_spent = sum of expenses with credit_account_id = this account`
- Card payments (type 'expense' category 'card_payment' with `credit_account_id`) reduce total spent

### 4. Transaction form updates
**What**: When creating an expense, allow optionally charging it to a credit card.
**How**:
- In `TransactionForm.tsx`, when type is 'expense', show an optional "Cargar a tarjeta" toggle/selector listing credit accounts
- If selected, the transaction gets `credit_account_id` set
- New category "Pago de tarjeta" for payments that restore credit
- A "card payment" reduces the credit account's spent balance and restores available credit

**Files**: `src/components/TransactionForm.tsx`

---

### DataContext changes
- Add `creditAccounts` state, fetch from `credit_accounts` table
- Add `addCreditAccount`, `deleteCreditAccount` functions
- Add `getCreditAccountBalance(id)` → computes available credit and total spent from transactions
- Expose `creditAccounts` and related functions

---

### New files to create
- `src/pages/CreditAccountDetailPage.tsx` — detail view for a credit account
- Migration for `credit_accounts` table and `transactions.credit_account_id` column

### Files to modify
- `src/types/database.ts` — add `CreditAccount` interface, `CREDIT_TYPES` constant, remove `credit_card` from `ACCOUNT_TYPES`
- `src/contexts/DataContext.tsx` — credit account CRUD, balance computation
- `src/pages/AccountsPage.tsx` — split into regular + credit sections
- `src/pages/ProfilesPage.tsx` — deletion guard with AlertDialog
- `src/components/TransactionForm.tsx` — transfer hint, credit card charge option
- `src/pages/TransactionsPage.tsx` — transfer display improvements
- `src/contexts/LanguageContext.tsx` — new translation keys
- `src/App.tsx` — route for `/credit-accounts/:id`

### New translation keys
- `credit.title`, `credit.add`, `credit.type`, `credit.creditCard`, `credit.mortgage`, `credit.auto`, `credit.personal`
- `credit.creditLimit`, `credit.loanAmount`, `credit.nextPayment`, `credit.cutOffDate`, `credit.paymentDueDate`
- `credit.minSpend`, `credit.availableCredit`, `credit.totalSpent`, `credit.chargeToCard`, `credit.cardPayment`
- `credit.minSpendProgress`
- `profiles.cannotDelete`, `profiles.unassignFirst`
- `transactions.transferHint` ("Solo entre cuentas propias")

