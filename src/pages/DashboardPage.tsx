import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/database';
import { CategoryIcon } from '@/lib/categoryIcons';
import { format } from 'date-fns';

type RangeKey = 'week' | 'month' | 'year' | 'all';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f97316', '#eab308', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const DashboardPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { transactions, profiles, accounts, getAccountBalance } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expandedCard, setExpandedCard] = useState<'income' | 'expense' | 'balance' | null>(null);
  const [range, setRange] = useState<RangeKey>('month');
  const [barsFilter, setBarsFilter] = useState<'both' | 'income' | 'expense'>('both');
  const [chartView, setChartView] = useState<'balance' | 'bars'>('balance');

  const now = new Date();

  // Range start: null = all time
  const rangeStart = useMemo<Date | null>(() => {
    if (range === 'all') return null;
    if (range === 'week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = (day + 6) % 7; // Monday as start of week
      d.setDate(d.getDate() - diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(now.getFullYear(), 0, 1); // year
  }, [range]);

  // Transactions in current range, excluding transfers (used for cards/categories/history)
  const periodTx = useMemo(() =>
    transactions.filter(tx => {
      if (tx.type === 'transfer') return false;
      if (!rangeStart) return true;
      return new Date(tx.date) >= rangeStart;
    }),
    [transactions, rangeStart]
  );

  const periodIncome = useMemo(() => periodTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [periodTx]);
  const periodExpenses = useMemo(() => periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [periodTx]);
  const balance = useMemo(() => accounts.reduce((s, a) => s + getAccountBalance(a.id), 0), [accounts, transactions, getAccountBalance]);

  const groupByCategory = (type: 'income' | 'expense') => {
    const txs = periodTx.filter(tx => tx.type === type);
    const categoryList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const grouped: Record<string, number> = {};
    txs.forEach(tx => {
      const key = tx.category || '__none__';
      grouped[key] = (grouped[key] || 0) + tx.amount;
    });
    const total = Object.values(grouped).reduce((s, v) => s + v, 0);
    return Object.entries(grouped).map(([id, value]) => {
      const cat = categoryList.find(c => c.id === id);
      return {
        categoryId: id,
        name: cat?.name || id,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      };
    }).sort((a, b) => b.value - a.value);
  };

  // Cumulative balance line, transfers cancel out at total level so we use income/expense net.
  const balanceData = useMemo(() => {
    const initialAccountBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
    const priorDelta = transactions
      .filter(tx => tx.type !== 'transfer' && (!rangeStart || new Date(tx.date) < rangeStart))
      .reduce((s, tx) => s + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    let cumulative = initialAccountBalance + priorDelta;
    const sorted = [...periodTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const fmtStr = range === 'all' ? 'MM/yy' : range === 'year' ? 'MMM' : 'dd/MM';
    const startLabel = rangeStart ? format(rangeStart, fmtStr) : (sorted[0] ? format(new Date(sorted[0].date), fmtStr) : '');
    const points = [{ date: startLabel, balance: cumulative }];
    sorted.forEach(tx => {
      cumulative += tx.type === 'income' ? tx.amount : -tx.amount;
      points.push({ date: format(new Date(tx.date), fmtStr), balance: cumulative });
    });
    return points;
  }, [periodTx, transactions, accounts, rangeStart, range]);

  // Bars: income vs expenses bucketed by day(week), week(month), or month(year/all)
  // For 'week' we always show 7 days (Mon-Sun) even if some days have no data,
  // so the visual proportion of the week stays consistent.
  const barsData = useMemo(() => {
    const buckets: Record<string, { label: string; sortKey: number; income: number; expense: number }> = {};

    if (range === 'week' && rangeStart) {
      const dayLabels = ['EEE'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(rangeStart);
        d.setDate(rangeStart.getDate() + i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        buckets[key] = { label: format(d, dayLabels[0]), sortKey: d.getTime(), income: 0, expense: 0 };
      }
    } else if (range === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const totalWeeks = Math.ceil(daysInMonth / 7);
      for (let w = 1; w <= totalWeeks; w++) {
        buckets[`w${w}`] = { label: `S${w}`, sortKey: w, income: 0, expense: 0 };
      }
    }

    periodTx.forEach(tx => {
      const d = new Date(tx.date);
      let key: string, label: string, sortKey: number;
      if (range === 'week') {
        key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        label = format(d, 'EEE');
        sortKey = d.getTime();
      } else if (range === 'month') {
        const weekNum = Math.ceil(d.getDate() / 7);
        key = `w${weekNum}`;
        label = `S${weekNum}`;
        sortKey = weekNum;
      } else {
        key = `${d.getFullYear()}-${d.getMonth()}`;
        label = format(d, range === 'year' ? 'MMM' : 'MM/yy');
        sortKey = d.getFullYear() * 12 + d.getMonth();
      }
      if (!buckets[key]) buckets[key] = { label, sortKey, income: 0, expense: 0 };
      if (tx.type === 'income') buckets[key].income += tx.amount;
      else if (tx.type === 'expense') buckets[key].expense += tx.amount;
    });
    return Object.values(buckets).sort((a, b) => a.sortKey - b.sortKey);
  }, [periodTx, range, rangeStart, now]);

  const balanceByAccount = useMemo(() => {
    const items = accounts.map(a => ({
      accountId: a.id,
      name: a.name,
      value: getAccountBalance(a.id),
    })).filter(i => i.value !== 0);
    const total = items.reduce((s, i) => s + Math.abs(i.value), 0);
    return items
      .map(i => ({ ...i, pct: total > 0 ? Math.round((Math.abs(i.value) / total) * 100) : 0 }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [accounts, transactions]);

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const cards = [
    { key: 'income' as const, label: t('dashboard.income'), value: periodIncome, icon: TrendingUp, variant: 'income' },
    { key: 'expense' as const, label: t('dashboard.expenses'), value: periodExpenses, icon: TrendingDown, variant: 'expense' },
  ];

  const toggleCard = (key: 'income' | 'expense' | 'balance') => {
    setExpandedCard(prev => prev === key ? null : key);
  };

  const userName = user?.name || user?.email?.split('@')[0] || '';
  const dateLocale = language === 'es' ? 'es-MX' : 'en-US';
  const todayLabel = now.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' });

  const rangeLabel = range === 'week' ? t('dashboard.range.week') : range === 'month' ? t('dashboard.thisMonth') : range === 'year' ? t('dashboard.range.year') : t('dashboard.range.all');

  return (
    <div className="space-y-5 pb-24">
      {/* Hero header — date, greeting, summary */}
      <section className="min-h-[55vh] flex flex-col justify-between gap-5 pt-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{todayLabel}</p>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            {t('dashboard.hello')}{userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground pt-1">{rangeLabel} · {t('dashboard.overview')}</p>
        </div>

        {/* Global range selector */}
        <div className="pt-2">
          <div className="flex bg-secondary rounded-xl p-1 text-xs">
            {(['week', 'month', 'year', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 px-3 py-1.5 rounded-lg transition-colors font-medium ${range === r ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
              >
                {t(`dashboard.range.${r}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-3">
        {cards.map((card, i) => {
          const isExpanded = expandedCard === card.key;
          const chartData = groupByCategory(card.key);
          return (
            <div key={card.key}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => toggleCard(card.key)}
                className={`summary-card summary-card--${card.variant} rounded-2xl p-5 cursor-pointer active:scale-[0.99] transition-transform`}
              >
                <div className="relative flex items-start justify-between gap-4 pt-1">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">{card.label}</p>
                    <p className="text-[26px] leading-tight font-semibold font-mono mt-1.5 summary-card__amount tracking-tight">
                      {formatCurrency(card.value)}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-2">{t('dashboard.tapToSee')}</p>
                  </div>
                  <span className="summary-card__icon shrink-0">
                    <card.icon className="w-5 h-5" />
                  </span>
                </div>
              </motion.div>
              <AnimatePresence>
                {isExpanded && chartData.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="elegant-card rounded-2xl p-5 mt-2">
                      <h3 className="text-sm font-medium text-foreground mb-3">
                        {card.key === 'income' ? t('dashboard.incomeByCategory') : t('dashboard.expenseByCategory')}
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
                            <div
                              key={item.categoryId}
                              className="w-full flex items-center gap-2 text-sm rounded-md py-0.5 -mx-1 px-1"
                            >
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
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => toggleCard('balance')}
            className="summary-card summary-card--balance rounded-2xl p-5 cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="relative flex items-start justify-between gap-4 pt-1">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-medium">{t('dashboard.balance')}</p>
                <p className="text-[26px] leading-tight font-semibold font-mono mt-1.5 summary-card__amount tracking-tight">
                  {formatCurrency(balance)}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-2">{t('dashboard.tapToSee')}</p>
              </div>
              <span className="summary-card__icon shrink-0">
                <Wallet className="w-5 h-5" />
              </span>
            </div>
          </motion.div>
          <AnimatePresence>
            {expandedCard === 'balance' && balanceByAccount.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="elegant-card rounded-2xl p-5 mt-2">
                  <h3 className="text-sm font-medium text-foreground mb-3">{t('dashboard.balanceByAccount')}</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={balanceByAccount.map(b => ({ ...b, value: Math.abs(b.value) }))} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={50} paddingAngle={2}>
                            {balanceByAccount.map((_, idx) => (
                              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {balanceByAccount.map((item, idx) => (
                        <button
                          key={item.accountId}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${item.accountId}`); }}
                          className="w-full flex items-center gap-2 text-sm rounded-md py-0.5 -mx-1 px-1 text-left hover:bg-muted/50 active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground truncate">{item.name}</span>
                          <span className="ml-auto font-mono text-foreground text-xs">{item.pct}%</span>
                          <span className="font-mono text-foreground text-xs">{formatCurrency(item.value)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
        </div>
      </section>

      {/* Balance line chart */}
      {balanceData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="elegant-card rounded-2xl p-5">
          <h2 className="section-title mb-4">{t('dashboard.balanceOverTime')}</h2>
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

      {/* Income vs Expenses bars */}
      {barsData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="elegant-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h2 className="section-title">{t('dashboard.incomeVsExpenses')}</h2>
            <div className="flex bg-secondary rounded-lg p-0.5 text-xs">
              {(['both', 'income', 'expense'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setBarsFilter(f)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${barsFilter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  {f === 'both' ? t('dashboard.both') : f === 'income' ? t('dashboard.income') : t('dashboard.expenses')}
                </button>
              ))}
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barsData}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }}
                  formatter={(value: number, name) => [formatCurrency(value), name === 'income' ? t('dashboard.income') : t('dashboard.expenses')]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => v === 'income' ? t('dashboard.income') : t('dashboard.expenses')} />
                {(barsFilter === 'both' || barsFilter === 'income') && (
                  <Bar dataKey="income" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                )}
                {(barsFilter === 'both' || barsFilter === 'expense') && (
                  <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="section-title">{t('dashboard.history')}</h2>
        {periodTx.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('transactions.noTransactions')}</p>
        ) : (
          periodTx.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx, i) => {
            const cat = allCategories.find(c => c.id === tx.category);
            const profile = profiles.find(p => p.id === tx.profile_id);
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="elegant-card rounded-xl p-4 flex items-center gap-3"
              >
                <CategoryIcon category={tx.category} type={tx.type === 'income' ? 'income' : 'expense'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.name || cat?.name || tx.category}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString('es-MX')}</span>
                    {profile && <span>• {profile.name === '__default_no_profile__' ? t('dashboard.noProfile') : profile.name}</span>}
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
