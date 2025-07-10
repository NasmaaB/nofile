import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, secretKey, queueId } = body;

        // Validation des entrées
        if (!name || !secretKey || !queueId) {
            return NextResponse.json(
                { success: false, message: 'Tous les champs requis ne sont pas remplis' },
                { status: 400 }
            );
        }

        // Recherche du client avec ces informations
        const clientsCollection = collection(db, 'clients');
        const q = query(
            clientsCollection,
            where('name', '==', name),
            where('secretKey', '==', secretKey),
            where('queueId', '==', queueId),
            where('status', '==', 'waiting')
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json(
                { success: false, message: "Client non trouvé ou déjà désactivé" },
                { status: 404 }
            );
        }

        // On ne devrait avoir qu'un seul résultat, mais on traite le premier au cas où
        const clientDoc = querySnapshot.docs[0];
        const clientId = clientDoc.id;
        const clientData = clientDoc.data();

        // Mise à jour du statut du client
        const clientRef = doc(db, 'clients', clientId);
        await updateDoc(clientRef, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        });

        // Retourne le client mis à jour
        const updatedClient = {
            id: clientId,
            ...clientData,
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            message: "Client désinscrit avec succès",
            client: updatedClient
        });
    } catch (error) {
        console.error("Erreur lors de la désinscription du client:", error);
        return NextResponse.json(
            { success: false, message: "Erreur lors de la désinscription du client" },
            { status: 500 }
        );
    }
} 