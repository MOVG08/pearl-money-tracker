import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PROFILE_TYPES, type TransactionType } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const TransactionForm: React.FC<Props> = ({ onClose }) => {
  const { t } = useLanguage();
  const { addTransaction, accounts, profiles, addProfile } = useData();
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [profileId, setProfileId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Profile search & quick create
  const [profileSearch, setProfileSearch] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<'person' | 'business'>('person');

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const filteredProfiles = useMemo(() => {
    if (!profileSearch) return profiles;
    const q = profileSearch.toLowerCase();
    return profiles.filter(p => p.name.toLowerCase().includes(q));
  }, [profiles, profileSearch]);

  const selectedProfile = profiles.find(p => p.id === profileId);

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

  const handleQuickCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const newProfile = addProfile({ name: newProfileName.trim(), type: newProfileType });
    if (newProfile) {
      setProfileId(newProfile.id);
    }
    setNewProfileName('');
    setShowQuickCreate(false);
    setShowProfileDropdown(false);
    setProfileSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !accountId || !profileId) return;
    addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      account_id: accountId,
      profile_id: profileId,
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

      {/* Profile selector */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">{t('transactions.profile')}</label>
        {selectedProfile ? (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
            <span className="text-sm">{selectedProfile.type === 'person' ? '👤' : '🏢'}</span>
            <span className="text-sm font-medium text-foreground flex-1">{selectedProfile.name}</span>
            <button type="button" onClick={() => { setProfileId(''); setProfileSearch(''); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('profiles.search')}
                value={profileSearch}
                onChange={(e) => { setProfileSearch(e.target.value); setShowProfileDropdown(true); }}
                onFocus={() => setShowProfileDropdown(true)}
                className="h-11 pl-9 bg-secondary border-border/50 rounded-xl"
              />
            </div>
            {showProfileDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredProfiles.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setProfileId(p.id); setShowProfileDropdown(false); setProfileSearch(''); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <span>{p.type === 'person' ? '👤' : '🏢'}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setShowQuickCreate(true); setShowProfileDropdown(false); setNewProfileName(profileSearch); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-secondary transition-colors border-t border-border"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('profiles.quickCreate')}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick create inline form */}
        {showQuickCreate && (
          <div className="mt-2 bg-secondary rounded-xl p-3 space-y-3">
            <Input
              placeholder={t('profiles.name')}
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="h-10 bg-background border-border/50 rounded-lg text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              {PROFILE_TYPES.map(pt => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setNewProfileType(pt.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all ${
                    newProfileType === pt.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
                  }`}
                >
                  <span>{pt.icon}</span>
                  <span>{t(pt.labelKey)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowQuickCreate(false)} className="flex-1 py-2 rounded-lg text-xs text-muted-foreground bg-background">
                {t('general.cancel')}
              </button>
              <button type="button" onClick={handleQuickCreateProfile} className="flex-1 py-2 rounded-lg text-xs bg-primary text-primary-foreground">
                {t('profiles.save')}
              </button>
            </div>
          </div>
        )}
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
