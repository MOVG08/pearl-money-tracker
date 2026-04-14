

## Plan: Dashboard Analytics & Visualizations

### Overview
Redesign the dashboard to be an interactive analytics hub with clickable cards, filterable charts, and a balance timeline.

### 1. Clickable Income card → Pie chart by profile
- When user taps "Ingresos" card, expand/toggle a section below showing:
  - Pie chart grouping income by profile (who paid)
  - Legend with percentage and total per profile
  - Transactions without a profile grouped as "Sin perfil" / "No profile"

### 2. Clickable Expense card → Pie chart by profile
- Same behavior for "Gastos" card
- Replace current category-based pie chart with profile-based grouping on click
- Show percentage and total per profile

### 3. Balance line chart
- Add a `LineChart` (Recharts) below the cards
- X-axis: dates, Y-axis: cumulative balance
- Sort all transactions by date, compute running total (account balances + income - expenses)
- Default to current month

### 4. Filters bar
- Add a filter section at the top with:
  - **Account** dropdown (from `accounts`)
  - **Profile** dropdown (from `profiles`)
  - **Date range** picker (start/end date using Shadcn Calendar/Popover)
- All charts and the recent transactions list react to these filters
- Default: current month, all accounts, all profiles

### 5. Transaction history filtered view
- Below the charts, show filtered transaction list (replaces current "recent transactions")
- Respects all active filters (account, profile, date range)
- Shows all matching transactions, not just last 5

### 6. Translations
- Add keys: `dashboard.incomeByProfile`, `dashboard.expenseByProfile`, `dashboard.balanceOverTime`, `dashboard.filters`, `dashboard.allAccounts`, `dashboard.allProfiles`, `dashboard.noProfile`, `dashboard.from`, `dashboard.to`, `dashboard.history`

### 7. UX details
- Use `framer-motion` `AnimatePresence` for smooth expand/collapse of chart sections
- Charts use `ResponsiveContainer` for mobile-friendly sizing
- Clean glass card styling consistent with existing design

### Files to modify
- `src/pages/DashboardPage.tsx` — complete rewrite with interactive cards, charts, filters
- `src/contexts/LanguageContext.tsx` — new translation keys

### Technical notes
- Recharts `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip` already available (recharts is installed)
- Shadcn `Popover` + `Calendar` for date range filter
- `Select` component for account/profile dropdowns

