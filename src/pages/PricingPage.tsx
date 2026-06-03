import { useState } from "react";
import { Building2, Check, Crown, Rocket, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SignInModal from "../auth/SignInModal";
import ContactModal from "../components/ContactModal";
import PricingCalculator from "../components/PricingCalculator";

interface PlanCard {
  label: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  credits: string;
  icon: React.ReactNode;
  features: string[];
  highlight?: boolean;
}

const plans: PlanCard[] = [
  {
    label: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    credits: "1,000 credits/mo",
    icon: <Zap size={24} />,
    features: [
      "1 voice clone",
      "5 emotions (happy, sad, angry, calm, confused)",
      "1,000 monthly credits",
      "1 credit per 20 characters",
      "10 credits per voice clone",
    ],
  },
  {
    label: "Pro",
    monthlyPrice: 4,
    annualPrice: 3,
    credits: "10,000 credits/mo",
    icon: <Crown size={24} />,
    highlight: true,
    features: [
      "5 voice uploads",
      "All 23 emotions",
      "10,000 monthly credits",
      "1 credit per 20 characters",
      "10 credits per voice clone",
      "API access",
    ],
  },
  {
    label: "Startup",
    monthlyPrice: 41,
    annualPrice: 33,
    credits: "70,000 credits/mo",
    icon: <Rocket size={24} />,
    features: [
      "Unlimited voice clones",
      "All 23 emotions",
      "70,000 monthly credits",
      "1 credit per 20 characters",
      "10 credits per voice clone",
      "Priority support",
    ],
  },
  {
    label: "Scale",
    monthlyPrice: 254,
    annualPrice: 203,
    credits: "500,000 credits/mo",
    icon: <Shield size={24} />,
    features: [
      "Unlimited voice clones",
      "All 23 emotions",
      "500,000 monthly credits",
      "1 credit per 20 characters",
      "10 credits per voice clone",
      "SLA support",
    ],
  },
  {
    label: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    credits: "Custom credits",
    icon: <Building2 size={24} />,
    features: [
      "Custom credit volume",
      "Unlimited voice clones",
      "All 23 emotions",
      "Dedicated support",
      "Custom SLA",
      "Deployment planning",
    ],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [modalOpen, setModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const handleGetStarted = (planLabel: string) => {
    if (planLabel === "Enterprise") {
      setContactModalOpen(true);
      return;
    }
    if (user) {
      navigate("/dashboard/overview");
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
      <main className="relative z-10 pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold text-cyan-200">Pricing</p>
          <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Pay only for what you use. Credits renew monthly. 1 credit per 20 characters of generated speech, 10 credits per voice clone.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {(["monthly", "annual"] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`rounded-full px-6 py-2.5 text-sm font-medium capitalize transition
                  ${billing === b ? "bg-cyan-300 text-ink-950" : "text-slate-400 hover:text-white"}`}
              >
                {b}
                {b === "annual" && <span className="ml-1.5 text-xs font-semibold text-green-400">Save with annual</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {plans.map((plan) => {
            const price =
              plan.monthlyPrice === null
                ? null
                : billing === "annual" && plan.annualPrice !== null
                  ? plan.annualPrice
                  : plan.monthlyPrice;

            return (
              <div
                key={plan.label}
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
                  {price === null ? "Custom" : price === 0 ? "$0" : `$${price}`}
                  {price !== null && price > 0 && (
                    <span className="text-sm font-normal text-slate-400">/mo</span>
                  )}
                </p>
                {billing === "annual" && plan.annualPrice !== null && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    ${(plan.annualPrice * 12).toFixed(0)} billed annually
                  </p>
                )}

                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check size={14} className="mt-0.5 shrink-0 text-cyan-300" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleGetStarted(plan.label)}
                  className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-cyan-300 text-ink-950 hover:bg-cyan-200"
                      : "border border-white/10 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {plan.label === "Enterprise" ? "Contact us" : "Get started"}
                </button>
              </div>
            );
          })}
        </div>

        {/* How credits work */}
        <section className="mt-20">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">How credits work</h2>
            <p className="mt-2 text-sm text-slate-400">
              Credits are consumed based on word count and voice cloning
            </p>
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-ink-950/70 p-5 text-center">
              <p className="text-3xl font-bold text-cyan-200">1</p>
              <p className="mt-2 text-sm text-white">credit per 20 characters</p>
              <p className="mt-1 text-xs text-slate-400">of generated speech</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-ink-950/70 p-5 text-center">
              <p className="text-3xl font-bold text-cyan-200">10</p>
              <p className="mt-2 text-sm text-white">credits per voice clone</p>
              <p className="mt-1 text-xs text-slate-400">upload a voice sample</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-ink-950/70 p-5 text-center">
              <p className="text-3xl font-bold text-cyan-200">30</p>
              <p className="mt-2 text-sm text-white">day renewal cycle</p>
              <p className="mt-1 text-xs text-slate-400">credits reset monthly</p>
            </div>
          </div>
        </section>

        {/* Pricing calculator */}
        <section className="mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-white">Calculate your usage</h2>
            <p className="mt-2 text-sm text-slate-400">
              Estimate how many credits you'll need based on your audio generation volume
            </p>
          </div>
          <div className="mx-auto max-w-lg">
            <PricingCalculator />
          </div>
        </section>
      </div>
    </main>
    </>
  );
}
