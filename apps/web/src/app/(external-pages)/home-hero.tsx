import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HomeHero() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-24 px-4 text-center">
      <Badge variant="secondary" className="px-3 py-1">
        Real-time analytics
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl max-w-3xl">
        Your business,{' '}
        <span className="text-primary">live</span>{' '}
        on one dashboard
      </h1>
      <p className="text-muted-foreground text-lg max-w-xl">
        InsightBoard streams revenue, orders, and conversion metrics in real time — no refresh, no stale reports.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/live-dashboard">
            View live demo <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/sign-up">
            Get Started
          </Link>
        </Button>
      </div>
    </section>
  );
}
