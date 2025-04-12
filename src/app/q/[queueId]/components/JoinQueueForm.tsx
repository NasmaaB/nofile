'use client';

import React, { useState, useEffect } from 'react';
import {
    AlertCircle,
    Check,
    Loader2,
    Mail,
    Phone,
    User,
    Clock,
} from 'lucide-react';

// Types simplifiés
interface Client {
    name: string;
    phone: string;
    email: string;
}

interface Queue {
    averageServiceTime?: number;
    maxClients?: number;
}

interface FormData {
    name: string;
    phone: string;
    email: string;
    smsNotifications: boolean;
    emailNotifications: boolean;
}

// Version simplifiée sans dépendances externes
export function JoinQueueForm({
    queue = { averageServiceTime: 5 },
    waitingClients = [],
    onSubmit = async () => ({ success: true }),
    isSubmitting = false,
}: {
    queue?: Queue;
    waitingClients?: Client[];
    onSubmit?: (data: FormData) => Promise<{ success: boolean; message?: string; duplicateFound?: boolean }>;
    isSubmitting?: boolean;
}) {
    // État du formulaire
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phone: '',
        email: '',
        smsNotifications: false,
        emailNotifications: true, // Email coché par défaut comme demandé
    });

    // État des erreurs
    const [errors, setErrors] = useState<{
        name?: string;
        phone?: string;
        email?: string;
    }>({});

    // État de la vérification des doublons
    const [duplicateCheck, setDuplicateCheck] = useState<{
        checking: boolean;
        found: boolean;
        field: string | null;
        value: string | null;
    }>({
        checking: false,
        found: false,
        field: null,
        value: null,
    });

    // Formatage du numéro de téléphone en temps réel
    useEffect(() => {
        if (formData.phone) {
            // Supprimer tous les caractères non numériques, sauf le '+'
            let cleaned = formData.phone.replace(/[^\d+]/g, '');

            // Limiter le nombre de chiffres
            if (cleaned.startsWith('0')) {
                // Format national français: limiter à 10 chiffres (y compris le 0)
                const digits = cleaned.replace(/\D/g, '');
                if (digits.length > 10) {
                    cleaned = digits.substring(0, 10);
                }
            } else if (cleaned.startsWith('+33')) {
                // Format international français: limiter à 12 caractères (+33 + 9 chiffres)
                const remaining = cleaned.substring(3); // Enlever '+33'
                const digits = remaining.replace(/\D/g, '');
                if (digits.length > 9) {
                    cleaned = '+33' + digits.substring(0, 9);
                }
            } else if (cleaned.startsWith('+')) {
                // Autres formats internationaux: limiter à 15 caractères
                if (cleaned.length > 15) {
                    cleaned = cleaned.substring(0, 15);
                }
            } else {
                // Autres formats: limiter à 10 chiffres
                if (cleaned.length > 10) {
                    cleaned = cleaned.substring(0, 10);
                }
            }

            // Appliquer le formatage après limitation
            if (cleaned.startsWith('0') && cleaned.length > 1) {
                // Format français national (0X XX XX XX XX)
                cleaned = cleaned.replace(
                    /^0(\d{1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})$/,
                    (_, a, b, c, d, e) => {
                        let formatted = `0${a}`;
                        if (b) formatted += ` ${b}`;
                        if (c) formatted += ` ${c}`;
                        if (d) formatted += ` ${d}`;
                        if (e) formatted += ` ${e}`;
                        return formatted;
                    }
                );
            } else if (cleaned.startsWith('+33') && cleaned.length > 3) {
                // Format français international (+33 X XX XX XX XX)
                cleaned = cleaned.replace(
                    /^\+33(\d{0,1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})$/,
                    (_, a, b, c, d, e) => {
                        let formatted = '+33';
                        if (a) formatted += ` ${a}`;
                        if (b) formatted += ` ${b}`;
                        if (c) formatted += ` ${c}`;
                        if (d) formatted += ` ${d}`;
                        if (e) formatted += ` ${e}`;
                        return formatted;
                    }
                );
            } else if (cleaned.length > 0 && !cleaned.startsWith('+') && !cleaned.startsWith('0')) {
                // Si l'utilisateur n'a pas mis de préfixe, supposer un numéro français
                cleaned = cleaned.replace(
                    /^(\d{0,1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})$/,
                    (_, a, b, c, d, e) => {
                        let formatted = '';
                        if (a) formatted += `${a}`;
                        if (b) formatted += b ? ` ${b}` : '';
                        if (c) formatted += c ? ` ${c}` : '';
                        if (d) formatted += d ? ` ${d}` : '';
                        if (e) formatted += e ? ` ${e}` : '';
                        return formatted;
                    }
                );
            }

            // Mettre à jour uniquement si le format a changé
            if (cleaned !== formData.phone) {
                setFormData(prev => ({ ...prev, phone: cleaned }));
            }
        }
    }, [formData.phone]);

    // Gestion des changements dans les champs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Réinitialiser les erreurs de doublons lorsque l'utilisateur modifie le champ
        if (duplicateCheck.field === name && duplicateCheck.found) {
            setDuplicateCheck({
                checking: false,
                found: false,
                field: null,
                value: null
            });
        }

        // Vérifier les doublons uniquement pour le téléphone et l'email pendant la saisie
        if ((name === 'phone' || name === 'email') && value.length >= 3) {
            checkForDuplicates(name, value);
        }

        // Si l'utilisateur désactive la notification qui correspond à un champ, 
        // on efface l'erreur correspondante
        if (name === 'emailNotifications' && !checked) {
            setErrors(prev => ({ ...prev, email: undefined }));
        }
        if (name === 'smsNotifications' && !checked) {
            setErrors(prev => ({ ...prev, phone: undefined }));
        }
    };

    // Vérifier les doublons
    const checkForDuplicates = (field: string, value: string) => {
        if (!value || value.length < 3) {
            // Réinitialiser l'état si la valeur est trop courte
            if (duplicateCheck.field === field) {
                setDuplicateCheck({
                    checking: false,
                    found: false,
                    field: null,
                    value: null
                });
            }
            return;
        }

        // Vérifications de doublons uniquement pour téléphone et email pendant la saisie
        if (field === 'name') return;

        setDuplicateCheck((prev) => ({ ...prev, checking: true, field, value }));

        // Temporisation pour éviter trop de vérifications pendant la saisie
        setTimeout(() => {
            let foundDuplicate = false;

            if (field === 'phone') {
                // Normaliser le téléphone pour la comparaison
                const normalizedPhone = normalizePhoneNumber(value);

                // Vérification explicite
                for (const client of waitingClients) {
                    if (normalizePhoneNumber(client.phone) === normalizedPhone && normalizedPhone !== '') {
                        foundDuplicate = true;
                        break;
                    }
                }
            } else if (field === 'email') {
                // Normaliser l'email pour la comparaison
                const normalizedEmail = value.toLowerCase().trim();

                // Vérification explicite
                for (const client of waitingClients) {
                    if (client.email.toLowerCase().trim() === normalizedEmail && normalizedEmail !== '') {
                        foundDuplicate = true;
                        break;
                    }
                }
            }

            setDuplicateCheck({
                checking: false,
                found: foundDuplicate,
                field: foundDuplicate ? field : null,
                value: foundDuplicate ? value : null,
            });
        }, 500);
    };

    // Validation du formulaire
    const validateForm = () => {
        const formErrors: { name?: string; phone?: string; email?: string } = {};

        // Validation du nom (toujours obligatoire)
        if (!formData.name || formData.name.trim() === '') {
            formErrors.name = 'Le nom est requis';
        } else if (formData.name.length < 3) {
            formErrors.name = 'Le nom doit contenir au moins 3 caractères';
        } else if (formData.name.length > 50) {
            formErrors.name = 'Le nom ne peut pas dépasser 50 caractères';
        }

        // Au moins une méthode de notification doit être activée
        if (!formData.smsNotifications && !formData.emailNotifications) {
            formErrors.name = formErrors.name || 'Vous devez choisir au moins une méthode de notification (SMS ou Email)';
            setErrors(formErrors);
            return false;
        }

        // Validation du téléphone uniquement si notifications SMS activées
        if (formData.smsNotifications) {
            if (!formData.phone || formData.phone.trim() === '') {
                formErrors.phone = 'Le numéro de téléphone est requis pour les notifications SMS';
            } else {
                const phoneWithoutSpaces = formData.phone.replace(/\s/g, '');
                const digitsOnly = phoneWithoutSpaces.replace(/\D/g, '');

                if (phoneWithoutSpaces.startsWith('0') && digitsOnly.length !== 10) {
                    formErrors.phone = 'Le numéro doit contenir exactement 10 chiffres';
                } else if (phoneWithoutSpaces.startsWith('+33') && digitsOnly.length !== 9) {
                    formErrors.phone = 'Le numéro avec +33 doit contenir exactement 9 chiffres';
                } else if (!phoneWithoutSpaces.startsWith('0') && !phoneWithoutSpaces.startsWith('+')) {
                    formErrors.phone = 'Le numéro doit commencer par 0 ou +33';
                } else if (!/^[0-9+\s()-]+$/.test(formData.phone)) {
                    formErrors.phone = 'Le format du numéro de téléphone est invalide';
                }
            }
        }

        // Validation de l'email uniquement si notifications email activées
        if (formData.emailNotifications) {
            if (!formData.email || formData.email.trim() === '') {
                formErrors.email = "L'email est requis pour les notifications email";
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    formErrors.email = "L'email est invalide";
                } else if (formData.email.length < 5) {
                    formErrors.email = "L'email doit contenir au moins 5 caractères";
                } else if (formData.email.length > 100) {
                    formErrors.email = "L'email ne peut pas dépasser 100 caractères";
                }
            }
        }

        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    // Helper pour normaliser le numéro de téléphone avant soumission
    const normalizePhoneNumber = (phone: string): string => {
        // Si le numéro est vide, retourner une chaîne vide
        if (!phone || phone.trim() === '') return '';

        // Enlever tous les caractères non numériques
        const digitsOnly = phone.replace(/\D/g, '');

        if (digitsOnly === '') return '';

        // Format national français (commence par 0)
        if (digitsOnly.startsWith('0')) {
            return '+33' + digitsOnly.substring(1); // Remplace le 0 initial par +33
        }

        // Format international français (commence par 33)
        if (digitsOnly.startsWith('33')) {
            return '+' + digitsOnly;
        }

        // Déjà au format international
        if (phone.startsWith('+')) {
            return digitsOnly.startsWith('33') ? '+' + digitsOnly : phone;
        }

        // Pour tous les autres cas (numéros sans indicatif), on suppose un numéro français
        return '+33' + digitsOnly;
    };

    // Version modifiée de la fonction handleSubmit avec plus de logging et de vérifications
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Avant toute chose, réinitialiser l'état des doublons
        setDuplicateCheck({
            checking: false,
            found: false,
            field: null,
            value: null,
        });

        // Validation du formulaire avant soumission
        if (!validateForm()) {
            return;
        }

        try {
            // Variables pour stocker les valeurs normalisées
            const normalizedName = formData.name.toLowerCase().trim();
            let normalizedPhone = '';
            let normalizedEmail = '';
            let isDuplicate = false;

            // Préparer les valeurs normalisées qui seront utilisées pour la détection de doublons et la soumission
            if (formData.smsNotifications && formData.phone) {
                normalizedPhone = normalizePhoneNumber(formData.phone);
            }

            if (formData.emailNotifications && formData.email) {
                normalizedEmail = formData.email.toLowerCase().trim();
            }

            // Vérification du nom (toujours requise)
            // Important: Utilisez une comparaison stricte pour les chaînes
            for (const client of waitingClients) {
                if (client.name.toLowerCase().trim() === normalizedName) {
                    console.log("Doublon de nom trouvé:", client.name, "vs", normalizedName);
                    setDuplicateCheck({
                        checking: false,
                        found: true,
                        field: 'name',
                        value: formData.name,
                    });
                    isDuplicate = true;
                    return; // Arrêter immédiatement si doublon trouvé
                }
            }

            // Vérification du téléphone uniquement si SMS activés
            if (!isDuplicate && formData.smsNotifications && normalizedPhone) {
                for (const client of waitingClients) {
                    const clientPhone = normalizePhoneNumber(client.phone);
                    if (clientPhone === normalizedPhone && normalizedPhone !== '') {
                        setDuplicateCheck({
                            checking: false,
                            found: true,
                            field: 'phone',
                            value: formData.phone,
                        });
                        isDuplicate = true;
                        return; // Arrêter immédiatement si doublon trouvé
                    }
                }
            }

            // Vérification de l'email uniquement si Email activé
            if (!isDuplicate && formData.emailNotifications && normalizedEmail) {
                for (const client of waitingClients) {
                    const clientEmail = client.email.toLowerCase().trim();
                    if (clientEmail === normalizedEmail && normalizedEmail !== '') {
                        setDuplicateCheck({
                            checking: false,
                            found: true,
                            field: 'email',
                            value: formData.email,
                        });
                        isDuplicate = true;
                        return; // Arrêter immédiatement si doublon trouvé
                    }
                }
            }

            // Si nous arrivons ici, c'est qu'aucun doublon n'a été trouvé
            // Préparation des données pour soumission
            const submissionData = {
                name: formData.name.trim(),
                phone: normalizedPhone,
                email: normalizedEmail,
                smsNotifications: formData.smsNotifications,
                emailNotifications: formData.emailNotifications
            };

            // Soumission du formulaire
            const result = await onSubmit(submissionData);

            // Gestion du cas où le backend trouve un doublon que nous n'avons pas détecté
            if (!result.success && result.duplicateFound) {
                setDuplicateCheck({
                    checking: false,
                    found: true,
                    field: 'name', // Par défaut, on suppose un doublon de nom
                    value: formData.name,
                });
            }

            // Si tout s'est bien passé, on peut réinitialiser le formulaire ici si nécessaire

        } catch (error) {
            console.error("Erreur lors de la soumission du formulaire:", error);
            // Réinitialiser l'état des doublons en cas d'erreur
            setDuplicateCheck({
                checking: false,
                found: false,
                field: null,
                value: null,
            });
        }
    };

    // Calculer la position estimée dans la file d'attente
    const estimatedPosition = waitingClients.length + 1;

    // Calculer le temps d'attente estimé
    const averageServiceTime = queue.averageServiceTime || 5; // 5 minutes par défaut
    const estimatedWaitTime = estimatedPosition * averageServiceTime;

    // Vérifier si la file d'attente est pleine
    const queueIsFull = queue.maxClients ? waitingClients.length >= queue.maxClients : false;

    // Utilitaire pour combiner des classes conditionnellement (cn)
    const cn = (...classes: (string | boolean | undefined)[]) => {
        return classes.filter(Boolean).join(' ');
    };

    // Animation pour les transitions
    const getTransitionStyle = (delay: number) => ({
        transform: 'translateY(0)',
        opacity: 1,
        transition: `all 0.3s ${delay}s`
    });

    return (
        <div
            className="w-full max-w-lg mx-auto opacity-100 translate-y-0 transition-all duration-400"
            style={{ transform: 'translateY(0)', opacity: 1 }}
        >
            <div className="shadow-sm border-nofile-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950 rounded-md">
                <div className="py-1.5 px-3 bg-gradient-to-r from-nofile-50 to-transparent dark:from-nofile-900/10 dark:to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white font-medium">
                            <div className="bg-nofile-100 dark:bg-nofile-800/30 p-1 rounded-full">
                                <User className="h-3.5 w-3.5 text-nofile-600 dark:text-nofile-400" />
                            </div>
                            Rejoindre la file
                        </div>
                        <div className="flex gap-1.5">
                            <span className="bg-nofile-100 dark:bg-nofile-900/20 text-[10px] py-0 h-4 text-nofile-700 dark:text-nofile-300 border border-nofile-200 dark:border-nofile-800/30 px-1.5 rounded-full inline-flex items-center">
                                Position: #{estimatedPosition}
                            </span>
                            <span className="bg-nofile-100 dark:bg-nofile-900/20 text-[10px] py-0 h-4 text-nofile-700 dark:text-nofile-300 border border-nofile-200 dark:border-nofile-800/30 flex items-center gap-0.5 px-1.5 rounded-full">
                                <Clock className="h-2.5 w-2.5 text-nofile-500 dark:text-nofile-400" />
                                <span>Attente: ~{estimatedWaitTime}min</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-3 pb-2 px-3">
                    {queueIsFull ? (
                        <div
                            className="p-3 rounded-lg bg-nofile-accent-50 dark:bg-nofile-accent-900/20 border border-nofile-accent-200 dark:border-nofile-accent-800/30 my-2"
                            style={{ transform: 'scale(1)', opacity: 1, transition: 'all 0.3s' }}
                        >
                            <div className="flex gap-2">
                                <AlertCircle className="h-4 w-4 text-nofile-accent-600 dark:text-nofile-accent-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-nofile-accent-700 dark:text-nofile-accent-300">
                                        File d'attente complète
                                    </p>
                                    <p className="text-xs text-nofile-accent-600/80 dark:text-nofile-accent-400/80 mt-1">
                                        Veuillez réessayer plus tard ou contacter le service client.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Nom (toujours visible et obligatoire) */}
                            <div className="opacity-100" style={getTransitionStyle(0.2)}>
                                <div className="mb-3">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                        Nom complet<span className="text-nofile-accent-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 flex justify-center">
                                            <User className="h-3.5 w-3.5 text-nofile-500 dark:text-nofile-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Votre nom et prénom"
                                            className={cn(
                                                'w-full pl-9 h-9 text-sm border border-gray-200 dark:border-gray-700 focus:ring-nofile-500 focus:border-nofile-500 outline-none rounded-md',
                                                duplicateCheck.field === 'name' && duplicateCheck.found &&
                                                'border-nofile-accent-500 focus:ring-nofile-accent-500 focus:border-nofile-accent-500'
                                            )}
                                            autoComplete="name"
                                        />
                                    </div>
                                    {duplicateCheck.field === 'name' && duplicateCheck.found && (
                                        <div className="p-1.5 rounded-md text-xs text-nofile-accent-500 flex items-start">
                                            <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                            <p>Ce nom exact est déjà présent dans la file d'attente</p>
                                        </div>
                                    )}
                                    {errors.name && (
                                        <p className="text-xs text-nofile-accent-500 mt-1">{errors.name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Options de notification */}
                            <div className="grid grid-cols-2 gap-2 opacity-100" style={getTransitionStyle(0.3)}>
                                <div
                                    className={cn(
                                        "flex flex-row items-start space-x-2 space-y-0 rounded-md p-2 border",
                                        formData.smsNotifications
                                            ? "border-nofile-100 dark:border-gray-800 bg-nofile-50 dark:bg-nofile-900/10"
                                            : "border-gray-200 dark:border-gray-800"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        id="smsNotifications"
                                        name="smsNotifications"
                                        checked={formData.smsNotifications}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-nofile-200 dark:border-gray-700 text-nofile-500 focus:ring-nofile-500"
                                    />
                                    <div className="space-y-0.5 leading-none">
                                        <label htmlFor="smsNotifications" className="text-xs font-medium cursor-pointer text-gray-800 dark:text-gray-200">
                                            SMS
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Notifications par SMS
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={cn(
                                        "flex flex-row items-start space-x-2 space-y-0 rounded-md p-2 border",
                                        formData.emailNotifications
                                            ? "border-nofile-100 dark:border-gray-800 bg-nofile-50 dark:bg-nofile-900/10"
                                            : "border-gray-200 dark:border-gray-800"
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        id="emailNotifications"
                                        name="emailNotifications"
                                        checked={formData.emailNotifications}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-nofile-500 focus:ring-nofile-500"
                                    />
                                    <div className="space-y-0.5 leading-none">
                                        <label htmlFor="emailNotifications" className="text-xs font-medium cursor-pointer text-gray-800 dark:text-gray-200">
                                            Email
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Notifications par email
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Téléphone (visible et obligatoire uniquement si SMS est coché) */}
                            {formData.smsNotifications && (
                                <div className="opacity-100" style={getTransitionStyle(0.4)}>
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                            Téléphone<span className="text-nofile-accent-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 flex justify-center">
                                                <Phone className="h-3.5 w-3.5 text-nofile-500 dark:text-nofile-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="06 12 34 56 78"
                                                className={cn(
                                                    'w-full pl-9 h-9 text-sm border border-gray-200 dark:border-gray-700 focus:ring-nofile-500 focus:border-nofile-500 outline-none rounded-md',
                                                    duplicateCheck.field === 'phone' && duplicateCheck.found &&
                                                    'border-nofile-accent-500 focus:ring-nofile-accent-500 focus:border-nofile-accent-500'
                                                )}
                                                maxLength={16}
                                                inputMode="tel"
                                                autoComplete="tel"
                                                aria-describedby="phone-tip"
                                            />
                                        </div>
                                        <div id="phone-tip" className="text-[10px] text-gray-500 mt-1 ml-1">
                                            Format: 06 XX XX XX XX ou +33 6 XX XX XX XX
                                        </div>
                                        {duplicateCheck.field === 'phone' && duplicateCheck.found && (
                                            <div className="p-1.5 rounded-md text-xs text-nofile-accent-500 flex items-start">
                                                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                                <p>Téléphone déjà dans la file d'attente</p>
                                            </div>
                                        )}
                                        {errors.phone && (
                                            <p className="text-xs text-nofile-accent-500 mt-1">{errors.phone}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Email (visible et obligatoire uniquement si Email est coché) */}
                            {formData.emailNotifications && (
                                <div className="opacity-100" style={getTransitionStyle(0.5)}>
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                            Email<span className="text-nofile-accent-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 flex justify-center">
                                                <Mail className="h-3.5 w-3.5 text-nofile-500 dark:text-nofile-400" />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="votre.email@exemple.com"
                                                className={cn(
                                                    'w-full pl-9 h-9 text-sm border border-gray-200 dark:border-gray-700 focus:ring-nofile-500 focus:border-nofile-500 outline-none rounded-md',
                                                    duplicateCheck.field === 'email' && duplicateCheck.found &&
                                                    'border-nofile-accent-500 focus:ring-nofile-accent-500 focus:border-nofile-accent-500'
                                                )}
                                                autoComplete="email"
                                            />
                                        </div>
                                        {duplicateCheck.field === 'email' && duplicateCheck.found && (
                                            <div className="p-1.5 rounded-md text-xs text-nofile-accent-500 flex items-start">
                                                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                                <p>Email déjà dans la file d'attente</p>
                                            </div>
                                        )}
                                        {errors.email && (
                                            <p className="text-xs text-nofile-accent-500 mt-1">{errors.email}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex px-0 pt-2 pb-0">
                                <div className="w-full opacity-100" style={getTransitionStyle(0.6)}>
                                    <button
                                        type="submit"
                                        className={cn(
                                            "w-full gap-2 h-9 text-sm font-medium rounded-md flex items-center justify-center",
                                            isSubmitting || duplicateCheck.found || duplicateCheck.checking || queueIsFull
                                                ? "bg-gray-400 dark:bg-gray-700 cursor-not-allowed text-white"
                                                : "bg-gradient-to-r from-nofile-500 to-nofile-600 hover:from-nofile-600 hover:to-nofile-700 text-white"
                                        )}
                                        disabled={
                                            isSubmitting ||
                                            duplicateCheck.found ||
                                            duplicateCheck.checking ||
                                            queueIsFull
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                                <span>Traitement...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-3.5 w-3.5 mr-2" />
                                                <span>Rejoindre la file d'attente</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Message d'erreur si aucune méthode de notification n'est sélectionnée */}
                                    {!formData.smsNotifications && !formData.emailNotifications && (
                                        <p className="text-xs text-nofile-accent-500 text-center mt-2">
                                            Veuillez sélectionner au moins une méthode de notification
                                        </p>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}