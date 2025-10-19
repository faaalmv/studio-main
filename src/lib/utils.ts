
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Item, Schedule, ViewMode, Totals, Meal, UseSchedulerProps, SchedulerState } from './types';
import { MEALS, DAYS_IN_MONTH } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitialSchedulerState(props: UseSchedulerProps): SchedulerState {
  const { items, groups } = props;
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);
  
  // Initialize empty schedule for all items
  const schedule: Schedule = {};
  for (const item of items) {
    schedule[item.id] = {};
    for (const day of days) {
      schedule[item.id][day] = { desayuno: 0, almuerzo: 0, cena: 0 };
    }
  }

  return {
    items,
    groups,
    schedule,
    totals: calculateTotals(items),
    viewMode: 'general',
    filters: {},
    collapsedGroups: {},
    days,
    selectedMonth: 'ENERO',
    selectedService: 'PACIENTES',
  };
}

export function calculateTotals(items: Item[]): Totals {
  const totals: Totals = {};
  
  for (const item of items) {
    let totalUsed = 0;
    
    if (item.dailyData) {
      for (const [_, dayData] of Object.entries(item.dailyData)) {
        let dayTotal = 0;
        for (const [__, mealValue] of Object.entries(dayData)) {
          dayTotal += Number(mealValue) || 0;
        }
        totalUsed += dayTotal;
      }
    }
    
    totals[item.id] = {
      total: totalUsed,
      remaining: item.totalPossible - totalUsed,
      totalPossible: item.totalPossible,
      isOverLimit: totalUsed > item.totalPossible,
    };
  }
  
  return totals;
}

export function applyInitialAndFilters(items: Item[], filters: Record<string, unknown>): Item[] {
  if (!filters || Object.keys(filters).length === 0) return items;
  
  const searchQuery = String(filters.search || '').toLowerCase();
  const groupFilter = String(filters.group || '');
  
  return items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.description.toLowerCase().includes(searchQuery) ||
      item.code.toLowerCase().includes(searchQuery);
      
    const matchesGroup = !groupFilter || item.group === groupFilter;
    
    return matchesSearch && matchesGroup;
  });
}

export function exportToCsv(items: Item[], schedule: Schedule, totals: Totals, viewMode: ViewMode, fileName: string): void {
  const rows: string[] = [];
  
  // Add headers
  const headers = ['Descripción', 'Código', 'Grupo', 'Total Planificado', 'Total Restante'];
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);

  if (viewMode === 'general') {
    for (const day of days) {
      headers.push(`Día ${day}`);
    }
  } else {
    for (const day of days) {
      for (const meal of MEALS) {
        headers.push(`Día ${day} ${meal.charAt(0).toUpperCase() + meal.slice(1)}`);
      }
    }
  }
  rows.push(headers.map(header => `"${header}"`).join(','));

  // Add data rows
  for (const item of items) {
    const row = [
      `"${item.description.replaceAll('"', '""')}"`,
      `"${item.code}"`,
      `"${item.group}"`,
      String(totals[item.id].total),
      String(totals[item.id].remaining)
    ];

    for (const day of days) {
      if (viewMode === 'general') {
        let dailyTotal = 0;
        const dayData = schedule[item.id]?.[day];
        if (dayData) {
          for (const mealValue of Object.values(dayData)) {
            dailyTotal += Number(mealValue) || 0;
          }
        }
        row.push(String(dailyTotal));
      } else {
        for (const meal of MEALS) {
          const value = schedule[item.id]?.[day]?.[meal] || 0;
          row.push(String(value));
        }
      }
    }
    rows.push(row.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(row => 
    row.split(',').map(cell => encodeURIComponent(cell)).join(',')
  ).join('\r\n');

  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
}