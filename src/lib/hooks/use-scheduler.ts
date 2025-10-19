
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

  // Obtenemos el raw store factory: desde contexto o creamos uno local
  const getStore = store ?? (() => {
    if (!localRef.current) {
      localRef.current = createSchedulerStore({ items: initialItems, groups: initialGroups });
    }
    return localRef.current;
  })();

  const s = getStore();

  // Normalizamos la API: items como array, groups como array, filter/setFilter
  const itemsArray = typeof s.getAllItems === 'function' ? s.getAllItems() : (Array.isArray(s.items) ? s.items : []);
  const groupsArray = typeof s.getAllGroups === 'function' ? s.getAllGroups() : (Array.isArray(s.groups) ? s.groups : []);

  return {
    ...s,
    items: itemsArray,
    groups: groupsArray,
    filter: s.filters?.search ?? s.filter ?? '',
    setFilter: (value: string) => {
      if (typeof s.setFilters === 'function') {
        s.setFilters({ ...(s.filters || {}), search: value });
      } else if (typeof s.setFilter === 'function') {
        s.setFilter(value);
      }
    },
  };
};
