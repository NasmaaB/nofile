'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function ClientUrlUpdater() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [result, setResult] = useState<{
        success?: boolean;
        updated?: number;
        error?: string;
    } | null>(null);

    const updateClientUrls = async () => {
        try {
            setIsUpdating(true);
            setResult(null);

            // Récupérer les clients dont les URLs contiennent 'localhost:3000'
            const clientsRef = collection(db, 'clients');
            const clientsSnapshot = await getDocs(clientsRef);

            let updatedCount = 0;
            const updatePromises: Promise<void>[] = [];

            clientsSnapshot.forEach(docSnapshot => {
                const clientData = docSnapshot.data();
                let needsUpdate = false;
                const updatedData: Record<string, any> = {};

                // Vérifier les champs pouvant contenir des URLs
                if (clientData.cancelUrl && typeof clientData.cancelUrl === 'string' &&
                    clientData.cancelUrl.includes('localhost:3000')) {
                    updatedData.cancelUrl = clientData.cancelUrl.replace(/localhost:3000/g, 'localhost:3001');
                    needsUpdate = true;
                }

                if (clientData.notificationData && typeof clientData.notificationData === 'object') {
                    const notifData = clientData.notificationData;
                    let notifUpdated = false;

                    // Parcourir les propriétés de notificationData
                    for (const key in notifData) {
                        if (typeof notifData[key] === 'string' && notifData[key].includes('localhost:3000')) {
                            notifData[key] = notifData[key].replace(/localhost:3000/g, 'localhost:3001');
                            notifUpdated = true;
                        }
                    }

                    if (notifUpdated) {
                        updatedData.notificationData = notifData;
                        needsUpdate = true;
                    }
                }

                // Mettre à jour le document si nécessaire
                if (needsUpdate) {
                    updatePromises.push(updateDoc(doc(db, 'clients', docSnapshot.id), updatedData));
                    updatedCount++;
                }
            });

            await Promise.all(updatePromises);

            setResult({
                success: true,
                updated: updatedCount
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour des URLs:', error);
            setResult({
                success: false,
                updated: 0,
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Mise à jour des URLs clients</CardTitle>
                <CardDescription>
                    Met à jour toutes les URLs stockées dans les documents clients qui pointent vers localhost:3000
                    pour qu'elles pointent vers localhost:3001.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {result && (
                    <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <div className="flex items-center">
                            {result.success ? (
                                <CheckCircle className="h-5 w-5 mr-2" />
                            ) : (
                                <AlertCircle className="h-5 w-5 mr-2" />
                            )}
                            <h3 className="font-medium">
                                {result.success ? "Mise à jour réussie" : "Échec de la mise à jour"}
                            </h3>
                        </div>
                        <p className="mt-1 ml-7">
                            {result.success
                                ? `${result.updated} client(s) ont été mis à jour avec succès.`
                                : `Erreur: ${result.error}`}
                        </p>
                    </div>
                )}

                <Button
                    onClick={updateClientUrls}
                    disabled={isUpdating}
                    variant="outline"
                    className="w-full"
                >
                    {isUpdating ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Mise à jour des clients en cours...
                        </>
                    ) : (
                        "Mettre à jour les URLs des clients"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
} 