import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className,
    text
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16'
    };

    return (
        <div className={cn('flex flex-col items-center justify-center', className)}>
            <div className={cn('nofile-spinner', sizeClasses[size])}></div>
            {text && (
                <p className="mt-3 text-sm text-muted-foreground">{text}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;