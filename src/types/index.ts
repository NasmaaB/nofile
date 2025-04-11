/**
 * Types définissant un client et une file d'attente
 */
import { Timestamp } from 'firebase/firestore';

export interface Queue {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    businessId?: string;
    status: 'active' | 'inactive' | 'archived';
    maxClients?: number;
    averageServiceTime?: number;
    createdAt: Date | Timestamp | number;
    updatedAt?: Date | Timestamp | number;
    isPublic?: boolean;
    notifyByEmail?: boolean;
    notifyBySMS?: boolean;
    notificationThreshold?: number;
    customFields?: CustomField[];
    settings?: QueueSettings;
    isActive?: boolean;
    currentToken?: number;
    dailyCounter?: number;
    resetDailyAt?: Date;
    publicUrl?: string;
    stats?: QueueStats;
}

export interface QueueSettings {
    welcomeMessage?: string;
    completionMessage?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    showEstimatedTime?: boolean;
    allowSelfCancel?: boolean;
    collectCustomerFeedback?: boolean;
    customerFeedbackQuestions?: string[];
    enableSmsNotifications?: boolean;
    enableEmailNotifications?: boolean;
    notifyOwnerOnJoin?: boolean;
    notifyOwnerOnCancel?: boolean;
    enableReservations?: boolean;
    reservationTimeSlots?: number;
    reservationDuration?: number;
    timezone?: string;
    allowSelfRegistration?: boolean;
    requireClientPhone?: boolean;
    requireClientEmail?: boolean;
    notifyNextClientInAdvance?: boolean;
    notifyAdvanceCount?: number;
    notificationType?: string[];
    autoIncrementToken?: boolean;
    displayEstimatedWaitTime?: boolean;
    tokenPrefix?: string;
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    queueId: string;
    position?: number;
    status: 'waiting' | 'served' | 'canceled' | 'no-show';
    token: string | number;
    secretKey?: string;
    clientUid?: string;
    createdAt: Date | Timestamp | number;
    updatedAt?: Date | Timestamp | number;
    servedAt?: Date | Timestamp | number;
    estimatedWaitTime?: number;
    actualWaitTime?: number;
    smsNotifications?: boolean;
    emailNotifications?: boolean;
    customFields?: Record<string, string | number | boolean>;
    feedback?: {
        rating?: number;
        comment?: string;
        givenAt?: Date | Timestamp | number;
    };
    notes?: string;
    calledAt?: Date | Timestamp | number;
}

export interface SMSMessage {
    to: string;
    message: string;
    from?: string;
    queueId?: string;
    clientId?: string;
    sentAt?: Date | Timestamp | number;
    status?: 'sent' | 'delivered' | 'failed';
    messageId?: string;
    errorMessage?: string;
}

export interface EmailMessage {
    to: string;
    subject: string;
    text: string;
    html?: string;
    from?: string;
    queueId?: string;
    clientId?: string;
    sentAt?: Date | Timestamp | number;
    status?: 'sent' | 'delivered' | 'failed';
    messageId?: string;
    errorMessage?: string;
}

export interface QueueStats {
    totalClients?: number;
    servedClients?: number;
    cancelledClients?: number;
    noShowClients?: number;
    averageWaitTime?: number;
    maxWaitTime?: number;
    minWaitTime?: number;
    peakHours?: Record<string, number>;
    clientsPerDay?: Record<string, number>;
    clientsPerHour?: Record<string, number>;
    averageServiceTime?: number;
    avgWaitTime?: number;
    totalServed?: number;
    canceledCount?: number;
}

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    role: 'admin' | 'manager' | 'staff';
    businessId?: string;
    createdAt: Date | Timestamp | number;
    updatedAt?: Date | Timestamp | number;
    lastLoginAt?: Date | Timestamp | number;
    photoURL?: string;
    subscription?: 'free' | 'basic' | 'premium';
    settings?: {
        theme?: 'light' | 'dark' | 'system';
        notifications?: {
            email?: boolean;
            push?: boolean;
            sms?: boolean;
        };
    };
}

export interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'date';
    required: boolean;
    placeholder?: string;
    options?: string[];
    defaultValue?: string | number | boolean;
    order?: number;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}
