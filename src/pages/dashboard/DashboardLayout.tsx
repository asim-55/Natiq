import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart2, Building2, ChevronDown, Clock3, Home, Key, Layers, LogOut,
  Mic2, Settings, CreditCard, User as UserIcon,
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
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const planMaxCredits =
    user?.plan === "enterprise" ? 999999 : user?.plan === "scale" ? 500000 : user?.plan === "startup" ? 70000 : user?.plan === "pro" ? 10000 : 1000;
  const creditPct = user ? Math.min(100, Math.round((user.credits / planMaxCredits) * 100)) : 0;

  return (
    <div className="flex h-screen flex-col p-5">
      {/* Logo */}
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-2 flex-shrink-0">
        <img src="/natiq_logo.png" alt="Natiq" className="h-12 w-auto" />
      </Link>

      {/* Top nav - scrollable */}
      <nav 
        className="mt-8 flex-1 space-y-1 overflow-y-auto pr-2"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent'
        }}
      >
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
      </nav>

      {/* Credits bar - always visible at bottom */}
      <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4 mt-4 flex-shrink-0">
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
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allNav = [...TOP_NAV, ...SETTINGS_SUB];
  const currentPage = allNav.find(n => n.path === location.pathname);

  // Keep org billing credits/plan fresh when moving around the dashboard.
  useEffect(() => {
    refreshUser();
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userDropdownOpen]);

  function handleLogout() {
    logout();
    navigate("/");
    setUserDropdownOpen(false);
  }

  return (
    <div className="min-h-screen bg-ink-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-radial-field opacity-70" />
      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar - fixed height */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-white/10 bg-ink-900/75 backdrop-blur-2xl h-screen sticky top-0">
          <Sidebar />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="relative z-50 w-72 border-r border-white/10 bg-ink-900 h-screen">
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

              {/* Right: user dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-xl hover:bg-white/5 transition p-1"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="h-9 w-9 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/10 text-xs font-bold text-cyan-200">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                  <ChevronDown 
                    size={16} 
                    className={`text-slate-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-ink-900 shadow-2xl z-50 overflow-hidden">
                    {/* User info */}
                    <div className="border-b border-white/10 p-4">
                      <p className="text-sm font-semibold text-white truncate">{user?.name ?? "User"}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email ?? ""}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cyan-300/10 border border-cyan-300/20 px-2.5 py-1">
                        <span className="text-xs font-semibold capitalize text-cyan-300">{user?.plan ?? "free"} Plan</span>
                      </div>
                    </div>

                    {/* Settings items */}
                    <div className="p-2">
                      {SETTINGS_SUB.map(item => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setUserDropdownOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition
                            ${location.pathname === item.path
                              ? "bg-cyan-300/15 text-cyan-200"
                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-white/10 p-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition"
                      >
                        <LogOut size={16} />
                        Log out
                      </button>
                    </div>
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
