
"use client";

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableCell, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ChevronDown } from "lucide-react";
import type { Group, Item, Totals } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GROUP_CONFIG } from '@/lib/constants';

interface GroupHeaderProps {
  group: Group;
  items: Item[];
  totals: Totals;
  isExpanded: boolean;
  onToggle: () => void;
  colSpan: number;
  stickyTopClass: string;
  style?: React.CSSProperties;
}

export const SchedulerGroupHeader: React.FC<GroupHeaderProps> = ({ group, items, totals, isExpanded, onToggle, colSpan, stickyTopClass, style }) => {
  const { t } = useTranslation();
  /**
   * Calcula el resumen del grupo incluyendo el conteo de items y el porcentaje de disponibilidad.
   */
  const summary = useMemo(() => {
    try {
      if (!items || items.length === 0) {
        return { itemCount: 0, availablePercent: 100, progressBarClass: 'bg-green-500' };
      }
      const itemsWithoutTotal = items.filter(item => item.totalPossible === undefined || item.totalPossible === null);
      const totalMax = items.reduce((acc, item) => acc + (item.totalPossible ?? 0), 0);
      const totalScheduled = items.reduce((acc, item) => acc + (totals[item.id]?.total ?? 0), 0);
      if (totalMax === 0) {
        return { 
          itemCount: items.length, 
          availablePercent: 100, 
          progressBarClass: 'bg-green-500',
          hasIncompleteData: itemsWithoutTotal.length > 0
        };
      }
      const scheduledPercent = (totalScheduled / totalMax) * 100;
      const availablePercent = 100 - scheduledPercent;
      let progressBarClass = 'bg-rose-500';
      if (availablePercent > 75) progressBarClass = 'bg-green-500';
      else if (availablePercent > 50) progressBarClass = 'bg-sky-500';
      else if (availablePercent > 25) progressBarClass = 'bg-amber-400';
      else if (availablePercent > 0) progressBarClass = 'bg-orange-500';
      return { 
        itemCount: items.length, 
        availablePercent: Math.max(0, availablePercent), 
        progressBarClass,
        hasIncompleteData: itemsWithoutTotal.length > 0
      };
    } catch (err) {
      return { itemCount: items.length || 0, availablePercent: 100, progressBarClass: 'bg-green-500' };
    }
  }, [items, totals, group.name]);

  const { bg: groupBgClass, border: groupBorderClass } = GROUP_CONFIG[group.name] || GROUP_CONFIG.Default;
  const groupBg = cn(groupBgClass);
  const groupBorder = cn(groupBorderClass);

  // handleKeyDown eliminado: ahora usamos un <button> nativo para accesibilidad

  return (
    <TableRow style={style} className={cn("group hover:z-20", stickyTopClass)}>
      <TableCell colSpan={colSpan} className={cn("p-0 border-b", groupBg, groupBorder)}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className={cn(
            "w-full text-left flex items-center justify-between px-4 py-2",
            "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          )}
        >
          <div className="flex items-center gap-4">
            <ChevronDown
              className={cn('h-5 w-5 text-current opacity-80 transform transition-transform duration-300 ease-out', {
                'rotate-0': isExpanded,
                '-rotate-90': !isExpanded,
              })}
            />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm uppercase tracking-wider">{group.name}</span>
              <span className="text-xs text-muted-foreground font-normal">{summary.itemCount} {t('articulos')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 w-1/3 max-w-xs">
            <div
              className="flex-1"
              title={summary.hasIncompleteData
                ? t('advertencia_incompleto', { percent: Math.round(summary.availablePercent) })
                : t('disponibilidad', { percent: Math.round(summary.availablePercent) })}
            >
              <Progress
                value={summary.availablePercent}
                className={cn("h-2", summary.hasIncompleteData && "opacity-75")}
                indicatorClassName={summary.progressBarClass}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold w-16 text-right tabular-nums">
                {Math.round(summary.availablePercent)}%
              </span>
              {summary.hasIncompleteData && (
                <span className="text-amber-500 text-sm" title={t('algunos_sin_limite')}>
                  *
                </span>
              )}
            </div>
          </div>
        </button>
      </TableCell>
    </TableRow>
  );
};
