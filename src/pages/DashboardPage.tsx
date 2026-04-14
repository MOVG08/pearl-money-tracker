import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { TrendingUp, TrendingDown, Wallet, Filter, CalendarIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/database';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { monthlyIncome, monthlyExpenses, balance, transactions, profiles, accounts } = useData();

  const now = new Date();
  const [expandedCard, setExpandedCard] = useState<'income' | 'expense' | null>(null);
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterProfile, setFilterProfile] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(now.getFullYear(), now.getMonth(), 1));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [showFilters, setShowFilters] = useState(false);

  const filteredTx = useMemo(() => {
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      if (filterAccount !== 'all' && tx.account_id !== filterAccount) return false;
      if (filterProfile !== 'all' && tx.profile_id !== filterProfile) return false;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [transactions, filterAccount, filterProfile, dateFrom, dateTo]);

  const filteredIncome = useMemo(() => filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [filteredTx]);
  const filteredExpenses = useMemo(() => filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [filteredTx]);

  const groupByProfile = (type: 'income' | 'expense') => {
    const txs = filteredTx.filter(tx => tx.type === type);
    const grouped: Record<string, number> = {};
    txs.forEach(tx => {
      const key = tx.profile_id || '__none__';
      grouped[key] = (grouped[key] || 0) + tx.amount;
    });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0);
    return Object.entries(grouped).map(([id, value]) => {
      const profile = profiles.find(p => p.id === id);
      return {
        name: profile?.name || t('dashboard.noProfile'),
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      };
    }).sort((a, b) => b.value - a.value);
  };

  const balanceData = useMemo(() => {
    const sorted = [...filteredTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulative = 0;
    return sorted.map(tx => {
      cumulative += tx.type === 'income' ? tx.amount : -tx.amount;
      return { date: format(new Date(tx.date), 'dd/MM'), balance: cumulative };
    });
  }, [filteredTx]);

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const cards = [
    { key: 'income' as const, label: t('dashboard.income'), value: filteredIncome, icon: TrendingUp, className: 'gradient-income' },
    { key: 'expense' as const, label: t('dashboard.expenses'), value: filteredExpenses, icon: TrendingDown, className: 'gradient-expense' },
  ];

  const toggleCard = (key: 'income' | 'expense') => {
    setExpandedCard(prev => prev === key ? null : key);
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t('dashboard.thisMonth')}</p>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{t('dashboard.overview')}</h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-2.5 rounded-xl transition-colors",
            showFilters ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dashboard.filters')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('transactions.account')}</label>
                  <select
                    value={filterAccount}
                    onChange={e => setFilterAccount(e.target.value)}
                    className="w-full h-10 rounded-xl bg-secondary text-foreground text-sm px-3 border border-border/50"
                  >
                    <option value="all">{t('dashboard.allAccounts')}</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('transactions.profile')}</label>
                  <select
                    value={filterProfile}
                    onChange={e => setFilterProfile(e.target.value)}
                    className="w-full h-10 rounded-xl bg-secondary text-foreground text-sm px-3 border border-border/50"
                  >
                    <option value="all">{t('dashboard.allProfiles')}</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('dashboard.from')}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full h-10 rounded-xl bg-secondary text-foreground text-sm px-3 border border-border/50 flex items-center gap-2 text-left">
                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        {dateFrom ? format(dateFrom, 'dd/MM/yy') : '—'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('dashboard.to')}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full h-10 rounded-xl bg-secondary text-foreground text-sm px-3 border border-border/50 flex items-center gap-2 text-left">
                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        {dateTo ? format(dateTo, 'dd/MM/yy') : '—'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
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
                onClick={() => toggleCard(card.key)}
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
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass rounded-2xl p-5 mt-2">
                      <h3 className="text-sm font-medium text-foreground mb-3">
                        {card.key === 'income' ? t('dashboard.incomeByProfile') : t('dashboard.expenseByProfile')}
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="w-28 h-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={50} paddingAngle={2}>
                                {chartData.map((_, idx) => (
                                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
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

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gradient-balance rounded-2xl p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">{t('dashboard.balance')}</p>
              <p className="text-2xl font-semibold font-mono mt-1">{formatCurrency(balance)}</p>
            </div>
            <Wallet className="w-8 h-8 opacity-60" />
          </div>
        </motion.div>
      </div>

      {/* Balance line chart */}
      {balanceData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
          <h2 className="text-base font-medium text-foreground mb-4">{t('dashboard.balanceOverTime')}</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }}
                  formatter={(value: number) => [formatCurrency(value), t('dashboard.balance')]}
                />
                <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Filtered history */}
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground">{t('dashboard.history')}</h2>
        {filteredTx.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('transactions.noTransactions')}</p>
        ) : (
          filteredTx.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => {
            const cat = allCategories.find(c => c.id === tx.category);
            const profile = profiles.find(p => p.id === tx.profile_id);
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-xl">{cat?.icon || '💰'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{cat?.name || tx.category}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                    {profile && <span>• {profile.name}</span>}
                  </div>
                </div>
                <span className={`font-mono text-sm font-medium ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
