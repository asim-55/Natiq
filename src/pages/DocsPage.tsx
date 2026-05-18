import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
    description: "Create a new account with email and password. Returns JWT access token and user profile. New users receive 500 free credits.",
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
    description: "Generate expressive Roman Urdu speech with one of 23 emotions. Supports Urdu text (both Urdu script and Roman Urdu). Costs 1 credit per 20 characters. Returns WAV audio file.",
    auth: true,
    body: `{
  "text": "Aaj ka din bohat khoobsurat hai",
  "language": "ur",
  "emotion": "happy",
  "voice_reference_id": "<VOICE_ID>"
}`,
    curl: `curl -s ${BASE}/generate-audio-emotion \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Aaj ka din bohat khoobsurat hai","language":"ur","emotion":"happy","voice_reference_id":"<VOICE_ID>"}' \\
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
      className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
      title="Copy"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <div id={ep.id} className="rounded-3xl border border-white/10 bg-ink-950/70 p-5 scroll-mt-24">
      {/* Header */}
      <button
        className="flex w-full flex-wrap items-center gap-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${methodColors[ep.method]}`}>
          {ep.method}
        </span>
        <code className="text-sm font-semibold text-white">{ep.path}</code>
        {ep.auth && (
          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
            AUTH
          </span>
        )}
        <span className="ml-auto text-xs text-slate-500">{open ? "▲" : "▼"}</span>
      </button>
      <p className="mt-2 text-sm leading-6 text-slate-400">{ep.description}</p>

      {open && (
        <div className="mt-4 space-y-4">
          {ep.body && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Request body</p>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-ink-950 p-4 text-xs leading-5 text-cyan-100">
                {ep.body}
              </pre>
            </div>
          )}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">curl</p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-ink-950 p-4 pr-12 text-xs leading-5 text-cyan-100">
                {ep.curl}
              </pre>
              <CopyButton text={ep.curl} />
            </div>
          </div>
          {ep.responseNote && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Example response</p>
              <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-ink-950 p-4 text-xs leading-5 text-emerald-200">
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
  { title: "Authentication", ids: ["signup", "login"] },
  { title: "API Tokens", ids: ["create-token", "list-tokens", "delete-token"] },
  { title: "Voice Upload", ids: ["upload-voice", "my-voices"] },
  { title: "Audio Generation", ids: ["gen-emotion"] },
  { title: "User Profile", ids: ["me"] },
];

export default function DocsPage() {
  return (
    <main className="relative z-10 pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <p className="text-sm font-semibold text-cyan-200">API Reference</p>
        <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
          Natiq API Documentation
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          Complete REST API reference for Natiq Roman Urdu TTS. Generate expressive, emotionally rich speech with 23 emotion styles. All authenticated endpoints accept either a JWT session token or a long-lived <code className="rounded bg-white/10 px-1.5 text-cyan-200">psk_</code> API token via the <code className="rounded bg-white/10 px-1.5 text-cyan-200">Authorization: Bearer</code> header.
        </p>

        {/* Quick-start box */}
        <div className="mt-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-5">
          <p className="text-sm font-semibold text-white">Quick start — Getting started</p>
          <ol className="mt-3 list-inside list-decimal space-y-1 text-sm leading-6 text-slate-300">
            <li><code className="rounded bg-white/10 px-1 text-cyan-200">POST /auth/signup</code> — create account, receive 500 free credits</li>
            <li><code className="rounded bg-white/10 px-1 text-cyan-200">POST /auth/api-tokens</code> — create a <code className="text-cyan-200">psk_</code> token for programmatic access</li>
            <li><code className="rounded bg-white/10 px-1 text-cyan-200">POST /upload-voice</code> — upload a voice reference (10-30s audio), get <code className="text-cyan-200">voice_id</code></li>
            <li><code className="rounded bg-white/10 px-1 text-cyan-200">POST /generate-audio-emotion</code> — generate Roman Urdu speech with emotion (1 credit per 20 characters)</li>
            <li><code className="rounded bg-white/10 px-1 text-cyan-200">GET /me</code> — check your remaining credits and profile</li>
          </ol>
        </div>

        {/* Emotion Support */}
        <div className="mt-6 rounded-3xl border border-violet-300/20 bg-violet-300/5 p-5">
          <p className="text-sm font-semibold text-white">23 Supported Emotions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["neutral", "happy", "sad", "angry", "excited", "calm", "serious", "romantic", "dramatic", "funny", "fearful", "surprised", "confused", "disappointed", "hopeful", "motivational", "whisper", "sarcastic", "narrative", "empathetic", "formal", "casual", "poetic"].map(emotion => (
              <span key={emotion} className="rounded-full bg-violet-400/15 px-2.5 py-1 text-xs font-medium text-violet-200">
                {emotion}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Use <code className="rounded bg-white/10 px-1 text-cyan-200">GET /emotions</code> to programmatically fetch the list.
          </p>
        </div>

        {/* TOC */}
        <nav className="mt-8 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.title}
              href={`#${s.ids[0]}`}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {s.title}
            </a>
          ))}
        </nav>

        {/* Endpoint sections */}
        {sections.map((s) => (
          <div key={s.title} className="mt-10">
            <h2 className="text-lg font-semibold text-white">{s.title}</h2>
            <div className="mt-4 space-y-4">
              {s.ids.map((id) => {
                const ep = endpoints.find((e) => e.id === id);
                return ep ? <EndpointCard key={id} ep={ep} /> : null;
              })}
            </div>
          </div>
        ))}

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-cyan-200 transition hover:text-white"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
