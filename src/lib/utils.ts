
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

interface Filters {
  search?: string;
  group?: string;
  [key: string]: string | undefined;
}

export function applyInitialAndFilters(items: Item[], filters: Filters): Item[] {
  if (!filters || Object.keys(filters).length === 0) return items;
  
  const searchQuery = (filters.search ?? '').toLowerCase();
  const groupFilter = filters.group ?? '';
  
  return items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.description.toLowerCase().includes(searchQuery) ||
      item.code.toLowerCase().includes(searchQuery);
      
    const matchesGroup = !groupFilter || item.group === groupFilter;
    
    return matchesSearch && matchesGroup;
  });
}

function getDailyTotal(dayData: Partial<Record<Meal, number>> | undefined): number {
  if (!dayData) return 0;
  return Object.values(dayData).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function formatHeaders(days: number[], viewMode: ViewMode): string[] {
  const baseHeaders = ['Descripción', 'Código', 'Grupo', 'Total Planificado', 'Total Restante'];
  const dayHeaders: string[] = [];

  if (viewMode === 'general') {
    for (const day of days) {
      dayHeaders.push(`Día ${day}`);
    }
  } else {
    for (const day of days) {
      for (const meal of MEALS) {
        dayHeaders.push(`Día ${day} ${meal.charAt(0).toUpperCase() + meal.slice(1)}`);
      }
    }
  }

  return [...baseHeaders, ...dayHeaders];
}

function formatItemRow(
  item: Item,
  schedule: Schedule,
  totals: Totals,
  days: number[],
  viewMode: ViewMode
): string[] {
  const baseData = [
    `"${item.description.replaceAll('"', '""')}"`,
    `"${item.code}"`,
    `"${item.group}"`,
    String(totals[item.id].total),
    String(totals[item.id].remaining)
  ];

  const dayData: string[] = [];
  for (const day of days) {
    if (viewMode === 'general') {
      const daySchedule = schedule[item.id]?.[day];
      dayData.push(String(getDailyTotal(daySchedule)));
    } else {
      for (const meal of MEALS) {
        const value = schedule[item.id]?.[day]?.[meal];
        dayData.push(String(value ?? 0));
      }
    }
  }

  return [...baseData, ...dayData];
}

export function exportToCsv(
  items: Item[],
  schedule: Schedule,
  totals: Totals,
  viewMode: ViewMode,
  fileName: string
): void {
  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);
  
  // Generate CSV content
  const headers = formatHeaders(days, viewMode);
  const rows = [
    headers.map(header => `"${header}"`).join(','),
    ...items.map(item => formatItemRow(item, schedule, totals, days, viewMode).join(','))
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + 
    rows.map(row => row.split(',').map(cell => encodeURIComponent(cell)).join(',')).join('\r\n');

  // Download CSV
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
}