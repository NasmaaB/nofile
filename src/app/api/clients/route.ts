import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            phone,
            queueId,
            position,
            token,
            secretKey,
            smsNotifications,
            emailNotifications,
            estimatedWaitTime
        } = body;

        console.log("Données reçues:", {
            name, email, phone, queueId,
            smsNotifications, emailNotifications
        });

        // Validation de base - nom et queueId sont toujours requis
        if (!name || !queueId) {
            return NextResponse.json(
                { success: false, message: 'Le nom et l\'identifiant de file sont requis' },
                { status: 400 }
            );
        }

        // Validation conditionnelle pour email et téléphone selon options de notification
        if (smsNotifications && !phone) {
            return NextResponse.json(
                { success: false, message: 'Le numéro de téléphone est requis quand les notifications SMS sont activées' },
                { status: 400 }
            );
        }

        if (emailNotifications && !email) {
            return NextResponse.json(
                { success: false, message: 'L\'email est requis quand les notifications email sont activées' },
                { status: 400 }
            );
        }

        // Au moins une méthode de notification doit être activée
        if (!smsNotifications && !emailNotifications) {
            return NextResponse.json(
                { success: false, message: 'Au moins une méthode de notification doit être activée' },
                { status: 400 }
            );
        }

        // Vérification que la file d'attente existe
        try {
            const queueRef = doc(db, 'queues', queueId);
            const queueSnap = await getDoc(queueRef);

            if (!queueSnap.exists()) {
                return NextResponse.json(
                    { success: false, message: "La file d'attente spécifiée n'existe pas" },
                    { status: 404 }
                );
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de la file d'attente:", error);
            return NextResponse.json(
                { success: false, message: "Erreur lors de la vérification de la file d'attente" },
                { status: 500 }
            );
        }

        // Création du client dans Firestore
        const clientData = {
            name,
            email: email || "",  // Valeur par défaut si null
            phone: phone || "",  // Valeur par défaut si null
            queueId,
            position,
            token,
            secretKey,
            smsNotifications: Boolean(smsNotifications),
            emailNotifications: Boolean(emailNotifications),
            estimatedWaitTime,
            status: 'waiting',
            createdAt: new Date().toISOString(),
        };

        console.log("Ajout d'un nouveau client:", clientData);

        const clientsCollection = collection(db, 'clients');
        const docRef = await addDoc(clientsCollection, clientData);

        // Récupérer l'ID généré et ajouter le document complet
        const newClient = {
            id: docRef.id,
            ...clientData
        };

        return NextResponse.json({
            success: true,
            message: "Client ajouté avec succès à la file d'attente",
            client: newClient
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout du client:", error);
        return NextResponse.json(
            { success: false, message: "Erreur lors de l'ajout du client" },
            { status: 500 }
        );
    }
} 