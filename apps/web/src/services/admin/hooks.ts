import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminDashboardService } from "./dashboard";
import { UserService } from "./users";
import { RoleService } from "./role";
import { NotificationService } from "./notifications";
import { SupportTicketService } from "./tickets";
import { ProjectService } from "./projects";
import { AnalyticsService } from "./analytics";
import { AuditService } from "./audit";
import { SystemService } from "./system";
import { FeedbackService } from "./feedback";
import { SettingsService } from "./settings";

export const adminKeys = {
  dashboard: ["admin", "dashboard"] as const,
  users: ["admin", "users"] as const,
  userDetails: (id: string) => ["admin", "users", id] as const,
  notifications: ["admin", "notifications"] as const,
  userOptions: ["admin", "user-options"] as const,
  tickets: ["admin", "tickets"] as const,
  ticketMessages: (id: string) => ["admin", "tickets", id, "messages"] as const,
  adminUsers: ["admin", "admin-users"] as const,
  projects: ["admin", "projects"] as const,
  analytics: ["admin", "analytics"] as const,
  audit: ["admin", "audit"] as const,
  systemLogs: ["admin", "system", "logs"] as const,
  systemStatuses: ["admin", "system", "statuses"] as const,
  feedback: ["admin", "feedback"] as const,
  blockedIps: ["admin", "security", "blocked-ips"] as const,
  warnings: ["admin", "security", "warnings"] as const,
  settings: ["admin", "settings"] as const,
  userTickets: (userId: string) => ["user", userId, "tickets"] as const,
  userTicketMessages: (id: string) => ["user", "tickets", id, "messages"] as const,
};

// 1. Dashboard Hooks
export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: () => AdminDashboardService.getMetrics(),
  });
}

// 2. User Hooks
export function useAdminUsers(options?: {
  sortBy?: "created_at" | "full_name" | "last_seen";
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: [...adminKeys.users, options?.sortBy, options?.sortOrder],
    queryFn: () => UserService.getUsers(options),
  });
}

export function useAdminUserDetails(id: string) {
  return useQuery({
    queryKey: adminKeys.userDetails(id),
    queryFn: () => UserService.getUserDetails(id),
    enabled: !!id,
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => UserService.deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

// 3. Role & Status Hooks
export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      RoleService.updateUserRole(userId, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
      qc.invalidateQueries({ queryKey: adminKeys.userDetails(variables.userId) });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: string }) =>
      RoleService.updateUserStatus(userId, status),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
      qc.invalidateQueries({ queryKey: adminKeys.userDetails(variables.userId) });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

// 4. Security & Blocked IPs Hooks
export function useAdminBlockedIps() {
  return useQuery({
    queryKey: adminKeys.blockedIps,
    queryFn: () => RoleService.getBlockedIps(),
  });
}

export function useAdminSecurityWarnings() {
  return useQuery({
    queryKey: adminKeys.warnings,
    queryFn: () => RoleService.getSecurityWarnings(),
  });
}

export function useUnblockIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ip: string) => RoleService.unblockIp(ip),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.blockedIps });
    },
  });
}

// 5. Notification Hooks
export function useAdminNotifications() {
  return useQuery({
    queryKey: adminKeys.notifications,
    queryFn: () => NotificationService.getNotifications(),
  });
}

export function useAdminUserOptions() {
  return useQuery({
    queryKey: adminKeys.userOptions,
    queryFn: () => NotificationService.getUserOptions(),
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      message: string;
      type: string;
      is_broadcast: boolean;
      user_id?: string | null;
      recipient_user_id?: string | null;
      created_by?: string;
    }) => NotificationService.createNotification(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.notifications });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useCreateNotificationsBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inserts: any[]) => NotificationService.createNotificationsBulk(inserts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.notifications });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useUpdateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) =>
      NotificationService.updateNotification(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.notifications });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NotificationService.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.notifications });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

// 6. Support Ticket Hooks
export function useAdminTickets() {
  return useQuery({
    queryKey: adminKeys.tickets,
    queryFn: () => SupportTicketService.getTickets(),
  });
}

export function useAdminTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: adminKeys.ticketMessages(ticketId),
    queryFn: () => SupportTicketService.getTicketMessages(ticketId),
    enabled: !!ticketId,
  });
}

export function useAdminUsersList() {
  return useQuery({
    queryKey: adminKeys.adminUsers,
    queryFn: () => SupportTicketService.getAdminUsers(),
  });
}

export function useCreateTicketMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      ticket_id: string;
      sender_id: string;
      message: string;
      is_internal: boolean;
      attachment?: string | null;
    }) => SupportTicketService.createTicketMessage(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: adminKeys.ticketMessages(variables.ticket_id) });
      qc.invalidateQueries({ queryKey: adminKeys.tickets });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) =>
      SupportTicketService.updateTicket(id, patch),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: adminKeys.tickets });
      qc.invalidateQueries({ queryKey: adminKeys.ticketMessages(variables.id) });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SupportTicketService.deleteTicket(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.tickets });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useUserTickets(userId: string) {
  return useQuery({
    queryKey: adminKeys.userTickets(userId),
    queryFn: () => SupportTicketService.getUserTickets(userId),
    enabled: !!userId,
  });
}

