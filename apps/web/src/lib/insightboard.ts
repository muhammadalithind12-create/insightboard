// InsightBoard — shared types, formatting, and demo helpers.

export interface IBOrder {
  id: string;
  customer_name: string;
  product: string;
  category: string;
  amount_cents: number;
  status: 'completed' | 'pending' | 'refunded';
  region: string;
  created_at: string;
}

export interface IBEvent {
  id: string;
  event_type: 'page_view' | 'signup' | 'purchase';
  meta: Record<string, unknown>;
  created_at: string;
}

export const RANGE_OPTIONS = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
] as const;

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatPct(change: number | null): string {
  if (change === null || !isFinite(change)) return '—';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

const DEMO_PRODUCTS = [
  { product: 'Pro Plan — Monthly', category: 'Subscriptions', amount_cents: 2900 },
  { product: 'Pro Plan — Annual', category: 'Subscriptions', amount_cents: 29000 },
  { product: 'Team Plan — Monthly', category: 'Subscriptions', amount_cents: 7900 },
  { product: 'Starter Plan', category: 'Subscriptions', amount_cents: 1200 },
  { product: 'Extra Seats ×5', category: 'Add-ons', amount_cents: 4900 },
  { product: 'Priority Support', category: 'Add-ons', amount_cents: 19900 },
  { product: 'Data Export Pack', category: 'Add-ons', amount_cents: 9900 },
  { product: 'Onboarding Session', category: 'Services', amount_cents: 14900 },
  { product: 'Custom Dashboard', category: 'Services', amount_cents: 24900 },
  { product: 'API Credits 10k', category: 'Usage', amount_cents: 5900 },
  { product: 'White-label Branding', category: 'Add-ons', amount_cents: 29900 },
];

const DEMO_REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const DEMO_FIRST = ['Ava', 'Liam', 'Maya', 'Noah', 'Zara', 'Ethan', 'Priya', 'Omar', 'Sofia', 'Lucas', 'Nina', 'Kai', 'Elena', 'Yusuf', 'Tara', 'Felix', 'Hana', 'Diego'];
const DEMO_LAST = ['Khan', 'Smith', 'Garcia', 'Nguyen', 'Patel', 'Haddad', 'Novak', 'Silva', 'Kim', 'Ali', 'Rossi', 'Dubois', 'Tanaka', 'Weber', 'Costa', 'Moreau', 'Larsen', 'Petrov'];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Builds a random demo order payload for the "Simulate sale" button. */
export function randomDemoOrder() {
  const p = pick(DEMO_PRODUCTS);
  return {
    customer_name: `${pick(DEMO_FIRST)} ${pick(DEMO_LAST)}`,
    product: p.product,
    category: p.category,
    amount_cents: p.amount_cents,
    status: 'completed' as const,
    region: pick(DEMO_REGIONS),
  };
}

export const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];
