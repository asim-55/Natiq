import type { AuthResponse, Generation, Voice, ApiToken, Session, PlanConfig, PlanName, PricingEstimate,
  Organization, OrgMember, OrgInvitation } from "../types";

const BASE = import.meta.env.VITE_VOICE_API_BASE_URL || "/api";

function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function api<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = body.detail ?? body;
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    (err as any).status = res.status;
    (err as any).detail = detail;
    throw err;
  }
  // Handle empty responses (like 204 No Content)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json();
}

// Auth -----------------------------------------------------------------------

export async function googleAuth(credential: string): Promise<AuthResponse> {
  return api("/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
}

export async function githubAuth(code: string): Promise<AuthResponse> {
  return api("/auth/github", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
}

export async function microsoftAuth(code: string, redirectUri: string): Promise<AuthResponse> {
  return api("/auth/microsoft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, redirect_uri: redirectUri }) });
}

export async function signup(email: string, password: string, name: string): Promise<AuthResponse> {
  return api("/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name }) });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return api("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
}

export async function fetchMe(token: string) {
  const res = await api<{ user: AuthResponse["user"] }>("/me", { headers: headers(token) });
  return res.user;
}

export async function logoutApi(token: string): Promise<void> {
  await api("/auth/logout", { method: "POST", headers: headers(token) });
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  return api("/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await api("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export async function getSessions(token: string): Promise<Session[]> {
  const res = await api<{ items: Session[] }>("/auth/sessions", { headers: headers(token) });
  return res.items;
}

export async function revokeSession(token: string, sessionId: number): Promise<void> {
  await api(`/auth/sessions/${sessionId}`, { method: "DELETE", headers: headers(token) });
}

export async function revokeOtherSessions(token: string): Promise<void> {
  await api("/auth/sessions/revoke-others", { method: "DELETE", headers: headers(token) });
}

export async function setApiTokenExpiry(token: string, tokenId: number, expiresAt: string | null): Promise<void> {
  await api(`/auth/api-tokens/${tokenId}/expiry`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ expires_at: expiresAt }),
  });
}

// Voices ---------------------------------------------------------------------

export async function uploadVoice(token: string, audioBase64: string, filename?: string): Promise<string> {
  const res = await api<{ voice_id: string }>("/upload-voice", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ audio_base64: audioBase64, filename }),
  });
  return res.voice_id;
}

export async function denoiseAudio(token: string, audioBase64: string): Promise<string> {
  const res = await api<{ audio_base64: string }>("/denoise-audio", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ audio_base64: audioBase64 }),
  });
  return res.audio_base64;
}

export async function fetchVoices(token: string): Promise<Voice[]> {
  const res = await api<{ items: Voice[] }>("/my-voices", { headers: headers(token) });
  return res.items;
}

export async function deleteVoice(token: string, voiceId: string): Promise<void> {
  await api<{ status: string }>(`/voices/${encodeURIComponent(voiceId)}`, {
    method: "DELETE",
    headers: headers(token),
  });
}

