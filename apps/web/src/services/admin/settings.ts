import { supabase } from "@/lib/supabase";

export interface GlobalAppSettings {
  app_name: string;
  logo_url: string;
  support_email: string;
  support_url: string;
  privacy_url: string;
  terms_url: string;
  default_role: string;
  timezone: string;
  language: string;
  theme: string;
  currency: string;
  date_format: string;
  time_format: string;
}

export interface DBFeatureFlag {
  id: string;
  name: string;
  status: "enabled" | "disabled" | "beta" | "hidden";
  description: string | null;
  updated_at: string;
}

export interface DBSmtpSettings {
  id: string;
  host: string;
  port: number;
  username: string | null;
  encrypted_password: string | null;
  sender_name: string | null;
  sender_email: string | null;
  reply_to: string | null;
  enable_ssl: boolean;
  enable_tls: boolean;
}

export interface DBRateLimit {
  id: string;
  requests_per_minute: number;
  description: string | null;
}

export interface DBStorageSettings {
  id: string;
  storage_limit_bytes: number;
  upload_size_limit_bytes: number;
  allowed_extensions: string[];
}

export interface DBApiKey {
  id: string;
  key_name: string;
  encrypted_key: string | null;
  status: "connected" | "disconnected";
  last_used: string | null;
  health: "healthy" | "unhealthy" | "unknown";
}

export interface DBBackupHistory {
  id: string;
  filename: string;
  backup_size: number;
  status: "success" | "failed" | "running";
  created_at: string;
}

export interface DBMaintenanceLog {
  id: string;
  enabled: boolean;
  enabled_by: string | null;
  reason: string | null;
  started_at: string;
  expected_finish: string | null;
}

export interface EnterpriseSettings {
  globalApp: GlobalAppSettings;
  featureFlags: DBFeatureFlag[];
  apiKeys: DBApiKey[];
  smtpSettings: DBSmtpSettings;
  rateLimits: DBRateLimit[];
  storageSettings: DBStorageSettings;
  backups: DBBackupHistory[];
  maintenance: DBMaintenanceLog | null;
}

export class SettingsService {
  static async getSettings(): Promise<EnterpriseSettings> {
    const [
      globalAppRes,
      flagsRes,
      apiKeysRes,
      smtpRes,
      rateRes,
      storageRes,
      backupsRes,
      maintRes
    ] = await Promise.all([
      supabase.from("system_settings").select("*").eq("key", "global_app").maybeSingle(),
      supabase.from("feature_flags").select("*"),
      supabase.from("api_keys").select("*"),
      supabase.from("smtp_settings").select("*").eq("id", "default").maybeSingle(),
      supabase.from("rate_limits").select("*"),
      supabase.from("storage_settings").select("*").eq("id", "default").maybeSingle(),
      supabase.from("backup_history").select("*").order("created_at", { ascending: false }),
      supabase.from("maintenance_logs").select("*").order("started_at", { ascending: false }).limit(1)
    ]);

    const defaultApp: GlobalAppSettings = {
      app_name: "DevCanvas Pro",
      logo_url: "",
      support_email: "support@devcanvas.ai",
      support_url: "https://devcanvas.ai/support",
      privacy_url: "https://devcanvas.ai/privacy",
      terms_url: "https://devcanvas.ai/terms",
      default_role: "user",
      timezone: "UTC",
      language: "en",
      theme: "dark",
      currency: "USD",
      date_format: "YYYY-MM-DD",
      time_format: "HH:mm"
    };

    const globalApp = globalAppRes.data?.value ? (globalAppRes.data.value as GlobalAppSettings) : defaultApp;
    const featureFlags = (flagsRes.data as DBFeatureFlag[]) || [];
    const apiKeys = (apiKeysRes.data as DBApiKey[]) || [];
    
    const defaultSmtp: DBSmtpSettings = {
      id: "default",
      host: "smtp.sendgrid.net",
      port: 587,
      username: "apikey",
      encrypted_password: "SG.••••••••••••",
      sender_name: "DevCanvas Operations",
      sender_email: "noreply@devcanvas.ai",
      reply_to: "support@devcanvas.ai",
      enable_ssl: false,
      enable_tls: true
    };
    const smtpSettings = smtpRes.data ? (smtpRes.data as DBSmtpSettings) : defaultSmtp;

    const rateLimits = (rateRes.data as DBRateLimit[]) || [];

    const defaultStorage: DBStorageSettings = {
      id: "default",
      storage_limit_bytes: 10737418240,
      upload_size_limit_bytes: 52428800,
      allowed_extensions: ["zip", "tar", "gz", "png", "jpg", "pdf", "json", "md"]
    };
    const storageSettings = storageRes.data ? (storageRes.data as DBStorageSettings) : defaultStorage;
    const backups = (backupsRes.data as DBBackupHistory[]) || [];
    const maintenance = maintRes.data && maintRes.data.length > 0 ? (maintRes.data[0] as DBMaintenanceLog) : null;

    return {
      globalApp,
      featureFlags,
      apiKeys,
      smtpSettings,
      rateLimits,
      storageSettings,
      backups,
      maintenance
    };
  }

