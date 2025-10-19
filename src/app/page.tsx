
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { SchedulerClient } from "@/components/scheduler/scheduler-client";
import { initialItems, initialGroups } from "@/lib/data";

export default async function Home() {
  return (
    <main className="container mx-auto">
      <SchedulerClient 
        items={initialItems} 
        groups={initialGroups} 
      />
    </main>
  );
}
