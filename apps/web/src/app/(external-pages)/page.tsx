import { Separator } from '@/components/ui/separator';
import { Activity, BarChart3, Globe2, Radio, Table2, Zap } from 'lucide-react';
import { HomeCTA } from './home-cta';
import { HomeFeatures, type HomeFeature } from './home-features';
import { HomeHero } from './home-hero';

const features: HomeFeature[] = [
  {
    icon: Radio,
    title: 'Real-Time Updates',
    description: 'New sales stream into the dashboard instantly via Supabase Realtime — no refresh needed.',
  },
  {
    icon: BarChart3,
    title: 'Revenue Analytics',
    description: 'Revenue trends, category breakdowns, top products, and regional performance at a glance.',
  },
  {
    icon: Activity,
    title: 'Live Activity Feed',
    description: 'Watch every order land the second it happens, with a live event stream.',
  },
  {
    icon: Table2,
    title: 'KPI Tracking',
    description: 'Revenue, orders, average order value, and conversion rate with period-over-period change.',
  },
  {
    icon: Globe2,
    title: 'Regional Insights',
    description: 'See exactly where your revenue comes from across every region.',
  },
  {
    icon: Zap,
    title: 'Postgres-Powered',
    description: 'Next.js 16, Supabase Postgres, and Row Level Security — fast and production-ready.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HomeHero />
      <Separator />
      <HomeFeatures features={features} />
      <Separator />
      <HomeCTA />
    </div>
  );
}
