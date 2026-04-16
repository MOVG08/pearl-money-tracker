import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2, Pencil, History, ChevronDown, ArrowRight } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Transaction } from '@/types/database';
import TransactionForm from '@/components/TransactionForm';
import { isDefaultProfile } from '@/contexts/DataContext';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

type SortKey = 'date' | 'created' | 'modified';

const TransactionsPage: React.FC = () => {
  const { t } = useLanguage();
  const { transactions, accounts, profiles, creditAccounts, deleteTransaction, getEditHistory } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
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

  const handleEdit = (tx: Transaction) => { setEditingTx(tx); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setEditingTx(null); };

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
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">📊</p>
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
            const isHistoryExpanded = expandedHistory === tx.id;
            const isTransfer = tx.type === 'transfer';

            return (
              <motion.div key={tx.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-xl overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <span className="text-xl">{isTransfer ? '🔄' : cat?.icon || '💰'}</span>
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
                        <button onClick={() => setExpandedHistory(isHistoryExpanded ? null : tx.id)}
                          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <History className="w-3 h-3" />
                          <ChevronDown className={`w-3 h-3 transition-transform ${isHistoryExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                      {!isTransfer && acc && <span>• {acc.name}</span>}
                      {!isTransfer && !acc && creditAcc && <span>• 💳 {creditAcc.name}</span>}
                      {profile && <span>• {profile.name === '__default_no_profile__' ? t('dashboard.noProfile') : profile.name}</span>}
                      {acc && creditAcc && <span>• 💳 {creditAcc.name}</span>}
                    </div>
                    {tx.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{tx.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-sm font-medium ${
                      isTransfer ? 'text-primary' : tx.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <button onClick={() => handleEdit(tx)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteTransaction(tx.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <AnimatePresence>
                  {isHistoryExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-3 pt-1 border-t border-border/50 space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">{t('transactions.history')}</p>
                        {history.map(edit => (
                          <div key={edit.id} className="text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
                            <span className="text-foreground/70 font-medium">{fieldLabel(edit.field)}</span>
                            <span className="line-through text-destructive/60">{formatValue(edit.field, edit.old_value)}</span>
                            <span>→</span>
                            <span className="text-success/80">{formatValue(edit.field, edit.new_value)}</span>
                            <span className="ml-auto">{new Date(edit.edited_at).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
