import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Building2, Check, ChevronDown, Globe, Linkedin,
  Loader2, Mail, Plus, Trash2, Twitter, UserMinus, X,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import {
  cancelInvitation, changeMemberRole, createOrg, deleteOrg,
  getMyOrgs, getOrgMembers, inviteMember, removeMember, updateOrg,
} from "../../api/client";
import type { OrgInvitation, OrgMember, Organization, OrgRole } from "../../types";

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

interface ToastMsg {
  id: number;
  type: "success" | "error" | "warn";
  text: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);

  const dismiss = (id: number) => setToasts(t => t.filter(x => x.id !== id));

  const show = (
    text: string,
    type: ToastMsg["type"] = "success",
    action?: { label: string; onClick: () => void | Promise<void> },
  ) => {
    const id = ++counter.current;
    setToasts(t => [...t, { id, type, text, actionLabel: action?.label, onAction: action?.onClick }]);
    setTimeout(() => dismiss(id), 5000);
  };
  return { toasts, show, dismiss };
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast-slide-in flex items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-lg
            ${t.type === "success" ? "bg-cyan-300/20 border border-cyan-300/40 text-cyan-100"
              : t.type === "warn" ? "bg-amber-400/20 border border-amber-400/40 text-amber-100"
              : "bg-red-500/20 border border-red-500/40 text-red-200"}`}
        >
          <span className="flex-1">{t.text}</span>
          {t.actionLabel && t.onAction && (
            <button
              onClick={() => {
                void t.onAction?.();
                onDismiss(t.id);
              }}
              className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs font-semibold text-white hover:bg-white/20"
            >
              {t.actionLabel}
            </button>
          )}
          <button onClick={() => onDismiss(t.id)} className="mt-0.5 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite Modal
// ---------------------------------------------------------------------------

interface InviteModalProps {
  onClose: () => void;
  onSubmit: (email: string, role: string) => Promise<void>;
  plan: string;
}

function InviteModal({ onClose, onSubmit, plan }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const isFreePlan = (plan || "free").toLowerCase() === "free";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErr("");
    setLoading(true);
    try {
      await onSubmit(email.trim(), role);
      onClose();
    } catch (e: any) {
      const detail = e?.detail;
      setErr(typeof detail === "object" ? detail?.message || JSON.stringify(detail) : e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#0d1a2b] border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Invite team member</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {isFreePlan && (
          <div className="mb-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 p-4 text-sm text-amber-200">
            You have reached your limit of 1 organization membership, including outstanding invitations.
            Please update your plan to access it.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isFreePlan}
              placeholder="teammate@company.com"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300/50 disabled:opacity-40"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={isFreePlan}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-300/50 disabled:opacity-40"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFreePlan || loading}
              className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-cyan-200 disabled:opacity-40"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Send invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create org modal
// ---------------------------------------------------------------------------

function CreateOrgModal({ onClose, onCreated }: { onClose: () => void; onCreated: (org: Organization) => void }) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !token) return;
    setLoading(true);
    try {
      const org = await createOrg(token, name.trim());
      onCreated(org);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#0d1a2b] border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">Create organization</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Organization name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Acme Inc."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300/50"
              required
            />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-cyan-200 disabled:opacity-40"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirm modal
// ---------------------------------------------------------------------------

function DeleteOrgModal({ orgName, onClose, onConfirm }: { orgName: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#0d1a2b] border border-red-500/30 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/20">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Delete organization</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          This will permanently delete <strong className="text-white">{orgName}</strong>, all members, and pending invitations.
          Type <code className="text-red-300">{orgName}</code> to confirm.
        </p>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={orgName}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={input !== orgName || loading}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-40"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role dropdown
// ---------------------------------------------------------------------------

function RoleDropdown({
  value,
  onChange,
  disabled,
}: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const options = ["admin", "member"];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:border-white/20 disabled:opacity-40"
      >
        <span className="capitalize">{value}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-28 rounded-xl bg-[#0d1a2b] border border-white/10 py-1 shadow-xl">
          {options.map(o => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs capitalize hover:bg-white/5
                ${o === value ? "text-cyan-300" : "text-slate-300"}`}
            >
              {o === value && <Check size={10} />}
              {o !== value && <span className="w-[10px]" />}
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type Tab = "general" | "members";

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function OrganizationPage() {
  const { user, token } = useAuth();
  const { toasts, show, dismiss } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [pendingRoles, setPendingRoles] = useState<Record<number, OrgRole>>({});
  const [roleBusyId, setRoleBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  // email → invite_link (only populated when SMTP is not configured)
  const [recentLinks, setRecentLinks] = useState<Record<string, string>>({});
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // General form state
  const [formName, setFormName] = useState("");
  const [formTwitter, setFormTwitter] = useState("");
  const [formLinkedin, setFormLinkedin] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Load org
  useEffect(() => {
    if (!token) return;
    getMyOrgs(token)
      .then(orgs => {
        if (orgs.length > 0) {
          const o = orgs[0];
          setOrg(o);
          setFormName(o.display_name);
          setFormTwitter(o.twitter || "");
          setFormLinkedin(o.linkedin || "");
          setFormWebsite(o.website || "");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Load members when tab changes
  useEffect(() => {
    if (!token || !org || activeTab !== "members") return;
    loadMembers();
  }, [token, org?.id, activeTab]);

  const loadMembers = async () => {
    if (!token || !org) return;
    try {
      const data = await getOrgMembers(token, org.id);
      setMembers(data.members);
      setInvitations(data.invitations);
    } catch {}
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !org) return;
    setSaving(true);
    try {
      const updated = await updateOrg(token, org.id, {
        display_name: formName,
        twitter: formTwitter,
        linkedin: formLinkedin,
        website: formWebsite,
      });
      setOrg(prev => ({ ...prev!, ...updated }));
      show("Organization updated");
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (email: string, role: string) => {
    if (!token || !org) return;
    const res = await inviteMember(token, org.id, email, role);
    if (res.email_sent) {
      show(`Invitation email sent to ${email}`);
    } else {
      // SMTP not configured — expose link for manual sharing
      setRecentLinks(prev => ({ ...prev, [email.toLowerCase()]: res.invite_link }));
      show(`Invite created for ${email} — copy the link below`);
    }
    await loadMembers();
  };

  const handleStageRole = (userId: number, currentRole: OrgRole, newRole: string) => {
    const nextRole = newRole as OrgRole;
    setPendingRoles((prev) => {
      const copy = { ...prev };
      if (nextRole === currentRole) delete copy[userId];
      else copy[userId] = nextRole;
      return copy;
    });
  };

  const handleUndoRole = async (userId: number, originalRole: OrgRole) => {
    if (!token || !org) return;
    setRoleBusyId(userId);
    try {
      await changeMemberRole(token, org.id, userId, originalRole);
      setMembers(m => m.map(x => x.user_id === userId ? { ...x, role: originalRole } : x));
      setPendingRoles((prev) => { const copy = { ...prev }; delete copy[userId]; return copy; });
    } catch (e: any) {
      show(e.message || "Failed to undo role change", "error");
    } finally {
      setRoleBusyId(null);
    }
  };

  const handleConfirmRole = async (userId: number) => {
    if (!token || !org) return;
    const newRole = pendingRoles[userId];
    if (!newRole) return;
    const originalRole = members.find(m => m.user_id === userId)?.role;
    if (!originalRole) return;
    setRoleBusyId(userId);
    try {
      await changeMemberRole(token, org.id, userId, newRole);
      setMembers(m => m.map(x => x.user_id === userId ? { ...x, role: newRole } : x));
      setPendingRoles((prev) => { const copy = { ...prev }; delete copy[userId]; return copy; });
      show("The role has been changed", "success", {
        label: "Undo",
        onClick: () => handleUndoRole(userId, originalRole),
      });
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setRoleBusyId(null);
    }
  };

  const handleCancelRole = (userId: number) => {
    setPendingRoles((prev) => { const copy = { ...prev }; delete copy[userId]; return copy; });
  };

  const handleRemoveMember = async (userId: number) => {
    if (!token || !org) return;
    try {
      await removeMember(token, org.id, userId);
      setMembers(m => m.filter(x => x.user_id !== userId));
      show("Member removed");
    } catch (e: any) {
      show(e.message, "error");
    }
  };

  const handleCancelInvite = async (inviteId: number) => {
    if (!token || !org) return;
    const inv = invitations.find(i => i.id === inviteId);
    try {
      await cancelInvitation(token, org.id, inviteId);
      setInvitations(i => i.filter(x => x.id !== inviteId));
      if (inv) setRecentLinks(prev => { const n = { ...prev }; delete n[inv.email.toLowerCase()]; return n; });
      show("Invitation cancelled");
    } catch (e: any) {
      show(e.message, "error");
    }
  };

  const handleDeleteOrg = async () => {
    if (!token || !org) return;
    try {
      await deleteOrg(token, org.id);
      setOrg(null);
      setShowDelete(false);
      show("Organization deleted");
    } catch (e: any) {
      show(e.message, "error");
    }
  };

  // -------------------------------------------------------------------------
  // Render: no org yet
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!org) {
    return (
      <>
        <div className="mx-auto max-w-lg py-16 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-300/10 border border-cyan-300/20">
              <Building2 size={28} className="text-cyan-300" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No organization yet</h2>
          <p className="text-sm text-slate-400 mb-6">
            Create an organization to collaborate with your team, manage members, and share voices.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-cyan-200"
          >
            <Plus size={16} /> Create organization
          </button>
        </div>

        {showCreate && (
          <CreateOrgModal
            onClose={() => setShowCreate(false)}
            onCreated={o => {
              setOrg(o);
              setFormName(o.display_name);
              setShowCreate(false);
              show("Organization created!");
            }}
          />
        )}

        <ToastContainer toasts={toasts} onDismiss={dismiss} />
      </>
    );
  }

  const myRole = org.my_role ?? "member";
  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";

  // -------------------------------------------------------------------------
  // Render: org exists
  // -------------------------------------------------------------------------

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 border border-cyan-300/20">
              <Building2 size={18} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{org.display_name}</h1>
              <p className="text-xs text-slate-500">{org.org_slug}</p>
            </div>
          </div>
          <span className="rounded-xl bg-white/5 border border-white/10 px-3 py-1 text-xs capitalize text-slate-400">
            {myRole}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10">
          {(["general", "members"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px
                ${activeTab === tab
                  ? "border-cyan-300 text-cyan-300"
                  : "border-transparent text-slate-400 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* General tab                                                       */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === "general" && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">General information</h3>
              <form onSubmit={handleSaveGeneral} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Display name</label>
                  <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    disabled={!isOwnerOrAdmin}
                    className="w-full max-w-sm rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-300/50 disabled:opacity-40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Organization ID</label>
                  <input
                    value={org.org_slug}
                    readOnly
                    className="w-full max-w-sm rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-slate-500 cursor-default"
                  />
                </div>

                <h4 className="text-xs font-semibold text-slate-400 pt-2">External links</h4>

                <div className="flex items-center gap-3">
                  <Twitter size={14} className="text-slate-500 shrink-0" />
                  <input
                    value={formTwitter}
                    onChange={e => setFormTwitter(e.target.value)}
                    disabled={!isOwnerOrAdmin}
                    placeholder="https://twitter.com/yourorg"
                    className="flex-1 max-w-sm rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300/50 disabled:opacity-40"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Linkedin size={14} className="text-slate-500 shrink-0" />
                  <input
                    value={formLinkedin}
                    onChange={e => setFormLinkedin(e.target.value)}
                    disabled={!isOwnerOrAdmin}
                    placeholder="https://linkedin.com/company/yourorg"
                    className="flex-1 max-w-sm rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300/50 disabled:opacity-40"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Globe size={14} className="text-slate-500 shrink-0" />
                  <input
                    value={formWebsite}
                    onChange={e => setFormWebsite(e.target.value)}
                    disabled={!isOwnerOrAdmin}
                    placeholder="https://yourcompany.com"
                    className="flex-1 max-w-sm rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-300/50 disabled:opacity-40"
                  />
                </div>

                {isOwnerOrAdmin && (
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-ink-950 hover:bg-cyan-200 disabled:opacity-40"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Save changes
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Danger zone */}
            {isOwner && (
              <div className="rounded-3xl border border-red-500/25 bg-red-500/5 p-6">
                <h3 className="text-sm font-semibold text-red-400 mb-1">Danger zone</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Permanently delete this organization and all its data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 size={14} /> Delete organization
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Members tab                                                       */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {members.length} member{members.length !== 1 ? "s" : ""}
                {invitations.length > 0 && ` · ${invitations.length} pending`}
              </p>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-cyan-200"
                >
                  <Plus size={14} /> Invite member
                </button>
              )}
            </div>

            {/* Members list */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                  {m.picture ? (
                    <img src={m.picture} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300/20 text-xs font-bold text-cyan-300">
                      {(m.name || m.email)[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.name || m.email}</p>
                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                  </div>
                  {m.role === "owner" ? (
                    <span className="text-xs text-cyan-300 font-medium">Owner</span>
                  ) : isOwnerOrAdmin ? (
                    <div className="flex items-center gap-1.5">
                      <RoleDropdown
                        value={pendingRoles[m.user_id] ?? m.role}
                        onChange={v => handleStageRole(m.user_id, m.role, v)}
                        disabled={(m.user_id === user?.id && myRole !== "owner") || roleBusyId === m.user_id}
                      />
                      {pendingRoles[m.user_id] && pendingRoles[m.user_id] !== m.role && (
                        <>
                          <button
                            onClick={() => handleConfirmRole(m.user_id)}
                            disabled={roleBusyId === m.user_id}
                            className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300/20 disabled:opacity-50"
                          >
                            {roleBusyId === m.user_id ? "Saving..." : "Done"}
                          </button>
                          <button
                            onClick={() => handleCancelRole(m.user_id)}
                            disabled={roleBusyId === m.user_id}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:text-white disabled:opacity-50"
                            title="Cancel role change"
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs capitalize text-slate-400">{m.role}</span>
                  )}
                  {isOwnerOrAdmin && m.role !== "owner" && m.user_id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="ml-1 text-slate-500 hover:text-red-400 transition"
                      title="Remove member"
                    >
                      <UserMinus size={15} />
                    </button>
                  )}
                </div>
              ))}

              {members.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-slate-500">No members yet.</div>
              )}
            </div>

            {/* Pending invitations */}
            {invitations.length > 0 && (
              <>
                <h4 className="text-xs font-semibold text-slate-400 pt-2">Pending invitations</h4>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
                  {invitations.map(inv => (
                    <div key={inv.id} className="flex flex-col gap-2 px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/10 shrink-0">
                          <Mail size={14} className="text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{inv.email}</p>
                          <p className="text-xs text-slate-500 capitalize">{inv.role} · Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                        </div>
                        <span className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-xs text-amber-300 shrink-0">
                          Pending
                        </span>
                        {isOwnerOrAdmin && (
                          <button
                            onClick={() => handleCancelInvite(inv.id)}
                            className="ml-1 text-slate-500 hover:text-red-400 transition shrink-0"
                            title="Cancel invitation"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                      {/* Show copy-link row when SMTP is not configured */}
                      {recentLinks[inv.email.toLowerCase()] && (
                        <div className="ml-11 flex items-center gap-2">
                          <input
                            readOnly
                            value={recentLinks[inv.email.toLowerCase()]}
                            className="flex-1 min-w-0 rounded-lg bg-black/30 border border-white/10 px-2.5 py-1 text-xs text-slate-400 cursor-text"
                            onFocus={e => e.target.select()}
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(recentLinks[inv.email.toLowerCase()]);
                              setCopiedEmail(inv.email.toLowerCase());
                              setTimeout(() => setCopiedEmail(null), 2000);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-cyan-300/20 border border-cyan-300/30 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-300/30 shrink-0"
                          >
                            {copiedEmail === inv.email.toLowerCase() ? <><Check size={11} /> Copied</> : "Copy link"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      {showInvite && (
        <InviteModal
          plan={user?.plan ?? "free"}
          onClose={() => setShowInvite(false)}
          onSubmit={handleInvite}
        />
      )}
      {showDelete && org && (
        <DeleteOrgModal
          orgName={org.display_name}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteOrg}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
