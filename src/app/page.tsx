
'use client';

import { SchedulerClient } from "@/components/scheduler/scheduler-client";
import { initialItems, initialGroups } from "@/lib/data";
import { useEffect, useState } from "react";
import type { Item, Group } from "@/lib/types";

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    setItems(initialItems);
    setGroups(initialGroups);
  }, []);

  if (items.length === 0 || groups.length === 0) {
    return <div>Cargando...</div>;
  }

  return (
    <main className="container mx-auto">
      <SchedulerClient 
        items={items} 
        groups={groups} 
      />
    </main>
  );
}
