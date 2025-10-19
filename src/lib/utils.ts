
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
  items.forEach(item => {
    schedule[item.id] = {};
    days.forEach(day => {
      schedule[item.id][day] = { desayuno: 0, almuerzo: 0, cena: 0 };
    });
  });

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
  items.forEach(item => {
    const totalUsed = Object.values(item.dailyData || {}).reduce((total, day) => {
      return total + Object.values(day).reduce((dayTotal, value) => dayTotal + value, 0);
    }, 0);
    
    totals[item.id] = {
      total: totalUsed,
      remaining: item.totalPossible - totalUsed,
      totalPossible: item.totalPossible,
      isOverLimit: totalUsed > item.totalPossible,
    };
  });
  return totals;
}

export function applyInitialAndFilters(items: Item[], filters: any): Item[] {
  if (!filters || Object.keys(filters).length === 0) return items;
  
  const searchQuery = (filters.search || '').toLowerCase();
  const groupFilter = filters.group || '';
  
  return items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.description.toLowerCase().includes(searchQuery) ||
      item.code.toLowerCase().includes(searchQuery);
      
    const matchesGroup = !groupFilter || item.group === groupFilter;
    
    return matchesSearch && matchesGroup;
  });
}

export function exportToCsv(items: Item[], schedule: Schedule, totals: Totals, viewMode: ViewMode, fileName: string) {
  const rows: string[] = [];
  
  // Add headers
  const headers = ['Descripción', 'Código', 'Grupo', 'Total Planificado', 'Total Restante'];
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);

  if (viewMode === 'general') {
    days.forEach(day => headers.push(`Día ${day}`));
  } else {
    days.forEach(day => {
      MEALS.forEach(meal => headers.push(`Día ${day} ${meal.charAt(0).toUpperCase() + meal.slice(1)}`));
    });
  }
  rows.push(headers.map(header => `"${header}"`).join(','));

  // Add data rows
  items.forEach(item => {
    const row = [
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.code}"`,
      `"${item.group}"`,
      String(totals[item.id].total),
      String(totals[item.id].remaining)
    ];

    days.forEach(day => {
      if (viewMode === 'general') {
        const dailyTotal = Object.values(schedule[item.id]?.[day] || {}).reduce((a, b) => a + b, 0);
        row.push(String(dailyTotal));
      } else {
        MEALS.forEach(meal => {
          row.push(String(schedule[item.id]?.[day]?.[meal] || 0));
        });
      }
    });
    rows.push(row.join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(row => 
    row.split(',').map(cell => encodeURIComponent(cell)).join(',')
  ).join('\r\n');

  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}