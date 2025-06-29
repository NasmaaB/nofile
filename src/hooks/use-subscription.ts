import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

// Types pour les abonnements
export type SubscriptionTier = 'free' | 'basic' | 'premium';

// Structure des limites par abonnement
interface SubscriptionLimits {
    maxQueues: number;
    maxClientsPerDay: number;
    maxUsers: number;
    features: string[];
}

// Définition des prix par niveau d'abonnement
const SUBSCRIPTION_PRICES: Record<string, number> = {
    basic: 9.99,
    premium: 29.99,
};

// Définition des limites par niveau d'abonnement
const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
        maxQueues: 1,
        maxClientsPerDay: 20,
        maxUsers: 1,
        features: ['basic'],
    },
    basic: {
        maxQueues: 3,
        maxClientsPerDay: 100,
        maxUsers: 3,
        features: ['basic', 'sms', 'statistics'],
    },
    premium: {
        maxQueues: Infinity,
        maxClientsPerDay: Infinity,
        maxUsers: Infinity,
        features: ['basic', 'sms', 'statistics', 'api', 'priority-support'],
    },
};

export function useSubscription() {
    const { user, updateUserProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Récupérer le niveau d'abonnement actuel
    const currentTier = (user?.subscription as SubscriptionTier) || 'free';
    const currentLimits = SUBSCRIPTION_LIMITS[currentTier];

    // Vérifier si l'abonnement actuel inclut une fonctionnalité spécifique
    const canUseFeature = (feature: string): boolean => {
        return currentLimits.features.includes(feature);
    };

    // Vérifier si l'utilisateur a atteint la limite de files d'attente
    const hasReachedQueueLimit = (currentQueueCount: number): boolean => {
        return currentQueueCount >= currentLimits.maxQueues;
    };

    // Vérifier si l'utilisateur a atteint la limite de clients par jour
    const hasReachedClientLimit = (currentClientCount: number): boolean => {
        return currentClientCount >= currentLimits.maxClientsPerDay;
    };

    // Mettre à jour l'abonnement de l'utilisateur
    const updateSubscription = async (newTier: SubscriptionTier): Promise<void> => {
        try {
            setLoading(true);
            // Utiliser updateUserProfile avec seulement la propriété subscription
            await updateUserProfile({
                subscription: newTier,
                // La date d'expiration sera gérée côté API ou UI si nécessaire
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
            setError('Erreur lors de la mise à jour de l\'abonnement');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Vérifier si l'utilisateur a un abonnement actif
    const hasActiveSubscription = currentTier !== 'free';

    // Mettre à jour l'état de chargement lorsque les données de l'utilisateur sont disponibles
    useEffect(() => {
        if (user) {
            setLoading(false);
        }
    }, [user]);

    return {
        currentTier,
        currentLimits,
        prices: SUBSCRIPTION_PRICES,
        canUseFeature,
        hasReachedQueueLimit,
        hasReachedClientLimit,
        updateSubscription,
        hasActiveSubscription,
        loading,
        error,
    };
}

export default useSubscription;