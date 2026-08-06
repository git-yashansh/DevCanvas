export interface AuditLog {
  id: string;
  created_at: string;
  actor_id: string;
  action: string;
  entity: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  result: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export interface UserFeedback {
  id: string;
  created_at: string;
  user_id: string | null;
  feedback_type?: 'feature_request' | 'bug_report' | 'rating' | 'other';
  category: string;
  rating: number | null;
  comment: string;
  status: 'pending' | 'under_review' | 'planned' | 'completed' | 'declined';
  votes: number;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export interface SystemLog {
  id: string;
  created_at: string;
  service: string;
  status: string;
  cpu_usage: number | null;
  memory_usage: number | null;
  message: string | null;
  level: 'info' | 'warning' | 'error';
}

export interface BlockedIp {
  ip: string;
  reason: string;
  date: string;
}

export interface SecurityWarning {
  title: string;
  msg: string;
  time: string;
}

export interface FeatureFlag {
  key: string;
  value: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSetting {
  key: string;
  value: any;
  updated_at: string;
}
