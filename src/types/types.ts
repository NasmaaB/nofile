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
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: 'waiting' | 'served' | 'cancelled' | 'no-show';
    queueId: string;
    position?: number;
    joinedAt: any;
    servedAt?: any;
    waitTime?: number;
    estimatedWaitTime?: number;
    token?: number;
    secretKey?: string;
    notificationPreference?: 'sms' | 'email' | 'both' | 'none';
    clientUid?: string;
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
    totalClients: number;
    waitingClients: number;
    servedClients: number;
    cancelledClients: number;
    noShowClients: number;
    averageWaitTime: number;
    maxWaitTime: number;
    minWaitTime: number;
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
}

export interface QueueSettings {
    allowWalkIn: boolean;
    showEstimatedTime: boolean;
    notifyByEmail: boolean;
    notifyBySMS: boolean;
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