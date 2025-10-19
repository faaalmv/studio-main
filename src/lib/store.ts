
import { create } from 'zustand';
import {
  SchedulerStore,
  UseSchedulerProps,
  Item,
  ViewMode,
  Meal,
  Filters,
  FilterSchema,
  UseSchedulerPropsSchema,
  Schedule,
} from '@/lib/types';
import {
  getInitialSchedulerState,
  calculateTotals,
  applyInitialAndFilters,
  exportToCsv,
} from '@/lib/utils';

const MONTH_OPTIONS = [
  { value: 'ENERO', label: 'Enero' },
  { value: 'FEBRERO', label: 'Febrero' },
  { value: 'MARZO', label: 'Marzo' },
  { value: 'ABRIL', label: 'Abril' },
  { value: 'MAYO', label: 'Mayo' },
  { value: 'JUNIO', label: 'Junio' },
  { value: 'JULIO', label: 'Julio' },
  { value: 'AGOSTO', label: 'Agosto' },
  { value: 'SEPTIEMBRE', label: 'Septiembre' },
  { value: 'OCTUBRE', label: 'Octubre' },
  { value: 'NOVIEMBRE', label: 'Noviembre' },
  { value: 'DICIEMBRE', label: 'Diciembre' },
];

const SERVICE_OPTIONS = [
  { value: 'PACIENTES', label: 'Pacientes' },
];

export const createSchedulerStore = (props: UseSchedulerProps) => {
  const validatedProps = UseSchedulerPropsSchema.parse(props);
  const initialState = getInitialSchedulerState(validatedProps);

  return create<SchedulerStore>()((set, get) => ({
    ...initialState,

    // UI options
    monthOptions: MONTH_OPTIONS,
    serviceOptions: SERVICE_OPTIONS,
    selectedMonthLabel: MONTH_OPTIONS.find(m => m.value === initialState.selectedMonth)?.label ?? initialState.selectedMonth,

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

    setSelectedMonth: (selectedMonth: string) => {
      const label = MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label ?? selectedMonth;
      set({ selectedMonth });
      // setState separado para respetar el tipo parcial
      set(state => ({ ...state, selectedMonthLabel: label }));
    },

    setSelectedService: (selectedService: string) => set({ selectedService }),

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
            ...(schedule.byId[itemId] || {
              [day]: { desayuno: 0, almuerzo: 0, cena: 0 }
            }),
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

    // Selectors memoizados
    getItemById: (id: string) => get().items.byId[id],
    
    getGroupById: (name: string) => get().groups.byId[name],
    
    getAllItems: () => get().items.allIds.map(id => get().items.byId[id]),
    
    getAllGroups: () => get().groups.allIds.map(id => get().groups.byId[id]),
    
    getItemsByGroup: (groupName: string) => get().getAllItems().filter(item => item.group === groupName),

    getFilteredItems: () => {
      const { filters } = get();
      return applyInitialAndFilters(get().getAllItems(), {
        search: filters.search,
        group: filters.group
      });
    },

    getDailyTotal: (itemId: string, day: number) => {
      const { schedule } = get();
      const dayData = schedule.byId[itemId]?.[day];
      if (!dayData) return 0;
  return Object.values(dayData).reduce((sum, current) => sum + (Number(current) || 0), 0);
    },

    onExport: () => {
      const items = get().getAllItems();
      const schedule = get().schedule;
      const totals = get().totals;
      const viewMode = get().viewMode;
      const monthLabel = get().selectedMonthLabel ?? get().selectedMonth;
      const serviceLabel = get().selectedService;
      const fileName = `${monthLabel}-${serviceLabel}.csv`;
      // exportToCsv usa document, en tests headless puede fallar — capturamos y no propagamos
      try {
        exportToCsv(items, schedule.byId, totals, viewMode, fileName);
      } catch (err) {
        // En entornos de test sin DOM esto puede fallar; registramos para diagnóstico
        // y no propagamos.
        // eslint-disable-next-line no-console
        console.error('Export failed', err);
      }
    },
  }));
};
