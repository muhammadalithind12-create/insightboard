import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Rocket } from 'lucide-react';
import Link from 'next/link';

export function AboutCTA() {
  return (
    <Empty className="border-2 border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Rocket />
        </EmptyMedia>
        <EmptyTitle>Ready to Build Something Amazing?</EmptyTitle>
        <EmptyDescription>
          Clone the repository and start building your next project with the
          best tools in the ecosystem.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">Start Building</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/live-dashboard">
              View live dashboard
            </Link>
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
