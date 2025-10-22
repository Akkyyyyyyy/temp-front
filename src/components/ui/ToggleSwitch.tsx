import React from 'react';
import { Button } from '@/components/ui/button';
export type ToggleOption = {
  value: string;
  label: string;
};

interface ToggleSwitchProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
  inactiveButtonClassName?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  options,
  value,
  onChange,
  className = '',
  buttonClassName = '',
  activeButtonClassName = '',
  inactiveButtonClassName = '',
}) => {
  const activeIndex = options.findIndex(option => option.value === value);
  const position = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className={`inline-flex items-center gap-1 bg-muted rounded-full p-1 border border-border shadow-sm relative ${className}`}>
      {/* Sliding background */}
      <div
        className="absolute bg-primary rounded-full shadow-sm transition-all duration-300 ease-in-out h-[calc(100%-8px)]"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          left: `calc(${position * (100 / options.length)}% + 1px)`,
        }}
      />

      {options.map((option) => (
        <Button
          key={option.value}
          onClick={() => onChange(option.value)}
          size="sm"
          className={`
            relative px-4 py-1.5 text-sm rounded-full transition-all duration-300 hover:bg-transparent
            ${buttonClassName}
            ${value === option.value
              ? `text-primary-foreground ${activeButtonClassName}`
              : `bg-transparent text-muted-foreground hover:text-foreground ${inactiveButtonClassName}`
            }
          `}
          variant="ghost"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};