import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionType } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

const TransactionForm: React.FC<Props> = ({ onClose }) => {
  const { t } = useLanguage();
  const { addTransaction, accounts } = useData();
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  if (accounts.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4 text-center">
        <p className="text-3xl">🏦</p>
        <p className="text-foreground font-medium">{t('accounts.needAccount')}</p>
        <button
          onClick={() => { onClose(); navigate('/accounts'); }}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium"
        >
          {t('accounts.add')}
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !accountId) return;
    addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      account_id: accountId,
      date,
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2 bg-secondary rounded-xl p-1">
        {(['expense', 'income'] as const).map((t_type) => (
          <button
            key={t_type}
            type="button"
            onClick={() => { setType(t_type); setCategory(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              type === t_type
                ? t_type === 'expense' ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {t(`transactions.${t_type}`)}
          </button>
        ))}
      </div>

      {/* Amount */}
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-14 text-2xl font-mono text-center bg-secondary border-border/50 rounded-xl"
        required
      />

      {/* Account */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">{t('transactions.account')}</label>
        <div className="flex gap-2 flex-wrap">
          {accounts.map(acc => (
            <button
              key={acc.id}
              type="button"
              onClick={() => setAccountId(acc.id)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                accountId === acc.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {acc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">{t('transactions.category')}</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all ${
                category === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="truncate w-full text-center">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-12 bg-secondary border-border/50 rounded-xl"
      />

      {/* Notes */}
      <Textarea
        placeholder={t('transactions.notes')}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="bg-secondary border-border/50 rounded-xl resize-none"
        rows={2}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-muted-foreground bg-secondary">
          {t('general.cancel')}
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-95 transition-transform">
          {t('transactions.save')}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
