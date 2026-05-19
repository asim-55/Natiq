import { useEffect, useRef, useState } from "react";
import { Check, Mic, Trash2, Upload } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { deleteVoice, denoiseAudio, fetchVoices, previewVoiceUrl, uploadVoice } from "../../api/client";
import type { Voice } from "../../types";
import UpgradeModal from "../../components/UpgradeModal";
import AudioPlayer from "../../components/AudioPlayer";
import WaveformSelector from "../../components/WaveformSelector";

const LANGUAGES: Record<string, string> = {
  ur:"Urdu", ar:"Arabic", da:"Danish", de:"German", el:"Greek", en:"English",
  es:"Spanish", fi:"Finnish", fr:"French", he:"Hebrew", hi:"Hindi",
  it:"Italian", ja:"Japanese", ko:"Korean", ms:"Malay", nl:"Dutch",
  no:"Norwegian", pl:"Polish", pt:"Portuguese", ru:"Russian",
  sv:"Swedish", sw:"Swahili", tr:"Turkish", zh:"Chinese",
};

// ─── Constants ───────────────────────────────────────────────────────────────

const RECORD_TIPS = [
  "Record in a quiet room with minimal background noise",
  "Speak clearly and at a natural, steady pace",
  "Keep recordings between 10–30 seconds for best results",
  "Use a quality microphone or headset if possible",
  "Avoid clipping — stay consistent in volume",
];

const SAMPLE_SCRIPT = `Welcome to Paysys, your secure AI voice banking platform.
To confirm your transaction, please say your four-digit PIN followed by your account number.
Your voice print is now being verified. Thank you for banking with us.`;

// ─── Drag-and-drop upload zone ────────────────────────────────────────────────

