import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Transaction, Account, Profile } from '@/types/database';

interface DataContextType {
  transactions: Transaction[];
  accounts: Account[];
  profiles: Profile[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  addAccount: (acc: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  addProfile: (profile: Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Profile;
  deleteTransaction: (id: string) => void;
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

  // General balance: sum of all account initial balances + all income - all expenses
  const balance = useMemo(() => {
    const accountBalances = accounts.reduce((s, a) => s + a.balance, 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return accountBalances + totalIncome - totalExpenses;
  }, [accounts, transactions]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

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
    <DataContext.Provider value={{ transactions, accounts, profiles, addTransaction, addAccount, addProfile, deleteTransaction, monthlyIncome, monthlyExpenses, balance }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
