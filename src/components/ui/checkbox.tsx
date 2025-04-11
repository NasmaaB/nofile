'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            if (onCheckedChange) {
                onCheckedChange(event.target.checked);
            }
        };

        return (
            <div className="relative">
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className="sr-only"
                    {...props}
                />
                <div
                    className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center",
                        checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-primary bg-background",
                        disabled && "opacity-50 cursor-not-allowed",
                        className
                    )}
                >
                    {checked && <Check className="h-3 w-3" />}
                </div>
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
