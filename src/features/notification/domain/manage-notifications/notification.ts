/**
 * Notification Entity
 * Représente une notification dans le système
 */

export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string; // Titre du toast (text1)
  message: string; // Message détaillé du toast (text2)
  timestamp: number;
}
