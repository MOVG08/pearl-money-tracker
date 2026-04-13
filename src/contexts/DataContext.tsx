import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Transaction, Account } from '@/types/database';

interface DataContextType {
  transactions: Transaction[];
  accounts: Account[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  addAccount: (acc: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  deleteTransaction: (id: string) => void;
  monthlyIncome: number;
  monthlyExpenses: number;
  balance: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      user_id: '1', // TODO: from auth
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

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

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

  const balance = monthlyIncome - monthlyExpenses;

  return (
    <DataContext.Provider value={{ transactions, accounts, addTransaction, addAccount, deleteTransaction, monthlyIncome, monthlyExpenses, balance }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
