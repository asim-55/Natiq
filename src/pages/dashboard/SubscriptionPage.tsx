import { useEffect, useState } from "react";
import { Check, Building2, Rocket, Shield, Zap } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { selectPlan, createCheckoutSession } from "../../api/client";
import { useSearchParams } from "react-router-dom";
import type { PlanName } from "../../types";
import ContactModal from "../../components/ContactModal";

interface PlanDef {
  id: PlanName;
  label: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  credits: string;
  voices: string;
  features: string[];
  icon: React.ReactNode;
}

const PLANS: PlanDef[] = [
  {
    id: "free",
    label: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    credits: "500 credits / mo",
    voices: "1 voice",
    icon: <Zap size={18} />,
    features: ["500 monthly credits", "1 voice clone", "5 emotions", "API access"],
  },
  {
    id: "plus",
    label: "Startup",
    monthlyPrice: 29,
    annualPrice: 23,
    credits: "5,000 credits / mo",
    voices: "Unlimited voices",
    icon: <Rocket size={18} />,
    features: ["5,000 monthly credits", "Unlimited voice clones", "All 23 emotions", "Priority queue", "API access"],
  },
  {
    id: "pro",
    label: "Pro",
    monthlyPrice: 99,
    annualPrice: 79,
    credits: "25,000 credits / mo",
    voices: "Unlimited voices",
    icon: <Shield size={18} />,
    features: ["25,000 monthly credits", "Unlimited voice clones", "All 23 emotions", "Dedicated queue", "Analytics", "SLA support"],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    credits: "Custom",
    voices: "Unlimited",
    icon: <Building2 size={18} />,
    features: ["Custom credit volume", "Unlimited voice clones", "All emotions", "On-prem option", "Dedicated support", "Custom SLA"],
  },
];

