import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, TrendingUp, TrendingDown, Folder } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ACCOUNT_TYPES } from '@/types/database';
import { CategoryIcon } from '@/lib/categoryIcons';
import { format } from 'date-fns';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { accounts, transactions, profiles, getAccountBalance } = useData();

  const account = accounts.find(a => a.id === id);
  const accountType = ACCOUNT_TYPES.find(at => at.value === account?.type);

  const [expandedCard, setExpandedCard] = useState<'income' | 'expense' | null>(null);

  const accountTx = useMemo(() =>
    transactions.filter(tx => tx.account_id === id || tx.destination_account_id === id),
    [transactions, id]
  );

  const nonTransferTx = useMemo(() => accountTx.filter(tx => tx.type !== 'transfer'), [accountTx]);

  const income = useMemo(() => nonTransferTx.filter(tx => tx.type === 'income').reduce((s, t) => s + t.amount, 0), [nonTransferTx]);
  const expenses = useMemo(() => nonTransferTx.filter(tx => tx.type === 'expense').reduce((s, t) => s + t.amount, 0), [nonTransferTx]);

  const groupByProfile = (type: 'income' | 'expense') => {
    const txs = nonTransferTx.filter(tx => tx.type === type);
    const grouped: Record<string, number> = {};
    txs.forEach(tx => {
      const key = tx.profile_id || '__none__';
      grouped[key] = (grouped[key] || 0) + tx.amount;
    });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0);
    return Object.entries(grouped).map(([pid, value]) => {
      const profile = profiles.find(p => p.id === pid);
      return { name: profile?.name || t('dashboard.noProfile'), value, pct: total > 0 ? Math.round((value / total) * 100) : 0 };
    }).sort((a, b) => b.value - a.value);
  };

  const balanceData = useMemo(() => {
    const sorted = [...accountTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulative = account?.balance ?? 0;
    return sorted.map(tx => {
      if (tx.type === 'income') {
        cumulative += tx.amount;
      } else if (tx.type === 'expense') {
        cumulative -= tx.amount;
      } else if (tx.type === 'transfer') {
        if (tx.account_id === id) cumulative -= tx.amount;
        if (tx.destination_account_id === id) cumulative += tx.amount;
      }
      return { date: format(new Date(tx.date), 'dd/MM'), balance: cumulative };
    });
  }, [accountTx, account, id]);

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  if (!account) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t('accounts.noAccounts')}</p>
        <button onClick={() => navigate('/accounts')} className="mt-4 text-primary text-sm">{t('general.back')}</button>
      </div>
    );
  }

  const currentBalance = getAccountBalance(account.id);

  const cards = [
    { key: 'income' as const, label: t('dashboard.income'), value: income, icon: TrendingUp, className: 'gradient-income' },
    { key: 'expense' as const, label: t('dashboard.expenses'), value: expenses, icon: TrendingDown, className: 'gradient-expense' },
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/accounts')} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground">
            {(() => { const Icon = accountType?.Icon ?? Folder; return <Icon className="w-5 h-5" />; })()}
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{account.name}</h1>
            <p className="text-xs text-muted-foreground">{accountType ? t(accountType.labelKey) : account.type}</p>
          </div>
        </div>
      </div>

      {/* Balance prominent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-balance rounded-2xl p-6 text-primary-foreground text-center"
      >
        <p className="text-sm opacity-80">{t('dashboard.balance')}</p>
        <p className="text-3xl font-bold font-mono mt-1">{formatCurrency(currentBalance)}</p>
      </motion.div>

      {/* Income / Expense cards */}
      <div className="grid grid-cols-1 gap-3">
        {cards.map((card, i) => {
          const isExpanded = expandedCard === card.key;
          const chartData = groupByProfile(card.key);
          return (
            <div key={card.key}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setExpandedCard(prev => prev === card.key ? null : card.key)}
                className={`${card.className} rounded-2xl p-5 text-primary-foreground cursor-pointer active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">{card.label}</p>
                    <p className="text-2xl font-semibold font-mono mt-1">{formatCurrency(card.value)}</p>
                  </div>
                  <card.icon className="w-8 h-8 opacity-60" />
                </div>
                <p className="text-xs opacity-50 mt-2">{t('dashboard.tapToSee')}</p>
              </motion.div>
              <AnimatePresence>
                {isExpanded && chartData.length > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="glass rounded-2xl p-5 mt-2">
                      <h3 className="text-sm font-medium text-foreground mb-3">
                        {card.key === 'income' ? t('dashboard.incomeByProfile') : t('dashboard.expenseByProfile')}
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="w-28 h-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={50} paddingAngle={2}>
                                {chartData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {chartData.map((item, idx) => (
                            <div key={item.name} className="flex items-center gap-2 text-sm">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                              <span className="text-muted-foreground truncate">{item.name}</span>
                              <span className="ml-auto font-mono text-foreground text-xs">{item.pct}%</span>
                              <span className="font-mono text-foreground text-xs">{formatCurrency(item.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Balance over time */}
      {balanceData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
          <h2 className="text-base font-medium text-foreground mb-4">{t('dashboard.balanceOverTime')}</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={60} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} formatter={(value: number) => [formatCurrency(value), t('dashboard.balance')]} />
                <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Transaction history */}
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground">{t('dashboard.history')}</h2>
        {accountTx.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('transactions.noTransactions')}</p>
        ) : (
          accountTx.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => {
            const cat = allCategories.find(c => c.id === tx.category);
            const profile = profiles.find(p => p.id === tx.profile_id);
            const isTransferIn = tx.type === 'transfer' && tx.destination_account_id === id;
            const isTransferOut = tx.type === 'transfer' && tx.account_id === id;
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="elegant-card rounded-xl p-4 flex items-center gap-3"
              >
                <CategoryIcon
                  category={tx.type === 'transfer' ? 'transfer' : tx.category}
                  type={tx.type === 'transfer' ? 'transfer' : tx.type === 'income' ? 'income' : 'expense'}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.type === 'transfer' ? t('transactions.transfer') : (cat?.name || tx.category)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                    {profile && <span>• {profile.name === '__default_no_profile__' ? t('dashboard.noProfile') : profile.name}</span>}
                  </div>
                </div>
                <span className={`font-mono text-sm font-medium ${
                  isTransferIn ? 'text-success' : isTransferOut ? 'text-destructive' : tx.type === 'income' ? 'text-success' : 'text-destructive'
                }`}>
                  {isTransferIn ? '+' : tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AccountDetailPage;
