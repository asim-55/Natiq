import { useState } from "react";
import { Check, Copy, BookOpen, Key, Upload, Mic2, User, Lock, Zap } from "lucide-react";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

interface Endpoint {
  id: string;
  method: "GET" | "POST" | "DELETE" | "PATCH";
  path: string;
  title: string;
  description: string;
  auth: boolean;
  body?: string;
  curl: string;
  responseNote?: string;
}

const BASE = "https://api.natiq.ai";

const endpoints: Endpoint[] = [
  /* ---- Auth ---- */
  {
    id: "signup",
    method: "POST",
    path: "/auth/signup",
    title: "Sign up",
    description: "Create a new account with email and password. Returns JWT access token and user profile. New users receive 1,000 free credits.",
    auth: false,
    body: `{
  "email": "you@example.com",
  "password": "yourpassword",
  "name": "Your Name"
}`,
    curl: `curl -s ${BASE}/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"yourpassword","name":"Your Name"}'`,
  },
  {
    id: "login",
    method: "POST",
    path: "/auth/login",
    title: "Login",
    description: "Authenticate with email and password. Returns JWT access token valid for 7 days.",
    auth: false,
    body: `{
  "email": "you@example.com",
  "password": "yourpassword"
}`,
    curl: `curl -s ${BASE}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"you@example.com","password":"yourpassword"}'`,
  },

  /* ---- API Tokens ---- */
  {
    id: "create-token",
    method: "POST",
    path: "/auth/api-tokens",
    title: "Create API token",
    description: "Generate a long-lived API token (psk_...) for programmatic access. The full token is shown only once — save it securely.",
    auth: true,
    body: `{
  "name": "my-production-app",
  "expires_at": "2025-12-31T23:59:59Z"
}`,
    curl: `curl -s ${BASE}/auth/api-tokens \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"my-production-app"}'`,
  },
  {
    id: "list-tokens",
    method: "GET",
    path: "/auth/api-tokens",
    title: "List API tokens",
    description: "Lists all active API tokens for your account (prefix only, not the full secret).",
    auth: true,
    curl: `curl -s ${BASE}/auth/api-tokens \\
  -H "Authorization: Bearer <TOKEN>"`,
  },
  {
    id: "delete-token",
    method: "DELETE",
    path: "/auth/api-tokens/{token_id}",
    title: "Revoke API token",
    description: "Permanently deactivates an API token by its ID.",
    auth: true,
    curl: `curl -s -X DELETE ${BASE}/auth/api-tokens/1 \\
  -H "Authorization: Bearer <TOKEN>"`,
  },

  /* ---- Voice Upload ---- */
  {
    id: "upload-voice",
    method: "POST",
    path: "/upload-voice",
    title: "Upload voice reference",
    description: "Upload a base64-encoded audio file (.wav, .mp3, .ogg, .webm) as your voice reference for instant voice cloning. Returns a voice_id used in generation requests. Recommended: 10-30 seconds of clean, high-quality speech.",
    auth: true,
    body: `{
  "audio_base64": "<BASE64_ENCODED_AUDIO>",
  "filename": "my-voice.wav"
}`,
    curl: `curl -s ${BASE}/upload-voice \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d "{\\"audio_base64\\":\\"$(base64 -w0 /path/to/voice.wav)\\", \\"filename\\":\\"my-voice.wav\\"}"`,
    responseNote: '{"status":"ok","voice_id":"abc123xyz"}',
  },
  {
    id: "my-voices",
    method: "GET",
    path: "/my-voices",
    title: "List my voices",
    description: "Returns all voice references you have uploaded for voice cloning.",
    auth: true,
    curl: `curl -s ${BASE}/my-voices \\
  -H "Authorization: Bearer <TOKEN>"`,
  },

  /* ---- Generation ---- */
  {
    id: "gen-emotion",
    method: "POST",
    path: "/generate-audio-emotion",
    title: "Generate audio with emotion",
    description: "Generate expressive Roman Urdu speech with one of 23 emotions. Supports Urdu text (both Urdu script and Roman Urdu). Costs 1 credit per 20 characters. Returns WAV audio file. Available on Pro, Startup, and Scale plans. Optional: speed (0.5-2.0, default 1.0) and volume (0.0-2.0, default 1.0).",
    auth: true,
    body: `{
  "text": "Aaj ka din bohat khoobsurat hai",
  "language": "ur",
  "emotion": "happy",
  "voice_reference_id": "<VOICE_ID>",
  "speed": 1.0,
  "volume": 1.0
}`,
    curl: `curl -s ${BASE}/generate-audio-emotion \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Aaj ka din bohat khoobsurat hai","language":"ur","emotion":"happy","voice_reference_id":"<VOICE_ID>","speed":1.0,"volume":1.0}' \\
  --output output.wav`,
    responseNote: "Returns audio/wav file",
  },
  {
    id: "gen-no-emotion",
    method: "POST",
    path: "/generate-audio-no-emotion",
    title: "Generate audio (neutral)",
    description: "Generate neutral Roman Urdu speech without emotion tags. Supports 23+ languages including Arabic, English, Hindi, and more. Costs 1 credit per 20 characters. Returns WAV audio file. Available on all plans. Optional: speed (0.5-2.0, default 1.0) and volume (0.0-2.0, default 1.0).",
    auth: true,
    body: `{
  "text": "Welcome to Mayna voice platform",
  "language": "en",
  "voice_reference_id": "<VOICE_ID>",
  "speed": 1.0,
  "volume": 1.0
}`,
    curl: `curl -s ${BASE}/generate-audio-no-emotion \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Welcome to Mayna voice platform","language":"en","voice_reference_id":"<VOICE_ID>","speed":1.0,"volume":1.0}' \\
  --output output.wav`,
    responseNote: "Returns audio/wav file",
  },

  /* ---- User ---- */
  {
    id: "me",
    method: "GET",
    path: "/me",
    title: "Get my profile",
    description: "Returns your user profile including remaining credits, plan, and account details.",
    auth: true,
    curl: `curl -s ${BASE}/me \\
  -H "Authorization: Bearer <TOKEN>"`,
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
  POST: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
  DELETE: "bg-red-400/20 text-red-300 border-red-400/30",
  PATCH: "bg-amber-400/20 text-amber-300 border-amber-400/30",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className={`absolute right-3 top-3 flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition ${
        copied 
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" 
          : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? (
        <>
          <Check size={12} />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy
        </>
      )}
    </button>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <div id={ep.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent overflow-hidden scroll-mt-24">
      {/* Header */}
      <button
        className="flex w-full items-start gap-4 p-5 text-left transition hover:bg-white/[0.02]"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${methodColors[ep.method]}`}>
              {ep.method}
            </span>
            {ep.auth && (
              <span className="flex items-center gap-1 rounded-lg bg-violet-400/15 border border-violet-400/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                <Lock size={10} />
                AUTH
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-white">{ep.title}</h3>
          </div>
          <code className="text-sm text-cyan-300 font-mono">{ep.path}</code>
          <p className="mt-2 text-sm leading-6 text-slate-400">{ep.description}</p>
        </div>
        <div className="flex-shrink-0 mt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition">
            <span className="text-xs">{open ? "▲" : "▼"}</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 bg-black/20 p-5 space-y-5">
          {ep.body && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 rounded-full bg-cyan-400"></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Request Body</p>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-ink-950 p-4 text-xs leading-6 text-cyan-100 font-mono">
                {ep.body}
              </pre>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-1 rounded-full bg-cyan-400"></div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">cURL Example</p>
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-ink-950 p-4 pr-14 text-xs leading-6 text-cyan-100 font-mono">
                {ep.curl}
              </pre>
              <CopyButton text={ep.curl} />
            </div>
          </div>
          {ep.responseNote && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 rounded-full bg-emerald-400"></div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Example Response</p>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-xs leading-6 text-emerald-200 font-mono">
                {ep.responseNote}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const sections = [
  { title: "Authentication", ids: ["signup", "login"], icon: Lock },
  { title: "API Tokens", ids: ["create-token", "list-tokens", "delete-token"], icon: Key },
  { title: "Voice Upload", ids: ["upload-voice", "my-voices"], icon: Upload },
  { title: "Audio Generation", ids: ["gen-emotion", "gen-no-emotion"], icon: Mic2 },
  { title: "User Profile", ids: ["me"], icon: User },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("signup");

  return (
    <main className="relative z-10 pt-20 pb-20 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Header */}
              <div className="pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                    <BookOpen size={16} className="text-cyan-300" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">API Docs</h2>
                </div>
                <p className="text-xs text-slate-400">Complete REST API reference</p>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = section.ids.includes(activeSection);
                  return (
                    <div key={section.title}>
                      <a
                        href={`#${section.ids[0]}`}
                        onClick={() => setActiveSection(section.ids[0])}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          isActive 
                            ? "bg-cyan-400/10 text-cyan-300" 
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon size={16} />
                        {section.title}
                      </a>
                      {isActive && (
                        <div className="ml-9 mt-1 space-y-1">
                          {section.ids.map((id) => {
                            const ep = endpoints.find((e) => e.id === id);
                            return ep ? (
                              <a
                                key={id}
                                href={`#${id}`}
                                className="block px-3 py-1.5 text-xs text-slate-500 hover:text-cyan-300 transition"
                              >
                                {ep.title}
                              </a>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Quick Links */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Quick Links</p>
                <div className="space-y-1">
                  <Link to="/dashboard/settings" className="block px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-300 transition">
                    Get API Key
                  </Link>
                  <Link to="/dashboard/voice" className="block px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-300 transition">
                    Try Playground
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="max-w-4xl">
            {/* Hero Header */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 mb-4">
                <Zap size={12} className="text-cyan-300" />
                <span className="text-xs font-semibold text-cyan-300">API Reference</span>
              </div>
              <h1 className="text-4xl font-bold text-white sm:text-5xl mb-4">
                Mayna API Documentation
              </h1>
              <p className="text-lg leading-8 text-slate-300 max-w-3xl">
                Generate expressive Roman Urdu speech with 23 emotion styles. All authenticated endpoints accept either a JWT session token or a long-lived <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-200">psk_</code> API token.
              </p>
            </div>

            {/* Getting Started Card */}
            <div className="mb-8 rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/5 to-cyan-400/0 p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-400/10 flex items-center justify-center flex-shrink-0">
                  <Zap size={20} className="text-cyan-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-3">Quick Start Guide</h3>
                  <ol className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-bold text-cyan-300 flex-shrink-0">1</span>
                      <span><code className="text-cyan-300">POST /auth/signup</code> — Create account, receive 1,000 free credits</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-bold text-cyan-300 flex-shrink-0">2</span>
                      <span><code className="text-cyan-300">POST /auth/api-tokens</code> — Generate your API key</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-bold text-cyan-300 flex-shrink-0">3</span>
                      <span><code className="text-cyan-300">POST /upload-voice</code> — Upload 10-30s voice reference</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-bold text-cyan-300 flex-shrink-0">4</span>
                      <span><code className="text-cyan-300">POST /generate-audio-emotion</code> — Generate speech with emotion</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Emotions Card */}
            <div className="mb-12 rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-400/5 to-violet-400/0 p-6">
              <h3 className="text-base font-semibold text-white mb-3">23 Supported Emotions</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {["neutral", "happy", "sad", "angry", "excited", "calm", "serious", "romantic", "dramatic", "funny", "fearful", "surprised", "confused", "disappointed", "hopeful", "motivational", "whisper", "sarcastic", "narrative", "empathetic", "formal", "casual", "poetic"].map(emotion => (
                  <span key={emotion} className="rounded-lg bg-violet-400/15 px-2.5 py-1 text-xs font-medium text-violet-200 border border-violet-400/20">
                    {emotion}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                All emotions available on Pro, Startup, and Scale plans. Free plan supports a limited emotion set.
              </p>
            </div>

            {/* Endpoint Sections */}
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} id={section.ids[0]} className="mb-12 scroll-mt-24">
                  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
                    <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
                      <Icon size={18} className="text-cyan-300" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                  </div>
                  <div className="space-y-6">
                    {section.ids.map((id) => {
                      const ep = endpoints.find((e) => e.id === id);
                      return ep ? <EndpointCard key={id} ep={ep} /> : null;
                    })}
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-white/10 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-white transition"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
