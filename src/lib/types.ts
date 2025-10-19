
import { z } from 'zod';

export const MealSchema = z.enum(['desayuno', 'almuerzo', 'cena']);
export type Meal = z.infer<typeof MealSchema>;

export const MEALS: Meal[] = ['desayuno', 'almuerzo', 'cena'];

export const DAYS_IN_MONTH = 31;

export const ItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string(),
  group: z.string(),
  totalPossible: z.number().int().min(0),
  unit: z.string(),
});
export type Item = z.infer<typeof ItemSchema>;

export const GroupSchema = z.object({
  name: z.string(),
});
export type Group = z.infer<typeof GroupSchema>;

export const DailyScheduleSchema = z.record(MealSchema, z.number().int().min(0));
export const ScheduleSchema = z.record(z.string(), z.record(z.number().int().min(1).max(DAYS_IN_MONTH), DailyScheduleSchema));
export type Schedule = z.infer<typeof ScheduleSchema>;

export const TotalsSchema = z.record(z.string(), z.object({
  total: z.number().int().min(0),
  remaining: z.number().int().min(0),
  totalPossible: z.number().int().min(0),
  isOverLimit: z.boolean(),
}));
export type Totals = z.infer<typeof TotalsSchema>;

export const ViewModeSchema = z.enum(['general', 'detailed']);
export type ViewMode = z.infer<typeof ViewModeSchema>;

export const UseSchedulerPropsSchema = z.object({
  items: z.array(ItemSchema),
  groups: z.array(GroupSchema),
});
export type UseSchedulerProps = z.infer<typeof UseSchedulerPropsSchema>;

export interface SchedulerState {
  items: Item[];
  groups: Group[];
  schedule: Schedule;
  totals: Totals;
  viewMode: ViewMode;
  filters: any; // Consider refining this type
  collapsedGroups: Record<string, boolean>;
  days: number[];
  selectedMonth: string;
  selectedService: string;
}

export interface SchedulerStore extends SchedulerState {
  setItems: (items: Item[]) => void;
  setFilters: (filters: any) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setCollapsedGroups: (collapsedGroups: Record<string, boolean>) => void;
  updateQuantity: (itemId: string, day: number, mealType: Meal, value: number) => void;
  toggleGroupCollapsed: (groupName: string) => void;
  getFilteredItems: () => Item[];
}


    