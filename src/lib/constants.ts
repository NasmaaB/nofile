// Forfaits d'abonnement
export const SUBSCRIPTION_TIERS = {
    FREE: 'free',
    BASIC: 'basic',
    PREMIUM: 'premium'
};

// Limites de chaque forfait
export const SUBSCRIPTION_LIMITS = {
    [SUBSCRIPTION_TIERS.FREE]: {
        maxQueues: 1,
        maxClientsPerDay: 20,
        maxUsers: 1,
        features: ['basic_queue', 'basic_stats']
    },
    [SUBSCRIPTION_TIERS.BASIC]: {
        maxQueues: 3,
        maxClientsPerDay: 100,
        maxUsers: 3,
        features: ['basic_queue', 'advanced_queue', 'sms_notifications', 'basic_stats', 'qr_code']
    },
    [SUBSCRIPTION_TIERS.PREMIUM]: {
        maxQueues: -1, // Illimité
        maxClientsPerDay: -1, // Illimité
        maxUsers: -1, // Illimité
        features: ['all']
    }
};

// Tarifs
export const SUBSCRIPTION_PRICES = {
    [SUBSCRIPTION_TIERS.FREE]: 0,
    [SUBSCRIPTION_TIERS.BASIC]: 29,
    [SUBSCRIPTION_TIERS.PREMIUM]: 89
};

// Fonctionnalités
export const FEATURES = {
    basic_queue: 'Gestion de file d\'attente basique',
    advanced_queue: 'Configuration avancée des files',
    sms_notifications: 'Notifications SMS',
    basic_stats: 'Statistiques basiques',
    advanced_stats: 'Statistiques avancées et rapports',
    qr_code: 'QR Code pour inscription autonome',
    multi_user: 'Utilisateurs multiples',
    api_access: 'Accès API',
    white_label: 'Version sans marque',
    email_notifications: 'Notifications par e-mail',
    custom_branding: 'Personnalisation de marque',
    priority_support: 'Support prioritaire'
};

// Statuts des clients
export const CLIENT_STATUS = {
    WAITING: 'waiting',
    SERVING: 'serving',
    SERVED: 'served',
    CANCELED: 'canceled',
    NO_SHOW: 'no-show'
};

// Types de notifications
export const NOTIFICATION_TYPES = {
    SMS: 'sms',
    EMAIL: 'email',
    SYSTEM: 'system'
};

// Messages d'erreur communs
export const ERROR_MESSAGES = {
    QUEUE_LIMIT_REACHED: 'Vous avez atteint la limite de files d\'attente de votre abonnement.',
    CLIENT_LIMIT_REACHED: 'Vous avez atteint la limite de clients quotidienne pour cette file d\'attente.',
    INVALID_PHONE: 'Le numéro de téléphone est invalide.',
    QUEUE_NOT_FOUND: 'File d\'attente introuvable.',
    CLIENT_NOT_FOUND: 'Client introuvable.',
    NOT_AUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action.',
    SMS_FAILED: 'Échec de l\'envoi du SMS.',
    QUEUE_INACTIVE: 'Cette file d\'attente est actuellement inactive.'
};

// Thèmes de couleur pour les QR codes
export const QR_CODE_THEMES = [
    { name: 'Classique', bg: '#FFFFFF', fg: '#000000' },
    { name: 'NoFile', bg: '#FFFFFF', fg: '#0CA5E9' },
    { name: 'Accentué', bg: '#FFFFFF', fg: '#F43F5E' },
    { name: 'Sombre', bg: '#1F2937', fg: '#FFFFFF' },
    { name: 'Foncé', bg: '#000000', fg: '#FFFFFF' }
];

// Niveaux de correction d'erreur QR
export const QR_CODE_ERROR_CORRECTION_LEVELS = [
    { value: 'L', label: 'Faible (7%)' },
    { value: 'M', label: 'Medium (15%)' },
    { value: 'Q', label: 'Qualité (25%)' },
    { value: 'H', label: 'Haute (30%)' }
];