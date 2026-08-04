export type NotificationType = "info" | "success" | "warning" | "error";

export interface DBNotification {
  id: string;
  created_at: string;
  created_by?: string | null;
  user_id?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  is_broadcast: boolean;
  is_read: boolean;
}
