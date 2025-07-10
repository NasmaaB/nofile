import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

/**
 * Met à jour toutes les URLs des files d'attente qui pointent vers localhost:3000
 * pour qu'elles pointent vers localhost:3001
 */
export async function updateQueueUrls(): Promise<{ success: boolean, updated: number, error?: string }> {
    try {
        const queuesRef = collection(db, 'queues');
        const queuesSnapshot = await getDocs(queuesRef);

        let updatedCount = 0;

        // Parcourir toutes les files d'attente
        const updatePromises = queuesSnapshot.docs.map(async (docSnapshot) => {
            const queueData = docSnapshot.data();

            // Vérifier si l'URL publique contient localhost:3000
            if (queueData.publicUrl && queueData.publicUrl.includes('localhost:3000')) {
                // Remplacer localhost:3000 par localhost:3001
                const updatedUrl = queueData.publicUrl.replace('localhost:3000', 'localhost:3001');

                // Mettre à jour le document
                await updateDoc(doc(db, 'queues', docSnapshot.id), {
                    publicUrl: updatedUrl
                });

                updatedCount++;
            }
        });

        // Attendre que toutes les mises à jour soient terminées
        await Promise.all(updatePromises);

        return {
            success: true,
            updated: updatedCount
        };
    } catch (error) {
        console.error('Erreur lors de la mise à jour des URLs:', error);
        return {
            success: false,
            updated: 0,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        };
    }
} 