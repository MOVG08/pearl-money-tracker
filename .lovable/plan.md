

## Plan: Fix transaction saving + Add Profiles as main section

### Problem
1. Transactions can't be saved because `profileId` is required in the form validation (`if (!amount || !category || !accountId || !profileId) return;`), but users have no profiles yet and no dedicated place to manage them.
2. Profiles section is not accessible from main navigation.

### Changes

**1. Make `profile_id` optional in transactions**
- In `src/types/database.ts`: make `profile_id` optional (`profile_id?: string`)
- In `src/components/TransactionForm.tsx`: remove `!profileId` from the validation check so transactions can be saved without a profile

**2. Create `src/pages/ProfilesPage.tsx`**
- List all profiles with name and type (person/business)
- Button to add new profile (name + type selector)
- Delete profile option
- Clean card-based layout matching existing pages

**3. Add Profiles to main navigation**
- In `src/components/BottomNav.tsx`: add a Profiles tab (Users icon) between Transactions and Accounts
- In `src/App.tsx`: add route `/profiles` → `ProfilesPage`
- Add translation keys `nav.profiles` in `src/contexts/LanguageContext.tsx`

**4. Add translations**
- Add missing profile-related keys: `profiles.title`, `profiles.add`, `profiles.empty`, `profiles.delete`, etc.

### Files to modify
- `src/types/database.ts` — make profile_id optional
- `src/components/TransactionForm.tsx` — fix validation
- `src/pages/ProfilesPage.tsx` — new file
- `src/components/BottomNav.tsx` — add profiles tab
- `src/App.tsx` — add route
- `src/contexts/LanguageContext.tsx` — translations

