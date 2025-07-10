'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, ChevronLeft, Loader2 } from 'lucide-react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CancelRegistrationForm } from './CancelRegistrationForm';
import { Client } from '@/types/index';

interface CancelViewProps {
    onCancel: (name: string, secretKey: string) => Promise<{ success: boolean; message?: string; client?: Client }>;
    onReset: () => void;
}

export function CancelView({ onCancel, onReset }: CancelViewProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [cancelResult, setCancelResult] = useState<{
        success: boolean;
        message: string;
        cancelled?: boolean;
        client?: Client;
    } | null>(null);

    const handleCancel = async (name: string, secretKey: string) => {
        setIsProcessing(true);
        try {
            const result = await onCancel(name, secretKey);

            setCancelResult({
                success: result.success,
                message: result.message || (result.success
                    ? "Désinscription réussie."
                    : "Erreur lors de la désinscription."),
                cancelled: result.success,
                client: result.client
            });
        } catch (error) {
            setCancelResult({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Une erreur inattendue s'est produite."
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setCancelResult(null);
        onReset();
    };

    return (
        <AnimatePresence mode="wait">
            {cancelResult ? (
                <CancelResultView
                    result={cancelResult}
                    onReset={resetForm}
                />
            ) : (
                <CancelRegistrationForm
                    onCancel={handleCancel}
                    isProcessing={isProcessing}
                />
            )}
        </AnimatePresence>
    );
}

interface CancelResultViewProps {
    result: {
        success: boolean;
        message: string;
        cancelled?: boolean;
        client?: Client;
    };
    onReset: () => void;
}

function CancelResultView({ result, onReset }: CancelResultViewProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mx-auto"
        >
            <Card className="shadow-sm border-opacity-50 overflow-hidden">
                <CardHeader className={`py-3 ${result.success
                    ? 'bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent'
                    : 'bg-gradient-to-r from-destructive/10 to-transparent'}`}
                >
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`p-1.5 rounded-full ${result.success
                            ? 'bg-green-100 dark:bg-green-800/30'
                            : 'bg-destructive/20'}`}
                        >
                            {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                            ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                            )}
                        </div>
                        {result.success ? 'Désinscription réussie' : 'Échec de désinscription'}
                    </CardTitle>
                </CardHeader>

                <CardContent className="pt-3 pb-2">
                    <div className={`p-3 border rounded-md text-sm ${result.success
                        ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30'
                        : 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30'
                        }`}
                    >
                        <div className="flex gap-2">
                            {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className={`text-sm font-medium ${result.success
                                    ? 'text-green-700 dark:text-green-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                    }`}
                                >
                                    {result.success ? 'Désinscription confirmée' : 'Action impossible'}
                                </p>
                                <p className={`text-xs mt-1 ${result.success
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                    }`}
                                >
                                    {result.message}
                                </p>

                                {result.success && result.client && (
                                    <div className="mt-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded border border-green-200 dark:border-green-800/50">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            Client désinscrit:
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Nom:</span> {result.client.name}
                                            </p>
                                            {result.client.position !== undefined && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    <span className="font-medium">Position:</span> #{result.client.position}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex pt-2 pb-3 px-3">
                    <Button
                        variant="outline"
                        className="w-full gap-2 h-9 text-sm font-medium"
                        onClick={onReset}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Retour au formulaire</span>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}