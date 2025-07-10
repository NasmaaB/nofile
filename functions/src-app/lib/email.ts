/**
 * Interface pour les paramètres d'envoi d'email
 */
export interface EmailParams {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

/**
 * Envoie un email via l'API de messagerie
 * @param params Paramètres de l'email
 * @returns Promise qui se résout avec un booléen indiquant le succès
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
    try {
        const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        return false;
    }
} 