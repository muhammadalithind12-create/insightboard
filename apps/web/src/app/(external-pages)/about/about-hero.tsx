import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { T } from '@/components/ui/Typography';
import { Github } from 'lucide-react';
import Link from 'next/link';

export function AboutHero() {
  return (
    <div className="text-center space-y-4">
      <Badge variant="outline" className="mb-4">
        About InsightBoard
      </Badge>
      <T.H1 className="text-4xl sm:text-5xl md:text-6xl">
        Business analytics,{' '}
        <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
          in real time
        </span>
      </T.H1>
      <T.P className="mx-auto max-w-[700px] text-lg text-muted-foreground">
        InsightBoard streams revenue, orders, and conversion metrics into one
        live dashboard — built with Next.js, TypeScript, Supabase Realtime, and shadcn/ui.
      </T.P>
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <Button size="lg" asChild>
          <Link href="/login">Get Started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link
            href="https://github.com/muhammadalithind12-create/insightboard"
            target="_blank"
          >
            <Github className="mr-2 h-5 w-5" />
            View on GitHub
          </Link>
        </Button>
      </div>
    </div>
  );
}
