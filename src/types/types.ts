// Types pour l'application de file d'attente

export interface Queue {
    id: string;
    name: string;
    description?: string;
    maxClients?: number;
    averageServiceTime?: number;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
    ownerId: string;
    settings?: QueueSettings;
    stats?: {
        avgWaitTime: number;
        maxWaitTime: number;
        totalServed: number;
        canceledCount?: number;
    };
    currentToken?: number;
    dailyCounter?: number;
    resetDailyAt?: any;
    publicUrl?: string;
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: 'waiting' | 'served' | 'cancelled' | 'canceled' | 'no-show';
    queueId: string;
    position?: number;
    joinedAt: any;
    servedAt?: any;
    calledAt?: any; // Timestamp quand le client a été appelé
    waitTime?: number;
    estimatedWaitTime?: number;
    token?: string | number;
    secretKey?: string;
    notificationPreference?: 'sms' | 'email' | 'both' | 'none';
    clientUid?: string;
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface SMSMessage {
    id: string;
    clientId: string;
    queueId: string;
    phoneNumber: string;
    message: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: any; // Timestamp d'envoi
    createdAt: any; // Timestamp de création
}

export interface EmailMessage {
    id: string;
    clientId: string;
    queueId: string;
    email: string;
    subject: string;
    content: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: any; // Timestamp d'envoi
    createdAt: any; // Timestamp de création
}

export interface QueueStats {
    avgWaitTime?: number;
    maxWaitTime?: number;
    totalServed?: number;
    canceledCount?: number;
    totalClients?: number;
    waitingClients?: number;
    servedClients?: number;
    cancelledClients?: number;
    noShowClients?: number;
    averageWaitTime?: number;
    minWaitTime?: number;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'manager' | 'staff';
    createdAt: any;
    lastLoginAt?: any;
    isActive: boolean;
    subscription: 'free' | 'basic' | 'premium';
    uid?: string; // Firebase UID
}

export interface QueueSettings {
    allowSelfRegistration?: boolean;
    requireClientPhone?: boolean;
    requireClientEmail?: boolean;
    notifyNextClientInAdvance?: boolean;
    notifyAdvanceCount?: number;
    notificationType?: string[];
    autoIncrementToken?: boolean;
    displayEstimatedWaitTime?: boolean;
    tokenPrefix?: string;
    activeServers?: number; // Nombre de serveurs actifs pour le calcul du temps d'attente

    // Champs hérités de l'ancienne version
    allowWalkIn?: boolean;
    showEstimatedTime?: boolean;
    notifyByEmail?: boolean;
    notifyBySMS?: boolean;
    maxDailyClients?: number;
    closingTime?: string;
    openingTime?: string;
    closingMessage?: string;
}

export interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'checkbox';
    required: boolean;
    options?: string[]; // Pour le type 'select'
    placeholder?: string;
} 