import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, RefreshCcw, Info } from 'lucide-react'
import { useQueue } from '@/context/queue-context'
import { Client } from '@/types'
import { getWaitTimeColor } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface WaitingTimeEstimateProps {
    client?: Client
    position?: number
    className?: string
    showRefreshButton?: boolean
    showDetails?: boolean
}

/**
 * Composant pour afficher le temps d'attente estimé.
 * Peut afficher le temps pour un client spécifique ou pour une position donnée.
 */
export default function WaitingTimeEstimate({
    client,
    position,
    className = '',
    showRefreshButton = true,
    showDetails = true
}: WaitingTimeEstimateProps) {
    const { currentQueue, updateWaitingTimesEstimates } = useQueue()
    const [updating, setUpdating] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

    // Si client est fourni, utiliser son estimatedWaitTime et sa position
    const waitTime = client?.estimatedWaitTime || 0
    const displayPosition = client?.position || position || 0

    // Déterminer la couleur en fonction du temps d'attente
    const timeColor = getWaitTimeColor(waitTime)

    // Formater le temps d'attente de manière plus lisible
    const formatWaitTime = (minutes: number): string => {
        if (minutes < 1) return "Moins d'une minute";
        if (minutes < 60) return `~${minutes} minute${minutes > 1 ? 's' : ''}`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (remainingMinutes === 0) {
            return `~${hours} heure${hours > 1 ? 's' : ''}`;
        }

        return `~${hours}h${remainingMinutes}`;
    };

    // Calculer le temps restant (mise à jour en temps réel)
    useEffect(() => {
        if (!client || client.estimatedWaitTime === undefined || !client.updatedAt) return;

        const updateTimeRemaining = () => {
            const updateTimestamp = client.updatedAt ? new Date((client.updatedAt as any).seconds * 1000) : new Date();
            const now = new Date();
            const elapsedMinutes = Math.floor((now.getTime() - updateTimestamp.getTime()) / 60000);

            // Ne pas afficher de valeurs négatives
            // On peut faire cette assertion car on a déjà vérifié que estimatedWaitTime est défini
            const remaining = Math.max(0, client.estimatedWaitTime! - elapsedMinutes);
            setTimeRemaining(remaining);
        };

        // Mise à jour initiale
        updateTimeRemaining();

        // Mise à jour toutes les minutes
        const interval = setInterval(updateTimeRemaining, 60000);
        return () => clearInterval(interval);
    }, [client]);

    // Rafraîchir les estimations de temps d'attente
    const handleRefresh = async () => {
        setUpdating(true)
        try {
            await updateWaitingTimesEstimates()
            setLastUpdated(new Date())
        } catch (error) {
            console.error("Erreur lors de la mise à jour des temps d'attente", error)
        } finally {
            setTimeout(() => setUpdating(false), 1000) // Donner un retour visuel
        }
    }

    // Mise à jour automatique toutes les 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            updateWaitingTimesEstimates()
            setLastUpdated(new Date())
        }, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [updateWaitingTimesEstimates])

    return (
        <Card className={`overflow-hidden ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Temps d'attente estimé
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-sm">
                                <p>Cette estimation est basée sur le temps moyen de service par client et votre position dans la file. Elle est mise à jour régulièrement mais peut varier.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
                <CardDescription>
                    {displayPosition > 0 && `Position dans la file: ${displayPosition}`}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                        <div className="text-3xl font-bold tracking-tight">
                            <span className={timeColor}>
                                {formatWaitTime(timeRemaining !== null ? timeRemaining : waitTime)}
                            </span>
                        </div>

                        {showDetails && currentQueue?.averageServiceTime && (
                            <div className="text-sm text-muted-foreground">
                                Temps moyen par client: {currentQueue.averageServiceTime} min
                            </div>
                        )}
                    </div>

                    {displayPosition > 1 && showDetails && (
                        <div className="text-sm text-muted-foreground">
                            {displayPosition > 3
                                ? `Il y a ${displayPosition - 1} personnes avant vous`
                                : `Il y a ${displayPosition - 1} personne${displayPosition > 2 ? 's' : ''} avant vous`}
                        </div>
                    )}

                    {lastUpdated && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </CardContent>

            {showRefreshButton && (
                <CardFooter className="pt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={updating}
                        className="w-full"
                    >
                        <RefreshCcw className={`mr-2 h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
                        {updating ? 'Mise à jour...' : 'Actualiser l\'estimation'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
} 