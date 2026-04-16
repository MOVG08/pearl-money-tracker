export type TransactionType = 'income' | 'expense' | 'transfer';

export type CreditType = 'credit_card' | 'mortgage' | 'auto' | 'personal';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'savings' | 'investment' | 'other';
  currency: string;
  balance: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditAccount {
  id: string;
  user_id: string;
  name: string;
  credit_type: CreditType;
  credit_limit: number;
  next_payment_date?: string;
  cut_off_date?: string;
  payment_due_date?: string;
  min_monthly_spend: number;
  /** For loans (non credit-card): date the loan was disbursed. */
  start_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  type: 'person' | 'business' | 'bank';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string | null;
  destination_account_id?: string;
  credit_account_id?: string;
  profile_id?: string;
  type: TransactionType;
  amount: number;
  category: string;
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionEdit {
  id: string;
  transaction_id: string;
  field: string;
  old_value: string;
  new_value: string;
  edited_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Comida', icon: '🍽️', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: '🚗', type: 'expense' },
  { id: 'housing', name: 'Vivienda', icon: '🏠', type: 'expense' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎬', type: 'expense' },
  { id: 'health', name: 'Salud', icon: '💊', type: 'expense' },
  { id: 'education', name: 'Educación', icon: '📚', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', type: 'expense' },
  { id: 'services', name: 'Servicios', icon: '📱', type: 'expense' },
  { id: 'card_payment', name: 'Pago de tarjeta', icon: '💳', type: 'expense' },
  { id: 'other_expense', name: 'Otros', icon: '📦', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salario', icon: '💰', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', type: 'income' },
  { id: 'investment', name: 'Inversiones', icon: '📈', type: 'income' },
  { id: 'gift', name: 'Regalos', icon: '🎁', type: 'income' },
  { id: 'other_income', name: 'Otros', icon: '💵', type: 'income' },
];

import { Wallet, Landmark, PiggyBank, Folder, CreditCard, Home, Car, HandCoins, User, Building2, TrendingUp, type LucideIcon } from 'lucide-react';

export const ACCOUNT_TYPES: { value: 'cash' | 'bank' | 'savings' | 'investment' | 'other'; labelKey: string; Icon: LucideIcon }[] = [
  { value: 'cash', labelKey: 'accountType.cash', Icon: Wallet },
  { value: 'bank', labelKey: 'accountType.bank', Icon: Landmark },
  { value: 'savings', labelKey: 'accountType.savings', Icon: PiggyBank },
  { value: 'investment', labelKey: 'accountType.investment', Icon: TrendingUp },
  { value: 'other', labelKey: 'accountType.other', Icon: Folder },
];

export const CREDIT_TYPES: { value: CreditType; labelKey: string; Icon: LucideIcon }[] = [
  { value: 'credit_card', labelKey: 'credit.creditCard', Icon: CreditCard },
  { value: 'mortgage', labelKey: 'credit.mortgage', Icon: Home },
  { value: 'auto', labelKey: 'credit.auto', Icon: Car },
  { value: 'personal', labelKey: 'credit.personal', Icon: HandCoins },
];

export const PROFILE_TYPES: { value: 'person' | 'business' | 'bank'; labelKey: string; Icon: LucideIcon }[] = [
  { value: 'person', labelKey: 'profileType.person', Icon: User },
  { value: 'business', labelKey: 'profileType.business', Icon: Building2 },
  { value: 'bank', labelKey: 'profileType.bank', Icon: Landmark },
];
