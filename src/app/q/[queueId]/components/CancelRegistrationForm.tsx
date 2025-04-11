'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle,
    Info,
    KeyRound,
    Loader2,
    User,
    X,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CancelRegistrationFormProps {
    onCancel: (name: string, secretKey: string) => Promise<void>;
    isProcessing: boolean;
}

export function CancelRegistrationForm({
    onCancel,
    isProcessing,
}: CancelRegistrationFormProps) {
    const [name, setName] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [nameError, setNameError] = useState('');
    const [keyError, setKeyError] = useState('');
    const [formTouched, setFormTouched] = useState(false);

    // Validation de formulaire à la volée après le premier toucher
    useEffect(() => {
        if (!formTouched) return;

        if (!name.trim()) {
            setNameError('Veuillez saisir votre nom');
        } else {
            setNameError('');
        }

        if (!secretKey.trim()) {
            setKeyError('Veuillez saisir votre clé');
        } else if (secretKey.length < 5) {
            setKeyError('La clé doit contenir 5 caractères');
        } else {
            setKeyError('');
        }
    }, [name, secretKey, formTouched]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormTouched(true);

        let hasError = false;

        if (!name.trim()) {
            setNameError('Veuillez saisir votre nom');
            hasError = true;
        }

        if (!secretKey.trim() || secretKey.length < 5) {
            setKeyError('Clé invalide (5 caractères)');
            hasError = true;
        }

        if (!hasError) {
            await onCancel(name, secretKey);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full"
        >
            <Card
                className={cn(
                    // On retire les ombres marquées et on opte pour des bords arrondis
                    'rounded-xl shadow-none border',
                    'bg-white dark:bg-nofile-900',
                    'border-nofile-100 dark:border-nofile-800',
                    'overflow-hidden'
                )}
            >
                <form onSubmit={handleSubmit}>
                    {/* Header sans gradient, plus sobre */}
                    <CardHeader
                        className={cn(
                            'pb-2 px-3 pt-3',
                            'bg-nofile-accent-50 dark:bg-nofile-accent-900/10'
                        )}
                    >
                        <CardTitle
                            className={cn(
                                'flex items-center justify-center gap-2 text-base',
                                'text-nofile-900 dark:text-white'
                            )}
                        >
                            {/* Petite puce d’icône accentuée */}
                            {/* <div className="p-1.5 rounded-full bg-nofile-accent-100 dark:bg-nofile-accent-900/40">
                                <X className="h-4 w-4 text-nofile-accent-600 dark:text-nofile-accent-400" />
                            </div> */}
                            Désinscription
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-3 pb-2 space-y-3">
                        {/* Champ Nom Complet */}
                        <div className="space-y-1">
                            <label
                                htmlFor="cancel-name"
                                className={cn(
                                    'text-xs font-medium leading-none flex items-center gap-1',
                                    'text-nofile-800 dark:text-white'
                                )}
                            >
                                Nom complet
                                <span className="text-nofile-accent-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 flex justify-center">
                                    <User className="h-3.5 w-3.5 text-nofile-500 dark:text-nofile-400" />
                                </div>
                                <input
                                    id="cancel-name"
                                    type="text"
                                    placeholder="Votre nom"
                                    className={cn(
                                        'h-9 w-full rounded-md border px-3 py-1 text-sm pl-8',
                                        'bg-white dark:bg-nofile-900',
                                        'placeholder:text-nofile-400 dark:placeholder:text-nofile-500',
                                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nofile-500 focus-visible:border-nofile-500',
                                        'focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                                        'transition-colors',
                                        nameError
                                            ? 'border-nofile-accent-500 focus-visible:ring-nofile-accent-500 focus-visible:border-nofile-accent-500'
                                            : 'border-nofile-200 dark:border-nofile-700'
                                    )}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (!formTouched) setFormTouched(true);
                                    }}
                                    disabled={isProcessing}
                                    autoComplete="name"
                                />
                            </div>
                            <AnimatePresence>
                                {nameError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xs text-nofile-accent-500 flex items-start mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                        <span>{nameError}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Champ Clé Secrète */}
                        <div className="space-y-1">
                            <label
                                htmlFor="secret-key"
                                className={cn(
                                    'text-xs font-medium leading-none flex items-center gap-1',
                                    'text-nofile-800 dark:text-white'
                                )}
                            >
                                Clé secrète
                                <span className="text-nofile-accent-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 flex justify-center">
                                    <KeyRound className="h-3.5 w-3.5 text-nofile-500 dark:text-nofile-400" />
                                </div>
                                <input
                                    id="secret-key"
                                    type="text"
                                    placeholder="CLÉ (EX: BD47A)"
                                    className={cn(
                                        'h-9 w-full rounded-md border px-3 py-1 text-sm uppercase tracking-wider font-medium pl-8',
                                        'bg-white dark:bg-nofile-900',
                                        'placeholder:text-nofile-400 dark:placeholder:text-nofile-500',
                                        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nofile-500 focus-visible:border-nofile-500',
                                        'focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                                        'transition-colors',
                                        keyError
                                            ? 'border-nofile-accent-500 focus-visible:ring-nofile-accent-500 focus-visible:border-nofile-accent-500'
                                            : 'border-nofile-200 dark:border-nofile-700'
                                    )}
                                    value={secretKey}
                                    onChange={(e) => {
                                        setSecretKey(e.target.value.toUpperCase());
                                        if (!formTouched) setFormTouched(true);
                                    }}
                                    disabled={isProcessing}
                                    maxLength={5}
                                    pattern="[A-Z0-9]{5}"
                                    inputMode="text"
                                    autoComplete="off"
                                />
                            </div>
                            <AnimatePresence>
                                {keyError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-xs text-nofile-accent-500 flex items-start mt-1"
                                    >
                                        <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                        <span>{keyError}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Note d'information */}
                        <div
                            className={cn(
                                'rounded-md p-2 text-xs flex gap-2 items-start border',
                                'bg-nofile-50 dark:bg-nofile-900/10',
                                'border-nofile-100 dark:border-nofile-800/30'
                            )}
                        >
                            <Info className="h-3.5 w-3.5 text-nofile-600 dark:text-nofile-400 flex-shrink-0 mt-0.5" />
                            <span className="text-nofile-800 dark:text-nofile-200">
                                La clé secrète vous a été fournie lors de votre inscription pour confirmer votre identité.
                            </span>
                        </div>
                    </CardContent>

                    <CardFooter className="flex pt-2 pb-3 px-3">
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full"
                        >
                            <Button
                                type="submit"
                                disabled={isProcessing}
                                className={cn(
                                    'w-full h-9 text-sm font-medium rounded-md gap-2',
                                    'bg-nofile-accent-600 text-white',
                                    'hover:bg-nofile-accent-700 transition-colors'
                                )}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Traitement...</span>
                                    </>
                                ) : (
                                    <>
                                        <X className="h-3.5 w-3.5" />
                                        <span>Se désinscrire</span>
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>
    );
}
