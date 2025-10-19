
"use client";

import React, { useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
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
  isError?: boolean;
  onClearError?: () => void;
}

/**
 * A customizable quantity stepper component that is fully controlled by its props.
 * @param {QuantityStepperProps} props - The component props.
 * @returns {JSX.Element} The rendered quantity stepper.
 */
export function QuantityStepper({ value, onValueChange, onCommit, max, 'aria-labelledby': ariaLabelledby }: Readonly<QuantityStepperProps>) {
  const { t } = useTranslation();
  const inputId = useId();
  const [inputValue, setInputValue] = React.useState(String(value));
  const [isInvalid, setIsInvalid] = React.useState(false);

  React.useEffect(() => {
    setInputValue(String(value));
    setIsInvalid(false);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // allow empty string for editing
    if (val === '') {
      setInputValue('');
      setIsInvalid(false);
      return;
    }
    // sanitize to digits only
  const sanitized = val.replaceAll(/\D/g, '');
    setInputValue(sanitized);
    const num = Number.parseInt(sanitized, 10);
    const isError = Number.isNaN(num) || num < 0 || num > max;
    setIsInvalid(isError);
  };

  const commitValue = () => {
    if (isInvalid) {
      setInputValue(String(value));
      setIsInvalid(false);
      return;
    }
  const finalValue = inputValue === '' ? 0 : Number.parseInt(inputValue, 10);
    if (Number.isNaN(finalValue)) {
      setInputValue(String(value));
      return;
    }
    if (finalValue !== value) onValueChange(finalValue);
    onCommit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue();
      (e.currentTarget as HTMLInputElement).blur();
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
        type="text"
        aria-labelledby={ariaLabelledby}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={commitValue}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-full w-full rounded-none border-0 p-2 pr-5 text-center text-sm shadow-none transition-all duration-150 [appearance:textfield] focus:bg-primary/10 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
          "placeholder:text-muted-foreground/50",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          { "font-semibold text-primary": Number(inputValue) > 0, 'border-destructive ring-destructive animate-pulse': isInvalid },
        )}
        placeholder="0"
      />
      <div className="absolute right-0.5 top-0 bottom-0 flex flex-col items-center justify-center w-5">
        <button 
          type="button"
          onClick={() => handleStep(1)}
          className="h-1/2 w-full text-slate-400 hover:text-slate-800 transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center"
          aria-label={t('incrementar_valor')}
          aria-controls={inputId}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button 
          type="button"
          onClick={() => handleStep(-1)} 
          disabled={!value || value <= 0}
          className="h-1/2 w-full text-slate-400 hover:text-slate-800 transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label={t('disminuir_valor')}
          aria-controls={inputId}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
