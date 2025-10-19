
import { z } from 'zod';

export const MealSchema = z.enum(['desayuno', 'almuerzo', 'cena']);
export type Meal = z.infer<typeof MealSchema>;

export const MEALS: Meal[] = ['desayuno', 'almuerzo', 'cena'];

export const DAYS_IN_MONTH = 31;

export const DailyDataSchema = z.record(
  z.coerce.number().int().min(1).max(DAYS_IN_MONTH),
  z.record(MealSchema, z.number().int().min(0))
);

export const ItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string(),
  group: z.string(),
  totalPossible: z.number().int().min(0),
  unit: z.string(),
  dailyData: DailyDataSchema.optional(),
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

export const FilterSchema = z.object({
  search: z.string().optional(),
  group: z.string().optional(),
}).passthrough();
export type Filters = z.infer<typeof FilterSchema>;

export const NormalizedScheduleSchema = z.object({
  byId: z.record(z.string(), z.record(z.coerce.number().int().min(1).max(DAYS_IN_MONTH), DailyScheduleSchema)),
  allIds: z.array(z.string()),
});
export type NormalizedSchedule = z.infer<typeof NormalizedScheduleSchema>;

export const NormalizedItemsSchema = z.object({
  byId: z.record(z.string(), ItemSchema),
  allIds: z.array(z.string()),
});
export type NormalizedItems = z.infer<typeof NormalizedItemsSchema>;

export const NormalizedGroupsSchema = z.object({
  byId: z.record(z.string(), GroupSchema),
  allIds: z.array(z.string()),
});
export type NormalizedGroups = z.infer<typeof NormalizedGroupsSchema>;

export const UseSchedulerPropsSchema = z.object({
  items: z.array(ItemSchema),
  groups: z.array(GroupSchema),
});
export type UseSchedulerProps = z.infer<typeof UseSchedulerPropsSchema>;

export interface SchedulerState {
  items: NormalizedItems;
  groups: NormalizedGroups;
  schedule: NormalizedSchedule;
  totals: Totals;
  viewMode: ViewMode;
  filters: Filters;
  collapsedGroups: Record<string, boolean>;
  days: number[];
  selectedMonth: string;
  selectedService: string;
}

export interface SchedulerStore extends SchedulerState {
  setItems: (items: Item[]) => void;
  setFilters: (filters: Filters) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setCollapsedGroups: (collapsedGroups: Record<string, boolean>) => void;
  updateQuantity: (itemId: string, day: number, mealType: Meal, value: number) => void;
  toggleGroupCollapsed: (groupName: string) => void;
  getFilteredItems: () => Item[];
  // Nuevos selectores para trabajar con estado normalizado
  getItemById: (id: string) => Item | undefined;
  getGroupById: (id: string) => Group | undefined;
  getAllItems: () => Item[];
  getAllGroups: () => Group[];
  getItemsByGroup: (groupName: string) => Item[];
}


    