export default function SubscriptionPage() {
  const { user, token, refreshUser } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<PlanName | null>(null);
  const [message, setMessage] = useState("");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // If the user is an org member, billing_owner_id is set — they cannot change plans
  const isOrgMember = !!(user as any)?.billing_owner_id;

  const currentPlan = user?.plan ?? "free";

  // Handle Stripe checkout return
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setMessage("Payment successful! Your plan is being activated...");
      // Refresh user to pick up plan change from webhook
      const poll = async () => {
        for (let i = 0; i < 10; i++) {
          await refreshUser();
          await new Promise(r => setTimeout(r, 2000));
        }
      };
      poll();
      // Clear the query param
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    } else if (checkout === "cancel") {
      setMessage("Checkout was cancelled. You can try again anytime.");
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(planId: PlanName) {
    if (!token) return;
    if (planId === "enterprise") {
      setContactModalOpen(true);
      return;
    }
    setLoading(planId);
    try {
      if (planId === "free") {
        // Free plan activates instantly
        await selectPlan(token, planId);
        await refreshUser();
        setMessage("Plan updated to Free!");
      } else {
        // Paid plans — redirect to Stripe Checkout
        const res = await createCheckoutSession(token, planId, billing);
        if (res.checkout_url) {
          window.location.href = res.checkout_url;
          return;
        }
      }
    } catch (e: any) {
      // If Stripe not configured (503), fall back to instant activation for testing
      if (e.status === 503 || e.status === 400) {
        try {
          await selectPlan(token, planId);
          await refreshUser();
          setMessage(`Plan updated to ${planId} (test mode)!`);
        } catch (e2: any) {
          setMessage(e2.detail || "Failed to update plan");
        }
      } else {
        setMessage(e.detail || "Failed to update plan");
      }
    } finally {
      setLoading(null);
    }
  }

  const totalCredits = user?.credits ?? 0;
  const planCfg = PLANS.find(p => p.id === currentPlan);
  const planMaxCredits =
    currentPlan === "free" ? 500 : currentPlan === "plus" ? 5000 : currentPlan === "pro" ? 25000 : 99999;
  const creditPct = Math.min(100, Math.round((totalCredits / planMaxCredits) * 100));

  return (
    <>
      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
      <div className="grid gap-6">
      {/* ── Credit summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Model Credits */}
        <div className="dashboard-panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Model Credits Remaining</p>
              <p className="mt-2 text-4xl font-bold text-white">{totalCredits.toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-400">of {planMaxCredits.toLocaleString()} this month</p>
            </div>
            <span className="mt-1 flex h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.5)]" />
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${creditPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{creditPct}% used · resets monthly</p>
        </div>

        {/* Voice Agent Dollars */}
        <div className="dashboard-panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Voice Agent Dollars Remaining</p>
              <p className="mt-2 text-4xl font-bold text-white">
                ${billing === "monthly" ? (planCfg?.monthlyPrice ?? 0) : (planCfg?.annualPrice ?? 0)}
                <span className="text-base font-normal text-slate-400">/mo</span>
              </p>
              <p className="mt-1 text-sm text-slate-400 capitalize">{currentPlan} plan · {billing} billing</p>
            </div>
            <span className="mt-1 flex h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.5)]" />
          </div>
          <p className="mt-6 text-xs text-slate-500">Current plan started: {user?.plan_started_at ? new Date(user.plan_started_at).toLocaleDateString() : "—"}</p>
        </div>
      </div>

      {/* ── Plan selection ── */}
      <div className="dashboard-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300">Plans</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Choose your plan</h2>
          </div>
          {/* Monthly / Annual toggle — hidden for org members */}
          {!isOrgMember && (
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              {(["monthly", "annual"] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`rounded-full px-5 py-2 text-sm font-medium capitalize transition
                    ${billing === b ? "bg-cyan-300 text-ink-950" : "text-slate-400 hover:text-white"}`}
                >
                  {b}
                  {b === "annual" && <span className="ml-1.5 text-xs font-semibold text-green-400">–20%</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Org member notice */}
        {isOrgMember && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3.5">
            <Building2 size={16} className="mt-0.5 shrink-0 text-cyan-300" />
            <p className="text-sm text-slate-300">
              You’re a member of an organization. Your plan and credits are managed by your organization’s owner.
              Contact your admin to make changes.
            </p>
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-200">
            {message}
          </div>
        )}

        {/* Plan list */}
        <div className="grid gap-3">
          {PLANS.map(plan => {
            const isActive = plan.id === currentPlan;
            const price =
              plan.monthlyPrice === null
                ? null
                : billing === "annual" && plan.annualPrice !== null
                  ? plan.annualPrice
                  : plan.monthlyPrice;

            return (
              <label
                key={plan.id}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition
                  ${isActive ? "border-cyan-300/50 bg-cyan-300/5" : "border-white/10 bg-white/5"}
                  ${!isOrgMember && !isActive ? "cursor-pointer hover:bg-white/8" : "cursor-default"}`}
              >
                {/* Radio */}
                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition
                  ${isActive ? "border-cyan-300 bg-cyan-300" : "border-white/30"}`}>
                  {isActive && <span className="h-2 w-2 rounded-full bg-ink-950" />}
                </div>

                {/* Plan info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-lg p-1.5 ${isActive ? "bg-cyan-300/20 text-cyan-200" : "bg-white/10 text-slate-400"}`}>
                      {plan.icon}
                    </span>
                    <span className="font-semibold text-white">{plan.label}</span>
                    {isActive && <span className="rounded-full bg-cyan-300/20 px-2 py-0.5 text-xs text-cyan-300">Current</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{plan.credits}</span>
                    <span>·</span>
                    <span>{plan.voices}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {plan.features.map(f => (
                      <span key={f} className="flex items-center gap-1 text-xs text-slate-400">
                        <Check size={11} className="text-green-400" /> {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price / action — hidden for org members */}
                <div className="shrink-0 text-right">
                  {isOrgMember ? (
                    // Show price only, no action buttons
                    price !== null && (
                      <p className="text-lg font-bold text-white">
                        {price === 0 ? "Free" : `$${price}`}
                        {price > 0 && <span className="text-xs font-normal text-slate-400">/mo</span>}
                      </p>
                    )
                  ) : price === null ? (
                    <button
                      onClick={e => { e.preventDefault(); handleSelect("enterprise"); }}
                      className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-300/20 transition"
                    >
                      Contact Us
                    </button>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-white">
                        {price === 0 ? "Free" : `$${price}`}
                        {price > 0 && <span className="text-xs font-normal text-slate-400">/mo</span>}
                      </p>
                      {!isActive && (
                        <button
                          onClick={e => { e.preventDefault(); handleSelect(plan.id); }}
                          disabled={loading === plan.id}
                          className="mt-2 rounded-xl bg-cyan-300 px-4 py-1.5 text-xs font-semibold text-ink-950 hover:bg-cyan-200 transition disabled:opacity-60"
                        >
                          {loading === plan.id ? "…" : "Select"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
