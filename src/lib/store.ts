
import { create } from 'zustand';
import {
  SchedulerState,
  SchedulerStore,
  UseSchedulerProps,
  Item,
  Group,
  ViewMode,
  Meal,
  Filters,
  FilterSchema,
  UseSchedulerPropsSchema,
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
    setItems: (items: Item[]) => {
      const newItems = {
        byId: items.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}),
        allIds: items.map(item => item.id),
      };
      const newTotals = calculateTotals(items);
      set({ items: newItems, totals: newTotals });
    },

    setFilters: (filters: Filters) => {
      const validatedFilters = FilterSchema.parse(filters);
      set({ filters: validatedFilters });
    },

    setViewMode: (viewMode: ViewMode) => set({ viewMode }),

    setCollapsedGroups: (collapsedGroups: Record<string, boolean>) => 
      set({ collapsedGroups }),

    updateQuantity: (
      itemId: string,
      day: number,
      mealType: Meal,
      value: number
    ) => {
      const { schedule, items, viewMode } = get();
      const item = items.byId[itemId];

      if (!item) {
        console.warn(`Item with id ${itemId} not found.`);
        return;
      }

      // Calcular el nuevo total para el día incluyendo el cambio
      const currentDayData = schedule.byId[itemId]?.[day] || { desayuno: 0, almuerzo: 0, cena: 0 };
      const newDayTotal = viewMode === 'detailed'
        ? Object.entries(currentDayData)
            .reduce((sum, [meal, qty]) => sum + (meal === mealType ? value : qty), 0)
        : value;

      if (newDayTotal > item.totalPossible) {
        console.warn(`Cannot set quantity above total possible (${item.totalPossible}) for item ${itemId}.`);
        return;
      }

      // Actualizar el schedule de forma inmutable
      const newSchedule = {
        ...schedule,
        byId: {
          ...schedule.byId,
          [itemId]: {
            ...(schedule.byId[itemId] || {}),
            [day]: viewMode === 'detailed'
              ? { ...currentDayData, [mealType]: value }
              : { desayuno: value, almuerzo: 0, cena: 0 },
          },
        },
      };

      // Re-calcular totales
      const allItems = get().getAllItems();
      const newTotals = calculateTotals(allItems);

      set({ schedule: newSchedule, totals: newTotals });
    },

    toggleGroupCollapsed: (groupName: string) => {
      const { collapsedGroups } = get();
      set({
        collapsedGroups: {
          ...collapsedGroups,
          [groupName]: !collapsedGroups[groupName],
        },
      });
    },

    // Selectors
    getItemById: (id: string) => get().items.byId[id],
    
    getGroupById: (name: string) => 
      get().groups.byId[name],
    
    getAllItems: () => 
      get().items.allIds.map(id => get().items.byId[id]),
    
    getAllGroups: () => 
      get().groups.allIds.map(id => get().groups.byId[id]),
    
    getItemsByGroup: (groupName: string) => 
      get().getAllItems().filter(item => item.group === groupName),

    getFilteredItems: () => {
      const { filters } = get();
      return applyInitialAndFilters(get().getAllItems(), filters);
    },
  }));
};
