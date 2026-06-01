import { useEffect, useState } from "react";
import { BookOpen, Check, Copy, Key, Monitor, Plus, Trash2, User } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { createApiToken, deleteApiToken, fetchApiTokens, getSessions, revokeOtherSessions, revokeSession, setApiTokenExpiry } from "../../api/client";
import { Link } from "react-router-dom";
import type { ApiToken, Session } from "../../types";

export default function SettingsPage() {
  const { user, token, logout } = useAuth();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenSecret, setNewTokenSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [expiryInput, setExpiryInput] = useState<Record<number, string>>({});
  const [settingsError, setSettingsError] = useState("");
  const [sessionBusy, setSessionBusy] = useState<number | "others" | null>(null);
  const [tokenBusy, setTokenBusy] = useState<number | null>(null);

  const loadTokens = async () => {
    if (!token) return;
    try { setTokens(await fetchApiTokens(token)); } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const loadSessions = async () => {
    if (!token) return;
    try { setSessions(await getSessions(token)); } catch { /* ignore */ }
    finally { setSessionsLoading(false); }
  };

  useEffect(() => { loadTokens(); loadSessions(); }, [token]);

  const handleCreate = async () => {
    if (!token || !newTokenName.trim()) return;
    setSettingsError("");
    try {
      const res = await createApiToken(token, newTokenName.trim());
      setNewTokenSecret(res.token);
      setNewTokenName("");
      await loadTokens();
    } catch (e: any) {
      setSettingsError(e.detail || "Failed to create token");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    setSettingsError("");
    setTokenBusy(id);
    try {
      await deleteApiToken(token, id);
      setTokens((items) => items.filter((item) => item.id !== id));
    } catch (e: any) {
      setSettingsError(e.detail || "Failed to revoke token");
    } finally {
      setTokenBusy(null);
    }
  };

  const handleSetExpiry = async (id: number) => {
    if (!token) return;
    const val = expiryInput[id]?.trim() || null;
    setSettingsError("");
    try {
      await setApiTokenExpiry(token, id, val ? new Date(val).toISOString() : null);
      await loadTokens();
    } catch (e: any) {
      setSettingsError(e.detail || "Failed to update token expiry");
    }
  };

  const handleRevokeSession = async (id: number) => {
    if (!token) return;
    setSettingsError("");
    setSessionBusy(id);
    try {
      await revokeSession(token, id);
      setSessions((items) => items.filter((item) => item.id !== id));
    } catch (e: any) {
      setSettingsError(e.detail || "Failed to revoke session");
    } finally {
      setSessionBusy(null);
    }
  };

  const handleRevokeOthers = async () => {
    if (!token) return;
    setSettingsError("");
    setSessionBusy("others");
    try {
      await revokeOtherSessions(token);
      setSessions((items) => items.filter((item) => item.is_current));
    } catch (e: any) {
      setSettingsError(e.detail || "Failed to revoke sessions");
    } finally {
      setSessionBusy(null);
    }
  };

  const handleCopy = () => { navigator.clipboard.writeText(newTokenSecret); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="grid gap-6">
      {/* Profile */}
      <section className="dashboard-panel p-5 sm:p-6">
        <div><p className="text-sm text-cyan-200">Profile</p><h2 className="mt-1 text-2xl font-semibold text-white">Account settings</h2></div>
        <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-cyan-300/10 text-cyan-200">
            {user?.picture ? <img src={user.picture} alt="" className="h-full w-full rounded-full object-cover" /> : <User size={28} />}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-white">{user?.name || "User"}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <p className="text-sm text-slate-400">Provider: {user?.auth_provider} &middot; Credits: {user?.credits}</p>
          </div>
        </div>
        <button className="secondary-button mt-6" onClick={logout}>Log out</button>
      </section>

      {/* API Docs */}
      <section className="dashboard-panel p-5 sm:p-6">
        <div><p className="text-sm text-cyan-200">Resources</p><h2 className="mt-1 text-2xl font-semibold text-white">API documentation</h2></div>
        <p className="mt-2 text-sm text-slate-400">Full reference for every endpoint including curl examples, request bodies, and auth details.</p>
        <Link to="/docs" className="primary-button mt-4 inline-flex"><BookOpen size={18} /> View API docs</Link>
      </section>

      {/* Active sessions */}
      <section className="dashboard-panel p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-cyan-200">Security</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Active sessions</h2>
            <p className="mt-2 text-sm text-slate-400">Every device that has a valid login. Revoke any session you don't recognise.</p>
          </div>
          <button
            className="secondary-button shrink-0 disabled:opacity-50"
            onClick={handleRevokeOthers}
            disabled={sessionBusy !== null || sessions.every((s) => s.is_current)}
          >
            {sessionBusy === "others" ? "Revoking..." : "Revoke all others"}
          </button>
        </div>
        {settingsError && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {settingsError}
          </div>
        )}
        <div className="mt-5">
          {sessionsLoading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-ink-950/70 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                    <Monitor size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {s.device_hint || "Unknown device"}
                      {s.is_current && <span className="ml-2 rounded-full bg-cyan-300/20 px-2 py-0.5 text-xs text-cyan-300">Current</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Signed in {s.created_at.slice(0, 10)}
                      {s.last_used_at && ` · Last active ${s.last_used_at.slice(0, 10)}`}
                    </p>
                  </div>
                  {!s.is_current && (
                    <button
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-400/30 bg-red-400/10 text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={sessionBusy !== null}
                      title="Revoke session"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* API tokens */}
      <section className="dashboard-panel p-5 sm:p-6">
        <div><p className="text-sm text-cyan-200">Developer</p><h2 className="mt-1 text-2xl font-semibold text-white">API tokens</h2>
          <p className="mt-2 text-sm text-slate-400">Use API tokens to call generation endpoints programmatically with <code className="rounded bg-white/10 px-1 text-cyan-200">Authorization: Bearer psk_...</code></p>
        </div>

        {newTokenSecret && (
          <div className="mt-5 rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-4">
            <p className="text-sm font-semibold text-white">Token created! Copy it now — you won't see it again.</p>
            <div className="mt-3 flex items-center gap-2">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-ink-950/80 px-3 py-2 text-sm text-cyan-100">{newTokenSecret}</code>
              <button className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20" onClick={handleCopy}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10" placeholder="Token name (e.g., 'my-app')" value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          <button className="primary-button whitespace-nowrap" onClick={handleCreate} disabled={!newTokenName.trim()}><Plus size={18} /> Create token</button>
        </div>

        <div className="mt-5">
          {loading ? <p className="text-sm text-slate-400">Loading...</p> : tokens.length === 0 ? <p className="text-sm text-slate-400">No API tokens created yet.</p> : (
            <div className="space-y-3">
              {tokens.map((tk) => (
                <div key={tk.id} className="rounded-3xl border border-white/10 bg-ink-950/70 p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-300/10 text-violet-200"><Key size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{tk.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {tk.token_prefix}... · Created {tk.created_at.slice(0, 10)}
                        {tk.last_used_at && ` · Last used ${tk.last_used_at.slice(0, 10)}`}
                        {tk.expires_at && ` · Expires ${tk.expires_at.slice(0, 10)}`}
                      </p>
                    </div>
                    <button className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-red-400/30 bg-red-400/10 text-red-300 transition hover:bg-red-400/20 disabled:opacity-50" onClick={() => handleDelete(tk.id)} disabled={tokenBusy === tk.id} title="Revoke token"><Trash2 size={16} /></button>
                  </div>
                  {/* Expiry setter */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <input
                      type="date"
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-300/50"
                      value={expiryInput[tk.id] ?? (tk.expires_at ? tk.expires_at.slice(0, 10) : "")}
                      onChange={(e) => setExpiryInput((p) => ({ ...p, [tk.id]: e.target.value }))}
                      title="Set expiry date (leave blank to remove)"
                    />
                    <button
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/20 transition"
                      onClick={() => handleSetExpiry(tk.id)}
                    >
                      {expiryInput[tk.id] ? "Set expiry" : "Clear expiry"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
