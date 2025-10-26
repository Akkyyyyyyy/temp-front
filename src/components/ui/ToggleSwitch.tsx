import React from "react";
import { Button } from "@/components/ui/button";

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
  className = "",
  buttonClassName = "",
  activeButtonClassName = "",
  inactiveButtonClassName = "",
}) => {
  const activeIndex = options.findIndex((option) => option.value === value);
  const position = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div
      className={`relative inline-flex items-center gap-1 bg-muted rounded-full p-1 border border-border shadow-sm ${className}`}
    >
      {/* Sliding background */}
      <div
        className="absolute top-1 left-1 bg-primary rounded-full shadow-sm transition-all duration-300 ease-in-out h-[calc(100%-8px)]"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          transform: `translateX(${position * 100}%)`,
        }}
      />

      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Button
            key={option.value}
            onClick={() => onChange(option.value)}
            size="sm"
            variant="ghost"
            className={`
              relative z-10 flex-1 px-4 py-1.5 text-sm rounded-full transition-all duration-300
              hover:bg-transparent
              ${buttonClassName}
              ${isActive
                ? `text-primary-foreground ${activeButtonClassName}`
                : `text-muted-foreground hover:text-foreground ${inactiveButtonClassName}`
              }
            `}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};
