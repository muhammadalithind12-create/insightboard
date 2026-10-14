import type { Metadata } from 'next';
import { Suspense } from 'react';
import DashboardClient from '@/components/insightboard/dashboard-client';

export const metadata: Metadata = {
  title: 'Live Dashboard — InsightBoard',
  description: 'Real-time business analytics: revenue, orders, conversion and live sales activity.',
};

// Suspense boundary: the dashboard reads Date.now() + live Supabase Realtime
// data, so it renders dynamically on the client instead of prerendering.
export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardClient />
    </Suspense>
  );
}
