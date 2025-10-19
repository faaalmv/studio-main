
"use client";

import { useContext, useRef } from 'react';
import { SchedulerContext } from '@/lib/context';
import { createSchedulerStore } from '@/lib/store';
import { initialItems, initialGroups } from '@/lib/data';

// Devuelve el store desde contexto; si no existe (por ejemplo en tests
// que llaman al hook sin envolver en Provider) crea un store local con
// datos iniciales.
export const useScheduler = () => {
  const store = useContext(SchedulerContext);
  const localRef = useRef<() => any>();
  if (store) return store();

  // Fallback para entornos de test o uso aislado
  if (!localRef.current) {
    localRef.current = createSchedulerStore({ items: initialItems, groups: initialGroups });
  }

  return localRef.current();
};
