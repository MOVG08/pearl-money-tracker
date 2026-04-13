import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2 } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/database';
import TransactionForm from '@/components/TransactionForm';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const TransactionsPage: React.FC = () => {
  const { t } = useLanguage();
  const { transactions, accounts, profiles, deleteTransaction } = useData();
  const [showForm, setShowForm] = useState(false);

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('transactions.title')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          {t('transactions.add')}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <TransactionForm onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {transactions.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">📊</p>
          <p className="text-foreground font-medium">{t('transactions.noTransactions')}</p>
          <p className="text-sm text-muted-foreground">{t('transactions.addFirst')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx, i) => {
            const cat = allCategories.find(c => c.id === tx.category);
            const acc = accounts.find(a => a.id === tx.account_id);
            const profile = profiles.find(p => p.id === tx.profile_id);
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-xl">{cat?.icon || '💰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{cat?.name || tx.category}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                    {acc && <span>• {acc.name}</span>}
                    {profile && <span>• {profile.name}</span>}
                  </div>
                  {tx.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{tx.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-medium ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                  <button onClick={() => deleteTransaction(tx.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
