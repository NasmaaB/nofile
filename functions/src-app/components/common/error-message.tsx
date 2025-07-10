import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ErrorMessageProps {
    title?: string;
    message: string;
    className?: string;
    onRetry?: () => void;
    action?: {
        label: string;
        href: string;
    };
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
    title = 'Erreur',
    message,
    className,
    onRetry,
    action
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center',
                className
            )}
        >
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-destructive">{title}</h2>
            <p className="text-muted-foreground mb-4">{message}</p>

            <div className="flex flex-col sm:flex-row justify-center gap-2">
                {onRetry && (
                    <Button
                        variant="outline"
                        onClick={onRetry}
                        className="flex items-center gap-1"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Réessayer
                    </Button>
                )}

                {action && (
                    <Button
                        variant="default"
                        onClick={() => window.location.href = action.href}
                        className="flex items-center gap-1"
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        </motion.div>
    );
};

export default ErrorMessage;