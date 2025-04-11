'use client';

import { useState } from 'react';
import { updateQueueUrls } from '@/lib/update-urls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { ClientUrlUpdater } from '@/components/client-updater';

export default function UpdateUrlsPage() {
    const [isUpdating, setIsUpdating] = useState(false);
    const [result, setResult] = useState<{
        success?: boolean;
        updated?: number;
        error?: string;
    } | null>(null);

    const handleUpdateUrls = async () => {
        setIsUpdating(true);
        try {
            const updateResult = await updateQueueUrls();
            setResult(updateResult);
        } catch (error) {
            setResult({
                success: false,
                error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Outils de correction d'URL</h1>
            <p className="mb-4 text-muted-foreground">
                Ces outils vous permettent de corriger les URLs qui pointent vers localhost:3000 au lieu de localhost:3001
                dans votre base de données Firestore.
            </p>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Mise à jour des URLs de files d'attente</CardTitle>
                    <CardDescription>
                        Cet outil mettra à jour toutes les URLs dans les documents de files d'attente qui pointent vers localhost:3000
                        pour qu'elles pointent vers localhost:3001.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Cette action est irréversible et modifiera directement les données dans Firestore.
                        Assurez-vous d'avoir une sauvegarde de vos données avant de continuer.
                    </p>

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
                                    ? `${result.updated} URL(s) ont été mises à jour avec succès.`
                                    : `Erreur: ${result.error}`}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpdateUrls}
                            disabled={isUpdating}
                            variant="default"
                        >
                            {isUpdating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Mise à jour en cours...
                                </>
                            ) : (
                                "Mettre à jour les URLs des files d'attente"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ClientUrlUpdater />
        </div>
    );
} 