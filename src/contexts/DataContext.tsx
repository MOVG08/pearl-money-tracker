import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Transaction, Account, Profile, TransactionEdit } from '@/types/database';
import { toast } from 'sonner';

interface DataContextType {
  transactions: Transaction[];
  accounts: Account[];
  profiles: Profile[];
  transactionHistory: TransactionEdit[];
  loading: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  addAccount: (acc: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addProfile: (profile: Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Profile | null>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccountBalance: (accountId: string) => number;
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
  const [transactionHistory, setTransactionHistory] = useState<TransactionEdit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setAccounts([]);
      setProfiles([]);
      setTransactionHistory([]);
      return;
    }
    setLoading(true);
    try {
      const [txRes, accRes, profRes, histRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').order('name', { ascending: true }),
        supabase.from('transaction_edits').select('*').order('edited_at', { ascending: false }),
      ]);

      if (txRes.error) throw txRes.error;
      if (accRes.error) throw accRes.error;
      if (profRes.error) throw profRes.error;
      if (histRes.error) throw histRes.error;

      setTransactions(txRes.data as Transaction[]);
      setAccounts(accRes.data as Account[]);
      setProfiles(profRes.data as Profile[]);
      setTransactionHistory(histRes.data as TransactionEdit[]);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...tx, user_id: user.id })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setTransactions(prev => [data as Transaction, ...prev]);
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const current = transactions.find(t => t.id === id);
    if (!current) return;

    const { data, error } = await supabase
      .from('transactions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) { toast.error(error.message); return; }

    const edits: { transaction_id: string; field: string; old_value: string; new_value: string }[] = [];
    for (const [field, newValue] of Object.entries(updates)) {
      const oldValue = String((current as any)[field] ?? '');
      const newVal = String(newValue ?? '');
      if (oldValue !== newVal) {
        edits.push({ transaction_id: id, field, old_value: oldValue, new_value: newVal });
      }
    }
    if (edits.length > 0) {
      const { data: editData, error: editError } = await supabase
        .from('transaction_edits')
        .insert(edits)
        .select();
      if (!editError && editData) {
        setTransactionHistory(prev => [...(editData as TransactionEdit[]), ...prev]);
      }
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
    const { data, error } = await supabase
      .from('accounts')
      .insert({ ...acc, user_id: user.id })
      .select()
      .single();
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
    const { data, error } = await supabase
      .from('profiles')
      .insert({ ...profile, user_id: user.id })
      .select()
      .single();
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

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    const initial = account?.balance ?? 0;
    const income = transactions.filter(t => t.account_id === accountId && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.account_id === accountId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    // Transfers out (source)
    const transfersOut = transactions.filter(t => t.account_id === accountId && t.type === 'transfer').reduce((s, t) => s + t.amount, 0);
    // Transfers in (destination)
    const transfersIn = transactions.filter(t => t.destination_account_id === accountId && t.type === 'transfer').reduce((s, t) => s + t.amount, 0);
    return initial + income - expenses - transfersOut + transfersIn;
  };

  const getEditHistory = (transactionId: string) => {
    return transactionHistory.filter(h => h.transaction_id === transactionId);
  };

  const balance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);
  }, [accounts, transactions]);

  const now2 = new Date();
  const currentMonth = now2.getMonth();
  const currentYear = now2.getFullYear();

  const monthlyTransactions = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [transactions, currentMonth, currentYear]
  );

  const monthlyIncome = useMemo(() =>
    monthlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthlyTransactions]
  );

  const monthlyExpenses = useMemo(() =>
    monthlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthlyTransactions]
  );

  return (
    <DataContext.Provider value={{ transactions, accounts, profiles, transactionHistory, loading, addTransaction, updateTransaction, addAccount, addProfile, deleteTransaction, deleteProfile, deleteAccount, getAccountBalance, getEditHistory, monthlyIncome, monthlyExpenses, balance }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
