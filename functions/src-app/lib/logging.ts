/**
 * Fonctions utilitaires pour la journalisation des erreurs
 */

/**
 * Journalise une erreur avec des informations supplémentaires
 * @param error L'erreur à journaliser
 * @param context Contexte optionnel pour l'erreur
 */
export function logError(error: any, context?: string): void {
    if (context) {
        console.error(`Erreur dans ${context}:`, error);
    } else {
        console.error('Erreur:', error);
    }
}

/**
 * Journalise un avertissement avec des informations supplémentaires
 * @param message Message d'avertissement
 * @param context Contexte optionnel pour l'avertissement
 */
export function logWarning(message: string, context?: string): void {
    if (context) {
        console.warn(`Avertissement dans ${context}:`, message);
    } else {
        console.warn('Avertissement:', message);
    }
}

/**
 * Journalise une information avec un contexte optionnel
 * @param message Message d'information
 * @param context Contexte optionnel pour l'information
 */
export function logInfo(message: string, context?: string): void {
    if (context) {
        console.info(`Info dans ${context}:`, message);
    } else {
        console.info('Info:', message);
    }
} 