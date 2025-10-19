
"use client";

import React, { memo, useState, useRef, useCallback, useMemo, useId } from 'react';
import { useScheduler } from "@/lib/hooks/use-scheduler";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { QuantityStepper } from './quantity-stepper';
import { MEALS, Meal } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SchedulerGroupHeader } from './scheduler-group-header';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GROUP_STYLES, STICKY_CELL_CLASSES, REMAINING_CELL_BG_CLASSES } from '@/lib/styles';

// CSS variable definitions for sticky column widths (keeps layout maintainable)
const STICKY_COLUMN_STYLES: React.CSSProperties = {
  // code | description | unit | total | remaining | status
  '--col-code-width': '8rem',
  '--col-desc-width': '16rem',
  '--col-unit-width': '6rem',
  '--col-total-width': '6rem',
  '--col-rest-width': '6rem',
  '--col-status-width': '6rem',
} as React.CSSProperties;

const StickyTableCell = React.forwardRef<HTMLTableCellElement, { isScrolled?: boolean, children: React.ReactNode, className?: string, isHeader?: boolean, style?: React.CSSProperties, [key: string]: any }>(({ isScrolled, children, className, isHeader, style, ...props }, ref) => (
  <TableCell 
    ref={ref}
    style={style}
    className={cn(
      STICKY_CELL_CLASSES,
      isScrolled && "shadow-lg",
      isHeader ? "bg-card" : "bg-card/95 backdrop-blur-sm",
      "shadow-[inset_0_-1px_0_0_hsl(var(--border))]",
      className
    )}
    {...props}
  >
    {children}
  </TableCell>
));
StickyTableCell.displayName = 'StickyTableCell';

