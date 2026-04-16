import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PROFILE_TYPES, type TransactionType, type Transaction } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X, CreditCard } from 'lucide-react';

interface Props {
  onClose: () => void;
  editTransaction?: Transaction;
}

const TransactionForm: React.FC<Props> = ({ onClose, editTransaction }) => {
  const { t } = useLanguage();
  const { addTransaction, updateTransaction, accounts, profiles, creditAccounts, addProfile } = useData();
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>(editTransaction?.type || 'expense');
  const [amount, setAmount] = useState(editTransaction ? String(editTransaction.amount) : '');
  const [category, setCategory] = useState(editTransaction?.category || '');
  // Unified source: either an account_id or a credit_account_id (mutually exclusive)
  const initialSource: { kind: 'account' | 'credit'; id: string } =
    editTransaction?.credit_account_id
      ? { kind: 'credit', id: editTransaction.credit_account_id }
      : { kind: 'account', id: editTransaction?.account_id || accounts[0]?.id || '' };
  const [source, setSource] = useState(initialSource);
  const [destinationAccountId, setDestinationAccountId] = useState(editTransaction?.destination_account_id || '');
  const [profileId, setProfileId] = useState(editTransaction?.profile_id || '');
  const [date, setDate] = useState(editTransaction?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(editTransaction?.notes || '');
  // For card_payment expenses paid from a regular account: which credit card to apply payment to
  const [paymentCardId, setPaymentCardId] = useState(
    editTransaction && editTransaction.category === 'card_payment' && editTransaction.account_id
      ? editTransaction.credit_account_id || ''
      : ''
  );

  const [profileSearch, setProfileSearch] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<'person' | 'business' | 'bank'>('person');

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const filteredProfiles = useMemo(() => {
    if (!profileSearch) return profiles;
    const q = profileSearch.toLowerCase();
    return profiles.filter(p => p.name.toLowerCase().includes(q));
  }, [profiles, profileSearch]);

  const selectedProfile = profiles.find(p => p.id === profileId);
  const accountId = source.kind === 'account' ? source.id : '';
  const creditAccountId = source.kind === 'credit' ? source.id : '';
  const destinationAccounts = useMemo(() => accounts.filter(a => a.id !== accountId), [accounts, accountId]);

  if (accounts.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4 text-center">
        <p className="text-3xl">🏦</p>
        <p className="text-foreground font-medium">{t('accounts.needAccount')}</p>
        <button onClick={() => { onClose(); navigate('/accounts'); }} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium">
          {t('accounts.add')}
        </button>
      </div>
    );
  }

  const handleQuickCreateProfile = async () => {
    if (!newProfileName.trim()) return;
    const newProfile = await addProfile({ name: newProfileName.trim(), type: newProfileType });
    if (newProfile) setProfileId(newProfile.id);
    setNewProfileName('');
    setShowQuickCreate(false);
    setShowProfileDropdown(false);
    setProfileSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    if (type === 'transfer' && (!accountId || !destinationAccountId)) return;
    if (type !== 'transfer' && !category) return;
    if (type !== 'expense' && !accountId) return; // income/transfer must use a regular account
    if (type === 'expense' && !accountId && !creditAccountId) return;

    // Determine final credit_account_id:
    // - if source is a credit card: that card is the source (charge)
    // - else if category is card_payment and a card is selected: attribute payment to it
    let finalCreditAccountId: string | undefined;
    if (source.kind === 'credit') finalCreditAccountId = creditAccountId;
    else if (type === 'expense' && category === 'card_payment' && paymentCardId) finalCreditAccountId = paymentCardId;

    const txData: any = {
      type,
      amount: parseFloat(amount),
      category: type === 'transfer' ? 'transfer' : category,
      account_id: source.kind === 'account' ? accountId : null,
      profile_id: profileId || undefined,
      destination_account_id: type === 'transfer' ? destinationAccountId : undefined,
      credit_account_id: finalCreditAccountId,
      date,
      notes: notes || undefined,
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 space-y-4">
      {/* Type toggle */}
      <div>
        <div className="flex gap-2 bg-secondary rounded-xl p-1">
          {(['expense', 'income', 'transfer'] as const).map((t_type) => (
            <button
              key={t_type}
              type="button"
              onClick={() => {
                setType(t_type);
                if (!editTransaction) {
                  setCategory('');
                  // Reset to a regular account for non-expense types
                  if (t_type !== 'expense' && source.kind === 'credit') {
                    setSource({ kind: 'account', id: accounts[0]?.id || '' });
                  }
                }
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === t_type
                  ? t_type === 'expense' ? 'bg-destructive text-destructive-foreground'
                    : t_type === 'income' ? 'bg-success text-success-foreground'
                    : 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {t(`transactions.${t_type}`)}
            </button>
          ))}
        </div>
        {type === 'transfer' && (
          <p className="text-xs text-muted-foreground mt-1.5 text-center">{t('transactions.transferHint')}</p>
        )}
      </div>

      {/* Amount */}
      <Input
        type="number" inputMode="decimal" step="0.01" placeholder="0.00"
        value={amount} onChange={(e) => setAmount(e.target.value)}
        className="h-14 text-2xl font-mono text-center bg-secondary border-border/50 rounded-xl" required
      />

      {/* Source Account (regular accounts + credit accounts for expenses) */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">
          {t('transactions.sourceAccount')}
        </label>
        <div className="space-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">{t('transactions.account')}</p>
            <div className="flex gap-2 flex-wrap">
              {accounts.map(acc => (
                <button key={acc.id} type="button"
                  onClick={() => {
                    setSource({ kind: 'account', id: acc.id });
                    if (destinationAccountId === acc.id) setDestinationAccountId('');
                  }}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${source.kind === 'account' && source.id === acc.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >{acc.name}</button>
              ))}
            </div>
          </div>
          {type === 'expense' && creditAccounts.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> {t('credit.title')}
              </p>
              <div className="flex gap-2 flex-wrap">
                {creditAccounts.map(ca => (
                  <button key={ca.id} type="button"
                    onClick={() => setSource({ kind: 'credit', id: ca.id })}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${source.kind === 'credit' && source.id === ca.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  >💳 {ca.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Destination Account (transfer only) */}
      {type === 'transfer' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('transactions.destinationAccount')}</label>
          <div className="flex gap-2 flex-wrap">
            {destinationAccounts.map(acc => (
              <button key={acc.id} type="button"
                onClick={() => setDestinationAccountId(acc.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${destinationAccountId === acc.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >{acc.name}</button>
            ))}
          </div>
          {destinationAccounts.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t('transactions.needTwoAccounts')}</p>
          )}
        </div>
      )}

      {/* Profile selector (not for transfers) */}
      {type !== 'transfer' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('transactions.profile')}</label>
          {selectedProfile ? (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
              <span className="text-sm">{PROFILE_TYPES.find(pt => pt.value === selectedProfile.type)?.icon || '👤'}</span>
              <span className="text-sm font-medium text-foreground flex-1">{selectedProfile.name}</span>
              <button type="button" onClick={() => { setProfileId(''); setProfileSearch(''); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('profiles.search')} value={profileSearch}
                  onChange={(e) => { setProfileSearch(e.target.value); setShowProfileDropdown(true); }}
                  onFocus={() => setShowProfileDropdown(true)}
                  className="h-11 pl-9 bg-secondary border-border/50 rounded-xl"
                />
              </div>
              {showProfileDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredProfiles.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => { setProfileId(p.id); setShowProfileDropdown(false); setProfileSearch(''); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <span>{PROFILE_TYPES.find(pt => pt.value === p.type)?.icon || '👤'}</span><span>{p.name}</span>
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => { setShowQuickCreate(true); setShowProfileDropdown(false); setNewProfileName(profileSearch); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-secondary transition-colors border-t border-border"
                  >
                    <Plus className="w-4 h-4" /><span>{t('profiles.quickCreate')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {showQuickCreate && (
            <div className="mt-2 bg-secondary rounded-xl p-3 space-y-3">
              <Input placeholder={t('profiles.name')} value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="h-10 bg-background border-border/50 rounded-lg text-sm" autoFocus
              />
              <div className="flex gap-2">
                {PROFILE_TYPES.map(pt => (
                  <button key={pt.value} type="button" onClick={() => setNewProfileType(pt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all ${
                      newProfileType === pt.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
                    }`}
                  ><span>{pt.icon}</span><span>{t(pt.labelKey)}</span></button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowQuickCreate(false)} className="flex-1 py-2 rounded-lg text-xs text-muted-foreground bg-background">{t('general.cancel')}</button>
                <button type="button" onClick={handleQuickCreateProfile} className="flex-1 py-2 rounded-lg text-xs bg-primary text-primary-foreground">{t('profiles.save')}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category (not for transfers) */}
      {type !== 'transfer' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">{t('transactions.category')}</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
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
      )}

      {/* Card payment target (when paying a credit card from a regular account) */}
      {type === 'expense' && category === 'card_payment' && source.kind === 'account' && creditAccounts.length > 0 && (
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> {t('transactions.payToCard')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {creditAccounts.map(ca => (
              <button key={ca.id} type="button" onClick={() => setPaymentCardId(ca.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${paymentCardId === ca.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >💳 {ca.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Date */}
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 bg-secondary border-border/50 rounded-xl" />

      {/* Notes */}
      <Textarea placeholder={t('transactions.notes')} value={notes} onChange={(e) => setNotes(e.target.value)}
        className="bg-secondary border-border/50 rounded-xl resize-none" rows={2}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium text-muted-foreground bg-secondary">{t('general.cancel')}</button>
        <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground active:scale-95 transition-transform">
          {editTransaction ? t('transactions.update') : t('transactions.save')}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
