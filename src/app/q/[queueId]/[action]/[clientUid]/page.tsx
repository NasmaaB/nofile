'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingSpinner from '@/components/common/loading-spinner';

export default function ClientActionPage() {
    const router = useRouter();
    const params = useParams();

    const queueId = params.queueId as string;
    const action = params.action as string;
    const clientUid = params.clientUid as string;

    useEffect(() => {
        // Rediriger vers la page principale avec les paramètres appropriés
        if (action === 'cancel' && clientUid) {
            router.push(`/q/${queueId}?action=cancel&clientUid=${clientUid}`);
        } else {
            router.push(`/q/${queueId}`);
        }
    }, [queueId, action, clientUid, router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <LoadingSpinner size="lg" text="Redirection en cours..." />
        </div>
    );
} 