import { useState } from "react";
import { Check, Crown, Rocket, Shield, X, Zap } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { selectPlan } from "../api/client";
import type { PlanName } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  message?: string;
}

const plans: { id: PlanName; label: string; price: string; icon: React.ReactNode; highlight?: boolean }[] = [
  { id: "free", label: "Free", price: "$0/mo", icon: <Zap size={18} /> },
  { id: "plus", label: "Plus", price: "$29/mo", icon: <Rocket size={18} />, highlight: true },
  { id: "pro", label: "Pro", price: "$99/mo", icon: <Crown size={18} /> },
  { id: "enterprise", label: "Enterprise", price: "Custom", icon: <Shield size={18} /> },
];

export default function UpgradeModal({ open, onClose, message }: Props) {
  const { token, refreshUser } = useAuth();
  const [loading, setLoading] = useState<PlanName | null>(null);

  if (!open) return null;

  const handleUpgrade = async (plan: PlanName) => {
    if (!token) return;
    setLoading(plan);
    try {
      await selectPlan(token, plan);
      await refreshUser();
      onClose();
    } catch {
      onClose();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-3xl border border-white/10 bg-ink-950 p-6">
        <button
          className="absolute right-4 top-4 text-slate-400 transition hover:text-white"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <p className="text-sm font-semibold text-red-300">Credits exhausted</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Upgrade your plan</h2>
        <p className="mt-2 text-sm text-slate-400">
          {message || "You've run out of credits. Upgrade to continue generating."}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleUpgrade(plan.id)}
              disabled={loading !== null}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                plan.highlight
                  ? "border-cyan-300/40 bg-cyan-300/10 hover:bg-cyan-300/20"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                  plan.highlight ? "bg-cyan-300/20 text-cyan-200" : "bg-white/10 text-slate-300"
                }`}
              >
                {plan.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{plan.label}</p>
                <p className="text-xs text-slate-400">{plan.price}</p>
              </div>
              {loading === plan.id && (
                <span className="ml-auto text-xs text-cyan-200">...</span>
              )}
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Plans activate instantly. No payment required for now.
        </p>
      </div>
    </div>
  );
}
