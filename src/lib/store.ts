
import { create } from 'zustand';
import {
  SchedulerState,
  SchedulerStore,
  UseSchedulerProps,
  UseSchedulerPropsSchema,
  Item,
  Meal,
} from '@/lib/types';
import {
  getInitialSchedulerState,
  calculateTotals,
  applyInitialAndFilters,
} from '@/lib/utils';

export const createSchedulerStore = (props: UseSchedulerProps) => {
  const validatedProps = UseSchedulerPropsSchema.parse(props);
  const initialState = getInitialSchedulerState(validatedProps);

  return create<SchedulerStore>((set, get) => ({
    ...initialState,

    // Actions
    setItems: (items: Item[]) => set({ items }),
    setFilters: (filters: any) => set({ filters }),
    setViewMode: (viewMode: 'detailed' | 'general') => set({ viewMode }),
    setCollapsedGroups: (collapsedGroups: Record<string, boolean>) => set({ collapsedGroups }),

    updateQuantity: (
      itemId: string,
      day: number,
      mealType: Meal,
      value: number
    ) => {
      const { items, schedule, viewMode } = get();
      const itemToUpdate = items.find((item) => item.id === itemId);

      if (!itemToUpdate) {
        console.warn(`Item with id ${itemId} not found.`);
        return;
      }

      const currentTotal = Object.values(schedule[itemId]?.[day] || {}).reduce((sum, qty) => sum + qty, 0);
      const newDailyTotal = viewMode === 'detailed'
        ? currentTotal - (schedule[itemId]?.[day]?.[mealType] || 0) + value
        : value; // In general mode, value is the new total for the day

      if (newDailyTotal > itemToUpdate.totalPossible) {
        console.warn(`Cannot set quantity above total possible for item ${itemId}.`);
        return;
      }

      const newSchedule = { ...schedule };
      newSchedule[itemId] = {
        ...(newSchedule[itemId] || {}),
        [day]: {
          ...(newSchedule[itemId]?.[day] || {}),
          ...(viewMode === 'detailed' ? { [mealType]: value } : { desayuno: value, almuerzo: 0, cena: 0 }), // Simplified for general mode
        },
      };

      const newItems = items.map((item) =>
        item.id === itemId ? { ...item, dailyData: newSchedule[itemId] } : item
      );

      const newTotals = calculateTotals(newItems);
      set({ schedule: newSchedule, items: newItems, totals: newTotals });
    },

    toggleGroupCollapsed: (groupName: string) => {
      const { collapsedGroups } = get();
      const newCollapsedGroups = { ...collapsedGroups };
      if (newCollapsedGroups[groupName]) {
        delete newCollapsedGroups[groupName];
      } else {
        newCollapsedGroups[groupName] = true;
      }
      set({ collapsedGroups: newCollapsedGroups });
    },

    // Derived state
    getFilteredItems: () => {
      const { items, filters } = get();
      return applyInitialAndFilters(items, filters);
    },
  }));
};
