import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import SignInModal from "../auth/SignInModal";

export default function Header() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-ink-950/80 backdrop-blur-2xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/natiq_logo.png" alt="Natiq" className="h-10 w-auto" />
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {[["Docs", "/docs"], ["Pricing", "/pricing"], ["About", "/about"], ["Blog", "/blog"]].map(([label, path]) => (
              <Link key={path} to={path} className="text-sm font-medium text-slate-300 transition hover:text-white">{label}</Link>
            ))}
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            {user ? (
              <button className="primary-button" onClick={() => navigate("/dashboard/overview")}>Playground</button>
            ) : (
              <>
                <button className="secondary-button" onClick={() => setModalOpen(true)}>Sign in</button>
                <button className="primary-button" onClick={() => setModalOpen(true)}>Get started</button>
              </>
            )}
          </div>

          <button className="text-slate-300 lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-white/10 bg-ink-950/95 px-4 py-6 lg:hidden">
            <div className="flex flex-col gap-4">
              {[["Docs", "/docs"], ["Pricing", "/pricing"], ["About", "/about"], ["Blog", "/blog"]].map(([label, path]) => (
                <Link key={path} to={path} className="text-sm font-medium text-slate-300" onClick={() => setMenuOpen(false)}>{label}</Link>
              ))}
              {user ? (
                <Link to="/dashboard/overview" className="primary-button justify-center" onClick={() => setMenuOpen(false)}>Playground</Link>
              ) : (
                <button className="primary-button justify-center" onClick={() => { setMenuOpen(false); setModalOpen(true); }}>Sign in</button>
              )}
            </div>
          </div>
        )}
      </header>
      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
