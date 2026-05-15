import { Mic2 } from "lucide-react";

export default function ModelsPage() {
  return (
    <section className="dashboard-panel p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm text-cyan-200">Model catalog</p><h2 className="mt-1 text-2xl font-semibold text-white">Available voice models</h2></div>
        <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-300">2 active models</span>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card title="Emotion Model" description="Expressive voice-over output with selectable emotional delivery." tags={["Backend emotion list", "Selectable delivery", "Urdu generation", "Voice reference"]} />
        <Card title="No Emotion Model" description="Clean neutral voice output for IVR, announcements, robotic reads, and standard narration." tags={["Neutral", "IVR", "Announcement", "Narration", "Robotic"]} />
      </div>
    </section>
  );
}

function Card({ title, description, tags }: { title: string; description: string; tags: string[] }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-ink-950/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200"><Mic2 size={20} /></div>
        <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">Ready</span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-300">{tag}</span>)}
      </div>
    </article>
  );
}
