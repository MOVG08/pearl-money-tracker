export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card' | 'savings' | 'other';
  currency: string;
  balance: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentación', icon: '🍽️', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: '🚗', type: 'expense' },
  { id: 'housing', name: 'Vivienda', icon: '🏠', type: 'expense' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎬', type: 'expense' },
  { id: 'health', name: 'Salud', icon: '💊', type: 'expense' },
  { id: 'education', name: 'Educación', icon: '📚', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', type: 'expense' },
  { id: 'services', name: 'Servicios', icon: '📱', type: 'expense' },
  { id: 'other_expense', name: 'Otros', icon: '📦', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salario', icon: '💰', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', type: 'income' },
  { id: 'investment', name: 'Inversiones', icon: '📈', type: 'income' },
  { id: 'gift', name: 'Regalos', icon: '🎁', type: 'income' },
  { id: 'other_income', name: 'Otros', icon: '💵', type: 'income' },
];

export const ACCOUNT_TYPES = [
  { value: 'cash' as const, label: 'Efectivo', icon: '💵' },
  { value: 'bank' as const, label: 'Banco', icon: '🏦' },
  { value: 'credit_card' as const, label: 'Tarjeta de crédito', icon: '💳' },
  { value: 'savings' as const, label: 'Ahorros', icon: '🐷' },
  { value: 'other' as const, label: 'Otro', icon: '📁' },
];
