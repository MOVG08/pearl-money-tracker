import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { ACCOUNT_TYPES } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const AccountsPage: React.FC = () => {
  const { t } = useLanguage();
  const { accounts, addAccount } = useData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'credit_card' | 'savings' | 'other'>('bank');
  const [balance, setBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    addAccount({ name, type, balance: parseFloat(balance) || 0, currency: 'MXN' });
    setName('');
    setBalance('');
    setShowForm(false);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('accounts.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          {t('accounts.add')}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-5 space-y-4"
        >
          <Input
            placeholder={t('accounts.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 bg-secondary border-border/50 rounded-xl"
            required
          />
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t('accounts.type')}</label>
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map(at => (
                <button
                  key={at.value}
                  type="button"
                  onClick={() => setType(at.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all ${
                    type === at.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  <span className="text-lg">{at.icon}</span>
                  <span>{at.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder={t('accounts.balance')}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="h-12 bg-secondary border-border/50 rounded-xl font-mono"
          />
          <button type="submit" className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-95 transition-transform">
            {t('accounts.save')}
          </button>
        </motion.form>
      )}

      {accounts.length === 0 && !showForm ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🏦</p>
          <p className="text-foreground font-medium">{t('accounts.noAccounts')}</p>
          <p className="text-sm text-muted-foreground">{t('accounts.createFirst')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc, i) => {
            const at = ACCOUNT_TYPES.find(a => a.value === acc.type);
            return (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-2xl">{at?.icon || '📁'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{acc.name}</p>
                  <p className="text-xs text-muted-foreground">{at?.label || acc.type}</p>
                </div>
                <span className="font-mono text-sm font-medium text-foreground">{formatCurrency(acc.balance)}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
