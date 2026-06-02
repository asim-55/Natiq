import { useEffect, useState } from "react";
import { Check, Rocket, Shield, Crown, AlertTriangle } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { createCheckoutSession, confirmCheckoutSession, cancelSubscription, resumeSubscription, fetchSubscriptionInfo } from "../../api/client";
import { useSearchParams } from "react-router-dom";
import type { PlanName } from "../../types";

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
    id: "pro",
    label: "Pro",
    monthlyPrice: 4,
    annualPrice: 3,
    credits: "10,000 credits / mo",
    voices: "Unlimited voices",
    icon: <Crown size={18} />,
    features: ["10,000 monthly credits", "Unlimited voice clones", "All 23 emotions", "API access"],
  },
  {
    id: "startup",
    label: "Startup",
    monthlyPrice: 41,
    annualPrice: 33,
    credits: "70,000 credits / mo",
    voices: "Unlimited voices",
    icon: <Rocket size={18} />,
    features: ["70,000 monthly credits", "Unlimited voice clones", "All 23 emotions", "Priority queue", "API access"],
  },
  {
    id: "scale",
    label: "Scale",
    monthlyPrice: 254,
    annualPrice: 203,
    credits: "500,000 credits / mo",
    voices: "Unlimited voices",
    icon: <Shield size={18} />,
    features: ["500,000 monthly credits", "Unlimited voice clones", "All 23 emotions", "Dedicated queue", "Analytics", "SLA support"],
  },
];

