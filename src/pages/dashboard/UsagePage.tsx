import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { fetchGenerationUsage, fetchUploadUsage } from "../../api/client";
import type { UsageDay } from "../../api/client";

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  // Format date from YYYY-MM-DD to readable format
  const formattedDate = new Date(label + 'T00:00:00').toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900 px-4 py-3 shadow-xl">
      <p className="text-xs text-slate-400">{formattedDate}</p>
      <p className="mt-1 text-lg font-bold text-cyan-300">{payload[0].value} <span className="text-xs font-normal text-slate-400">credits</span></p>
    </div>
  );
}

// ─── Mini calendar ───────────────────────────────────────────────────────────

function MiniCalendar({
  value, onChange, onClose,
}: {
  value: [Date, Date];
  onChange: (r: [Date, Date]) => void;
  onClose: () => void;
}) {
  const [cursor, setCursor] = useState(() => new Date(value[0].getFullYear(), value[0].getMonth(), 1));
  const [selecting, setSelecting] = useState<Date | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function inRange(d: Date) {
    if (!selecting) return d >= value[0] && d <= value[1];
    const lo = selecting < d ? selecting : d;
    const hi = selecting < d ? d : selecting;
    return d >= lo && d <= hi;
  }

  function handleClick(d: Date) {
    if (!selecting) {
      setSelecting(d);
    } else {
      const lo = selecting < d ? selecting : d;
      const hi = selecting < d ? d : selecting;
      onChange([lo, hi]);
      setSelecting(null);
      onClose();
    }
  }

  return (
    <div className="w-72 rounded-2xl border border-white/10 bg-ink-900 p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-white/10 text-slate-400"><ChevronLeft size={16} /></button>
        <span className="text-sm font-semibold text-white">{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-white/10 text-slate-400"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <span key={d} className="text-xs text-slate-500 py-1">{d}</span>
        ))}
        {cells.map((d, i) =>
          d == null ? <span key={i} /> : (
            <button
              key={i}
              onClick={() => handleClick(d)}
              className={`rounded-lg py-1 text-xs font-medium transition
                ${inRange(d) ? "bg-cyan-300/20 text-cyan-200" : "text-slate-300 hover:bg-white/10"}
                ${d.getTime() === value[0].getTime() || d.getTime() === value[1].getTime() ? "bg-cyan-300 !text-ink-950" : ""}
              `}
            >
              {d.getDate()}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ─── Usage chart block ───────────────────────────────────────────────────────

function UsageChart({ data, title }: { data: { date: string; credits: number }[]; title: string }) {
  // Keep original date format for dataKey, use formatter for display
  const tickFormatter = (value: string) => {
    const date = new Date(value + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };
  
  // Calculate interval to show reasonable number of ticks
  const interval = data.length > 15 ? Math.floor(data.length / 10) : data.length > 7 ? 1 : 0;
  
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-slate-300">{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={8}>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: "#94a3b8", fontSize: 11 }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={tickFormatter}
            interval={interval}
          />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="credits" fill="#67e8f9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const TABS = ["Voice Generation", "Voice Uploads"] as const;
type Tab = typeof TABS[number];


export default function UsagePage() {
  const { user, token } = useAuth();
  const plan = user?.plan ?? "free";

  const [genData, setGenData] = useState<UsageDay[]>([]);
  const [uploadData, setUploadData] = useState<UsageDay[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoadingData(true);
    Promise.all([
      fetchGenerationUsage(token, 30).catch(() => [] as UsageDay[]),
      fetchUploadUsage(token, 30).catch(() => [] as UsageDay[]),
    ]).then(([gen, upl]) => {
      setGenData(gen);
      setUploadData(upl);
    }).finally(() => setLoadingData(false));
  }, [token]);

  const [tab, setTab] = useState<Tab>("Voice Generation");
  const [calOpen, setCalOpen] = useState(false);
  const [calPos, setCalPos] = useState({ top: 0, right: 0 });
  const calBtnRef = useRef<HTMLButtonElement>(null);
  const [dateRange, setDateRange] = useState<[Date, Date]>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return [start, end];
  });

  // Close calendar on scroll / resize
  useEffect(() => {
    if (!calOpen) return;
    const close = () => setCalOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [calOpen]);

  const fmtDate = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

  const inSelectedRange = (item: UsageDay) => {
    // Date is in YYYY-MM-DD format from database
    const itemDate = new Date(item.date + 'T00:00:00');
    const start = new Date(dateRange[0]);
    const end = new Date(dateRange[1]);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return itemDate >= start && itemDate <= end;
  };

  const chartData = (tab === "Voice Generation" ? genData : uploadData).filter(inSelectedRange);

  return (
    <div className="grid gap-6">
      {/* ── Header ── */}
      <div className="dashboard-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300">Analytics</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Usage</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Date Range Picker */}
            <div className="relative">
              <button
                ref={calBtnRef}
                onClick={() => {
                  if (!calOpen) {
                    const r = calBtnRef.current?.getBoundingClientRect();
                    if (r) setCalPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
                  }
                  setCalOpen(o => !o);
                }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10 transition"
              >
                <Calendar size={14} />
                {fmtDate(dateRange[0])} – {fmtDate(dateRange[1])}
              </button>
              {calOpen && createPortal(
                <div
                  style={{ position: "fixed", top: calPos.top, right: calPos.right, zIndex: 9999 }}
                  onClick={e => e.stopPropagation()}
                >
                  <MiniCalendar
                    value={dateRange}
                    onChange={r => setDateRange(r)}
                    onClose={() => setCalOpen(false)}
                  />
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition ${tab === t ? "bg-cyan-300 text-ink-950" : "text-slate-400 hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main chart ── */}
      <div className="dashboard-panel p-5 sm:p-6">
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Total Usage</p>
        <p className="text-2xl font-bold text-white mb-6">
          {chartData.reduce((s, d) => s + d.credits, 0).toLocaleString()} <span className="text-sm font-normal text-slate-400">credits</span>
        </p>
        {loadingData ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-cyan-300 border-t-transparent animate-spin" />
          </div>
        ) : chartData.length === 0 || chartData.every(d => d.credits === 0) ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <span>No usage yet in this period</span>
          </div>
        ) : (
          <UsageChart data={chartData} title={tab} />
        )}
      </div>

      {/* ── Breakdown by capability ── */}
      <div className="dashboard-panel p-5 sm:p-6">
        <p className="text-sm font-semibold text-white mb-5">By capability</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            {loadingData || (chartData.length === 0 || chartData.every(d => d.credits === 0)) ? (
              <div className="flex h-[200px] items-center justify-center text-slate-500 text-xs">No data</div>
            ) : (
              <UsageChart data={genData} title="Text-to-Speech" />
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            {loadingData || (uploadData.length === 0 || uploadData.every(d => d.credits === 0)) ? (
              <div className="flex h-[200px] items-center justify-center text-slate-500 text-xs">No data</div>
            ) : (
              <UsageChart data={uploadData} title="Voice Cloning" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
