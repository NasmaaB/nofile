import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInMinutes } from "date-fns"
import { fr } from "date-fns/locale"

// Exporter la fonction differenceInMinutes pour qu'elle soit accessible
export { differenceInMinutes }

/**
 * Combine les classes CSS avec clsx et tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Génère un ID unique
 */
export function generateId(prefix: string = ''): string {
    return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
}

// Dans votre fichier utils.ts
export function toDate(timestamp: any): Date | null {
    if (!timestamp) return null;

    // Si c'est déjà une Date
    if (timestamp instanceof Date) {
        return timestamp;
    }

    // Si c'est un nombre (timestamp UNIX en ms)
    if (typeof timestamp === 'number') {
        return new Date(timestamp);
    }

    // Si c'est un objet Timestamp Firebase
    if (typeof timestamp === 'object') {
        // Vérifier si c'est un Timestamp Firebase avec méthode toDate()
        if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }

        // Vérifier si c'est un objet avec seconds (format Timestamp sérialisé)
        if ('seconds' in timestamp && typeof timestamp.seconds === 'number') {
            // Si nanoseconds est disponible, l'utiliser pour plus de précision
            if ('nanoseconds' in timestamp && typeof timestamp.nanoseconds === 'number') {
                return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
            }
            return new Date(timestamp.seconds * 1000);
        }
    }

    // Si c'est une chaîne ou autre chose, essayer de convertir
    try {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
    } catch (e) {
        console.error('Format de date invalide:', timestamp);
        return null;
    }
}

/**
 * Formate une date en format lisible
 */
export function formatDate(date: Date | string | number | any, pattern: string = 'dd/MM/yyyy'): string {
    if (!date) return '';

    let dateObj: Date;
    try {
        if (date instanceof Date) {
            dateObj = date;
        } else if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
            // C'est un Timestamp de Firebase
            dateObj = date.toDate();
        } else if (typeof date === 'object' && 'seconds' in date && typeof date.seconds === 'number') {
            // C'est un objet Timestamp-like avec seconds
            dateObj = new Date(date.seconds * 1000);
        } else {
            // C'est une chaîne ou un nombre
            dateObj = new Date(date);
        }

        if (isNaN(dateObj.getTime())) {
            console.warn('Date invalide:', date);
            return '';
        }

        return format(dateObj, pattern, { locale: fr });
    } catch (error) {
        console.error('Erreur lors du formatage de la date:', error, date);
        return '';
    }
}

/**
 * Calcule le temps relatif depuis une date
 */
export function timeAgo(date: Date | string | number | any): string {
    if (!date) return '';

    let dateObj: Date;
    try {
        if (date instanceof Date) {
            dateObj = date;
        } else if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
            // C'est un Timestamp de Firebase
            dateObj = date.toDate();
        } else if (typeof date === 'object' && 'seconds' in date && typeof date.seconds === 'number') {
            // C'est un objet Timestamp-like avec seconds
            dateObj = new Date(date.seconds * 1000);
        } else {
            // C'est une chaîne ou un nombre
            dateObj = new Date(date);
        }

        if (isNaN(dateObj.getTime())) {
            console.warn('Date invalide pour timeAgo:', date);
            return '';
        }

        return formatDistanceToNow(dateObj, { addSuffix: true, locale: fr });
    } catch (error) {
        console.error('Erreur lors du calcul du temps relatif:', error, date);
        return '';
    }
}

/**
 * Calcule le temps d'attente estimé en minutes pour un client en fonction de sa position
 * @param position - La position du client dans la file d'attente
 * @param averageServiceTime - Le temps moyen de service en minutes
 * @param activeServers - Le nombre de serveurs actifs (default: 1)
 * @param recentServiceTimes - Les temps de service récents pour ajuster l'estimation (optional)
 * @param queueSize - Le nombre total de clients en attente (optional)
 * @returns Temps d'attente estimé en minutes
 */
export function calculateWaitingTime(
    position: number,
    averageServiceTime: number = 5,
    activeServers: number = 1,
    recentServiceTimes?: number[],
    queueSize?: number
): number {
    // Valeur par défaut si aucun temps moyen n'est défini
    const baseServiceTime = Math.max(1, averageServiceTime || 5);

    // Utiliser le nombre effectif de serveurs actifs (minimum 1)
    const effectiveServers = Math.max(1, activeServers);

    // Calculer la position effective basée sur le nombre de serveurs
    // Par exemple, avec 2 serveurs, le client en position 3 sera servi après le premier client
    const effectivePosition = Math.ceil(position / effectiveServers);

    let adjustedServiceTime = baseServiceTime;

    // Ajuster le temps de service en fonction des données récentes si disponibles
    if (recentServiceTimes && recentServiceTimes.length > 0) {
        // Filtrer les valeurs aberrantes (méthode IQR)
        const sortedTimes = [...recentServiceTimes].sort((a, b) => a - b);
        const q1Index = Math.floor(sortedTimes.length * 0.25);
        const q3Index = Math.floor(sortedTimes.length * 0.75);
        const q1 = sortedTimes[q1Index];
        const q3 = sortedTimes[q3Index];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        // Filtrer les temps de service dans les limites acceptables
        const filteredTimes = sortedTimes.filter(
            time => time >= Math.max(1, lowerBound) && time <= Math.min(60, upperBound)
        );

        if (filteredTimes.length > 0) {
            // Calculer la moyenne des temps filtrés
            const sum = filteredTimes.reduce((acc, time) => acc + time, 0);
            const recentAverage = sum / filteredTimes.length;

            // Combiner le temps moyen historique avec les données récentes
            // Donner plus de poids aux données récentes (70%)
            adjustedServiceTime = baseServiceTime * 0.3 + recentAverage * 0.7;
        }
    }

    // Facteur d'ajustement basé sur la position
    // Les clients plus loin dans la file ont souvent des temps d'attente plus longs que proportionnels
    let positionFactor = 1.0;
    if (effectivePosition > 5) {
        // Augmenter légèrement le facteur pour les positions éloignées
        positionFactor = 1.0 + Math.min(0.2, (effectivePosition - 5) * 0.02);
    }

    // Facteur de charge basé sur la taille de la file
    let loadFactor = 1.0;
    if (queueSize && queueSize > 10) {
        // Les files plus grandes peuvent entraîner des ralentissements
        loadFactor = 1.0 + Math.min(0.3, (queueSize - 10) * 0.015);
    }

    // Calculer le temps d'attente estimé
    let estimatedWaitTime = effectivePosition * adjustedServiceTime * positionFactor * loadFactor;

    // Arrondir à l'entier le plus proche et assurer un minimum d'une minute
    return Math.max(1, Math.round(estimatedWaitTime));
}

