import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { ACCOUNT_TYPES, CREDIT_TYPES, type CreditType } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Landmark, Folder, CreditCard } from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const AccountsPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { accounts, creditAccounts, addAccount, deleteAccount, addCreditAccount, deleteCreditAccount, getAccountBalance, getCreditAccountBalance, getLoanBalance } = useData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'savings' | 'investment' | 'other'>('bank');
  const [balance, setBalance] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Credit form
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditName, setCreditName] = useState('');
  const [creditType, setCreditType] = useState<CreditType>('credit_card');
  const [creditLimit, setCreditLimit] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [cutOffDate, setCutOffDate] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [minMonthlySpend, setMinMonthlySpend] = useState('');
  const [startDate, setStartDate] = useState('');
  const [confirmCreditDelete, setConfirmCreditDelete] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    addAccount({ name, type, balance: parseFloat(balance) || 0, currency: 'MXN' });
    setName(''); setBalance(''); setShowForm(false);
  };

  const handleCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditName) return;
    const isCard = creditType === 'credit_card';
    addCreditAccount({
      name: creditName,
      credit_type: creditType,
      credit_limit: parseFloat(creditLimit) || 0,
      next_payment_date: nextPaymentDate || undefined,
      cut_off_date: isCard ? (cutOffDate || undefined) : undefined,
      payment_due_date: isCard ? (paymentDueDate || undefined) : undefined,
      min_monthly_spend: isCard ? (parseFloat(minMonthlySpend) || 0) : 0,
      start_date: !isCard ? (startDate || undefined) : undefined,
    });
    setCreditName(''); setCreditLimit(''); setNextPaymentDate(''); setCutOffDate(''); setPaymentDueDate(''); setMinMonthlySpend(''); setStartDate('');
    setShowCreditForm(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete === id) { deleteAccount(id); setConfirmDelete(null); }
    else { setConfirmDelete(id); setTimeout(() => setConfirmDelete(null), 3000); }
  };

  const handleCreditDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmCreditDelete === id) { deleteCreditAccount(id); setConfirmCreditDelete(null); }
    else { setConfirmCreditDelete(id); setTimeout(() => setConfirmCreditDelete(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Regular Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('accounts.title')}</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
          ><Plus className="w-4 h-4" />{t('accounts.add')}</button>
        </div>

        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleSubmit} className="glass rounded-2xl p-5 space-y-4">
            <Input placeholder={t('accounts.name')} value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-secondary border-border/50 rounded-xl" required />
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t('accounts.type')}</label>
              <div className="grid grid-cols-2 gap-2">
                {ACCOUNT_TYPES.map(at => {
                  const Icon = at.Icon;
                  return (
                    <button key={at.value} type="button" onClick={() => setType(at.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all ${type === at.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    ><Icon className="w-5 h-5" /><span>{t(at.labelKey)}</span></button>
                  );
                })}
              </div>
            </div>
            <Input type="number" inputMode="decimal" step="0.01" placeholder={t('accounts.balance')} value={balance} onChange={(e) => setBalance(e.target.value)} className="h-12 bg-secondary border-border/50 rounded-xl font-mono" />
            <button type="submit" className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-95 transition-transform">{t('accounts.save')}</button>
          </motion.form>
        )}

        {accounts.length === 0 && !showForm ? (
          <div className="text-center py-12 space-y-2">
            <Landmark className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-foreground font-medium">{t('accounts.noAccounts')}</p>
            <p className="text-sm text-muted-foreground">{t('accounts.createFirst')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc, i) => {
              const at = ACCOUNT_TYPES.find(a => a.value === acc.type);
              const Icon = at?.Icon ?? Folder;
              return (
                <motion.div key={acc.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/accounts/${acc.id}`)}
                  className="glass rounded-xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground"><Icon className="w-5 h-5" /></span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{at ? t(at.labelKey) : acc.type}</p>
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground mr-2">{formatCurrency(getAccountBalance(acc.id))}</span>
                  <button onClick={(e) => handleDelete(acc.id, e)}
                    className={`p-2 rounded-lg transition-colors ${confirmDelete === acc.id ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground hover:text-destructive'}`}
                  ><Trash2 className="w-4 h-4" /></button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Credit Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t('credit.title')}</h2>
          <button onClick={() => setShowCreditForm(!showCreditForm)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
          ><Plus className="w-4 h-4" />{t('credit.add')}</button>
        </div>

        {showCreditForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleCreditSubmit} className="glass rounded-2xl p-5 space-y-4">
            <Input placeholder={t('credit.name')} value={creditName} onChange={(e) => setCreditName(e.target.value)} className="h-12 bg-secondary border-border/50 rounded-xl" required />
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t('credit.type')}</label>
              <div className="grid grid-cols-2 gap-2">
                {CREDIT_TYPES.map(ct => {
                  const Icon = ct.Icon;
                  return (
                    <button key={ct.value} type="button" onClick={() => setCreditType(ct.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all ${creditType === ct.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                    ><Icon className="w-5 h-5" /><span>{t(ct.labelKey)}</span></button>
                  );
                })}
              </div>
            </div>
            <Input type="number" inputMode="decimal" step="0.01"
              placeholder={creditType === 'credit_card' ? t('credit.creditLimit') : t('credit.loanAmount')}
              value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)}
              className="h-12 bg-secondary border-border/50 rounded-xl font-mono"
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t('credit.nextPayment')}</label>
              <Input type="date" value={nextPaymentDate} onChange={(e) => setNextPaymentDate(e.target.value)} className="h-12 bg-secondary border-border/50 rounded-xl" />
            </div>
            {creditType === 'credit_card' ? (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t('credit.cutOffDate')}</label>
                  <Input type="date" value={cutOffDate} onChange={(e) => setCutOffDate(e.target.value)} className="h-12 bg-secondary border-border/50 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{t('credit.paymentDueDate')}</label>
                  <Input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} className="h-12 bg-secondary border-border/50 rounded-xl" />
                </div>
                <Input type="number" inputMode="decimal" step="0.01" placeholder={t('credit.minSpend')}
                  value={minMonthlySpend} onChange={(e) => setMinMonthlySpend(e.target.value)}
                  className="h-12 bg-secondary border-border/50 rounded-xl font-mono"
                />
              </>
            ) : (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">{t('credit.startDate')}</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12 bg-secondary border-border/50 rounded-xl" />
              </div>
            )}
            <button type="submit" className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-95 transition-transform">{t('credit.save')}</button>
          </motion.form>
        )}

        {creditAccounts.length === 0 && !showCreditForm ? (
          <div className="text-center py-12 space-y-2">
            <CreditCard className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-foreground font-medium">{t('credit.noCreditAccounts')}</p>
            <p className="text-sm text-muted-foreground">{t('credit.createFirst')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {creditAccounts.map((ca, i) => {
              const ct = CREDIT_TYPES.find(c => c.value === ca.credit_type);
              const isCard = ca.credit_type === 'credit_card';
              const cardBal = isCard ? getCreditAccountBalance(ca.id) : null;
              const loanBal = !isCard ? getLoanBalance(ca.id) : null;
              const minSpendPct = isCard && ca.min_monthly_spend > 0 && cardBal
                ? Math.min(100, (cardBal.cycleSpent / ca.min_monthly_spend) * 100) : 0;

              return (
                <motion.div key={ca.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/credit-accounts/${ca.id}`)}
                  className="glass rounded-xl p-4 space-y-2 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground">
                      {(() => { const Icon = ct?.Icon ?? CreditCard; return <Icon className="w-5 h-5" />; })()}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{ca.name}</p>
                      <p className="text-xs text-muted-foreground">{ct ? t(ct.labelKey) : ca.credit_type}</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="font-mono text-sm font-medium text-foreground">
                        {formatCurrency(isCard ? cardBal!.availableCredit : loanBal!.remaining)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isCard ? t('credit.availableCredit') : t('credit.remaining')}
                      </p>
                    </div>
                    <button onClick={(e) => handleCreditDelete(ca.id, e)}
                      className={`p-2 rounded-lg transition-colors ${confirmCreditDelete === ca.id ? 'bg-destructive text-destructive-foreground' : 'text-muted-foreground hover:text-destructive'}`}
                    ><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {isCard ? (
                      <>
                        <span>{t('credit.totalSpent')}: {formatCurrency(cardBal!.totalSpent)}</span>
                        <span>{t('credit.creditLimit')}: {formatCurrency(ca.credit_limit)}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('credit.borrowed')}: {formatCurrency(loanBal!.borrowed)}</span>
                        <span>{t('credit.paid')}: {formatCurrency(loanBal!.paid)}</span>
                      </>
                    )}
                  </div>
                  {isCard && ca.min_monthly_spend > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t('credit.minSpendProgress')}</span>
                        <span>{formatCurrency(cardBal!.cycleSpent)} / {formatCurrency(ca.min_monthly_spend)}</span>
                      </div>
                      <Progress value={minSpendPct} className="h-2" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsPage;