const MemoizedTableRow = memo(React.forwardRef<HTMLTableRowElement, any>(function MemoizedTableRow({ item, style, className, isScrolled, hoveredColumn, getDailyTotal, ...rest }, ref) {
    const id = useId();
    const {
        schedule,
        totals,
        viewMode,
    days,
        updateQuantity,
    } = useScheduler();
    
    const cellStyles = "p-0 h-14 transition-colors duration-200";
    
    const groupStyle = GROUP_STYLES[item.group] || {};
    const groupBorder = cn("shadow-[inset_4px_0_6px_-4px_var(--group-color)]", groupStyle.groupColor);

  const { remaining, percentage } = useMemo(() => {
    const remaining = totals[item.id].remaining;
    const totalPossible = totals[item.id].totalPossible;
    const percentage = totalPossible > 0 ? (remaining / totalPossible) * 100 : 100;
    return { remaining, percentage };
  }, [totals, item.id]);
    
    const getRemainingCellBg = (percentage: number) => {
        if (percentage > 75) return REMAINING_CELL_BG_CLASSES.gt75;
        if (percentage > 50) return REMAINING_CELL_BG_CLASSES.gt50;
        if (percentage > 25) return REMAINING_CELL_BG_CLASSES.gt25;
        if (percentage > 0) return REMAINING_CELL_BG_CLASSES.gt0;
        return REMAINING_CELL_BG_CLASSES.lte0;
    };
    
    const remainingCellBg = useMemo(() => getRemainingCellBg(percentage), [percentage]);

    const total = totals[item.id].total;
    const rowClasses = "group row-transition animate-slide-down-fade-in hover:z-10";

  // If factories are provided by parent, use them. Otherwise fall back to local implementations.
  const onDetailedValueChange = useCallback((day: number, meal: Meal) => (newValue: number) => {
    updateQuantity(item.id, day, meal, newValue);
  }, [item.id, updateQuantity]);

  const onGeneralValueChange = useCallback((day: number, dailyTotal: number) => (newValue: number) => {
    // same behavior as previous parent factory but using updateQuantity directly
    const diff = newValue - dailyTotal;
    if (diff === 0) return;
    const currentMeals = schedule[item.id]?.[day] || {};
    const MEALS_ORDER: string[] = ['desayuno', 'comida', 'cena'];
    const mealsWithValues = MEALS_ORDER.filter((meal) => (currentMeals[meal] ?? 0) > 0);
    if (diff > 0 && mealsWithValues.length === 0) {
      const current = currentMeals['desayuno'] ?? 0;
      updateQuantity(item.id, day, 'desayuno', current + diff);
      return;
    }
    if (mealsWithValues.length > 0) {
      const firstMealToUpdate = mealsWithValues[0];
      const currentMealValue = currentMeals[firstMealToUpdate] ?? 0;
      const newVal = Math.max(0, currentMealValue + diff);
      updateQuantity(item.id, day, firstMealToUpdate as Meal, newVal);
      return;
    }
    if (diff < 0) {
      const mealsNonZero = MEALS_ORDER.filter((meal) => (currentMeals[meal] ?? 0) > 0);
      if (mealsNonZero.length > 0) {
        const target = mealsNonZero.at(-1);
        const currentTargetVal = target ? (currentMeals[target] ?? 0) : 0;
        if (target) updateQuantity(item.id, day, target as Meal, Math.max(0, currentTargetVal + diff));
      }
    }
  }, [item.id, schedule, updateQuantity]);

  return (
    <TableRow ref={ref} className={cn(rowClasses, className, "relative")} style={style} {...rest}>
            {/* Primera columna sticky (Código) usando variables CSS para left/width */}
            <StickyTableCell isScrolled={isScrolled} style={{ left: 0, width: 'var(--col-code-width)' }} className="p-2 text-left align-middle">
              <Badge variant="secondary" className="font-mono text-xs">{item.code}</Badge>
            </StickyTableCell>
            <StickyTableCell isScrolled={isScrolled} style={{ left: 'calc(var(--col-code-width))', width: 'var(--col-desc-width)' }} className="p-2 text-left align-middle">
                <div className="font-bold text-sm">{item.description}</div>
            </StickyTableCell>
            <StickyTableCell isScrolled={isScrolled} style={{ left: 'calc(var(--col-code-width) + var(--col-desc-width))', width: 'var(--col-unit-width)' }}>{item.unit}</StickyTableCell>
            <StickyTableCell isScrolled={isScrolled} style={{ left: 'calc(var(--col-code-width) + var(--col-desc-width) + var(--col-unit-width))', width: 'var(--col-total-width)' }} className={cn("font-mono text-lg", totals[item.id].isOverLimit && "text-destructive")}>{total}</StickyTableCell>
            <StickyTableCell isScrolled={isScrolled} style={{ left: 'calc(var(--col-code-width) + var(--col-desc-width) + var(--col-unit-width) + var(--col-total-width))', width: 'var(--col-rest-width)' }} className={cn("font-mono text-lg font-bold", remainingCellBg)}>{remaining}</StickyTableCell>
      <StickyTableCell isScrolled={isScrolled} style={{ left: 'calc(var(--col-code-width) + var(--col-desc-width) + var(--col-unit-width) + var(--col-total-width) + var(--col-rest-width))', width: 'var(--col-status-width)' }} className={groupBorder}>
                <div className="flex justify-center items-center">
          {(() => {
            let badgeBg = 'bg-transparent';
            if (totals[item.id].isOverLimit) {
              badgeBg = 'bg-rose-500/20';
            } else if (total > 0) {
              badgeBg = 'bg-green-500/20';
            }
            return (
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300', badgeBg)}>
                {totals[item.id].isOverLimit ? <AlertTriangle className="h-5 w-5 text-destructive" /> : (total > 0 && <CheckCircle className="h-5 w-5 text-green-500" />)}
              </div>
            )
          })()}
                </div>
            </StickyTableCell>
            {days.map((day: number) => {
                const dailyTotal = getDailyTotal(item.id, day);
                const isHovered = hoveredColumn === day;
                const isFocusContainerActive = hoveredColumn !== null;
                const opacityClass = isFocusContainerActive && !isHovered ? 'opacity-40' : 'opacity-100';
                const stepperId = `${id}-stepper-${day}`;

                if (viewMode === 'general') {
                    return (
                        <TableCell key={`${item.id}-${day}`} className={cn("text-center w-24 align-middle border-l", cellStyles, isHovered && "bg-primary/5", (dailyTotal > 0 && !isHovered) && 'bg-primary/5', "shadow-[inset_0_-1px_0_0_hsl(var(--border))]")}>
                            <label htmlFor={stepperId} className="sr-only">{`Cantidad para ${item.description} en día ${day}`}</label>
                             <QuantityStepper
                                aria-labelledby={stepperId}
                                value={dailyTotal}
                                onValueChange={onGeneralValueChange(day, dailyTotal)}
                                max={item.totalPossible}
                            />
                        </TableCell>
                    );
                }

                return (
                    <React.Fragment key={`${item.id}-${day}-detailed`}>
                        {MEALS.map((meal: Meal) => {
                            const mealValue = schedule[item.id]?.[day]?.[meal] ?? 0;
                            const borderClass = meal === 'cena' ? 'border-r-slate-300' : 'border-r-dotted border-r-slate-200';
                            const backgroundClass = (day - 1) % 2 === 0 ? 'bg-slate-50/50' : 'bg-card';
                            const mealStepperId = `${id}-stepper-${day}-${meal}`;

                            return (
                                <TableCell 
                                    key={`${item.id}-${day}-${meal}`} 
                                    className={cn("w-12 align-middle border-l", cellStyles, borderClass, backgroundClass, isHovered && "bg-primary/5", (mealValue > 0 && !isHovered) && 'bg-primary/5', "shadow-[inset_0_-1px_0_0_hsl(var(--border))]", "transition-opacity duration-300", opacityClass)}
                                >
                                    <label htmlFor={mealStepperId} className="sr-only">{`Cantidad para ${item.description} en día ${day}, ${meal}`}</label>
                                    <QuantityStepper
                                        aria-labelledby={mealStepperId}
                                        value={mealValue}
                                        onValueChange={onDetailedValueChange(day, meal)}
                                        max={item.totalPossible}
                                    />
                                </TableCell>
                            );
                        })}
                    </React.Fragment>
                )
            })}
        </TableRow>
    )
}));

