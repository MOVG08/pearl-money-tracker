import React from 'react';
import {
  UtensilsCrossed, Car, Home, Film, Pill, BookOpen, ShoppingBag, Smartphone,
  CreditCard, Package, Wallet, Laptop, TrendingUp, Gift, Banknote,
  ArrowLeftRight, CheckCircle2, type LucideIcon,
} from 'lucide-react';

// Map of category ID -> Lucide icon
const ICONS: Record<string, LucideIcon> = {
  // expenses
  food: UtensilsCrossed,
  transport: Car,
  housing: Home,
  entertainment: Film,
  health: Pill,
  education: BookOpen,
  shopping: ShoppingBag,
  services: Smartphone,
  debt_payment: CreditCard,
  card_payment: CreditCard,
  other_expense: Package,
  // income
  salary: Wallet,
  freelance: Laptop,
  investment: TrendingUp,
  gift: Gift,
  other_income: Banknote,
  // special
  transfer: ArrowLeftRight,
  payment_done: CheckCircle2,
};

export const getCategoryIcon = (categoryId?: string | null): LucideIcon => {
  if (!categoryId) return Wallet;
  return ICONS[categoryId] ?? Wallet;
};

interface CategoryIconProps {
  category?: string | null;
  type?: 'income' | 'expense' | 'transfer' | 'payment';
  className?: string;
}

/**
 * Renders a Lucide icon for a transaction category inside a tinted square chip.
 * Tinting follows the type for a clear visual cue.
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, type = 'expense', className = '' }) => {
  const Icon = getCategoryIcon(category);
  const tone =
    type === 'income' ? 'bg-success/12 text-success border-success/20'
    : type === 'transfer' ? 'bg-primary/12 text-primary border-primary/20'
    : type === 'payment' ? 'bg-success/12 text-success border-success/20'
    : 'bg-destructive/10 text-destructive border-destructive/20';
  return (
    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${tone} ${className}`}>
      <Icon className="w-5 h-5" />
    </span>
  );
};
