import { useState } from "react";
import { Check, Crown, Rocket, Shield, Zap } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { selectPlan } from "../../api/client";
import { useNavigate } from "react-router-dom";
import type { PlanName } from "../../types";

interface PlanCard {
  id: PlanName;
  label: string;
  price: string;
  credits: string;
  icon: React.ReactNode;
  features: string[];
  highlight?: boolean;
}

const plans: PlanCard[] = [
  {
    id: "free",
    label: "Free",
    price: "$0",
    credits: "500 credits/mo",
    icon: <Zap size={24} />,
    features: [
      "1 voice clone",
      "5 emotions (happy, sad, angry, calm, confused)",
      "500 monthly credits",
      "1 credit per 20 characters",
      "10 credits per voice clone",
    ],
  },
  {
    id: "plus",
    label: "Plus",
    price: "$29",
    credits: "5,000 credits/mo",
    icon: <Rocket size={24} />,
    highlight: true,
    features: [
      "Unlimited voice clones",
      "All 23 emotions",
      "5,000 monthly credits",
      "1 credit per 20 characters",
      "10 credits per voice clone",
      "Priority support",
    ],
  },
  {
    id: "pro",
    label: "Pro",
    price: "$99",
    credits: "25,000 credits/mo",
    icon: <Crown size={24} />,
    features: [
      "Unlimited voice clones",
      "All 23 emotions",
      "25,000 monthly credits",
      "1 credit per 20 characters",
      "10 credits per voice clone",
      "Priority support",
      "API access",
    ],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    price: "Custom",
    credits: "Unlimited",
    icon: <Shield size={24} />,
    features: [
      "Unlimited everything",
      "Custom credit allocation",
      "Dedicated support",
      "SLA guarantee",
      "On-premise deployment",
    ],
  },
];

export default function SelectPlanPage() {
  const { token, refreshUser, clearIsNew } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<PlanName | null>(null);

  const handleSelect = async (plan: PlanName) => {
    if (!token) return;
    setLoading(plan);
    try {
      const res = await selectPlan(token, plan);
      if (res.applied) {
        await refreshUser();
        clearIsNew();
        navigate("/dashboard/overview");
      } else {
        // Enterprise — contact us
        clearIsNew();
        navigate("/dashboard/overview");
      }
    } catch {
      // fallback — just go to dashboard
      clearIsNew();
      navigate("/dashboard/overview");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-radial-field opacity-70" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <p className="text-sm font-semibold text-cyan-200">Choose your plan</p>
        <h1 className="mt-2 text-center text-3xl font-semibold text-white sm:text-4xl">
          Start generating with the right plan
        </h1>
        <p className="mt-3 max-w-xl text-center text-sm text-slate-400">
          Credits renew monthly. 1 credit per 20 characters of generated speech. 10 credits per voice clone upload.
        </p>

        <div className="mt-10 grid w-full max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-3xl border p-5 transition ${
                plan.highlight
                  ? "border-cyan-300/40 bg-cyan-300/5 shadow-lg shadow-cyan-300/10"
                  : "border-white/10 bg-ink-950/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-2xl ${
                    plan.highlight
                      ? "bg-cyan-300/20 text-cyan-200"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {plan.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{plan.label}</p>
                  <p className="text-xs text-slate-400">{plan.credits}</p>
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-white">
                {plan.price}
                {plan.price !== "Custom" && (
                  <span className="text-sm font-normal text-slate-400">/mo</span>
                )}
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check size={14} className="mt-0.5 shrink-0 text-cyan-300" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-cyan-300 text-ink-950 hover:bg-cyan-200"
                    : "border border-white/10 bg-white/10 text-white hover:bg-white/20"
                }`}
                onClick={() => handleSelect(plan.id)}
                disabled={loading !== null}
              >
                {loading === plan.id
                  ? "Activating..."
                  : plan.id === "enterprise"
                    ? "Contact us"
                    : `Select ${plan.label}`}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          No payment required for now. All plans are activated instantly for testing.
        </p>
      </div>
    </div>
  );
}
