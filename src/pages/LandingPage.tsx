import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  Code2,
  Network,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import SignInModal from "../auth/SignInModal";
import { useNavigate } from "react-router-dom";

const codeSample = `const res = await fetch("http://10.101.0.21:8000/generate-audio-emotion", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <YOUR_API_TOKEN>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "خوش آمدید! آپ کیسے ہیں؟",
    language: "ur",
    emotion: "happy",
    voice_reference_id: "<YOUR_VOICE_ID>"
  })
});

// Receive WAV audio — play it directly
const blob = await res.blob();
const url  = URL.createObjectURL(blob);
new Audio(url).play();`;

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const cta = () => (user ? navigate("/dashboard/overview") : setModalOpen(true));

  return (
    <>
      <main className="relative z-10">
        {/* Hero */}
        <section className="section-pad pt-40">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-200">
              <Sparkles size={16} /> Enterprise voice generation
            </div>
            <h1 className="mx-auto max-w-4xl text-balance text-5xl font-semibold leading-tight text-white sm:text-7xl">
              Build lifelike voice
              <span className="bg-gradient-to-r from-cyan-200 to-violet-200 bg-clip-text text-transparent"> experiences </span>
              at scale.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Paysys delivers production-ready voice-over models for banking, IVR, customer engagement, and enterprise workflows. Two simple model families—emotion and neutral.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="primary-button px-8 py-4 text-base" onClick={cta}>
                {user ? "Open playground" : "Get started"}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Performance */}
        <section className="section-pad">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Performance</p>
            <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Built for production reliability.</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: <Zap />, label: "Low latency", detail: "GPU-optimized inference pipeline" },
                { icon: <ShieldCheck />, label: "Enterprise security", detail: "JWT + API token auth, per-user isolation" },
                { icon: <BarChart3 />, label: "Credit tracking", detail: "1,000 free credits, 1 per 20 characters" },
                { icon: <Network />, label: "REST API", detail: "Simple JSON endpoints for any stack" },
              ].map((item) => (
                <div key={item.label} className="soft-card p-6">
                  <span className="text-cyan-200">{item.icon}</span>
                  <h3 className="mt-4 text-xl font-semibold text-white">{item.label}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Developer */}
        <section className="section-pad">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Developer</p>
                <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Integrate in minutes.</h2>
                <p className="mt-6 text-lg text-slate-300">
                  Upload a voice reference, pick a model, send text, and receive audio. Use JWT tokens from the dashboard or programmatic API tokens.
                </p>
                <button className="primary-button mt-8" onClick={cta}>
                  <Code2 size={18} /> Try the API
                </button>
              </div>
              <div className="soft-card overflow-hidden p-0">
                <div className="border-b border-white/10 px-5 py-3 text-xs text-slate-400">example.ts</div>
                <pre className="overflow-x-auto p-5 text-sm leading-7 text-cyan-100"><code>{codeSample}</code></pre>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="section-pad">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Use cases</p>
            <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Voice for every industry.</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: <Building2 />, title: "Banking & Finance", text: "Secure, professional IVR voice prompts." },
                { icon: <BriefcaseBusiness />, title: "Enterprise", text: "Internal comms, announcements, training." },
                { icon: <Bot />, title: "AI Assistants", text: "Natural voice output for conversational agents." },
              ].map((c) => (
                <div key={c.title} className="soft-card p-6">
                  <span className="text-cyan-200">{c.icon}</span>
                  <h3 className="mt-4 text-xl font-semibold text-white">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="section-pad">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">Pricing</p>
            <h2 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Start free. Scale when ready.</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
              Every new account gets 1,000 free credits. 1 credit per 20 characters of generated speech.
            </p>
            <button className="primary-button mx-auto mt-10 px-8 py-4 text-base" onClick={cta}>
              {user ? "Go to dashboard" : "Create free account"}
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Contact */}
        <section className="section-pad">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="soft-card p-8 text-center sm:p-12">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Ready to transform your voice pipeline?</h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-slate-300">
                Contact our team for custom deployments, model fine-tuning, and dedicated infrastructure.
              </p>
              <button className="primary-button mx-auto mt-8 px-8 py-4 text-base" onClick={cta}>
                Get in touch <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>
      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