function DropZone({ onFile, isUploading, fileName }: {
  onFile: (f: File) => void;
  isUploading: boolean;
  fileName: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-14 px-6 text-center transition
        ${dragging ? "border-cyan-300 bg-cyan-300/10" : "border-white/20 bg-white/5 hover:bg-white/8"}`}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
        <Upload size={24} className="text-cyan-200" />
      </div>
      {fileName ? (
        <p className="text-sm font-medium text-cyan-200">{fileName} — uploaded!</p>
      ) : (
        <p className="text-sm text-slate-400">
          {isUploading ? "Uploading…" : "Drag & drop your audio file here, or"}
        </p>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition disabled:opacity-50"
      >
        {isUploading ? "Uploading…" : "Browse files"}
      </button>
      <p className="text-xs text-slate-500">Maximum file size: 4 MB · MP3, WAV, OGG</p>
      <input ref={inputRef} type="file" accept="audio/*" className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} disabled={isUploading} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type InputMode = "Record" | "Upload";

export default function InstantVoiceCloningPage() {
  const { token, refreshUser, user } = useAuth();

  const [inputMode, setInputMode] = useState<InputMode>("Upload");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [enableDenoise, setEnableDenoise] = useState(false);
  const [isDenoising, setIsDenoising] = useState(false);

  // Record metadata
  const [recordName, setRecordName] = useState("");
  const [recordDescription, setRecordDescription] = useState("");
  const [recordLanguage, setRecordLanguage] = useState("ur");

  // WebSocket recording state
  const [recPhase, setRecPhase] = useState<"idle" | "recording" | "waveform" | "processing" | "preview">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Upload state
  const [uploadPhase, setUploadPhase] = useState<"idle" | "waveform" | "processing" | "preview">("idle");
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null);
  const [uploadOriginalName, setUploadOriginalName] = useState("");
  const [previewUploadVoiceId, setPreviewUploadVoiceId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  // Check if user has access to denoise feature (Plus and Pro plans only)
  const canUseDenoise = user?.plan === "plus" || user?.plan === "pro";

  /**
   * Denoise audio if the feature is enabled and user has access
   */
  async function applyDenoiseIfEnabled(base64Audio: string): Promise<string> {
    if (!enableDenoise || !canUseDenoise || !token) {
      return base64Audio;
    }
    
    setIsDenoising(true);
    try {
      const denoisedBase64 = await denoiseAudio(token, base64Audio);
      return denoisedBase64;
    } catch (err: any) {
      // If denoising fails, log error but continue with original audio
      console.error("Denoising failed:", err);
      setError("Background noise removal failed. Continuing with original audio.");
      return base64Audio;
    } finally {
      setIsDenoising(false);
    }
  }

  /**
   * Detect if an AudioBuffer contains actual vocal content or is mostly silence
   * Returns true if silence/no vocals detected, false if vocals present
   */
  async function detectSilence(audioBlob: Blob): Promise<boolean> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();

      const numChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const duration = buffer.duration;
      
      // Analyze in 100ms windows to detect speech patterns
      const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
      const numWindows = Math.floor(buffer.length / windowSize);
      
      let activeWindows = 0;
      let totalRMS = 0;
      let maxAmplitude = 0;
      
      for (let channel = 0; channel < numChannels; channel++) {
        const data = buffer.getChannelData(channel);
        
        // Analyze each window
        for (let w = 0; w < numWindows; w++) {
          const start = w * windowSize;
          const end = Math.min(start + windowSize, data.length);
          
          let sumSquares = 0;
          let windowMax = 0;
          
          for (let i = start; i < end; i++) {
            const sample = data[i];
            sumSquares += sample * sample;
            windowMax = Math.max(windowMax, Math.abs(sample));
          }
          
          const windowRMS = Math.sqrt(sumSquares / (end - start));
          totalRMS += windowRMS;
          maxAmplitude = Math.max(maxAmplitude, windowMax);
          
          // A window is "active" if it has significant energy
          // Speech typically has RMS above 0.02 and peaks above 0.1
          if (windowRMS > 0.02 && windowMax > 0.1) {
            activeWindows++;
          }
        }
      }
      
      const avgRMS = totalRMS / (numWindows * numChannels);
      const activeRatio = activeWindows / (numWindows * numChannels);
      
      // Detection criteria:
      // 1. Overall RMS must be above 0.015 (has some energy)
      // 2. Peak amplitude must be above 0.08 (has significant peaks)
      // 3. At least 10% of windows should be "active" (has speech-like patterns)
      const isSilent = avgRMS < 0.015 || maxAmplitude < 0.08 || activeRatio < 0.10;
      
      console.log("Audio analysis:", {
        duration: duration.toFixed(2) + "s",
        avgRMS: avgRMS.toFixed(4),
        maxAmplitude: maxAmplitude.toFixed(4),
        activeRatio: (activeRatio * 100).toFixed(1) + "%",
        isSilent
      });
      
      return isSilent;
    } catch (error) {
      console.error("Error analyzing audio:", error);
      // If we can't analyze, assume it's not silent to avoid false positives
      return false;
    }
  }

  async function startRecording() {
    if (!token) return;
    setError("");
    recordedChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.addEventListener("stop", async () => {
        // Create blob from all chunks
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        
        // Check if the recording is silent
        const isSilent = await detectSilence(blob);
        if (isSilent) {
          setError("No voice detected in the recording. Please record again with clear vocals.");
          setRecPhase("idle");
          setRecordedBlob(null);
          recordedChunksRef.current = [];
          return;
        }
        
        setRecordedBlob(blob);
        setRecPhase("waveform");
      }, { once: true });

      recorder.start(250);
      setRecPhase("recording");
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

    } catch {
      setError("Microphone access denied. Please allow microphone permission in your browser.");
    }
  }

  async function stopRecording() {
    // Validate minimum recording time
    if (recordingTime < 15) {
      setError("Recording must be at least 15 seconds long. Please continue recording.");
      return;
    }
    
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
  }

  function cleanupRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setRecPhase("idle");
    setRecordedBlob(null);
    recordedChunksRef.current = [];
  }

  async function handleWaveformSelection(selectedBlob: Blob, startTime: number, endTime: number) {
    if (!token) return;
    setRecPhase("processing");
    setError("");
    
    try {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const r = String(reader.result || "");
          resolve(r.includes(",") ? r.split(",")[1] : r);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(selectedBlob);
      });

      // Apply denoising if enabled
      const processedBase64 = await applyDenoiseIfEnabled(base64);

      // Upload the selected portion
      const fileName = `${recordName.trim() || "recording"}_${startTime.toFixed(1)}-${endTime.toFixed(1)}s.wav`;
      const voiceId = await uploadVoice(token, processedBase64, fileName);
      
      setPreviewVoiceId(voiceId);
      setRecPhase("preview");
      await loadVoices();
      setSelectedVoiceId(voiceId);
      refreshUser();
    } catch (err: any) {
      if (err?.detail?.upgrade_required || err?.status === 402 || err?.status === 403) {
        setUpgradeMessage(err?.detail?.message || err.message || "Please upgrade your plan");
        setShowUpgrade(true);
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
      setRecPhase("waveform");
    }
  }

  async function handleRetake() {
    if (previewVoiceId && token) {
      try { await deleteVoice(token, previewVoiceId); } catch { /* voice already gone is fine */ }
      setVoices(prev => {
        const remaining = prev.filter(v => v.voice_id !== previewVoiceId);
        if (selectedVoiceId === previewVoiceId) setSelectedVoiceId(remaining[0]?.voice_id ?? "");
        return remaining;
      });
    }
    setPreviewVoiceId(null);
    setRecordingTime(0);
    setRecordedBlob(null);
    recordedChunksRef.current = [];
    setRecPhase("idle");
    setError("");
  }

  function handleDoneRecording() {
    if (previewVoiceId) setSelectedVoiceId(previewVoiceId);
    setPreviewVoiceId(null);
    setRecPhase("idle");
    setRecordName("");
    setRecordDescription("");
    setRecordedBlob(null);
    recordedChunksRef.current = [];
  }

  const loadVoices = () => {
    if (!token) return;
    fetchVoices(token).then(v => {
      setVoices(v);
      if (v.length > 0 && !selectedVoiceId) setSelectedVoiceId(v[0].voice_id);
    }).catch(() => {});
  };

  useEffect(() => { loadVoices(); }, [token]);

  const handleUpload = async (file: File) => {
    if (!token) return;
    setError("");
    
    try {
      // Validate audio duration before proceeding
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();
      
      if (buffer.duration < 15) {
        setError("Uploaded audio must be at least 15 seconds long. Please upload a longer file.");
        return;
      }
      
      // Check if the uploaded audio is silent
      const isSilent = await detectSilence(file);
      if (isSilent) {
        setError("No voice detected in the uploaded file. Please upload an audio file with clear vocals.");
        return;
      }
      
      setUploadOriginalName(file.name);
      setUploadBlob(file);
      setUploadPhase("waveform");
    } catch (err) {
      setError("Failed to load audio file. Please ensure it's a valid audio format.");
    }
  };

  async function handleUploadWaveformSelection(selectedBlob: Blob, startTime: number, endTime: number) {
    if (!token) return;
    setUploadPhase("processing");
    setError("");
    
    try {
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const r = String(reader.result || "");
          resolve(r.includes(",") ? r.split(",")[1] : r);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(selectedBlob);
      });

      // Apply denoising if enabled
      const processedBase64 = await applyDenoiseIfEnabled(base64);

      // Upload the selected portion
      const fileName = `${uploadOriginalName.replace(/\.[^/.]+$/, "")}_${startTime.toFixed(1)}-${endTime.toFixed(1)}s.wav`;
      const voiceId = await uploadVoice(token, processedBase64, fileName);
      
      setPreviewUploadVoiceId(voiceId);
      setUploadFileName(fileName);
      setPreviewUrl(token ? previewVoiceUrl(token, voiceId) : "");
      setUploadPhase("preview");
      await loadVoices();
      setSelectedVoiceId(voiceId);
      refreshUser();
    } catch (err: any) {
      if (err?.detail?.upgrade_required || err?.status === 402 || err?.status === 403) {
        setUpgradeMessage(err?.detail?.message || err.message || "Please upgrade your plan");
        setShowUpgrade(true);
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
      setUploadPhase("waveform");
    }
  }

  async function handleRetakeUpload() {
    if (previewUploadVoiceId && token) {
      try { await deleteVoice(token, previewUploadVoiceId); } catch { /* voice already gone is fine */ }
      setVoices(prev => {
        const remaining = prev.filter(v => v.voice_id !== previewUploadVoiceId);
        if (selectedVoiceId === previewUploadVoiceId) setSelectedVoiceId(remaining[0]?.voice_id ?? "");
        return remaining;
      });
    }
    setPreviewUploadVoiceId(null);
    setUploadBlob(null);
    setUploadOriginalName("");
    setUploadFileName("");
    setPreviewUrl("");
    setUploadPhase("idle");
    setError("");
  }

  function handleDoneUpload() {
    if (previewUploadVoiceId) setSelectedVoiceId(previewUploadVoiceId);
    setPreviewUploadVoiceId(null);
    setUploadBlob(null);
    setUploadOriginalName("");
    setUploadPhase("idle");
  }

  async function handleDeleteVoice(voiceId: string) {
    if (!token) return;
    setDeletingId(voiceId);
    try {
      await deleteVoice(token, voiceId);
      setVoices(prev => {
        const remaining = prev.filter(v => v.voice_id !== voiceId);
        if (selectedVoiceId === voiceId) setSelectedVoiceId(remaining[0]?.voice_id ?? "");
        return remaining;
      });
      refreshUser();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} message={upgradeMessage} />

      <div className="grid gap-6">
        <section className="dashboard-panel p-5 sm:p-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300">Voice Reference</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Instant Voice Cloning</h2>
          <p className="mt-1 text-sm text-slate-400">
            Upload or record a voice sample to create a cloned voice you can use in Text to Voice.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* ── Left: input mode ── */}
            <div className="flex flex-col gap-4">
              {/* Segmented control */}
              <div className="flex gap-1 rounded-xl border border-white/10 bg-ink-950/50 p-1 w-fit">
                {(["Record", "Upload"] as InputMode[]).map(m => (
                  <button key={m} onClick={() => { 
                    setInputMode(m); 
                    setError(""); 
                    if (m === "Upload") setUploadPhase("idle");
                  }}
                    className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition
                      ${inputMode === m ? "bg-cyan-300 text-ink-950" : "text-slate-400 hover:text-white"}`}
                  >
                    {m === "Record" ? <Mic size={14} /> : <Upload size={14} />}
                    {m}
                  </button>
                ))}
              </div>

              {/* Background Noise Removal Toggle (Plus & Pro only) */}
              {canUseDenoise && (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-white">Background Noise Removal</span>
                    <span className="text-xs text-slate-400">Uses AI to remove background noise from your recording</span>
                  </div>
                  <button
                    onClick={() => setEnableDenoise(!enableDenoise)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      enableDenoise ? "bg-cyan-300" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        enableDenoise ? "translate-x-5.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Error message - always visible at top */}
              {error && (
                <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">{error}</p>
              )}

              {/* ── Record view ── */}
              {inputMode === "Record" && (
                <div className="flex flex-col gap-4">
                  {/* Phase: idle or recording */}
                  {recPhase !== "preview" && recPhase !== "waveform" && (
                    <button
                      onClick={() => recPhase === "idle" ? startRecording() : stopRecording()}
                      disabled={recPhase === "processing"}
                      className={`relative flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition
                        ${recPhase === "recording"
                          ? "border-red-400 bg-red-400/15 text-red-300"
                          : recPhase === "processing"
                          ? "border-slate-600 bg-white/5 text-slate-400 cursor-wait"
                          : "border-red-400/40 bg-red-400/5 hover:bg-red-400/10 text-red-300 cursor-pointer"}`}
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-red-400/20 transition
                        ${recPhase === "recording" ? "animate-pulse ring-4 ring-red-400/30 ring-offset-2 ring-offset-transparent" : ""}`}>
                        <Mic size={22} />
                      </div>
                      {recPhase === "recording" ? (
                        <>
                          <span className="text-sm font-semibold tabular-nums">{fmtTime(recordingTime)} · Click to stop</span>
                          {recordingTime < 15 && (
                            <span className="text-xs text-amber-300 mt-1">Minimum 15 seconds required ({15 - recordingTime}s remaining)</span>
                          )}
                        </>
                      ) : recPhase === "processing" ? (
                        <span className="text-sm font-semibold">Processing...</span>
                      ) : (
                        <span className="text-sm font-semibold">Click to Start Recording</span>
                      )}
                    </button>
                  )}

                  {/* Phase: waveform selection */}
                  {recPhase === "waveform" && recordedBlob && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">Select your audio segment</p>
                        <button
                          onClick={handleRetake}
                          className="text-xs text-slate-400 hover:text-red-300 transition"
                        >
                          ↺ Re-record
                        </button>
                      </div>
                      <WaveformSelector
                        audioBlob={recordedBlob}
                        onSelectionComplete={handleWaveformSelection}
                        maxDuration={15}
                        minDuration={15}
                      />
                    </div>
                  )}

                  {/* Phase: preview (saved to DB) */}
                  {recPhase === "preview" && previewVoiceId && token && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">Recording saved ✓</p>
                        <button
                          onClick={handleRetake}
                          className="text-xs text-slate-400 hover:text-red-300 transition"
                        >
                          ↺ Record another
                        </button>
                      </div>
                      <AudioPlayer src={previewVoiceUrl(token, previewVoiceId)} downloadName={`${recordName || "recording"}.wav`} />
                      <button
                        onClick={handleDoneRecording}
                        className="primary-button w-full justify-center"
                      >
                        Done
                      </button>
                    </div>
                  )}

                  {/* Tips and sample script - only show when idle or recording */}
                  {(recPhase === "idle" || recPhase === "recording") && (
                    <>
                      <div className="space-y-2.5">
                        {RECORD_TIPS.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                            <Check size={14} className="mt-0.5 shrink-0 text-green-400" />
                            {tip}
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Need something to read?</p>
                        <textarea readOnly rows={5} value={SAMPLE_SCRIPT}
                          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 leading-relaxed focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Metadata for recording - only show when idle or recording */}
                  {(recPhase === "idle" || recPhase === "recording") && (
                    <div className="grid gap-3 pt-1">
                      <div>
                        <label className="text-xs font-medium text-slate-400">Name <span className="text-red-400">*</span></label>
                        <input type="text" required placeholder="e.g. My Voice"
                          value={recordName} onChange={e => setRecordName(e.target.value)}
                          disabled={recPhase !== "idle"}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-300/60 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400">Description <span className="text-slate-600">(optional)</span></label>
                        <input type="text" placeholder="Short description"
                          value={recordDescription} onChange={e => setRecordDescription(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-300/60 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400">Language <span className="text-red-400">*</span></label>
                        <select required value={recordLanguage} onChange={e => setRecordLanguage(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-2.5 text-sm text-white focus:border-cyan-300/60 focus:outline-none"
                        >
                          {Object.entries(LANGUAGES).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                      </div>
                      {recPhase === "idle" && !recordName.trim() && (
                        <p className="text-xs text-amber-300">Enter a name before starting to record.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Upload view ── */}
              {inputMode === "Upload" && (
                <div className="flex flex-col gap-4">
                  {/* Phase: idle - show upload zone */}
                  {uploadPhase === "idle" && (
                    <DropZone onFile={handleUpload} isUploading={isUploading} fileName="" />
                  )}

                  {/* Phase: waveform selection */}
                  {uploadPhase === "waveform" && uploadBlob && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">Select your audio segment</p>
                        <button
                          onClick={handleRetakeUpload}
                          className="text-xs text-slate-400 hover:text-red-300 transition"
                        >
                          ↺ Upload different file
                        </button>
                      </div>
                      <WaveformSelector
                        audioBlob={uploadBlob}
                        onSelectionComplete={handleUploadWaveformSelection}
                        maxDuration={15}
                        minDuration={15}
                      />
                      <p className="text-xs text-slate-500">
                        Uploaded: <span className="text-slate-300">{uploadOriginalName}</span>
                      </p>
                    </div>
                  )}

                  {/* Phase: processing */}
                  {uploadPhase === "processing" && (
                    <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-600 bg-white/5">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                      <span className="text-sm font-semibold text-slate-400">
                        {isDenoising ? "Removing background noise..." : "Processing..."}
                      </span>
                    </div>
                  )}

                  {/* Phase: preview (saved to DB) */}
                  {uploadPhase === "preview" && previewUploadVoiceId && token && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">Voice uploaded ✓</p>
                        <button
                          onClick={handleRetakeUpload}
                          className="text-xs text-slate-400 hover:text-red-300 transition"
                        >
                          ↺ Upload another
                        </button>
                      </div>
                      <AudioPlayer src={previewUrl} downloadName={uploadFileName || "sample.wav"} />
                      <button
                        onClick={handleDoneUpload}
                        className="primary-button w-full justify-center"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: cloned voices list ── */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-white">Your Cloned Voices</p>
              {voices.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-16 text-center">
                  <Mic size={32} className="text-slate-600" />
                  <p className="text-sm text-slate-500">No voices yet. Upload or record a sample to get started.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {voices.map(voice => (
                    <div key={voice.voice_id}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition
                        ${selectedVoiceId === voice.voice_id
                          ? "border-cyan-300/50 bg-cyan-300/10"
                          : "border-white/10 bg-white/5"}`}
                    >
                      <button
                        className="flex flex-1 items-center gap-3 text-left min-w-0"
                        onClick={() => setSelectedVoiceId(voice.voice_id)}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-white truncate">{voice.name}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {new Date(voice.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {selectedVoiceId === voice.voice_id && (
                          <span className="shrink-0 rounded-full bg-cyan-300/20 px-2 py-0.5 text-xs text-cyan-300">Active</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteVoice(voice.voice_id)}
                        disabled={deletingId === voice.voice_id}
                        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500 hover:bg-red-500/10 hover:border-red-400/30 hover:text-red-400 transition disabled:opacity-40"
                        title="Delete voice"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600">
                Voices uploaded here are available automatically in the Text to Voice playground.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
