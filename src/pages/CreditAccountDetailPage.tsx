import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CREDIT_TYPES } from '@/types/database';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const CreditAccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { creditAccounts, transactions, accounts, profiles, getCreditAccountBalance } = useData();

  const creditAccount = creditAccounts.find(c => c.id === id);
  if (!creditAccount) {
    return (
      <div className="text-center py-16">
        <p className="text-foreground">{t('general.back')}</p>
        <button onClick={() => navigate('/accounts')} className="text-primary mt-2">{t('general.back')}</button>
      </div>
    );
  }

  const ct = CREDIT_TYPES.find(c => c.value === creditAccount.credit_type);
  const { totalSpent, availableCredit, monthlySpent } = getCreditAccountBalance(creditAccount.id);
  const minSpendPct = creditAccount.min_monthly_spend > 0 ? Math.min(100, (monthlySpent / creditAccount.min_monthly_spend) * 100) : 0;

  const creditTxs = transactions.filter(tx => tx.credit_account_id === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div className="space-y-5 pb-24">
      <button onClick={() => navigate('/accounts')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />{t('general.back')}
      </button>

      {/* Header */}
      <div className="glass rounded-2xl p-5 text-center space-y-1">
        <span className="text-3xl">{ct?.icon || '💳'}</span>
        <h1 className="text-xl font-semibold text-foreground">{creditAccount.name}</h1>
        <p className="text-xs text-muted-foreground">{ct ? t(ct.labelKey) : creditAccount.credit_type}</p>
      </div>

      {/* Balance info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('credit.availableCredit')}</p>
          <p className="text-lg font-mono font-semibold text-success">{formatCurrency(availableCredit)}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">{t('credit.totalSpent')}</p>
          <p className="text-lg font-mono font-semibold text-destructive">{formatCurrency(totalSpent)}</p>
        </div>
      </div>

      <div className="glass rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground">{creditAccount.credit_type === 'credit_card' ? t('credit.creditLimit') : t('credit.loanAmount')}</p>
        <p className="text-lg font-mono font-semibold text-foreground">{formatCurrency(creditAccount.credit_limit)}</p>
      </div>

      {/* TDC-specific info */}
      {creditAccount.credit_type === 'credit_card' && (
        <div className="glass rounded-xl p-4 space-y-3">
          {creditAccount.cut_off_date && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('credit.cutOffDate')}</span>
              <span className="text-foreground">{new Date(creditAccount.cut_off_date).toLocaleDateString('es-MX')}</span>
            </div>
          )}
          {creditAccount.payment_due_date && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('credit.paymentDueDate')}</span>
              <span className="text-foreground">{new Date(creditAccount.payment_due_date).toLocaleDateString('es-MX')}</span>
            </div>
          )}
          {creditAccount.min_monthly_spend > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('credit.minSpendProgress')}</span>
                <span className="text-foreground font-mono">{formatCurrency(monthlySpent)} / {formatCurrency(creditAccount.min_monthly_spend)}</span>
              </div>
              <Progress value={minSpendPct} className="h-2.5" />
            </div>
          )}
        </div>
      )}

      {creditAccount.next_payment_date && (
        <div className="glass rounded-xl p-4 flex justify-between text-sm">
          <span className="text-muted-foreground">{t('credit.nextPayment')}</span>
          <span className="text-foreground">{new Date(creditAccount.next_payment_date).toLocaleDateString('es-MX')}</span>
        </div>
      )}

      {/* Transactions */}
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground">{t('credit.transactions')}</h2>
        {creditTxs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('transactions.noTransactions')}</p>
        ) : (
          creditTxs.map((tx, i) => {
            const cat = allCategories.find(c => c.id === tx.category);
            const acc = accounts.find(a => a.id === tx.account_id);
            const profile = profiles.find(p => p.id === tx.profile_id);
            const isPayment = tx.category === 'card_payment';

            return (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-xl">{isPayment ? '✅' : cat?.icon || '💰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{isPayment ? t('transactions.cardPayment') : cat?.name || tx.category}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                    {acc && <span>• {acc.name}</span>}
                    {profile && <span>• {profile.name}</span>}
                  </div>
                </div>
                <span className={`font-mono text-sm font-medium ${isPayment ? 'text-success' : 'text-destructive'}`}>
                  {isPayment ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CreditAccountDetailPage;
