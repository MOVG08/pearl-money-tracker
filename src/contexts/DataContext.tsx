import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Transaction, Account, Profile, TransactionEdit } from '@/types/database';

interface DataContextType {
  transactions: Transaction[];
  accounts: Account[];
  profiles: Profile[];
  transactionHistory: TransactionEdit[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => void;
  addAccount: (acc: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  addProfile: (profile: Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Profile;
  deleteTransaction: (id: string) => void;
  deleteProfile: (id: string) => void;
  getAccountBalance: (accountId: string) => number;
  getEditHistory: (transactionId: string) => TransactionEdit[];
  monthlyIncome: number;
  monthlyExpenses: number;
  balance: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const createDefaultAccounts = (): Account[] => {
  const now = new Date().toISOString();
  return [
    { id: crypto.randomUUID(), user_id: '1', name: 'Efectivo', type: 'cash', currency: 'MXN', balance: 0, created_at: now, updated_at: now },
    { id: crypto.randomUUID(), user_id: '1', name: 'Banco', type: 'bank', currency: 'MXN', balance: 0, created_at: now, updated_at: now },
  ];
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(createDefaultAccounts);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionEdit[]>([]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      user_id: '1',
      created_at: now,
      updated_at: now,
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const now = new Date().toISOString();
    setTransactions(prev => prev.map(tx => {
      if (tx.id !== id) return tx;
      // Record history for each changed field
      const edits: TransactionEdit[] = [];
      for (const [field, newValue] of Object.entries(updates)) {
        const oldValue = String((tx as any)[field] ?? '');
        const newVal = String(newValue ?? '');
        if (oldValue !== newVal) {
          edits.push({
            id: crypto.randomUUID(),
            transaction_id: id,
            field,
            old_value: oldValue,
            new_value: newVal,
            edited_at: now,
          });
        }
      }
      if (edits.length > 0) {
        setTransactionHistory(prev => [...prev, ...edits]);
      }
      return { ...tx, ...updates, updated_at: now };
    }));
  };

  const addAccount = (acc: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newAcc: Account = {
      ...acc,
      id: crypto.randomUUID(),
      user_id: '1',
      created_at: now,
      updated_at: now,
    };
    setAccounts(prev => [...prev, newAcc]);
  };

  const addProfile = (profile: Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Profile => {
    const now = new Date().toISOString();
    const newProfile: Profile = {
      ...profile,
      id: crypto.randomUUID(),
      user_id: '1',
      created_at: now,
      updated_at: now,
    };
    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    const initial = account?.balance ?? 0;
    const income = transactions.filter(t => t.account_id === accountId && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.account_id === accountId && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return initial + income - expenses;
  };

  const getEditHistory = (transactionId: string) => {
    return transactionHistory.filter(h => h.transaction_id === transactionId);
  };

  const balance = useMemo(() => {
    const accountBalances = accounts.reduce((s, a) => s + a.balance, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return accountBalances + totalIncome - totalExpenses;
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
    <DataContext.Provider value={{ transactions, accounts, profiles, transactionHistory, addTransaction, updateTransaction, addAccount, addProfile, deleteTransaction, deleteProfile, getAccountBalance, getEditHistory, monthlyIncome, monthlyExpenses, balance }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
