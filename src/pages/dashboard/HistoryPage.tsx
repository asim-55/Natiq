import { useEffect, useState } from "react";
import { Clock3, Mic2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { fetchGenerations, fetchVoices, playUrl } from "../../api/client";
import AudioPlayer from "../../components/AudioPlayer";
import type { Generation, Voice } from "../../types";

export default function HistoryPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"generations" | "voices">("generations");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchGenerations(token, 100).catch(() => []), fetchVoices(token).catch(() => [])]).then(([g, v]) => {
      setGenerations(g); setVoices(v); setLoading(false);
    });
  }, [token]);

  return (
    <section className="dashboard-panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm text-cyan-200">History</p><h2 className="mt-1 text-2xl font-semibold text-white">{tab === "generations" ? "Generations" : "Uploaded voices"}</h2></div>
        <div className="flex rounded-full border border-white/10 bg-ink-950/70 p-1">
          {(["generations", "voices"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm capitalize transition ${tab === t ? "bg-cyan-300 text-ink-950" : "text-slate-300 hover:bg-white/10"}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {loading ? <p className="text-sm text-slate-400">Loading...</p> : tab === "generations" ? (
          generations.length === 0 ? <Empty icon={<Clock3 size={32} />} msg="No generations yet." /> : (
            <div className="overflow-x-auto rounded-3xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Text</th><th className="px-4 py-3">Emotion</th><th className="px-4 py-3">Lang</th><th className="px-4 py-3">Credits</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Audio</th>
                </tr></thead>
                <tbody>
                  {generations.map((gen) => (
                    <tr key={gen.id} className="border-b border-white/10 last:border-b-0">
                      <td className="max-w-[200px] truncate px-4 py-3 text-white" title={gen.text}>{gen.text.slice(0, 60)}{gen.text.length > 60 ? "..." : ""}</td>
                      <td className="px-4 py-3 capitalize text-slate-300">{gen.emotion}</td>
                      <td className="px-4 py-3 uppercase text-slate-300">{gen.language}</td>
                      <td className="px-4 py-3 text-slate-300">{gen.credits_used}</td>
                      <td className="px-4 py-3 text-slate-400">{gen.created_at}</td>
                      <td className="px-4 py-3 min-w-[260px]">{token && <AudioPlayer src={playUrl(token, gen.id)} downloadName={`natiq_${gen.id}.wav`} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : voices.length === 0 ? <Empty icon={<Mic2 size={32} />} msg="No uploaded voices." /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {voices.map((voice) => (
              <div key={voice.voice_id} className="rounded-3xl border border-white/10 bg-ink-950/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-300/10 text-violet-200"><Mic2 size={18} /></div>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{voice.name}</p><p className="mt-0.5 text-xs text-slate-400">{voice.voice_id}</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Created {voice.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Empty({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-ink-950/70 py-16 text-slate-400">{icon}<p className="text-sm">{msg}</p></div>;
}
