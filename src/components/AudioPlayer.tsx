import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play } from "lucide-react";

interface Props {
  src: string;
  downloadName?: string;
}

// Wave heights for the bar visualiser (21 bars)
const WAVE = [40, 65, 50, 80, 55, 90, 60, 45, 75, 50, 85, 55, 40, 70, 55, 80, 45, 65, 88, 50, 60];

export default function AudioPlayer({ src, downloadName = "audio.wav" }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
  }, [src]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
    setPlaying(!playing);
  }

  function fmt(s: number) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  function seekFromEvent(clientX: number) {
    const a = audioRef.current;
    const track = trackRef.current;
    if (!a || !track || !duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromEvent(e.clientX);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    seekFromEvent(e.clientX);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-ink-900/80 px-4 py-3">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
      />

      {/* Play / Pause */}
      <button
        onClick={toggle}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-ink-950 shadow-glow hover:bg-cyan-200 transition active:scale-95 self-center"
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="translate-x-0.5" />}
      </button>

      {/* Waveform + seek */}
      <div className="flex flex-1 flex-col gap-1.5">
        {/* Waveform bar visualiser (doubles as seek track) */}
        <div
          ref={trackRef}
          className="relative flex h-[28px] cursor-pointer items-end gap-[2px] overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          title="Click or drag to seek"
        >
          {WAVE.map((h, i) => {
            const barPct = ((i + 0.5) / WAVE.length) * 100;
            const isPlayed = barPct <= pct;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-colors"
                style={{
                  height: `${h}%`,
                  background: isPlayed
                    ? "linear-gradient(to top, rgb(103,232,249), rgb(167,139,250))"
                    : "rgba(255,255,255,0.12)",
                  animation: playing ? `wave-bounce ${0.6 + (i % 5) * 0.12}s ease-in-out infinite alternate` : "none",
                  animationDelay: `${(i * 0.04) % 0.5}s`,
                }}
              />
            );
          })}
          {/* invisible full-width hit area so edges are easy to click */}
          <div className="pointer-events-none absolute inset-0" />
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-slate-500">
          <span className="tabular-nums">{fmt(current)}</span>
          <span className="tabular-nums">{fmt(duration)}</span>
        </div>
      </div>

      {/* Download */}
      <a
        href={src}
        download={downloadName}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-cyan-300 transition self-center"
        title="Download"
      >
        <Download size={15} />
      </a>

      <style>{`
        @keyframes wave-bounce {
          from { transform: scaleY(0.55); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