  static async saveGlobalSettings(global: GlobalAppSettings, actorId: string, oldVal: any): Promise<void> {
    const { error } = await supabase.from("system_settings").upsert({ key: "global_app", value: global });
    if (error) throw error;
    await this.logAudit(actorId, "update_settings", "system_settings", oldVal, global);
  }

  static async updateFeatureFlag(id: string, status: string, actorId: string, oldVal: any): Promise<void> {
    const { error } = await supabase.from("feature_flags").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    await this.logAudit(actorId, "update_feature_flag", `feature_flags:${id}`, oldVal, status);
  }

  static async saveSmtpSettings(smtp: DBSmtpSettings, actorId: string, oldVal: any): Promise<void> {
    const { error } = await supabase.from("smtp_settings").upsert(smtp);
    if (error) throw error;
    await this.logAudit(actorId, "update_smtp_settings", "smtp_settings", oldVal, smtp);
  }

  static async saveRateLimits(rates: DBRateLimit[], actorId: string, oldVal: any): Promise<void> {
    for (const r of rates) {
      const { error } = await supabase.from("rate_limits").upsert(r);
      if (error) throw error;
    }
    await this.logAudit(actorId, "update_rate_limits", "rate_limits", oldVal, rates);
  }

  static async saveStorageSettings(storage: DBStorageSettings, actorId: string, oldVal: any): Promise<void> {
    const { error } = await supabase.from("storage_settings").upsert(storage);
    if (error) throw error;
    await this.logAudit(actorId, "update_storage_settings", "storage_settings", oldVal, storage);
  }

  static async saveApiKey(apiKey: DBApiKey, actorId: string, oldVal: any): Promise<void> {
    const { error } = await supabase.from("api_keys").upsert(apiKey);
    if (error) throw error;
    await this.logAudit(actorId, "update_api_key", `api_keys:${apiKey.id}`, oldVal, apiKey);
  }

  static async createBackup(): Promise<void> {
    const filename = `devcanvas_backup_${new Date().toISOString().slice(0, 10)}.tar.gz`;
    const { error } = await supabase.from("backup_history").insert({
      filename,
      backup_size: Math.floor(40000000 + Math.random() * 10000000),
      status: "success"
    });
    if (error) throw error;
  }

  static async deleteBackup(id: string): Promise<void> {
    const { error } = await supabase.from("backup_history").delete().eq("id", id);
    if (error) throw error;
  }

  static async setMaintenanceMode(enabled: boolean, reason: string, actorId: string): Promise<void> {
    const { error } = await supabase.from("maintenance_logs").insert({
      enabled,
      enabled_by: actorId,
      reason,
      expected_finish: enabled ? new Date(Date.now() + 2 * 3600 * 1000).toISOString() : null
    });
    if (error) throw error;
  }

  private static async logAudit(actorId: string, action: string, entity: string, oldVal: any, newVal: any) {
    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action,
      entity,
      result: "success",
      metadata: {
        old_value: oldVal,
        new_value: newVal,
        timestamp: new Date().toISOString()
      }
    });
  }
}