// Fonction d'aide pour calculer l'écart-type
function getStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => {
        const diff = value - avg;
        return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
}

/**
 * Vérifie si une chaîne est un email valide
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Vérifie si une chaîne est un numéro de téléphone valide
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/
    return phoneRegex.test(phone)
}

/**
 * Formate un numéro de téléphone pour l'affichage
 */
export function formatPhoneNumber(phone: string): string {
    if (!phone) return ''

    // Supprime tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '')

    // Format international : +XX XXX XXX XXX
    if (cleaned.length > 10) {
        return `+${cleaned.substring(0, cleaned.length - 9)} ${cleaned.substring(cleaned.length - 9, cleaned.length - 6)} ${cleaned.substring(cleaned.length - 6, cleaned.length - 3)} ${cleaned.substring(cleaned.length - 3)}`
    }

    // Format français : 06 XX XX XX XX
    if (cleaned.length === 10) {
        return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`
    }

    return phone
}

/**
 * Tronque le texte à une certaine longueur
 */
export function truncateText(text: string, maxLength: number = 100): string {
    if (!text || text.length <= maxLength) return text
    return `${text.substring(0, maxLength)}...`
}

/**
 * Convertit un objet Firestore Timestamp en Date
 */
export function timestampToDate(timestamp: any): Date | null {
    if (!timestamp) return null;

    try {
        if (timestamp instanceof Date) return timestamp;

        if (typeof timestamp === 'number') return new Date(timestamp);

        if (typeof timestamp === 'object') {
            if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
                return timestamp.toDate();
            }

            if ('seconds' in timestamp && typeof timestamp.seconds === 'number') {
                return new Date(timestamp.seconds * 1000);
            }
        }

        // Essayer comme chaîne de caractères ou autre format
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.error('Erreur lors de la conversion de timestamp en date:', error, timestamp);
        return null;
    }
}

/**
 * Détermine la couleur en fonction du temps d'attente
 */
export function getWaitTimeColor(minutes: number): string {
    if (minutes <= 5) return 'text-green-500'
    if (minutes <= 15) return 'text-yellow-500'
    return 'text-red-500'
}

/**
 * Calcule les statistiques de queue
 */
export function calculateQueueStats(
    queue: { createdAt: any; servedAt?: any }[]
): { avgWaitTime: number; maxWaitTime: number; totalServed: number } {
    const served = queue.filter(item => item.servedAt)

    if (served.length === 0) {
        return { avgWaitTime: 0, maxWaitTime: 0, totalServed: 0 }
    }

    const waitTimes = served.map(item => {
        const createdDate = timestampToDate(item.createdAt)
        const servedDate = timestampToDate(item.servedAt)

        if (!createdDate || !servedDate) return 0
        return differenceInMinutes(servedDate, createdDate)
    })

    const totalWaitTime = waitTimes.reduce((sum, time) => sum + time, 0)
    const avgWaitTime = Math.round(totalWaitTime / served.length)
    const maxWaitTime = Math.max(...waitTimes)

    return {
        avgWaitTime,
        maxWaitTime,
        totalServed: served.length
    }
}

/**
 * Obtient le titre de la page en fonction du chemin
 */
export function getPageTitle(pathname: string): string {
    const routes: Record<string, string> = {
        '/dashboard': 'Tableau de bord',
        '/dashboard/clients': 'Clients',
        // '/dashboard/clients/add': 'Ajouter un client',
        '/dashboard/queues': "Files d'attente",
        '/dashboard/queues/create': 'Créer une file',
        '/dashboard/statistics': 'Statistiques',
        '/dashboard/settings': 'Paramètres',
        '/dashboard/profile': 'Mon profil',
        '/dashboard/subscription': 'Abonnement',
        '/dashboard/notifications': 'Notifications'
    };

    // Pour les pages dynamiques avec des ID
    if (pathname.match(/^\/dashboard\/clients\/[^/]+$/)) {
        return 'Détails du client';
    }
    if (pathname.match(/^\/dashboard\/queues\/[^/]+$/)) {
        return "Détails de la file";
    }

    return routes[pathname] || 'Page introuvable';
}

/**
 * Génère un identifiant unique pour un client
 * Utilise un préfixe optionnel, un timestamp et une chaîne aléatoire
 */
export function generateUniqueId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `${prefix}${timestamp}-${randomStr}`;
}