export function SchedulerTable() {
  const {
    groups,
    viewMode,
    days,
    totals,
    toggleGroupCollapsed,
    collapsedGroups,
    getFilteredItems,
    getDailyTotal,
  } = useScheduler();

  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (parentRef.current) {
      setIsScrolled(parentRef.current.scrollLeft > 5);
    }
  }, []);

    const headerCellStyles = "p-2 align-middle text-sm font-semibold text-center bg-card shadow-inner-white";
    
    const handleColumnHover = useCallback((day: number | null) => {
        setHoveredColumn(day);
    }, []);

    const filteredItems = getFilteredItems();

    const allItems = useMemo(() => {
      return groups.flatMap((group: any) => {
        const groupItems = filteredItems.filter((item: any) => item.group === group.name);
        if (groupItems.length === 0) return [];

        const isExpanded = !collapsedGroups[group.name];
        const groupNode = { type: 'group', group, groupItems, isExpanded, id: group.name };
  const itemNodes = isExpanded ? groupItems.map((item: any) => ({ type: 'item', item, id: item.id })) : [];
        
        return [groupNode, ...itemNodes];
      });
    }, [groups, filteredItems, collapsedGroups]);
    
  const rowVirtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => allItems[index].type === 'group' ? 48 : 56,
    overscan: 10,
  });

  // Callback factories removed: rows use useScheduler directly to call updateQuantity

  const mealHeaderTop = `top-[2.5rem]`;
    const groupHeaderTop = viewMode === 'detailed' ? 'top-[5rem]' : 'top-[2.5rem]';

    // Overlay sticky column
    return (
      <div ref={parentRef} onScroll={handleScroll} className="h-full w-full overflow-auto relative">
        <style>{`
          .row-transition {
            transition: background-color 0.2s ease-in-out;
          }
          .animate-slide-down-fade-in {
            animation: slide-down-fade-in 0.3s ease-out forwards;
          }
          @keyframes slide-down-fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        {/* NOTE: Removed overlay sticky column. First column is now a native sticky cell inside each row. */}
        {/* Tabla virtualizada sin columna sticky */}
        <Table
          role="grid"
          aria-label="Programación de alimentos"
          aria-rowcount={allItems.length}
          style={{ ...STICKY_COLUMN_STYLES, height: `${rowVirtualizer.getTotalSize()}px` }}
          className="min-w-max border-separate border-spacing-0 relative"
        >
          <TableHeader className="sticky top-0 z-30 bg-card">
            <TableRow className="hover:bg-transparent">
              {/* Primera columna sticky (Código) */}
              <StickyTableCell isHeader isScrolled={isScrolled} style={{ left: 0, width: 'var(--col-code-width)' }} className={cn(headerCellStyles, "z-40 border-b text-left", isScrolled && "shadow-lg")}>
                Código
              </StickyTableCell>
              <TableHead className={cn(headerCellStyles, "z-40 border-b text-left", isScrolled && "shadow-lg")} style={{ width: 'var(--col-desc-width)' }}>Descripción</TableHead>
              <TableHead className={cn(headerCellStyles, "z-40 border-b text-center", isScrolled && "shadow-lg")} style={{ width: 'var(--col-unit-width)' }}>Unidad</TableHead>
              <TableHead className={cn(headerCellStyles, "z-40 border-b", isScrolled && "shadow-lg")} style={{ width: 'var(--col-total-width)' }}>Total</TableHead>
              <TableHead className={cn(headerCellStyles, "z-40 border-b", isScrolled && "shadow-lg")} style={{ width: 'var(--col-rest-width)' }}>Rest.</TableHead>
              <TableHead className={cn(headerCellStyles, "z-40 border-b", isScrolled && "shadow-lg")} style={{ width: 'var(--col-status-width)' }}>Estado</TableHead>
              {days.map((day: number) => (
                <TableHead key={day} colSpan={viewMode === 'detailed' ? 3 : 1} className={cn(headerCellStyles, "w-24 border-b border-l transition-colors duration-200", hoveredColumn === day && "bg-primary/5")} onMouseEnter={() => handleColumnHover(day)} onMouseLeave={() => handleColumnHover(null)}>
                  {day}
                </TableHead>
              ))}
            </TableRow>
            {viewMode === 'detailed' && (
              <TableRow className="hover:bg-transparent">
                {/* Sticky column header cell placeholder for meals row */}
                <StickyTableCell isHeader isScrolled={isScrolled} position="left-0" width="w-32" className={cn(headerCellStyles, "z-40 border-b text-left", isScrolled && "shadow-lg")} style={{ top: mealHeaderTop }} />
                <TableHead className={cn(headerCellStyles, "z-40 border-b", isScrolled && "shadow-lg")} style={{ top: mealHeaderTop }} />
                <TableHead className={cn(headerCellStyles, "z-40 border-b", isScrolled && "shadow-lg")} style={{ top: mealHeaderTop }} />
                <TableHead className={cn(headerCellStyles, "z-40 border-b", isScrolled && "shadow-lg")} style={{ top: mealHeaderTop }} />
                <TableHead className={cn(headerCellStyles, "z-40 border-b", isScrolled && "shadow-lg")} style={{ top: mealHeaderTop }} />
                <TableHead className={cn(headerCellStyles, "z-40 border-b", isScrolled && "shadow-lg")} style={{ top: mealHeaderTop }} />
                {days.map((day: number) => (
                  <React.Fragment key={`meals-${day}`}>
                    {MEALS.map(meal => (
                      <TableHead key={meal} className={cn(headerCellStyles, "text-center text-xs font-medium text-muted-foreground w-12 border-b border-l transition-colors duration-200", hoveredColumn === day && "bg-primary/5")} style={{ top: mealHeaderTop }} onMouseEnter={() => handleColumnHover(day)} onMouseLeave={() => handleColumnHover(null)}>
                        {meal.charAt(0).toUpperCase()}
                      </TableHead>
                    ))}
                  </React.Fragment>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const row = allItems[virtualItem.index];
              const commonStyle = {
                transform: `translateY(${virtualItem.start}px)`,
                position: 'absolute' as const,
                top: 0,
                left: 0,
                width: '100%',
              };

              if (row.type === 'group') {
                const { group, groupItems, isExpanded } = row;
                const colSpan = 6 + (viewMode === 'detailed' ? days.length * 3 : days.length); // 6 columnas incluyendo la columna sticky
                return (
                  <SchedulerGroupHeader
                    key={virtualItem.key}
                    group={group}
                    items={groupItems}
                    totals={totals}
                    isExpanded={isExpanded}
                      onToggle={() => toggleGroupCollapsed(group.name)}
                    colSpan={colSpan}
                    stickyTopClass={groupHeaderTop}
                    style={commonStyle}
                  />
                );
              }
              
              const { item } = row;
              return (
        <MemoizedTableRow
          ref={node => {
            rowVirtualizer.measureElement(node);
            if (node && focusedIndex === virtualItem.index) {
              const el = node as HTMLElement | null;
              if (el && typeof el.focus === 'function') el.focus();
            }
          }}
          data-index={virtualItem.index}
          key={virtualItem.key}
          item={item}
          style={{...commonStyle, animationDelay: `${virtualItem.index * 30}ms` }}
          aria-rowindex={virtualItem.index + 1}
          onFocus={() => setFocusedIndex(virtualItem.index)}
          tabIndex={-1}
          {...{ isScrolled, hoveredColumn }}
          getDailyTotal={getDailyTotal}
        />
              )
            })}
          </TableBody>
        </Table>
      </div>
    );
}
