export type TransactionType = 'income' | 'expense' | 'transfer';

export type CreditType = 'credit_card' | 'mortgage' | 'auto' | 'personal';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'savings' | 'other';
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
  { id: 'food', name: 'Alimentación', icon: '🍽️', type: 'expense' },
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

export const ACCOUNT_TYPES = [
  { value: 'cash' as const, labelKey: 'accountType.cash', icon: '💵' },
  { value: 'bank' as const, labelKey: 'accountType.bank', icon: '🏦' },
  { value: 'savings' as const, labelKey: 'accountType.savings', icon: '🐷' },
  { value: 'other' as const, labelKey: 'accountType.other', icon: '📁' },
];

export const CREDIT_TYPES = [
  { value: 'credit_card' as const, labelKey: 'credit.creditCard', icon: '💳' },
  { value: 'mortgage' as const, labelKey: 'credit.mortgage', icon: '🏠' },
  { value: 'auto' as const, labelKey: 'credit.auto', icon: '🚗' },
  { value: 'personal' as const, labelKey: 'credit.personal', icon: '💰' },
];

export const PROFILE_TYPES = [
  { value: 'person' as const, labelKey: 'profileType.person', icon: '👤' },
  { value: 'business' as const, labelKey: 'profileType.business', icon: '🏢' },
  { value: 'bank' as const, labelKey: 'profileType.bank', icon: '🏦' },
];
