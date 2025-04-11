/**
 * Interface pour les paramètres d'envoi de SMS
 */
export interface SMSParams {
    to: string;
    message: string;
}

/**
 * Envoie un SMS via l'API de messagerie
 * @param params Paramètres du SMS
 * @returns Promise qui se résout quand le SMS est envoyé
 */
export async function sendSMS(params: SMSParams): Promise<boolean> {
    try {
        const response = await fetch('/api/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Erreur lors de l\'envoi du SMS:', error);
        return false;
    }
} 