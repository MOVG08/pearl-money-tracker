import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Transaction, Account, Profile, TransactionEdit, CreditAccount } from '@/types/database';
import { toast } from 'sonner';

// Sentinel name for the auto-created per-user "no profile" bucket.
// Kept hidden from regular profile lists; rendered as the localized "Sin perfil" label.
export const DEFAULT_PROFILE_SENTINEL = '__default_no_profile__';

export const isDefaultProfile = (p: Pick<Profile, 'name'> | undefined | null) =>
  !!p && p.name === DEFAULT_PROFILE_SENTINEL;

interface DataContextType {
  transactions: Transaction[];
  accounts: Account[];
  profiles: Profile[];
  creditAccounts: CreditAccount[];
  transactionHistory: TransactionEdit[];
  loading: boolean;
  defaultProfileId: string | null;
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  addAccount: (acc: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addProfile: (profile: Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Profile | null>;
  addCreditAccount: (ca: Omit<CreditAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCreditAccount: (id: string, updates: Partial<Omit<CreditAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  deleteCreditAccount: (id: string) => Promise<void>;
  getAccountBalance: (accountId: string) => number;
  getCreditAccountBalance: (creditAccountId: string) => { totalSpent: number; availableCredit: number; cycleSpent: number };
  getLoanBalance: (creditAccountId: string) => { borrowed: number; paid: number; remaining: number };
  getEditHistory: (transactionId: string) => TransactionEdit[];
  monthlyIncome: number;
  monthlyExpenses: number;
  balance: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionEdit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setTransactions([]); setAccounts([]); setProfiles([]); setCreditAccounts([]); setTransactionHistory([]);
      return;
    }
    setLoading(true);
    try {
      const [txRes, accRes, profRes, histRes, creditRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').order('name', { ascending: true }),
        supabase.from('transaction_edits').select('*').order('edited_at', { ascending: false }),
        supabase.from('credit_accounts').select('*').order('created_at', { ascending: true }),
      ]);

      if (txRes.error) throw txRes.error;
      if (accRes.error) throw accRes.error;
      if (profRes.error) throw profRes.error;
      if (histRes.error) throw histRes.error;
      // credit_accounts table may not exist yet
      if (creditRes.error && !creditRes.error.message.includes('does not exist')) throw creditRes.error;

      let profilesData = (profRes.data as Profile[]) || [];
      let txData = (txRes.data as Transaction[]) || [];

      // Ensure a default "no profile" bucket exists for this user
      let defaultProfile = profilesData.find(p => p.name === DEFAULT_PROFILE_SENTINEL);
      if (!defaultProfile) {
        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert({ name: DEFAULT_PROFILE_SENTINEL, type: 'person', user_id: user.id })
          .select()
          .single();
        if (!createErr && created) {
          defaultProfile = created as Profile;
          profilesData = [...profilesData, defaultProfile];
        }
      }

      // Backfill: any transactions without profile_id get assigned to the default profile
      if (defaultProfile) {
        const orphanIds = txData.filter(t => !t.profile_id).map(t => t.id);
        if (orphanIds.length > 0) {
          const { error: backfillErr } = await supabase
            .from('transactions')
            .update({ profile_id: defaultProfile.id })
            .in('id', orphanIds);
          if (!backfillErr) {
            txData = txData.map(t => (!t.profile_id ? { ...t, profile_id: defaultProfile!.id } : t));
          }
        }
      }

      // Auto-roll TDC dates: when payment_due_date < today, advance both dates by 1 month
      // payment_due_date <- next_payment_date; next_payment_date <- next_payment_date + 1 month
      let creditAccountsData = (creditRes.data as CreditAccount[]) || [];
      const todayStr = new Date().toISOString().slice(0, 10);
      const addMonth = (iso: string) => {
        const d = new Date(iso + 'T00:00:00');
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().slice(0, 10);
      };
      const rollUpdates: Promise<any>[] = [];
      creditAccountsData = creditAccountsData.map(ca => {
        if (ca.credit_type !== 'credit_card') return ca;
        let due = ca.payment_due_date;
        let next = ca.next_payment_date;
        if (!due || !next) return ca;
        let changed = false;
        // Loop in case multiple cycles passed
        while (due && next && due < todayStr) {
          due = next;
          next = addMonth(next);
          changed = true;
        }
        if (changed) {
          rollUpdates.push(
            Promise.resolve(supabase.from('credit_accounts').update({ payment_due_date: due, next_payment_date: next }).eq('id', ca.id))
          );
          return { ...ca, payment_due_date: due, next_payment_date: next };
        }
        return ca;
      });
      if (rollUpdates.length > 0) await Promise.all(rollUpdates);

      setTransactions(txData);
      setAccounts(accRes.data as Account[]);
      setProfiles(profilesData);
      setTransactionHistory(histRes.data as TransactionEdit[]);
      setCreditAccounts(creditAccountsData);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const defaultProfileId = useMemo(
    () => profiles.find(p => p.name === DEFAULT_PROFILE_SENTINEL)?.id ?? null,
    [profiles]
  );

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const profile_id = tx.profile_id || defaultProfileId || undefined;
    const { data, error } = await supabase.from('transactions').insert({ ...tx, profile_id, user_id: user.id }).select().single();
    if (error) { toast.error(error.message); return; }
    setTransactions(prev => [data as Transaction, ...prev]);
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const current = transactions.find(t => t.id === id);
    if (!current) return;
    const { data, error } = await supabase.from('transactions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) { toast.error(error.message); return; }
    const edits: { transaction_id: string; field: string; old_value: string; new_value: string }[] = [];
    for (const [field, newValue] of Object.entries(updates)) {
      const oldValue = String((current as any)[field] ?? '');
      const newVal = String(newValue ?? '');
      if (oldValue !== newVal) edits.push({ transaction_id: id, field, old_value: oldValue, new_value: newVal });
    }
    if (edits.length > 0) {
      const { data: editData, error: editError } = await supabase.from('transaction_edits').insert(edits).select();
      if (!editError && editData) setTransactionHistory(prev => [...(editData as TransactionEdit[]), ...prev]);
    }
    setTransactions(prev => prev.map(t => t.id === id ? (data as Transaction) : t));
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addAccount = async (acc: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('accounts').insert({ ...acc, user_id: user.id }).select().single();
    if (error) { toast.error(error.message); return; }
    setAccounts(prev => [...prev, data as Account]);
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const addProfile = async (profile: Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Profile | null> => {
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').insert({ ...profile, user_id: user.id }).select().single();
    if (error) { toast.error(error.message); return null; }
    const newProfile = data as Profile;
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  };

  const deleteProfile = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const addCreditAccount = async (ca: Omit<CreditAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('credit_accounts').insert({ ...ca, user_id: user.id }).select().single();
    if (error) { toast.error(error.message); return; }
    setCreditAccounts(prev => [...prev, data as CreditAccount]);
  };

  const deleteCreditAccount = async (id: string) => {
    const { error } = await supabase.from('credit_accounts').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setCreditAccounts(prev => prev.filter(c => c.id !== id));
  };

  const updateCreditAccount = async (id: string, updates: Partial<Omit<CreditAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('credit_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setCreditAccounts(prev => prev.map(c => (c.id === id ? (data as CreditAccount) : c)));
  };

  const isDebtPayment = (cat?: string) => cat === 'debt_payment' || cat === 'card_payment';

  const getLoanBalance = (creditAccountId: string) => {
    const ca = creditAccounts.find(c => c.id === creditAccountId);
    const borrowed = ca?.credit_limit ?? 0;
    const txs = transactions.filter(t => t.credit_account_id === creditAccountId);
    const paid = txs.filter(t => isDebtPayment(t.category)).reduce((s, t) => s + t.amount, 0);
    return { borrowed, paid, remaining: Math.max(0, borrowed - paid) };
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    const initial = account?.balance ?? 0;
    const income = transactions.filter(t => t.account_id === accountId && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.account_id === accountId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const transfersOut = transactions.filter(t => t.account_id === accountId && t.type === 'transfer').reduce((s, t) => s + t.amount, 0);
    const transfersIn = transactions.filter(t => t.destination_account_id === accountId && t.type === 'transfer').reduce((s, t) => s + t.amount, 0);
    return initial + income - expenses - transfersOut + transfersIn;
  };

  const getCreditAccountBalance = (creditAccountId: string) => {
    const ca = creditAccounts.find(c => c.id === creditAccountId);
    const limit = ca?.credit_limit ?? 0;
    const creditTxs = transactions.filter(t => t.credit_account_id === creditAccountId);
    const charges = creditTxs.filter(t => t.category !== 'card_payment').reduce((s, t) => s + t.amount, 0);
    const payments = creditTxs.filter(t => t.category === 'card_payment').reduce((s, t) => s + t.amount, 0);
    const totalSpent = charges - payments;

    // Compute current billing cycle window using date strings (YYYY-MM-DD) to avoid TZ issues.
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
    const lastDayOfMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

    let cycleStartIso: string;
    let cycleEndIso: string;

    if (ca?.cut_off_date && ca.credit_type === 'credit_card') {
      // Parse cut_off_date as a plain date (YYYY-MM-DD), independent of TZ.
      const cutDay = parseInt(ca.cut_off_date.slice(8, 10), 10);
      const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonthCutDay = Math.min(cutDay, lastDayOfMonth(now.getFullYear(), now.getMonth()));
      const thisMonthCutIso = toIso(now.getFullYear(), now.getMonth(), thisMonthCutDay);
      if (todayIso <= thisMonthCutIso) {
        // Cycle: (prev month cut + 1) ... (this month cut)
        const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const prevM = (now.getMonth() + 11) % 12;
        const prevCutDay = Math.min(cutDay, lastDayOfMonth(prevY, prevM));
        cycleStartIso = toIso(prevY, prevM, prevCutDay + 1);
        cycleEndIso = thisMonthCutIso;
      } else {
        // Cycle: (this month cut + 1) ... (next month cut)
        const nextY = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
        const nextM = (now.getMonth() + 1) % 12;
        const nextCutDay = Math.min(cutDay, lastDayOfMonth(nextY, nextM));
        cycleStartIso = toIso(now.getFullYear(), now.getMonth(), thisMonthCutDay + 1);
        cycleEndIso = toIso(nextY, nextM, nextCutDay);
      }
    } else {
      cycleStartIso = toIso(now.getFullYear(), now.getMonth(), 1);
      cycleEndIso = toIso(now.getFullYear(), now.getMonth(), lastDayOfMonth(now.getFullYear(), now.getMonth()));
    }

    const cycleSpent = creditTxs.filter(t => {
      if (t.category === 'card_payment') return false;
      const d = (t.date || '').slice(0, 10);
      return d >= cycleStartIso && d <= cycleEndIso;
    }).reduce((s, t) => s + t.amount, 0);

    return { totalSpent: Math.max(0, totalSpent), availableCredit: limit - Math.max(0, totalSpent), cycleSpent };
  };

  const getEditHistory = (transactionId: string) => transactionHistory.filter(h => h.transaction_id === transactionId);

  const balance = useMemo(() => accounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0), [accounts, transactions]);

  const now2 = new Date();
  const currentMonth = now2.getMonth();
  const currentYear = now2.getFullYear();

  const monthlyTransactions = useMemo(() =>
    transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; }),
    [transactions, currentMonth, currentYear]
  );

  const monthlyIncome = useMemo(() => monthlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthlyTransactions]);
  // Exclude card_payment from total expenses: it's a transfer of debt, not new spending.
  // The original credit-card charges are already counted as expenses when made.
  const monthlyExpenses = useMemo(() => monthlyTransactions.filter(t => t.type === 'expense' && t.category !== 'card_payment').reduce((s, t) => s + t.amount, 0), [monthlyTransactions]);

  return (
    <DataContext.Provider value={{ transactions, accounts, profiles, creditAccounts, transactionHistory, loading, defaultProfileId, addTransaction, updateTransaction, addAccount, addProfile, addCreditAccount, updateCreditAccount, deleteTransaction, deleteProfile, deleteAccount, deleteCreditAccount, getAccountBalance, getCreditAccountBalance, getLoanBalance, getEditHistory, monthlyIncome, monthlyExpenses, balance }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
