export type DashboardTab = "overview" | "voice" | "history" | "settings";

export type PlanName = "free" | "pro" | "startup" | "scale";

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  auth_provider: string;
  credits: number;
  plan: PlanName;
  plan_started_at: string;
  created_at: string;
  subscription_cancel_at?: string | null;
  has_subscription?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  is_new: boolean;
}

export interface Generation {
  id: number;
  text: string;
  language: string;
  emotion: string;
  voice_id: string;
  backend: string;
  credits_used: number;
  created_at: string;
  play_url: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  file_path: string;
  created_at: string;
}

export interface ApiToken {
  id: number;
  token_prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface Session {
  id: number;
  device_hint: string;
  ip: string;
  created_at: string;
  last_used_at: string | null;
  is_current: boolean;
}

export interface PlanConfig {
  label: string;
  monthly_credits: number;
  max_voices: number;
  allowed_emotions: string[] | "all";
  price: number;
}

export interface PricingEstimate {
  minutes: number;
  estimated_words: number;
  generation_credits: number;
  voice_clone_credits: number;
  total_with_one_clone: number;
  note: string;
}

// Organization ---------------------------------------------------------------

export type OrgRole = "owner" | "admin" | "member";

export interface Organization {
  id: number;
  owner_id: number;
  display_name: string;
  org_slug: string;
  twitter: string;
  linkedin: string;
  website: string;
  created_at: string;
  my_role?: OrgRole;
}

export interface OrgMember {
  id: number;
  user_id: number;
  role: OrgRole;
  joined_at: string;
  name: string;
  email: string;
  picture: string;
}

export interface OrgInvitation {
  id: number;
  org_id: number;
  email: string;
  role: OrgRole;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  expires_at: string;
  invited_by_name: string;
}