export function useUserTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: adminKeys.userTicketMessages(ticketId),
    queryFn: () => SupportTicketService.getUserTicketMessages(ticketId),
    enabled: !!ticketId,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      user_id: string;
      subject: string;
      category: string;
      priority: string;
      description: string;
    }) => SupportTicketService.createTicket(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: adminKeys.userTickets(variables.user_id) });
      qc.invalidateQueries({ queryKey: adminKeys.tickets });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

// 7. Project Hooks
export function useAdminProjects() {
  return useQuery({
    queryKey: adminKeys.projects,
    queryFn: () => ProjectService.getProjects(),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ProjectService.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.projects });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

// 8. Analytics Hooks
export function useAdminAnalytics() {
  return useQuery({
    queryKey: adminKeys.analytics,
    queryFn: () => AnalyticsService.getAnalyticsMetrics(),
  });
}

// 9. Audit Hooks
export function useAdminAuditLogs() {
  return useQuery({
    queryKey: adminKeys.audit,
    queryFn: () => AuditService.getAuditLogs(),
  });
}

export function useCreateAuditLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      actor_id: string;
      action: string;
      entity: string;
      details?: any;
      result: string;
      ip_address?: string;
    }) => AuditService.createAuditLog(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.audit });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

// 10. System Hooks
export function useAdminSystemLogs() {
  return useQuery({
    queryKey: adminKeys.systemLogs,
    queryFn: () => SystemService.getSystemLogs(),
  });
}

export function useAdminSystemStatuses() {
  return useQuery({
    queryKey: adminKeys.systemStatuses,
    queryFn: () => SystemService.getSystemStatuses(),
  });
}

// 11. Feedback Hooks
export function useAdminFeedback() {
  return useQuery({
    queryKey: adminKeys.feedback,
    queryFn: () => FeedbackService.getFeedback(),
  });
}

export function useUpdateFeedbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      FeedbackService.updateFeedbackStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.feedback });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useDeleteFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FeedbackService.deleteFeedback(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.feedback });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

// 12. Settings Hooks
export function useAdminSettings() {
  return useQuery({
    queryKey: adminKeys.settings,
    queryFn: () => SettingsService.getSettings(),
  });
}

export function useSaveGlobalSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ global, actorId, oldVal }: { global: any; actorId: string; oldVal: any }) =>
      SettingsService.saveGlobalSettings(global, actorId, oldVal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
  });
}

export function useUpdateFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, actorId, oldVal }: { id: string; status: string; actorId: string; oldVal: any }) =>
      SettingsService.updateFeatureFlag(id, status, actorId, oldVal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
  });
}

export function useSaveSmtpSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ smtp, actorId, oldVal }: { smtp: any; actorId: string; oldVal: any }) =>
      SettingsService.saveSmtpSettings(smtp, actorId, oldVal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
  });
}

export function useSaveRateLimits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rates, actorId, oldVal }: { rates: any[]; actorId: string; oldVal: any }) =>
      SettingsService.saveRateLimits(rates, actorId, oldVal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
  });
}

export function useSaveStorageSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storage, actorId, oldVal }: { storage: any; actorId: string; oldVal: any }) =>
      SettingsService.saveStorageSettings(storage, actorId, oldVal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
  });
}

export function useSaveApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiKey, actorId, oldVal }: { apiKey: any; actorId: string; oldVal: any }) =>
      SettingsService.saveApiKey(apiKey, actorId, oldVal),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
  });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => SettingsService.createBackup(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
    },
  });
}

export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SettingsService.deleteBackup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
    },
  });
}

export function useSetMaintenanceMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enabled, reason, actorId }: { enabled: boolean; reason: string; actorId: string }) =>
      SettingsService.setMaintenanceMode(enabled, reason, actorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings });
    },
  });
}

export function useBlockIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ip, reason, blockedBy, expiry, permanent, notes }: { ip: string; reason: string; blockedBy: string; expiry: string | null; permanent: boolean; notes: string | null }) =>
      RoleService.blockIp(ip, reason, blockedBy, expiry, permanent, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.blockedIps });
    },
  });
}

export function useActiveSessions() {
  return useQuery({
    queryKey: ["admin", "activeSessions"],
    queryFn: () => RoleService.getActiveSessions(),
  });
}

export function useTerminateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => RoleService.terminateSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "activeSessions"] });
    },
  });
}

export function useTerminateAllSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => RoleService.terminateAllSessions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "activeSessions"] });
    },
  });
}

export function useLoginHistory() {
  return useQuery({
    queryKey: ["admin", "loginHistory"],
    queryFn: () => RoleService.getLoginHistory(),
  });
}

export function useFailedAttempts() {
  return useQuery({
    queryKey: ["admin", "failedAttempts"],
    queryFn: () => RoleService.getFailedAttempts(),
  });
}

export function useAccountLockouts() {
  return useQuery({
    queryKey: ["admin", "accountLockouts"],
    queryFn: () => RoleService.getAccountLockouts(),
  });
}

export function useLockAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, durationMinutes, reason }: { userId: string; durationMinutes: number; reason: string }) =>
      RoleService.lockAccount(userId, durationMinutes, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "accountLockouts"] });
    },
  });
}

export function useUnlockAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => RoleService.unlockAccount(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "accountLockouts"] });
    },
  });
}

export function useSystemRoles() {
  return useQuery({
    queryKey: ["admin", "systemRoles"],
    queryFn: () => RoleService.getSystemRoles(),
  });
}
