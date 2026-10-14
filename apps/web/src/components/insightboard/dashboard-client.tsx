'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, ArrowDownRight, ArrowUpRight, Minus, Plus, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/supabase-clients/client';
import {
  CHART_COLORS,
  RANGE_OPTIONS,
  formatMoney,
  formatPct,
  randomDemoOrder,
  type IBEvent,
  type IBOrder,
} from '@/lib/insightboard';

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  const up = value > 0;
  const flat = value === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const cls = flat ? 'text-muted-foreground' : up ? 'text-emerald-500' : 'text-rose-500';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {formatPct(value)}
    </span>
  );
}

export default function DashboardClient() {
  const [orders, setOrders] = useState<IBOrder[]>([]);
  const [events, setEvents] = useState<IBEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [simulating, setSimulating] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const [o, e] = await Promise.all([
        supabase.from('ib_orders').select('*').order('created_at', { ascending: false }).limit(2000),
        supabase.from('ib_events').select('*').order('created_at', { ascending: false }).limit(2000),
      ]);
      if (cancelled) return;
      if (o.error || e.error) {
        setLoadError('Could not load demo data. Make sure the InsightBoard SQL migration and seed have been run.');
        setLoading(false);
        return;
      }
      setOrders((o.data ?? []) as IBOrder[]);
      setEvents((e.data ?? []) as IBEvent[]);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel('ib-orders-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ib_orders' },
        (payload) => {
          const row = payload.new as IBOrder;
          setOrders((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev].slice(0, 2000)));
          setFlashId(row.id);
          setTimeout(() => setFlashId((f) => (f === row.id ? null : f)), 4000);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const ms = rangeDays * 24 * 3600 * 1000;
    const cutoff = now - ms;
    const prevCutoff = cutoff - ms;

    const inCur = (iso: string) => new Date(iso).getTime() >= cutoff;
    const inPrev = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= prevCutoff && t < cutoff;
    };

    const curOrders = orders.filter((o) => inCur(o.created_at));
    const prevOrders = orders.filter((o) => inPrev(o.created_at));
    const rev = (list: IBOrder[]) =>
      list.filter((o) => o.status === 'completed').reduce((s, o) => s + o.amount_cents, 0);
    const curRev = rev(curOrders);
    const prevRev = rev(prevOrders);
    const curCompleted = curOrders.filter((o) => o.status === 'completed').length;
    const prevCompleted = prevOrders.filter((o) => o.status === 'completed').length;

    const curEvents = events.filter((e) => inCur(e.created_at));
    const prevEvents = events.filter((e) => inPrev(e.created_at));
    const conv = (list: IBEvent[]) => {
      const pv = list.filter((e) => e.event_type === 'page_view').length;
      const pu = list.filter((e) => e.event_type === 'purchase').length;
      return pv === 0 ? 0 : (pu / pv) * 100;
    };

    // Daily revenue series (completed orders)
    const days: { key: string; label: string }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 3600 * 1000);
      days.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    const byDay = new Map<string, number>();
    for (const o of curOrders) {
      if (o.status !== 'completed') continue;
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + o.amount_cents);
    }
    const series = days.map((d) => ({
      label: d.label,
      revenue: Math.round((byDay.get(d.key) ?? 0) / 100),
    }));

    // Category donut (completed revenue)
    const catMap = new Map<string, number>();
    for (const o of curOrders) {
      if (o.status !== 'completed') continue;
      catMap.set(o.category, (catMap.get(o.category) ?? 0) + o.amount_cents);
    }
    const categories = [...catMap.entries()]
      .map(([name, cents]) => ({ name, value: Math.round(cents / 100) }))
      .sort((a, b) => b.value - a.value);

    // Top products
    const prodMap = new Map<string, { revenue: number; orders: number }>();
    for (const o of curOrders) {
      const p = prodMap.get(o.product) ?? { revenue: 0, orders: 0 };
      if (o.status === 'completed') p.revenue += o.amount_cents;
      p.orders += 1;
      prodMap.set(o.product, p);
    }
    const topProducts = [...prodMap.entries()]
      .map(([name, v]) => ({ name, revenue: Math.round(v.revenue / 100), orders: v.orders }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Region bars
    const regMap = new Map<string, number>();
    for (const o of curOrders) {
      if (o.status !== 'completed') continue;
      regMap.set(o.region, (regMap.get(o.region) ?? 0) + o.amount_cents);
    }
    const regions = [...regMap.entries()]
      .map(([name, cents]) => ({ name, revenue: Math.round(cents / 100) }))
      .sort((a, b) => b.revenue - a.revenue);
    const maxRegion = Math.max(1, ...regions.map((r) => r.revenue));

    return {
      revenue: curRev / 100,
      revenueChange: pctChange(curRev, prevRev),
      orderCount: curOrders.length,
      orderChange: pctChange(curOrders.length, prevOrders.length),
      aov: curCompleted ? curRev / 100 / curCompleted : 0,
      aovChange: pctChange(curCompleted ? curRev / curCompleted : 0, prevCompleted ? prevRev / prevCompleted : 0),
      conversion: conv(curEvents),
      conversionChange: pctChange(conv(curEvents), conv(prevEvents)),
      series,
      categories,
      topProducts,
      regions,
      maxRegion,
      totalRevenueAll: orders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.amount_cents, 0) / 100,
    };
  }, [orders, events, rangeDays]);

  async function simulateSale() {
    if (simulating) return;
    setSimulating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('ib_orders').insert(randomDemoOrder());
      if (error) throw error;
      // The realtime subscription will prepend the row when the broadcast arrives.
    } catch {
      setLoadError('Simulate sale failed — the demo INSERT policy may not be applied yet.');
    } finally {
      setSimulating(false);
    }
  }

  const feed = useMemo(() => [...orders].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 8), [orders]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (loadError && orders.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20">
        <Card>
          <CardHeader>
            <CardTitle>Demo data not loaded yet</CardTitle>
            <CardDescription>Run these two SQL files in the Supabase SQL editor to populate the dashboard:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <code className="block rounded bg-muted px-3 py-2">supabase/migrations/001_insightboard.sql</code>
            <code className="block rounded bg-muted px-3 py-2">supabase/seeds/demo.sql</code>
            <p className="text-muted-foreground pt-2">{loadError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Revenue', value: formatMoney(stats.revenue * 100), change: stats.revenueChange, hint: `last ${rangeDays} days` },
    { label: 'Orders', value: stats.orderCount.toLocaleString(), change: stats.orderChange, hint: `last ${rangeDays} days` },
    { label: 'Avg. Order Value', value: formatMoney(stats.aov * 100), change: stats.aovChange, hint: 'per completed order' },
    { label: 'Conversion Rate', value: `${stats.conversion.toFixed(2)}%`, change: stats.conversionChange, hint: 'purchases / page views' },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
            <Badge variant="default" className="gap-1.5 bg-emerald-600 hover:bg-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              LIVE
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Real-time business analytics powered by Supabase Realtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            {RANGE_OPTIONS.map((r) => (
              <Button
                key={r.days}
                variant={rangeDays === r.days ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setRangeDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
          <Button onClick={simulateSale} disabled={simulating} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {simulating ? 'Placing…' : 'Simulate sale'}
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-3xl">{k.value}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <ChangeBadge value={k.change} />
              <span className="text-xs text-muted-foreground">{k.hint}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
          <CardDescription>Daily completed revenue · last {rangeDays} days</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} className="text-muted-foreground" />
              <Tooltip
                formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: 8 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category donut + top products */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by category</CardTitle>
            <CardDescription>Completed orders · last {rangeDays} days</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.categories} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                  {stats.categories.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
              {stats.categories.map((c, i) => (
                <span key={c.name} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {c.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>By revenue · last {rangeDays} days</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.orders}</TableCell>
                    <TableCell className="text-right">${p.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Regions + live feed */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by region</CardTitle>
            <CardDescription>Completed revenue · last {rangeDays} days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.regions.map((r, i) => (
              <div key={r.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">${r.revenue.toLocaleString()}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(r.revenue / stats.maxRegion) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Live activity
              <Badge variant="outline" className="ml-1 gap-1 text-emerald-600 border-emerald-600/40">
                <Radio className="h-3 w-3" /> realtime
              </Badge>
            </CardTitle>
            <CardDescription>New orders appear here instantly via Supabase Realtime — try “Simulate sale”.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {feed.map((o) => (
                <li
                  key={o.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                    flashId === o.id ? 'border-emerald-500/60 bg-emerald-500/10' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.product} · {o.region} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <span className="font-semibold shrink-0 ml-3">{formatMoney(o.amount_cents)}</span>
                </li>
              ))}
              {feed.length === 0 && <li className="text-sm text-muted-foreground">No orders yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
