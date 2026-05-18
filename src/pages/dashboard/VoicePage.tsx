import { useEffect, useState } from "react";
import { Activity, Play, ChevronDown } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { fetchVoices, generateAudio } from "../../api/client";
import type { Voice } from "../../types";
import UpgradeModal from "../../components/UpgradeModal";
import AudioPlayer from "../../components/AudioPlayer";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_EMOTIONS = [
  "ANGRY","ANXIOUS","APOLOGETIC","ASSERTIVE","BORED","CALM",
  "CONFIDENT","CONFUSED","DISAPPOINTED","EXCITED","FEARFUL",
  "FRUSTRATED","HAPPY","HOPEFUL","NERVOUS","NEUTRAL","PLAYFUL",
  "REASSURING","SAD","SARCASTIC","SERIOUS","SORROWFUL","TIRED",
];

const FREE_EMOTIONS = ["HAPPY", "SAD", "ANGRY", "CALM", "CONFUSED","NEUTRAL"];
const FREE_MAX_CHARS = 300;

const LANGUAGES: Record<string, string> = {
  ur:"Urdu", ar:"Arabic", da:"Danish", de:"German", el:"Greek", en:"English",
  es:"Spanish", fi:"Finnish", fr:"French", he:"Hebrew", hi:"Hindi",
  it:"Italian", ja:"Japanese", ko:"Korean", ms:"Malay", nl:"Dutch",
  no:"Norwegian", pl:"Polish", pt:"Portuguese", ru:"Russian",
  sv:"Swedish", sw:"Swahili", tr:"Turkish", zh:"Chinese",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const { token, user, refreshUser } = useAuth();

  const isFree = !user?.plan || user.plan === "free";
  const EMOTIONS = isFree ? FREE_EMOTIONS : ALL_EMOTIONS;

  // Voices (for selector)
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");

  // Generation state
  const [language, setLanguage] = useState("ur");
  const [emotionType, setEmotionType] = useState("NEUTRAL");
  const [voiceScript, setVoiceScript] = useState(
    "Welcome to Paysys. Your secure banking voice flow is ready for real-time playback."
  );
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState("");

  // Upgrade modal
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  // Dropdown states
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [emotionDropdownOpen, setEmotionDropdownOpen] = useState(false);

  const isUrdu = language === "ur";
  // If switching away from Urdu, reset to NEUTRAL; also if free plan and emotionType not in FREE list
  const effectiveEmotion = isUrdu
    ? (isFree && !FREE_EMOTIONS.includes(emotionType) ? "HAPPY" : emotionType)
    : "NEUTRAL";

  useEffect(() => {
    if (!token) return;
    fetchVoices(token).then(v => {
      setVoices(v);
      if (v.length > 0) setSelectedVoiceId(v[0].voice_id);
    }).catch(() => {});
  }, [token]);

  // Reset emotion when plan/language changes
  useEffect(() => {
    if (!EMOTIONS.includes(emotionType)) setEmotionType(EMOTIONS[0]);
  }, [isFree, isUrdu]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setVoiceDropdownOpen(false);
        setLanguageDropdownOpen(false);
        setEmotionDropdownOpen(false);
      }
    };
    
    if (voiceDropdownOpen || languageDropdownOpen || emotionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [voiceDropdownOpen, languageDropdownOpen, emotionDropdownOpen]);

  const handleGenerate = async () => {
    if (!token) return;
    setIsGenerating(true); setHasResult(false); setError("");
    try {
      if (!selectedVoiceId) throw new Error("No voice reference available. Go to Instant Voice Cloning to upload one first.");
      const emotionArg = effectiveEmotion === "NEUTRAL" ? undefined : effectiveEmotion.toLowerCase();
      const url = await generateAudio(token, voiceScript, language, selectedVoiceId, emotionArg, speed, volume);
      setAudioUrl(url); setHasResult(true); refreshUser();
    } catch (err: any) {
      if (err?.detail?.upgrade_required || err?.status === 402 || err?.status === 403) {
        setUpgradeMessage(err?.detail?.message || err.message || "Please upgrade your plan");
        setShowUpgrade(true);
      } else {
        setError(err instanceof Error ? err.message : "Generation failed");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} message={upgradeMessage} />

      <div className="grid gap-6">
        <section className="dashboard-panel p-5 sm:p-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300">Playground</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Text to Voice</h2>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
            {/* ── Left: script + generate + sliders ── */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Voice script</label>
                  <span className={`text-xs tabular-nums font-medium ${
                    isFree
                      ? (voiceScript.length > FREE_MAX_CHARS ? "text-red-400" : "text-slate-400")
                      : "text-slate-500"
                  }`}>
                    {isFree ? `${voiceScript.length} / ${FREE_MAX_CHARS}` : `${voiceScript.length} chars · ${Math.max(1, Math.ceil(voiceScript.length / 20))} credits`}
                  </span>
                </div>
                <textarea
                  className={`mt-2 min-h-48 w-full resize-none rounded-2xl border bg-white/5 p-4 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:ring-4 focus:ring-cyan-300/10 ${
                    isFree && voiceScript.length > FREE_MAX_CHARS
                      ? "border-red-400/50 focus:border-red-400"
                      : "border-white/10 focus:border-cyan-300/70"
                  }`}
                  value={voiceScript}
                  onChange={e => setVoiceScript(e.target.value)}
                />
                {isFree && voiceScript.length > FREE_MAX_CHARS ? (
                  <p className="mt-1.5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300">
                    Free plan: max {FREE_MAX_CHARS} characters per generation.
                    Your text has <strong>{voiceScript.length}</strong> chars.{" "}
                    <a href="/dashboard/subscription" className="underline font-semibold">Upgrade</a> to remove this limit.
                  </p>
                ) : isFree ? (
                  <p className="mt-1 text-xs text-slate-500">Free plan · max {FREE_MAX_CHARS} characters per generation</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Long texts are split into chunks and stitched automatically</p>
                )}
              </div>

              <button
                className="primary-button w-full justify-center"
                onClick={handleGenerate}
                disabled={isGenerating || !selectedVoiceId || (isFree && voiceScript.length > FREE_MAX_CHARS)}
              >
                {isGenerating ? <><Activity size={18} /> Generating…</> : <><Play size={18} fill="currentColor" /> Generate voice</>}
              </button>

              {/* Speed Control */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Speed</label>
                  <span className="text-xs text-cyan-300 font-semibold">{(speed < 1 ? 0.5 + 0.5 * speed : speed).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.25"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-slate-600 to-slate-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0.50x</span>
                  <span>2.00x</span>
                </div>
              </div>

              {/* Volume Control */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-300">Volume</label>
                  <span className="text-xs text-cyan-300 font-semibold">{(volume < 1 ? 0.1 + 0.9 * volume : volume).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.25"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-slate-600 to-slate-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0.10x</span>
                  <span>2.00x</span>
                </div>
              </div>
            </div>

            {/* ── Right: voice reference + language + emotion dropdowns ── */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-4">
              {/* Voice reference */}
              <div className="relative">
                <label className="text-xs font-medium text-slate-400">Voice reference</label>
                {voices.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white text-left flex items-center justify-between focus:border-cyan-300/60 focus:outline-none"
                    >
                      <span>{voices.find(v => v.voice_id === selectedVoiceId)?.name || "Select voice"}</span>
                      <ChevronDown size={14} className={`transition-transform ${voiceDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {voiceDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-xl max-h-48 overflow-y-auto">
                        <style>{`
                          .voice-dropdown::-webkit-scrollbar {
                            width: 6px;
                          }
                          .voice-dropdown::-webkit-scrollbar-track {
                            background: rgba(255, 255, 255, 0.05);
                            border-radius: 10px;
                          }
                          .voice-dropdown::-webkit-scrollbar-thumb {
                            background: rgba(6, 182, 212, 0.5);
                            border-radius: 10px;
                          }
                          .voice-dropdown::-webkit-scrollbar-thumb:hover {
                            background: rgba(6, 182, 212, 0.7);
                          }
                        `}</style>
                        <div className="voice-dropdown py-1">
                          {voices.map(v => (
                            <button
                              key={v.voice_id}
                              onClick={() => {
                                setSelectedVoiceId(v.voice_id);
                                setVoiceDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-xs text-left hover:bg-cyan-300/10 transition ${
                                selectedVoiceId === v.voice_id ? 'bg-cyan-300/20 text-cyan-300' : 'text-white'
                              }`}
                            >
                              {v.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-1 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-300">
                    No voices yet. Go to <strong>Instant Voice Cloning</strong> to upload a voice reference first.
                  </div>
                )}
              </div>

              {/* Language */}
              <div className="relative">
                <label className="text-xs font-medium text-slate-400">Language</label>
                <button
                  type="button"
                  onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white text-left flex items-center justify-between focus:border-cyan-300/60 focus:outline-none"
                >
                  <span>{LANGUAGES[language]}</span>
                  <ChevronDown size={14} className={`transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {languageDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-xl max-h-48 overflow-y-auto language-dropdown">
                    <style>{`
                      .language-dropdown::-webkit-scrollbar {
                        width: 6px;
                      }
                      .language-dropdown::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                      }
                      .language-dropdown::-webkit-scrollbar-thumb {
                        background: rgba(6, 182, 212, 0.5);
                        border-radius: 10px;
                      }
                      .language-dropdown::-webkit-scrollbar-thumb:hover {
                        background: rgba(6, 182, 212, 0.7);
                      }
                    `}</style>
                    <div className="py-1">
                      {Object.entries(LANGUAGES).map(([code, name]) => (
                        <button
                          key={code}
                          onClick={() => {
                            setLanguage(code);
                            if (code !== "ur") setEmotionType("NEUTRAL");
                            setLanguageDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-xs text-left hover:bg-cyan-300/10 transition ${
                            language === code ? 'bg-cyan-300/20 text-cyan-300' : 'text-white'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Emotion */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-400">
                    Emotion {!isUrdu && <span className="text-slate-600">(Urdu only)</span>}
                  </label>
                  {isFree && isUrdu && (
                    <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-xs text-amber-300">
                      6 on Free · <a href="/dashboard/subscription" className="underline">Upgrade</a>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => isUrdu && setEmotionDropdownOpen(!emotionDropdownOpen)}
                  disabled={!isUrdu}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white text-left flex items-center justify-between focus:border-cyan-300/60 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>{effectiveEmotion.charAt(0) + effectiveEmotion.slice(1).toLowerCase()}</span>
                  <ChevronDown size={14} className={`transition-transform ${emotionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {emotionDropdownOpen && isUrdu && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-xl max-h-48 overflow-y-auto emotion-dropdown">
                    <style>{`
                      .emotion-dropdown::-webkit-scrollbar {
                        width: 6px;
                      }
                      .emotion-dropdown::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                      }
                      .emotion-dropdown::-webkit-scrollbar-thumb {
                        background: rgba(6, 182, 212, 0.5);
                        border-radius: 10px;
                      }
                      .emotion-dropdown::-webkit-scrollbar-thumb:hover {
                        background: rgba(6, 182, 212, 0.7);
                      }
                    `}</style>
                    <div className="py-1">
                      {EMOTIONS.map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            setEmotionType(t);
                            setEmotionDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-xs text-left hover:bg-cyan-300/10 transition ${
                            effectiveEmotion === t ? 'bg-cyan-300/20 text-cyan-300' : 'text-white'
                          }`}
                        >
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Audio result - Always visible */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 min-h-[140px] flex flex-col">
                <p className="mb-3 text-sm font-medium text-white">
                  {isGenerating ? "Generating preview…" : hasResult ? "Generated voice" : "Audio Preview"}
                </p>
                
                <div className="flex-1 flex items-center justify-center">
                  {/* Show audio player when generated */}
                  {audioUrl && hasResult && (
                    <div className="w-full">
                      <AudioPlayer src={audioUrl} downloadName="paysys-voice.wav" />
                    </div>
                  )}
                  
                  {/* Show generating animation */}
                  {isGenerating && (
                    <div className="w-full space-y-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-300 to-violet-300 animate-pulse" />
                      </div>
                      <div className="flex items-center justify-center py-2">
                        <div className="flex gap-1">
                          <div className="w-1 h-6 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                          <div className="w-1 h-8 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
                          <div className="w-1 h-5 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
                          <div className="w-1 h-9 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '450ms'}}></div>
                          <div className="w-1 h-6 bg-cyan-300 rounded-full animate-pulse" style={{animationDelay: '600ms'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show placeholder when idle */}
                  {!isGenerating && !hasResult && (
                    <div className="flex items-center justify-center py-2 border-2 border-dashed border-white/10 rounded-xl w-full">
                      <div className="text-center">
                        <svg className="mx-auto h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <p className="mt-2 text-xs text-slate-500">Your generated voice will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">{error}</p>
              )}
            </div>
          </div>

        </section>
      </div>
    </>
  );
}
