import { useCallback } from 'react';
import { useAuth } from './use-auth';
import { SUBSCRIPTION_LIMITS, SUBSCRIPTION_TIERS, SUBSCRIPTION_PRICES } from '@/lib/constants';
import { Subscription } from '@/types';

export const useSubscription = () => {
    const { user, updateUserProfile } = useAuth();

    const currentTier = user?.subscription || SUBSCRIPTION_TIERS.FREE;

    // Obtenir les limites du forfait actuel
    const getCurrentLimits = useCallback(() => {
        return SUBSCRIPTION_LIMITS[currentTier as 'free' | 'basic' | 'premium'];
    }, [currentTier]);

    // Vérifier si l'utilisateur peut effectuer une action en fonction de son forfait
    const canUseFeature = useCallback((feature: string): boolean => {
        const limits = getCurrentLimits();

        if (limits.features.includes('all')) {
            return true;
        }

        return limits.features.includes(feature);
    }, [getCurrentLimits]);

    // Vérifier si l'utilisateur a atteint sa limite de files d'attente
    const hasReachedQueueLimit = useCallback((currentQueueCount: number): boolean => {
        const limits = getCurrentLimits();

        // -1 signifie illimité
        if (limits.maxQueues === -1) {
            return false;
        }

        return currentQueueCount >= limits.maxQueues;
    }, [getCurrentLimits]);

    // Vérifier si l'utilisateur a atteint sa limite de clients par jour
    const hasReachedClientLimit = useCallback((currentClientCount: number): boolean => {
        const limits = getCurrentLimits();

        // -1 signifie illimité
        if (limits.maxClientsPerDay === -1) {
            return false;
        }

        return currentClientCount >= limits.maxClientsPerDay;
    }, [getCurrentLimits]);

    // Mettre à jour l'abonnement de l'utilisateur
    const updateSubscription = useCallback(async (newTier: 'free' | 'basic' | 'premium'): Promise<void> => {
        if (!user) {
            throw new Error('Utilisateur non connecté');
        }

        // Dans une application réelle, il y aurait une intégration de paiement ici
        await updateUserProfile({
            subscription: newTier,
            subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 jours
        });
    }, [user, updateUserProfile]);

    return {
        currentTier,
        currentLimits: getCurrentLimits(),
        prices: SUBSCRIPTION_PRICES,
        canUseFeature,
        hasReachedQueueLimit,
        hasReachedClientLimit,
        updateSubscription
    };
};

export default useSubscription;