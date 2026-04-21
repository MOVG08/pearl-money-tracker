import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2, Pencil, History, ArrowRight, BarChart3, CreditCard } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Transaction } from '@/types/database';
import { CategoryIcon } from '@/lib/categoryIcons';
import TransactionForm from '@/components/TransactionForm';
import { isDefaultProfile } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

type SortKey = 'date' | 'created' | 'modified';

const TransactionsPage: React.FC = () => {
  const { t } = useLanguage();
  const { transactions, accounts, profiles, creditAccounts, deleteTransaction, getEditHistory } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date');

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const sortedTransactions = React.useMemo(() => {
    const field = sortKey === 'date' ? 'date' : sortKey === 'created' ? 'created_at' : 'updated_at';
    return [...transactions].sort((a, b) => {
      const av = new Date((a as any)[field] || a.date).getTime();
      const bv = new Date((b as any)[field] || b.date).getTime();
      return bv - av;
    });
  }, [transactions, sortKey]);

  const handleEdit = (tx: Transaction) => { setDetailTx(null); setEditingTx(tx); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingTx(null); };
  const handleDelete = (tx: Transaction) => { setDetailTx(null); deleteTransaction(tx.id); };

  const noProfileLabel = t('dashboard.noProfile');

  const fieldLabel = (field: string): string => {
    const map: Record<string, string> = {
      amount: t('transactions.amount'),
      type: t('transactions.type'),
      category: t('transactions.category'),
      date: t('transactions.date'),
      notes: t('transactions.notes'),
      account_id: t('nav.accounts'),
      destination_account_id: t('nav.accounts'),
      profile_id: t('nav.profiles'),
      credit_account_id: t('nav.accounts'),
    };
    return map[field] || field;
  };

  const formatValue = (field: string, value: string): string => {
    if (!value || value === 'null' || value === 'undefined') return '—';
    if (field === 'account_id' || field === 'destination_account_id') {
      return accounts.find(a => a.id === value)?.name || '—';
    }
    if (field === 'credit_account_id') {
      return creditAccounts.find(c => c.id === value)?.name || '—';
    }
    if (field === 'profile_id') {
      const p = profiles.find(p => p.id === value);
      if (!p) return '—';
      return isDefaultProfile(p) ? noProfileLabel : p.name;
    }
    if (field === 'category') {
      return allCategories.find(c => c.id === value)?.name || value;
    }
    if (field === 'amount') {
      const n = Number(value);
      return isNaN(n) ? value : formatCurrency(n);
    }
    if (field === 'date') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-MX');
    }
    if (field === 'type') {
      const m: Record<string, string> = {
        income: t('dashboard.income'),
        expense: t('dashboard.expenses'),
        transfer: t('transactions.transfer') || 'Transfer',
      };
      return m[value] || value;
    }
    return value;
  };

  const detailHistory = detailTx ? getEditHistory(detailTx.id) : [];
  const detailCat = detailTx ? allCategories.find(c => c.id === detailTx.category) : null;
  const detailAcc = detailTx ? accounts.find(a => a.id === detailTx.account_id) : null;
  const detailDestAcc = detailTx ? accounts.find(a => a.id === detailTx.destination_account_id) : null;
  const detailProfile = detailTx ? profiles.find(p => p.id === detailTx.profile_id) : null;
  const detailCreditAcc = detailTx ? creditAccounts.find(c => c.id === detailTx.credit_account_id) : null;
  const detailIsTransfer = detailTx?.type === 'transfer';

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('transactions.title')}</h1>
        <button onClick={() => { setEditingTx(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
        ><Plus className="w-4 h-4" />{t('transactions.add')}</button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <TransactionForm onClose={handleCloseForm} editTransaction={editingTx || undefined} />
          </motion.div>
        )}
      </AnimatePresence>

      {transactions.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{t('sort.label')}:</span>
          {(['date', 'created', 'modified'] as const).map(k => (
            <button key={k} onClick={() => setSortKey(k)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${sortKey === k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
            >{t(`sort.${k}`)}</button>
          ))}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary border border-border/60 text-muted-foreground">
            <BarChart3 className="w-7 h-7" />
          </div>
          <p className="text-foreground font-medium">{t('transactions.noTransactions')}</p>
          <p className="text-sm text-muted-foreground">{t('transactions.addFirst')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTransactions.map((tx, i) => {
            const cat = allCategories.find(c => c.id === tx.category);
            const acc = accounts.find(a => a.id === tx.account_id);
            const destAcc = accounts.find(a => a.id === tx.destination_account_id);
            const profile = profiles.find(p => p.id === tx.profile_id);
            const creditAcc = creditAccounts.find(c => c.id === tx.credit_account_id);
            const history = getEditHistory(tx.id);
            const isEdited = history.length > 0;
            const isTransfer = tx.type === 'transfer';

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="elegant-card rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setDetailTx(tx)}
                  className="w-full text-left p-4 flex items-center gap-3 hover:bg-secondary/40 transition-colors active:scale-[0.99]"
                >
                  <CategoryIcon
                    category={isTransfer ? 'transfer' : tx.category}
                    type={isTransfer ? 'transfer' : tx.type === 'income' ? 'income' : 'expense'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {isTransfer ? (
                          <span className="flex items-center gap-1">
                            {acc?.name || '?'} <ArrowRight className="w-3 h-3 inline" /> {destAcc?.name || '?'}
                          </span>
                        ) : (cat?.name || tx.category)}
                      </p>
                      {isEdited && (
                        <span className="text-muted-foreground" title={t('transactions.edited')}>
                          <History className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                      {!isTransfer && acc && <span>• {acc.name}</span>}
                      {!isTransfer && !acc && creditAcc && (
                        <span className="inline-flex items-center gap-1">• <CreditCard className="w-3 h-3" /> {creditAcc.name}</span>
                      )}
                      {profile && <span>• {profile.name === '__default_no_profile__' ? t('dashboard.noProfile') : profile.name}</span>}
                      {acc && creditAcc && (
                        <span className="inline-flex items-center gap-1">• <CreditCard className="w-3 h-3" /> {creditAcc.name}</span>
                      )}
                    </div>
                    {tx.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{tx.notes}</p>}
                  </div>
                  <span className={`font-mono text-sm font-medium ${
                    isTransfer ? 'text-primary' : tx.type === 'income' ? 'text-success' : 'text-destructive'
                  }`}>
                    {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detailTx} onOpenChange={(open) => { if (!open) setDetailTx(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('transactions.details')}</DialogTitle>
          </DialogHeader>
          {detailTx && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CategoryIcon
                  category={detailIsTransfer ? 'transfer' : detailTx.category}
                  type={detailIsTransfer ? 'transfer' : detailTx.type === 'income' ? 'income' : 'expense'}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-foreground">
                    {detailIsTransfer ? (
                      <span className="inline-flex items-center gap-1">
                        {detailAcc?.name || '?'} <ArrowRight className="w-3.5 h-3.5" /> {detailDestAcc?.name || '?'}
                      </span>
                    ) : (detailCat?.name || detailTx.category)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`transactions.${detailTx.type}`)}
                  </p>
                </div>
                <span className={`font-mono text-base font-semibold ${
                  detailIsTransfer ? 'text-primary' : detailTx.type === 'income' ? 'text-success' : 'text-destructive'
                }`}>
                  {detailTx.type === 'income' ? '+' : detailTx.type === 'transfer' ? '' : '-'}{formatCurrency(detailTx.amount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{t('transactions.date')}</p>
                  <p className="text-foreground">{new Date(detailTx.date).toLocaleDateString('es-MX')}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{t('transactions.amount')}</p>
                  <p className="font-mono text-foreground">{formatCurrency(detailTx.amount)}</p>
                </div>
                {detailAcc && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      {detailIsTransfer ? t('transactions.sourceAccount') : t('transactions.account')}
                    </p>
                    <p className="text-foreground truncate">{detailAcc.name}</p>
                  </div>
                )}
                {detailDestAcc && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{t('transactions.destinationAccount')}</p>
                    <p className="text-foreground truncate">{detailDestAcc.name}</p>
                  </div>
                )}
                {detailCreditAcc && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> {t('credit.title')}
                    </p>
                    <p className="text-foreground truncate">{detailCreditAcc.name}</p>
                  </div>
                )}
                {!detailIsTransfer && detailCat && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{t('transactions.category')}</p>
                    <p className="text-foreground truncate">{detailCat.name}</p>
                  </div>
                )}
                {detailProfile && (
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{t('transactions.profile')}</p>
                    <p className="text-foreground truncate">
                      {isDefaultProfile(detailProfile) ? noProfileLabel : detailProfile.name}
                    </p>
                  </div>
                )}
              </div>

              {detailTx.notes && (
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{t('transactions.notes')}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{detailTx.notes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-0.5 border-t border-border/50 pt-3">
                {(detailTx as any).created_at && (
                  <p>{t('transactions.createdAt')}: {new Date((detailTx as any).created_at).toLocaleString('es-MX')}</p>
                )}
                {(detailTx as any).updated_at && (detailTx as any).updated_at !== (detailTx as any).created_at && (
                  <p>{t('transactions.updatedAt')}: {new Date((detailTx as any).updated_at).toLocaleString('es-MX')}</p>
                )}
              </div>

              {detailHistory.length > 0 && (
                <div className="border-t border-border/50 pt-3 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <History className="w-3 h-3" /> {t('transactions.history')}
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {detailHistory.map(edit => (
                      <div key={edit.id} className="text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
                        <span className="text-foreground/70 font-medium">{fieldLabel(edit.field)}</span>
                        <span className="line-through text-destructive/60">{formatValue(edit.field, edit.old_value)}</span>
                        <span>→</span>
                        <span className="text-success/80">{formatValue(edit.field, edit.new_value)}</span>
                        <span className="ml-auto">{new Date(edit.edited_at).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleDelete(detailTx)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> {t('transactions.delete')}
                </button>
                <button
                  onClick={() => handleEdit(detailTx)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-95 transition-transform inline-flex items-center justify-center gap-1.5"
                >
                  <Pencil className="w-4 h-4" /> {t('transactions.edit')}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsPage;
