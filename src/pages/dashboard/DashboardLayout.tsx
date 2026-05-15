import { useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart2, Building2, ChevronDown, Clock3, Home, Key, Layers, LogOut,
  Mic2, Settings, CreditCard,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

// ─── Sidebar items ────────────────────────────────────────────────────────────

interface NavItem {
  icon: ReactNode;
  label: string;
  path: string;
}

const TOP_NAV: NavItem[] = [
  { icon: <Home size={18} />,     label: "Overview",              path: "/dashboard/overview" },
  { icon: <Mic2 size={18} />,     label: "Text to Voice",         path: "/dashboard/voice" },
  { icon: <Layers size={18} />,   label: "Instant Voice Cloning", path: "/dashboard/voice-clone" },
  { icon: <BarChart2 size={18} />, label: "Usage",               path: "/dashboard/usage" },
  { icon: <Clock3 size={18} />,   label: "History",               path: "/dashboard/history" },
];

const SETTINGS_SUB: NavItem[] = [
  { icon: <CreditCard size={16} />,  label: "Subscription",  path: "/dashboard/subscription" },
  { icon: <Key size={16} />,         label: "API Keys",      path: "/dashboard/settings" },
  { icon: <Building2 size={16} />,   label: "Organization",  path: "/dashboard/organization" },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(
    SETTINGS_SUB.some(s => location.pathname === s.path)
  );

  const isActive = (path: string) => location.pathname === path;

  function handleLogout() { logout(); navigate("/"); }

  const planMaxCredits =
    user?.plan === "pro" ? 25000 : user?.plan === "plus" ? 5000 : 500;
  const creditPct = user ? Math.min(100, Math.round((user.credits / planMaxCredits) * 100)) : 0;

  return (
    <div className="flex h-full flex-col p-5">
      {/* Logo */}
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-2">
        <img src="/natiq_logo.png" alt="Natiq" className="h-10 w-auto" />
      </Link>

      {/* Top nav */}
      <nav className="mt-8 flex-1 space-y-1">
        {TOP_NAV.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition
              ${isActive(item.path) ? "bg-cyan-300 text-ink-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {/* Settings collapsible */}
        <div>
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition
              ${SETTINGS_SUB.some(s => isActive(s.path)) ? "text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            <Settings size={18} />
            <span className="flex-1 text-left">Settings</span>
            <ChevronDown
              size={15}
              className={`text-slate-500 transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`}
            />
          </button>

          {settingsOpen && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
              {SETTINGS_SUB.map(sub => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition
                    ${isActive(sub.path)
                      ? "bg-cyan-300/15 text-cyan-200 border border-cyan-300/20"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  {sub.icon}
                  {sub.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Credits bar */}
      <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Credits</p>
          <span className="text-xs capitalize text-cyan-300">{user?.plan ?? "free"}</span>
        </div>
        <p className="mt-1 text-sm text-cyan-50">{user?.credits ?? 0} remaining</p>
        {/* Waveform-style credits bar */}
        {(() => {
          const WAVE = [35,60,48,80,55,95,65,42,78,52,88,62,38,72,58,82,47,67,92,53,70,43,62];
          return (
            <div className="mt-3 flex items-end gap-[2px] h-[22px]">
              {WAVE.map((h, i) => {
                const active = ((i + 1) / WAVE.length) * 100 <= creditPct;
                return (
                  <div key={i}
                    className={`flex-1 rounded-[2px] transition-colors ${active ? "bg-cyan-300 shadow-[0_0_3px_rgba(103,232,249,0.45)]" : "bg-white/15"}`}
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>
          );
        })()}
        <Link
          to="/dashboard/subscription"
          onClick={onNavigate}
          className="mt-3 block text-center text-xs font-semibold text-cyan-300 hover:underline"
        >
          Manage plan →
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition"
      >
        <LogOut size={18} /> Log out
      </button>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNav = [...TOP_NAV, ...SETTINGS_SUB];
  const currentPage = allNav.find(n => n.path === location.pathname);

  return (
    <div className="min-h-screen bg-ink-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-radial-field opacity-70" />
      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-ink-900/75 backdrop-blur-2xl lg:block">
          <Sidebar />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="relative z-50 w-72 border-r border-white/10 bg-ink-900 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-950/80 px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile: hamburger + logo */}
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white"
                  onClick={() => setMobileOpen(true)}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div>
                  <p className="text-xs text-slate-500 hidden sm:block">
                    {user?.name ? `Welcome, ${user.name}` : "Dashboard"}
                  </p>
                  <h1 className="text-lg font-semibold text-white leading-tight">
                    {currentPage?.label ?? "Dashboard"}
                  </h1>
                </div>
              </div>

              {/* Right: user */}
              <div className="flex items-center gap-3">
                {user?.picture ? (
                  <img src={user.picture} alt="" className="h-9 w-9 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-xs font-bold text-cyan-200">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
