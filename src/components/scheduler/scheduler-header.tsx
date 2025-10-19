
"use client";

import { useId, useCallback } from 'react';
import { useScheduler } from "@/lib/hooks/use-scheduler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Search } from "lucide-react";
import { useDebouncedCallback } from '@/lib/hooks/use-debounce';
import type { Option } from '@/lib/types';

interface SchedulerHeaderPropsForTests {
  filter?: string;
  setFilter?: (value: string) => void;
  viewMode?: 'general' | 'detailed';
  setViewMode?: (value: 'general' | 'detailed') => void;
  onExport?: () => void;
  selectedMonth?: string;
  setSelectedMonth?: (value: string) => void;
  monthOptions?: Option[];
  selectedService?: string;
  setSelectedService?: (value: string) => void;
  serviceOptions?: Option[];
  selectedMonthLabel?: string;
}

export function SchedulerHeader(props?: Readonly<SchedulerHeaderPropsForTests>) {
  const id = useId();
  const scheduler = useScheduler();

  // Prefer props (used by tests) and fall back to the real store
  let filters = scheduler.filters;
  if (props?.filter !== undefined) {
    filters = { ...scheduler.filters, search: props.filter };
  }

  const setFilters = (up: any) => {
    if (props && typeof props.setFilter === 'function') {
      // If tests pass a simple setFilter, call it with the new search value when possible
      if (typeof up === 'function') {
        // compute new search by calling updater with current filters
        const next = up(filters);
        if (next && typeof next.search === 'string') props.setFilter(next.search);
      } else if (up && typeof up.search === 'string') {
        props.setFilter(up.search);
      }
    } else {
      scheduler.setFilters(up);
    }
  };

  const viewMode = props?.viewMode ?? scheduler.viewMode;
  const setViewMode = props?.setViewMode ?? scheduler.setViewMode;
  const onExport = props?.onExport ?? scheduler.onExport;
  const monthOptions = props?.monthOptions ?? scheduler.monthOptions ?? [];
  const serviceOptions = props?.serviceOptions ?? scheduler.serviceOptions ?? [];
  const selectedMonthLabel = props?.selectedMonthLabel ?? scheduler.selectedMonthLabel ?? '';

  const debouncedSetFilter = useDebouncedCallback((value: string) => {
    // If tests provided setFilter, our setFilters wrapper will call it accordingly.
    setFilters((prev: any) => ({ ...prev, search: value }));
  }, 300);

  const handleFilterChange = useCallback((value: string) => {
    debouncedSetFilter(value);
  }, [debouncedSetFilter]);

  const handleMonthChange = useCallback((value: string) => {
    setFilters((prev: any) => ({ ...prev, month: value }));
  }, [setFilters]);

  const handleServiceChange = useCallback((value: string) => {
    setFilters((prev: any) => ({ ...prev, service: value }));
  }, [setFilters]);

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-left">
              <h1 id="main-heading" className="text-3xl lg:text-4xl font-black text-foreground tracking-tight uppercase" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800 }}>
                Programación Mensual
              </h1>
              <p className="text-primary mt-1 text-lg font-bold uppercase tracking-wider">
                {selectedMonthLabel} - {filters.service}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-48">
                <label htmlFor={`${id}-month-select`} className="block text-sm font-medium text-muted-foreground">Mes</label>
                <Select value={filters.month} onValueChange={handleMonthChange}>
                    <SelectTrigger id={`${id}-month-select`} className="mt-1 glass-select-button">
                        <SelectValue placeholder="Seleccionar Mes" />
                    </SelectTrigger>
                    <SelectContent className="glass-select-menu">
            {monthOptions.map((option: { value: string; label: string }) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                 <label htmlFor={`${id}-service-select`} className="block text-sm font-medium text-muted-foreground">Servicio</label>
                <Select value={filters.service} onValueChange={handleServiceChange}>
                    <SelectTrigger id={`${id}-service-select`} className="mt-1 glass-select-button">
                        <SelectValue placeholder="Seleccionar Servicio" />
                    </SelectTrigger>
                    <SelectContent className="glass-select-menu">
            {serviceOptions.map((option: { value: string; label: string }) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
          </div>


        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-auto sm:flex-grow max-w-md">
                <label htmlFor={`${id}-filter-input`} className="sr-only">Filtrar</label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`${id}-filter-input`}
                  placeholder="Filtrar por código, descripción o grupo..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="pl-10 bg-background/50"
                />
            </div>
            <div className="flex items-center gap-4">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'general' | 'detailed')}>
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="detailed">Detallado</TabsTrigger>
                    </TabsList>
                </Tabs>
                 <Button onClick={onExport} variant="outline">
                    <FileDown className="mr-2 h-4 w-4 text-primary" />
                    Exportar
                </Button>
            </div>
        </div>
    </div>
  );
}