export async function updateVoiceName(token: string, voiceId: string, name: string): Promise<void> {
  await api<{ status: string }>(`/voices/${encodeURIComponent(voiceId)}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ name }),
  });
}

export function previewVoiceUrl(token: string, voiceId: string): string {
  return `${BASE}/preview-voice/${encodeURIComponent(voiceId)}?token=${encodeURIComponent(token)}`;
}

// Generations ----------------------------------------------------------------

export async function fetchGenerations(token: string, limit?: number): Promise<Generation[]> {
  const q = limit ? `?limit=${limit}` : "";
  const res = await api<{ items: Generation[] }>(`/my-generations${q}`, { headers: headers(token) });
  return res.items;
}

export async function generateAudio(
  token: string,
  text: string,
  language: string,
  voiceReferenceId: string,
  emotion?: string,
  speed?: number,
  volume?: number,
): Promise<string> {
  const isNeutral = !emotion || emotion.toLowerCase() === "neutral";
  const endpoint = isNeutral ? "/generate-audio-no-emotion" : "/generate-audio-emotion";
  const body: Record<string, string | number> = { text, language, voice_reference_id: voiceReferenceId };
  if (!isNeutral) body.emotion = emotion;
  if (speed !== undefined) body.speed = speed;
  if (volume !== undefined) body.volume = volume;

  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = errBody.detail ?? errBody;
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    (err as any).status = res.status;
    (err as any).detail = detail;
    throw err;
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function playUrl(token: string, id: number): string {
  return `${BASE}/play/${id}?token=${encodeURIComponent(token)}`;
}

// Emotions -------------------------------------------------------------------

export async function fetchEmotions(token: string): Promise<string[]> {
  const res = await api<{ emotions: string[] }>("/emotions", { headers: headers(token) });
  return res.emotions;
}

// API tokens -----------------------------------------------------------------

export async function createApiToken(token: string, name: string) {
  return api<{ token: string; token_id: number; prefix: string; name: string }>("/auth/api-tokens", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ name }),
  });
}

export async function fetchApiTokens(token: string): Promise<ApiToken[]> {
  const res = await api<{ items: ApiToken[] }>("/auth/api-tokens", { headers: headers(token) });
  return res.items;
}

export async function deleteApiToken(token: string, tokenId: number) {
  return api<{ status: string }>(`/auth/api-tokens/${tokenId}`, { method: "DELETE", headers: headers(token) });
}

// Usage ----------------------------------------------------------------------

export interface UsageDay { date: string; credits: number; }

export async function fetchGenerationUsage(token: string, days = 30): Promise<UsageDay[]> {
  const res = await api<{ data: UsageDay[] }>(`/usage/generations?days=${days}`, { headers: headers(token) });
  return res.data;
}

export async function fetchUploadUsage(token: string, days = 30): Promise<UsageDay[]> {
  const res = await api<{ data: UsageDay[] }>(`/usage/uploads?days=${days}`, { headers: headers(token) });
  return res.data;
}

// Plans ----------------------------------------------------------------------

export async function selectPlan(token: string, plan: PlanName) {
  return api<{ status: string; plan: string; applied: boolean; monthly_credits?: number; message: string }>(
    "/select-plan",
    { method: "POST", headers: headers(token), body: JSON.stringify({ plan }) },
  );
}

export async function createCheckoutSession(token: string, plan: PlanName, billing: "monthly" | "annual" = "monthly") {
  return api<{ status: string; checkout_url: string }>(
    "/create-checkout-session",
    { method: "POST", headers: headers(token), body: JSON.stringify({ plan, billing }) },
  );
}

export async function fetchPlans() {
  return api<{ plans: Record<string, PlanConfig> }>("/plans", { method: "GET", headers: { "Content-Type": "application/json" } });
}

// Pricing calculator ---------------------------------------------------------

export async function calculatePricing(minutes: number): Promise<PricingEstimate> {
  const res = await api<PricingEstimate & { status: string }>(
    `/pricing-calculator?minutes=${minutes}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return res;
}

// Organization ---------------------------------------------------------------

export async function createOrg(token: string, displayName: string): Promise<Organization> {
  return api("/org", { method: "POST", headers: headers(token), body: JSON.stringify({ display_name: displayName }) });
}

export async function getMyOrgs(token: string): Promise<Organization[]> {
  return api("/org/me", { headers: headers(token) });
}

export async function getOrg(token: string, orgId: number): Promise<Organization> {
  return api(`/org/${orgId}`, { headers: headers(token) });
}

export async function updateOrg(
  token: string,
  orgId: number,
  data: { display_name: string; twitter: string; linkedin: string; website: string },
): Promise<Organization> {
  return api(`/org/${orgId}`, { method: "PATCH", headers: headers(token), body: JSON.stringify(data) });
}

export async function deleteOrg(token: string, orgId: number): Promise<void> {
  await api(`/org/${orgId}`, { method: "DELETE", headers: headers(token) });
}

export async function getOrgMembers(
  token: string,
  orgId: number,
): Promise<{ members: OrgMember[]; invitations: OrgInvitation[] }> {
  return api(`/org/${orgId}/members`, { headers: headers(token) });
}

export async function inviteMember(
  token: string,
  orgId: number,
  email: string,
  role: string,
): Promise<{ invite_link: string; email_sent: boolean }> {
  return api(`/org/${orgId}/invite`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ email, role }),
  });
}

export async function cancelInvitation(token: string, orgId: number, inviteId: number): Promise<void> {
  await api(`/org/${orgId}/invitations/${inviteId}`, { method: "DELETE", headers: headers(token) });
}

export async function changeMemberRole(
  token: string,
  orgId: number,
  userId: number,
  role: string,
): Promise<void> {
  await api(`/org/${orgId}/members/${userId}/role`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ role }),
  });
}

export async function removeMember(token: string, orgId: number, userId: number): Promise<void> {
  await api(`/org/${orgId}/members/${userId}`, { method: "DELETE", headers: headers(token) });
}

export async function acceptInvite(token: string, inviteToken: string): Promise<Organization> {
  return api("/org/accept-invite", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ token: inviteToken }),
  });
}