export default function SubscriptionPage() {
  const { user, token, refreshUser } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<PlanName | null>(null);
  const [message, setMessage] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [localCancelAt, setLocalCancelAt] = useState<string | null>(null);

  // If the user is an org member, billing_owner_id is set — they cannot change plans
  const isOrgMember = !!(user as any)?.billing_owner_id;

  const currentPlan = user?.plan ?? "free";

  // Fetch subscription info (next billing date) on mount
  useEffect(() => {
    if (token && currentPlan !== "free") {
      fetchSubscriptionInfo(token)
        .then(res => {
          if (res.next_billing_date) setNextBillingDate(res.next_billing_date);
        })
        .catch(() => {});
    }
  }, [token, currentPlan]);

  // Handle Stripe checkout return
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (checkout === "success") {
      setMessage("Payment successful! Activating your plan...");
      const finalize = async () => {
        try {
          if (token && sessionId) {
            const res = await confirmCheckoutSession(token, sessionId);
            if (res.applied) {
              await refreshUser();
              setMessage("Payment successful! Your plan is now active.");
              return;
            }
            setMessage(res.message || "Payment received. Waiting for activation...");
          }
          // Fallback to refresh in case webhook applies shortly after redirect
          await refreshUser();
        } catch (e: any) {
          setMessage(e?.detail || "Payment received. Waiting for activation...");
          await refreshUser();
        }
      };
      void finalize();
      // Clear the query param
      searchParams.delete("checkout");
      searchParams.delete("session_id");
      setSearchParams(searchParams, { replace: true });
    } else if (checkout === "cancel") {
      setMessage("Checkout was cancelled. You can try again anytime.");
      searchParams.delete("checkout");
      searchParams.delete("session_id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(planId: PlanName) {
    if (!token) return;
    setLoading(planId);
    try {
      // Paid plans — redirect to Stripe Checkout
      const res = await createCheckoutSession(token, planId, billing);
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
        return;
      }
    } catch (e: any) {
      setMessage(e.detail || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  const cancelAt = localCancelAt ?? user?.subscription_cancel_at ?? null;
  const isCancelling = !!cancelAt;
  const hasSubscription = !!user?.has_subscription && currentPlan !== "free";

  async function handleCancelSubscription() {
    if (!token) return;
    setCancelLoading(true);
    try {
      const res = await cancelSubscription(token);
      setLocalCancelAt(res.cancel_at ?? nextBillingDate ?? new Date().toISOString());
      setShowCancelConfirm(false);
      setMessage(res.message);
      await refreshUser();
    } catch (e: any) {
      setMessage(e.detail || "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleResumeSubscription() {
    if (!token) return;
    setCancelLoading(true);
    try {
      const res = await resumeSubscription(token);
      setLocalCancelAt(null);
      setMessage(res.message);
      await refreshUser();
    } catch (e: any) {
      setMessage(e.detail || "Failed to resume subscription");
    } finally {
      setCancelLoading(false);
    }
  }

  const totalCredits = user?.credits ?? 0;
  const planMaxCredits =
    currentPlan === "free" ? 1000 : currentPlan === "pro" ? 10000 : currentPlan === "startup" ? 70000 : currentPlan === "scale" ? 500000 : 1000;
  const creditPct = Math.min(100, Math.round((totalCredits / planMaxCredits) * 100));
  const currentPlanLabel = currentPlan === "startup" ? "Startup" : currentPlan === "scale" ? "Scale" : currentPlan === "pro" ? "Pro" : "Free";
  const billingDisplayDate = isCancelling && cancelAt
    ? new Date(cancelAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : nextBillingDate
      ? new Date(nextBillingDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
      : null;

  return (
    <>
      <div className="grid gap-6">
      {/* ── Credit summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Model Credits */}
        <div className="dashboard-panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Credits remaining</p>
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

        {/* Subscription plan */}
        <div className="dashboard-panel p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Subscription plan</p>
              <p className="mt-2 text-4xl font-bold text-white">{currentPlanLabel}</p>
              <p className="mt-1 text-sm text-slate-400">
                {isCancelling ? "Ends on" : "Next billing"}: {billingDisplayDate ?? "—"}
              </p>
            </div>
            <span className={`mt-1 flex h-2.5 w-2.5 rounded-full ${isCancelling ? "bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]" : "bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.5)]"}`} />
          </div>
          <p className="mt-6 text-xs text-slate-500">Plan started: {user?.plan_started_at ? new Date(user.plan_started_at).toLocaleDateString() : "—"}</p>
        </div>
      </div>

      {/* ── Plan selection ── */}
      <div className="dashboard-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300">Plans</p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {currentPlan === "free" ? "Upgrade your plan" : "Choose your plan"}
            </h2>
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
            <Shield size={16} className="mt-0.5 shrink-0 text-cyan-300" />
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
                  ) : price === null ? null : (
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

      {/* ── Subscription management ── */}
      {hasSubscription && !isOrgMember && (
        <div className="dashboard-panel p-5 sm:p-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300">Subscription</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Manage subscription</h2>

          {isCancelling ? (
            <div className="mt-4">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/5 px-4 py-3.5">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-200">Subscription ending</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Your subscription is set to cancel on{" "}
                    <span className="font-semibold text-white">
                      {new Date(cancelAt!).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </span>.
                    You'll keep your current plan until then. After that, you'll be moved to the Free plan.
                  </p>
                  <button
                    onClick={handleResumeSubscription}
                    disabled={cancelLoading}
                    className="mt-3 rounded-xl bg-cyan-300 px-5 py-2 text-sm font-semibold text-ink-950 hover:bg-cyan-200 transition disabled:opacity-60"
                  >
                    {cancelLoading ? "Resuming…" : "Resume subscription"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-slate-400">
                Your subscription auto-renews {billing === "annual" ? "annually" : "monthly"}.
                If you cancel, you'll keep access until the end of the current billing period.
              </p>
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/20 transition"
                >
                  Cancel subscription
                </button>
              ) : (
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-400/5 px-4 py-3.5">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-200">Are you sure?</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Your plan will remain active until the end of the billing period, then downgrade to Free.
                    </p>
                  </div>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 transition disabled:opacity-60"
                  >
                    {cancelLoading ? "Cancelling…" : "Confirm cancel"}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 transition"
                  >
                    Keep plan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
