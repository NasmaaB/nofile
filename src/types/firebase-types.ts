// src/types/firebase-types.ts
import { Timestamp as FirebaseTimestamp } from "firebase/firestore";

// Exportez à nouveau Timestamp pour plus de clarté
export { FirebaseTimestamp as Timestamp };

// Fonction helper pour travailler avec les Timestamp
export const toDate = (timestamp: FirebaseTimestamp | Date | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Date) return timestamp;
    return timestamp.toDate();
};

export const fromDate = (date: Date | undefined): FirebaseTimestamp | undefined => {
    if (!date) return undefined;
    return FirebaseTimestamp.fromDate(date);
};

// Type qui représente explicitement les deux possibilités
export type TimestampType = FirebaseTimestamp | Date;