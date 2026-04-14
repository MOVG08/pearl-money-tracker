import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/database';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const ProfileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profiles, transactions, accounts } = useData();

  const profile = profiles.find(p => p.id === id);

  const profileTx = useMemo(() =>
    transactions.filter(tx => tx.profile_id === id && tx.type !== 'transfer'),
    [transactions, id]
  );

  const income = useMemo(() => profileTx.filter(tx => tx.type === 'income').reduce((s, t) => s + t.amount, 0), [profileTx]);
  const expenses = useMemo(() => profileTx.filter(tx => tx.type === 'expense').reduce((s, t) => s + t.amount, 0), [profileTx]);

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t('profiles.noProfiles')}</p>
        <button onClick={() => navigate('/profiles')} className="mt-4 text-primary text-sm">{t('general.back')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/profiles')} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{profile.type === 'person' ? '👤' : '🏢'}</span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{profile.name}</h1>
            <p className="text-xs text-muted-foreground">{t(`profileType.${profile.type}`)}</p>
          </div>
        </div>
      </div>

      {/* Income / Expense cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gradient-income rounded-2xl p-4 text-primary-foreground">
          <TrendingUp className="w-5 h-5 opacity-60 mb-1" />
          <p className="text-xs opacity-80">{t('dashboard.income')}</p>
          <p className="text-lg font-semibold font-mono mt-0.5">{formatCurrency(income)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="gradient-expense rounded-2xl p-4 text-primary-foreground">
          <TrendingDown className="w-5 h-5 opacity-60 mb-1" />
          <p className="text-xs opacity-80">{t('dashboard.expenses')}</p>
          <p className="text-lg font-semibold font-mono mt-0.5">{formatCurrency(expenses)}</p>
        </motion.div>
      </div>

      {/* Transactions */}
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground">{t('profiles.movements')}</h2>
        {profileTx.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('transactions.noTransactions')}</p>
        ) : (
          profileTx.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => {
            const cat = allCategories.find(c => c.id === tx.category);
            const acc = accounts.find(a => a.id === tx.account_id);
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-xl">{cat?.icon || '💰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{cat?.name || tx.category}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                    {acc && <span>• {acc.name}</span>}
                  </div>
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

export default ProfileDetailPage;
