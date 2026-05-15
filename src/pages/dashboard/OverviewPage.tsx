import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock3, Layers3, Mic2, Upload, Users, X, Zap } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { fetchGenerations, fetchVoices, playUrl, uploadVoice } from "../../api/client";
import AudioPlayer from "../../components/AudioPlayer";
import type { Generation, Voice } from "../../types";

export default function OverviewPage() {
  const { user, token, refreshUser, clearIsNew } = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // New users are auto-assigned to free plan — no redirect needed
  useEffect(() => {
    if (!token) return;
    refreshUser();
    Promise.all([fetchGenerations(token, 5).catch(() => []), fetchVoices(token).catch(() => [])]).then(([gens, vcs]) => {
      setGenerations(gens);
      setVoices(vcs);
      setLoading(false);
    });
  }, [token]);

  const handleVoiceUpload = async (file: File | undefined) => {
    if (!file || !token) return;
    setIsUploading(true);
    setUploadError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => { const r = String(reader.result || ""); resolve(r.includes(",") ? r.split(",")[1] : r); };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      await uploadVoice(token, base64, file.name);
      clearIsNew();
      setShowVoiceModal(false);
      // Refresh voices list and navigate to playground
      const updated = await fetchVoices(token);
      setVoices(updated);
      navigate("/dashboard/voice");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* First-time voice upload modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-ink-950 p-8 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                <Mic2 size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Welcome to Paysys!</h2>
                <p className="mt-1 text-sm text-slate-400">Upload a voice sample to get started with text-to-voice generation.</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <p className="text-sm font-medium text-white">Why do I need this?</p>
              <p className="mt-2 text-sm leading-6 text-cyan-50">
                A voice reference sample lets our models clone and reproduce natural speech patterns. Upload any short audio clip (5–30 seconds) of the voice you want to use.
              </p>
            </div>

            {uploadError && <p className="mt-4 rounded-2xl bg-red-400/10 px-4 py-3 text-sm text-red-300">{uploadError}</p>}

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-cyan-300/30 bg-cyan-300/5 px-6 py-10 text-center transition hover:bg-cyan-300/10">
              <Upload size={32} className="text-cyan-200" />
              <span className="text-lg font-semibold text-white">{isUploading ? "Uploading..." : "Click to upload voice sample"}</span>
              <span className="text-sm text-slate-400">WAV, MP3, or any audio format</span>
              <input className="sr-only" type="file" accept="audio/*" onChange={(e) => handleVoiceUpload(e.target.files?.[0])} disabled={isUploading} />
            </label>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Credits remaining" value={String(user?.credits ?? 0)} detail="1 credit per 20 characters" icon={<Zap />} />
        <Metric title="Current plan" value={user?.plan?.toUpperCase() ?? "FREE"} detail="Renews monthly" icon={<Layers3 />} />
        <Metric title="Uploaded voices" value={String(voices.length)} detail="Available for generation" icon={<Users />} />
        <Metric title="Total generations" value={loading ? "..." : String(generations.length)} detail="Recent (last 5 shown)" icon={<Clock3 />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/dashboard/voice" className="dashboard-panel flex items-center gap-4 p-5 transition hover:border-cyan-300/40">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><Zap size={20} /></div>
          <div><h3 className="text-lg font-semibold text-white">Generate voice</h3><p className="text-sm text-slate-400">Open the text-to-voice playground</p></div>
        </Link>
        <Link to="/dashboard/history" className="dashboard-panel flex items-center gap-4 p-5 transition hover:border-cyan-300/40">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-300/10 text-violet-200"><Clock3 size={20} /></div>
          <div><h3 className="text-lg font-semibold text-white">View history</h3><p className="text-sm text-slate-400">Browse past generations and voices</p></div>
        </Link>
      </div>

      <section className="dashboard-panel p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-cyan-200">Recent activity</p><h2 className="mt-1 text-2xl font-semibold text-white">Latest generations</h2></div>
          <Link to="/dashboard/history" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">View all</Link>
        </div>
        {loading ? (
          <p className="mt-6 text-sm text-slate-400">Loading...</p>
        ) : generations.length === 0 ? (
          <p className="mt-6 text-sm text-slate-400">No generations yet. Go to the playground to create your first one.</p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
            {generations.map((gen) => (
              <div key={gen.id} className="grid gap-2 border-b border-white/10 bg-white/5 p-4 text-sm last:border-b-0 sm:grid-cols-[1fr_0.6fr_0.6fr_0.8fr]">
                <span className="truncate font-medium text-white">{gen.text.slice(0, 60)}{gen.text.length > 60 ? "..." : ""}</span>
                <span className="capitalize text-slate-400">{gen.emotion}</span>
                <span className="uppercase text-slate-400">{gen.language}</span>
                <span className="text-slate-400">
                  {token && <AudioPlayer src={playUrl(token, gen.id)} downloadName={`natiq_${gen.id}.wav`} />}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Metric({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: ReactNode }) {
  return (
    <div className="dashboard-panel p-5">
      <div className="flex items-center justify-between"><p className="text-sm text-slate-400">{title}</p><span className="text-cyan-200">{icon}</span></div>
      <p className="mt-5 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}
