
"use client";

import { useCallback, useId } from 'react';
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @typedef {object} QuantityStepperProps
 * @property {number} value - The current value of the stepper.
 * @property {(value: number) => void} onValueChange - Callback triggered when the value changes.
 * @property {() => void} [onCommit] - Callback triggered on blur or Enter key press.
 * @property {number} max - The maximum allowed value.
 * @property {string} aria-labelledby - The ID of the element that labels the stepper.
 */
interface QuantityStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  onCommit?: () => void;
  max: number;
  'aria-labelledby': string;
}

/**
 * A customizable quantity stepper component that is fully controlled by its props.
 * @param {QuantityStepperProps} props - The component props.
 * @returns {JSX.Element} The rendered quantity stepper.
 */
  const inputId = useId();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueStr = e.target.value;

    if (valueStr === '') {
      // UX: tratar campo vacío como 0 y mantener el input controlado
      onValueChange(0);
      return;
    }

    // Eliminar caracteres no numéricos y parsear
  const sanitized = valueStr.replaceAll(/[^0-9-]/g, '');
    const numericValue = Number.parseInt(sanitized, 10);

    if (Number.isNaN(numericValue)) {
      // No hacer nada si no es numérico
      return;
    }

    // Prevenir negativos
    const clamped = Math.max(0, Math.min(numericValue, max));
    onValueChange(clamped);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit?.();
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleStep(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleStep(-1);
    }
  };

  const handleStep = useCallback((amount: number) => {
    const currentValue = value || 0;
    const newValue = Math.min(Math.max(0, currentValue + amount), max);
    if (newValue !== value) {
      onValueChange(newValue);
    }
  }, [value, onValueChange, max]);

  return (
    <div className="group relative flex items-center justify-center w-full h-full transition-transform duration-150 ease-in-out focus-within:z-10 focus-within:scale-110">
      <Input
        id={inputId}
        type="number"
        min={0}
        max={max}
        aria-labelledby={ariaLabelledby}
        // Mostrar siempre el valor del estado (incluir 0)
        value={String(value)}
        onChange={handleInputChange}
        onBlur={onCommit}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-full w-full rounded-none border-0 p-2 pr-5 text-center text-sm shadow-none transition-all duration-150 [appearance:textfield] focus:bg-primary/10 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
          "placeholder:text-muted-foreground/50",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          { "font-semibold text-primary": value > 0 },
        )}
        placeholder="0"
      />
      <div className="absolute right-0.5 top-0 bottom-0 flex flex-col items-center justify-center w-5">
        <button 
          type="button"
          onClick={() => handleStep(1)}
          className="h-1/2 w-full text-slate-400 hover:text-slate-800 transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center"
          aria-label="Incrementar valor" // TODO: i18n
          aria-controls={inputId}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button 
          type="button"
          onClick={() => handleStep(-1)} 
          disabled={!value || value <= 0}
          className="h-1/2 w-full text-slate-400 hover:text-slate-800 transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Disminuir valor" // TODO: i18n
          aria-controls={inputId}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
