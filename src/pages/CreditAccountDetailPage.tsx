import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CREDIT_TYPES } from '@/types/database';
import { CategoryIcon } from '@/lib/categoryIcons';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CreditCard } from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const CreditAccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { creditAccounts, transactions, accounts, profiles, getCreditAccountBalance, getLoanBalance, updateCreditAccount } = useData();

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
  const isCard = creditAccount.credit_type === 'credit_card';
  const cardBal = isCard ? getCreditAccountBalance(creditAccount.id) : null;
  const loanBal = !isCard ? getLoanBalance(creditAccount.id) : null;
  const minSpendPct = isCard && creditAccount.min_monthly_spend > 0 && cardBal
    ? Math.min(100, (cardBal.cycleSpent / creditAccount.min_monthly_spend) * 100) : 0;

  const creditTxs = transactions.filter(tx => tx.credit_account_id === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const dateValue = (iso?: string) => (iso ? iso.slice(0, 10) : '');
  const handleDateChange = (field: 'cut_off_date' | 'payment_due_date' | 'next_payment_date' | 'start_date') => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCreditAccount(creditAccount.id, { [field]: e.target.value || undefined } as any);
  };

  return (
    <div className="space-y-5 pb-24">
      <button onClick={() => navigate('/accounts')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />{t('general.back')}
      </button>

      {/* Header */}
      <div className="elegant-card rounded-2xl p-5 text-center space-y-1">
        <span className="inline-flex w-12 h-12 rounded-2xl bg-secondary items-center justify-center text-foreground border border-border/50">
          {(() => { const Icon = ct?.Icon ?? CreditCard; return <Icon className="w-6 h-6" />; })()}
        </span>
        <h1 className="text-xl font-semibold text-foreground">{creditAccount.name}</h1>
        <p className="text-xs text-muted-foreground">{ct ? t(ct.labelKey) : creditAccount.credit_type}</p>
      </div>

      {/* Balance info */}
      {isCard ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="elegant-card rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">{t('credit.availableCredit')}</p>
              <p className="text-lg font-mono font-semibold text-success">{formatCurrency(cardBal!.availableCredit)}</p>
            </div>
            <div className="elegant-card rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">{t('credit.totalSpent')}</p>
              <p className="text-lg font-mono font-semibold text-destructive">{formatCurrency(cardBal!.totalSpent)}</p>
            </div>
          </div>
          <div className="elegant-card rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('credit.creditLimit')}</p>
            <p className="text-lg font-mono font-semibold text-foreground">{formatCurrency(creditAccount.credit_limit)}</p>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="elegant-card rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">{t('credit.remaining')}</p>
              <p className="text-lg font-mono font-semibold text-destructive">{formatCurrency(loanBal!.remaining)}</p>
            </div>
            <div className="elegant-card rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground">{t('credit.paid')}</p>
              <p className="text-lg font-mono font-semibold text-success">{formatCurrency(loanBal!.paid)}</p>
            </div>
          </div>
          <div className="elegant-card rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('credit.borrowed')}</p>
            <p className="text-lg font-mono font-semibold text-foreground">{formatCurrency(loanBal!.borrowed)}</p>
          </div>
        </>
      )}

      {/* Editable dates */}
      <div className="elegant-card rounded-xl p-4 space-y-3">
        {isCard && (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground shrink-0">{t('credit.cutOffDate')}</span>
              <Input type="date" value={dateValue(creditAccount.cut_off_date)} onChange={handleDateChange('cut_off_date')}
                className="h-9 max-w-[180px] bg-secondary border-border/50 rounded-lg text-foreground" />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground shrink-0">{t('credit.paymentDueDate')}</span>
              <Input type="date" value={dateValue(creditAccount.payment_due_date)} onChange={handleDateChange('payment_due_date')}
                className="h-9 max-w-[180px] bg-secondary border-border/50 rounded-lg text-foreground" />
            </div>
          </>
        )}
        {!isCard && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground shrink-0">{t('credit.startDate')}</span>
            <Input type="date" value={dateValue(creditAccount.start_date)} onChange={handleDateChange('start_date')}
              className="h-9 max-w-[180px] bg-secondary border-border/50 rounded-lg text-foreground" />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground shrink-0">{t('credit.nextPayment')}</span>
          <Input type="date" value={dateValue(creditAccount.next_payment_date)} onChange={handleDateChange('next_payment_date')}
            className="h-9 max-w-[180px] bg-secondary border-border/50 rounded-lg text-foreground" />
        </div>
        {isCard && (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground shrink-0">{t('credit.minSpend')}</span>
              <Input type="number" inputMode="decimal" step="0.01"
                value={creditAccount.min_monthly_spend ?? 0}
                onChange={(e) => updateCreditAccount(creditAccount.id, { min_monthly_spend: parseFloat(e.target.value) || 0 })}
                className="h-9 max-w-[180px] bg-secondary border-border/50 rounded-lg text-foreground font-mono text-right" />
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('credit.minSpendProgress')}</span>
                <span className="text-foreground font-mono">
                  {formatCurrency(cardBal!.cycleSpent)} / {formatCurrency(creditAccount.min_monthly_spend || 0)}
                </span>
              </div>
              <Progress value={minSpendPct} className="h-2.5" />
            </div>
          </>
        )}
      </div>

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
            const isPayment = tx.category === 'debt_payment' || tx.category === 'card_payment';

            return (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="elegant-card rounded-xl p-4 flex items-center gap-3"
              >
                <CategoryIcon
                  category={isPayment ? 'payment_done' : tx.category}
                  type={isPayment ? 'payment' : 'expense'}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{isPayment ? t('transactions.cardPayment') : cat?.name || tx.category}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                    {acc && <span>• {acc.name}</span>}
                    {profile && <span>• {profile.name === '__default_no_profile__' ? t('dashboard.noProfile') : profile.name}</span>}
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
