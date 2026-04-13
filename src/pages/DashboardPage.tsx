import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/database';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
};

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { monthlyIncome, monthlyExpenses, balance, transactions } = useData();

  const now = new Date();
  const monthlyTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.name,
    value: monthlyTx.filter(t => t.type === 'expense' && t.category === cat.id).reduce((s, t) => s + t.amount, 0),
    icon: cat.icon,
  })).filter(c => c.value > 0);

  const chartColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

  const recentTransactions = transactions.slice(0, 5);
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const cards = [
    { label: t('dashboard.income'), value: monthlyIncome, icon: TrendingUp, className: 'gradient-income' },
    { label: t('dashboard.expenses'), value: monthlyExpenses, icon: TrendingDown, className: 'gradient-expense' },
    { label: t('dashboard.balance'), value: balance, icon: Wallet, className: 'gradient-balance' },
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{t('dashboard.thisMonth')}</p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('dashboard.overview')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${card.className} rounded-2xl p-5 text-primary-foreground`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{card.label}</p>
                <p className="text-2xl font-semibold font-mono mt-1">{formatCurrency(card.value)}</p>
              </div>
              <card.icon className="w-8 h-8 opacity-60" />
            </div>
          </motion.div>
        ))}
      </div>

      {expenseByCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5"
        >
          <h2 className="text-base font-medium text-foreground mb-4">{t('dashboard.expenses')}</h2>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                    {expenseByCategory.map((_, idx) => (
                      <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {expenseByCategory.map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                  <span className="text-muted-foreground">{cat.icon} {cat.name}</span>
                  <span className="ml-auto font-mono text-foreground">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground">{t('dashboard.recentTransactions')}</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('transactions.noTransactions')}</p>
        ) : (
          recentTransactions.map((tx, i) => {
            const cat = allCategories.find(c => c.id === tx.category);
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-xl">{cat?.icon || '💰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{cat?.name || tx.category}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('es-MX')}</p>
                </div>
                <span className={`font-mono text-sm font-medium ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
