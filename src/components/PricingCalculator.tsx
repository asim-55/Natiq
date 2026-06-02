import { useState } from "react";
import { Equal } from "lucide-react";

// 1 credit = 20 chars; ~150 words/min × ~6 chars/word = 900 chars/min
const CHARS_PER_CREDIT = 20;
const CHARS_PER_MINUTE = 900;
const CREDITS_PER_MINUTE = CHARS_PER_MINUTE / CHARS_PER_CREDIT; // 90 credits = 1 min

type TimeUnit = "Seconds" | "Minutes" | "Hours";

const UNIT_TO_MINUTES: Record<TimeUnit, number> = {
  Seconds: 1 / 60,
  Minutes: 1,
  Hours: 60,
};

function creditsToTime(credits: number, unit: TimeUnit): string {
  const minutes = credits / CREDITS_PER_MINUTE;
  const val = minutes / UNIT_TO_MINUTES[unit];
  if (!isFinite(val)) return "0";
  return parseFloat(val.toFixed(3)).toString();
}

function timeToCredits(time: number, unit: TimeUnit): string {
  const minutes = time * UNIT_TO_MINUTES[unit];
  const credits = minutes * CREDITS_PER_MINUTE;
  return Math.round(credits).toString();
}

export default function PricingCalculator() {
  const [credits, setCredits] = useState("1000");
  const [time, setTime] = useState(() => creditsToTime(1000, "Minutes"));
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("Minutes");
  const [creditUnit] = useState("Credits");

  function handleCreditsChange(val: string) {
    setCredits(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) setTime(creditsToTime(n, timeUnit));
  }

  function handleTimeChange(val: string) {
    setTime(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) setCredits(timeToCredits(n, timeUnit));
  }

  function handleTimeUnitChange(unit: TimeUnit) {
    setTimeUnit(unit);
    const n = parseFloat(credits);
    if (!isNaN(n) && n >= 0) setTime(creditsToTime(n, unit));
  }

  const inputBase =
    "flex-1 min-w-0 bg-transparent text-white text-2xl font-semibold outline-none placeholder:text-slate-600 tabular-nums";
  const selectBase =
    "border-l border-white/10 bg-transparent pl-3 pr-1 text-sm font-medium text-slate-300 outline-none cursor-pointer hover:text-cyan-300 transition";

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-ink-950/80 shadow-xl backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300/70">
          Credit converter
        </p>
        <p className="mt-0.5 text-sm text-slate-400">
          1 credit = 20 chars · {CREDITS_PER_MINUTE} credits / min
        </p>
      </div>

      {/* Top row — Credits */}
      <div className="mx-6 mt-4 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-4 focus-within:border-cyan-300/50 transition">
        <input
          type="number"
          min={0}
          placeholder="750"
          value={credits}
          onChange={(e) => handleCreditsChange(e.target.value)}
          className={inputBase}
        />
        <select
          value={creditUnit}
          disabled
          className={selectBase + " opacity-60"}
        >
          <option>Credits</option>
        </select>
      </div>

      {/* Divider + equals icon */}
      <div className="relative my-5 flex items-center justify-center">
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 border-t border-white/10" />
        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/40 bg-ink-950 text-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.25)]">
          <Equal size={16} strokeWidth={2.5} />
        </div>
      </div>

      {/* Bottom row — Time */}
      <div className="mx-6 mb-6 flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-4 focus-within:border-cyan-300/50 transition">
        <input
          type="number"
          min={0}
          step="any"
          placeholder="1"
          value={time}
          onChange={(e) => handleTimeChange(e.target.value)}
          className={inputBase}
        />
        <select
          value={timeUnit}
          onChange={(e) => handleTimeUnitChange(e.target.value as TimeUnit)}
          className={selectBase}
        >
          <option>Minutes</option>
          <option>Seconds</option>
          <option>Hours</option>
        </select>
      </div>

      {/* Footer note */}
      <div className="border-t border-white/10 bg-white/[0.02] px-6 py-3 text-xs text-slate-500">
        ≈ {Math.round(parseFloat(credits) * CHARS_PER_CREDIT || 0).toLocaleString()} characters ·&nbsp;
        {Math.round((parseFloat(credits) * CHARS_PER_CREDIT || 0) / 6).toLocaleString()} words
      </div>
    </div>
  );
}
