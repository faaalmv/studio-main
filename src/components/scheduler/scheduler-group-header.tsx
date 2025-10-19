
"use client";

import React, { useMemo } from 'react';
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
  /**
   * Calcula el resumen del grupo incluyendo el conteo de items y el porcentaje de disponibilidad.
   * 
   * @remarks
   * Este cálculo asume que todos los items deberían tener un totalPossible definido.
   * Si algún item no tiene totalPossible, se usará 0 como valor predeterminado,
   * lo que podría resultar en un porcentaje de disponibilidad más alto del real.
   * 
   * @returns {Object} Un objeto con el conteo de items, porcentaje disponible y clase CSS para la barra de progreso
   */
  const summary = useMemo(() => {
    try {
      if (!items || items.length === 0) {
        return { itemCount: 0, availablePercent: 100, progressBarClass: 'bg-green-500' };
      }

      // Primero verificamos si hay algún item sin totalPossible definido
      const itemsWithoutTotal = items.filter(item => item.totalPossible === undefined || item.totalPossible === null);
      if (itemsWithoutTotal.length > 0) {
        console.warn(`Advertencia: ${itemsWithoutTotal.length} items en el grupo "${group.name}" no tienen totalPossible definido:`, 
          itemsWithoutTotal.map(item => item.code));
      }

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

      let progressBarClass = 'bg-rose-500'; // 0% available
      if (availablePercent > 75) progressBarClass = 'bg-green-500'; // 75-100%
      else if (availablePercent > 50) progressBarClass = 'bg-sky-500'; // 50-75%
      else if (availablePercent > 25) progressBarClass = 'bg-amber-400'; // 25-50%
      else if (availablePercent > 0) progressBarClass = 'bg-orange-500'; // 0-25%

      return { 
        itemCount: items.length, 
        availablePercent: Math.max(0, availablePercent), 
        progressBarClass 
      };
    } catch (err) {
      console.error('Error calculando resumen del grupo', err);
      return { itemCount: items.length || 0, availablePercent: 100, progressBarClass: 'bg-green-500' };
    }
  }, [items, totals, group.name]);

  const { bg: groupBgClass, border: groupBorderClass } = GROUP_CONFIG[group.name] || GROUP_CONFIG.Default;
  const groupBg = cn(groupBgClass);
  const groupBorder = cn(groupBorderClass);

  return (
    <TableRow
      style={style}
      className={cn("cursor-pointer group hover:z-20", stickyTopClass)}
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      <TableCell colSpan={colSpan} className={cn("p-0 border-b", groupBg, groupBorder)}>
        <div className="flex items-center justify-between w-full px-4 py-2">
          <div className="flex items-center gap-4">
            <ChevronDown
              className={cn('h-5 w-5 text-current opacity-80 transform transition-transform duration-300 ease-out', {
                'rotate-0': isExpanded,
                '-rotate-90': !isExpanded,
              })}
            />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm uppercase tracking-wider">{group.name}</span>
              <span className="text-xs text-muted-foreground font-normal">{summary.itemCount} artículos</span>
            </div>
          </div>
          <div className="flex items-center gap-4 w-1/3 max-w-xs">
            <div 
              className="flex-1"
              title={summary.hasIncompleteData 
                ? `Advertencia: Algunos artículos no tienen límites definidos. Disponibilidad aproximada: ${Math.round(summary.availablePercent)}%`
                : `Disponibilidad: ${Math.round(summary.availablePercent)}%`}
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
                <span 
                  className="text-amber-500 text-sm" 
                  title="Algunos artículos no tienen límites definidos"
                >
                  *
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};
