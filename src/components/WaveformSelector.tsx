import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface WaveformSelectorProps {
  audioBlob: Blob;
  onSelectionComplete: (selectedBlob: Blob, startTime: number, endTime: number) => void;
  maxDuration?: number; // Maximum selection duration in seconds
}

export default function WaveformSelector({ 
  audioBlob, 
  onSelectionComplete,
  maxDuration = 15 
}: WaveformSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(maxDuration);
  const [isDragging, setIsDragging] = useState<"start" | "end" | "region" | "none">("none");
  const dragStartPosRef = useRef<{ x: number; selStart: number; selEnd: number } | null>(null);
  const [cursorStyle, setCursorStyle] = useState("cursor-crosshair");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Load and decode audio
  useEffect(() => {
    const loadAudio = async () => {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioBuffer(buffer);
      setAudioDuration(buffer.duration);
      setSelectionEnd(Math.min(maxDuration, buffer.duration));
    };
    loadAudio();

    return () => {
      stopPlayback();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      audioContextRef.current?.close();
    };
  }, [audioBlob, maxDuration]);

  // Draw waveform
  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const currentTime = (i / width) * audioDuration;
      const isInSelection = currentTime >= selectionStart && currentTime <= selectionEnd;

      // Gradient colors
      if (isInSelection) {
        ctx.fillStyle = "rgba(103, 232, 249, 0.7)"; // cyan
      } else {
        ctx.fillStyle = "rgba(100, 116, 139, 0.3)"; // slate
      }

      const barHeight = Math.max(1, (max - min) * amp);
      const y = amp - (max * amp);
      ctx.fillRect(i, y, 1, barHeight);
    }

    // Draw selection markers
    const startX = (selectionStart / audioDuration) * width;
    const endX = (selectionEnd / audioDuration) * width;

    // Selection region overlay
    ctx.fillStyle = "rgba(103, 232, 249, 0.1)";
    ctx.fillRect(startX, 0, endX - startX, height);

    // Start line
    ctx.strokeStyle = "rgba(103, 232, 249, 1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    // End line
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // Draw playback position indicator (white line)
    if (isPlaying && playbackPosition >= selectionStart && playbackPosition <= selectionEnd) {
      const playbackX = (playbackPosition / audioDuration) * width;
      ctx.strokeStyle = "rgba(255, 255, 255, 1)"; // white
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playbackX, 0);
      ctx.lineTo(playbackX, height);
      ctx.stroke();

      // Draw circle at top of playback line
      ctx.fillStyle = "rgba(255, 255, 255, 1)";
      ctx.beginPath();
      ctx.arc(playbackX, 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [audioBuffer, audioDuration, selectionStart, selectionEnd, isPlaying, playbackPosition]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * audioDuration;

    // Click to set selection
    const newStart = Math.max(0, clickTime);
    const newEnd = Math.min(audioDuration, clickTime + maxDuration);
    setSelectionStart(newStart);
    setSelectionEnd(newEnd);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * audioDuration;

    // Check if clicking near start or end markers
    const startX = (selectionStart / audioDuration) * rect.width;
    const endX = (selectionEnd / audioDuration) * rect.width;

    if (Math.abs(x - startX) < 10) {
      setIsDragging("start");
    } else if (Math.abs(x - endX) < 10) {
      setIsDragging("end");
    } else if (clickTime >= selectionStart && clickTime <= selectionEnd) {
      // Clicking inside the selection region - enable region dragging
      setIsDragging("region");
      dragStartPosRef.current = { x, selStart: selectionStart, selEnd: selectionEnd };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(audioDuration, (x / rect.width) * audioDuration));

    // Update cursor style when not dragging
    if (isDragging === "none") {
      const startX = (selectionStart / audioDuration) * rect.width;
      const endX = (selectionEnd / audioDuration) * rect.width;
      
      if (Math.abs(x - startX) < 10 || Math.abs(x - endX) < 10) {
        setCursorStyle("cursor-col-resize");
      } else if (time >= selectionStart && time <= selectionEnd) {
        setCursorStyle("cursor-grab");
      } else {
        setCursorStyle("cursor-crosshair");
      }
      return;
    }

    // Handle dragging
    if (isDragging === "start") {
      const newStart = Math.max(0, Math.min(time, selectionEnd - 0.1));
      if (selectionEnd - newStart <= maxDuration) {
        setSelectionStart(newStart);
      }
    } else if (isDragging === "end") {
      const newEnd = Math.min(audioDuration, Math.max(time, selectionStart + 0.1));
      if (newEnd - selectionStart <= maxDuration) {
        setSelectionEnd(newEnd);
      }
    } else if (isDragging === "region" && dragStartPosRef.current) {
      setCursorStyle("cursor-grabbing");
      // Dragging the entire selection region
      const deltaX = x - dragStartPosRef.current.x;
      const deltaTime = (deltaX / rect.width) * audioDuration;
      const duration = dragStartPosRef.current.selEnd - dragStartPosRef.current.selStart;
      
      let newStart = dragStartPosRef.current.selStart + deltaTime;
      let newEnd = dragStartPosRef.current.selEnd + deltaTime;
      
      // Keep within bounds
      if (newStart < 0) {
        newStart = 0;
        newEnd = duration;
      } else if (newEnd > audioDuration) {
        newEnd = audioDuration;
        newStart = audioDuration - duration;
      }
      
      setSelectionStart(newStart);
      setSelectionEnd(newEnd);
    }
  };

  const handleMouseUp = () => {
    setIsDragging("none");
    dragStartPosRef.current = null;
    setCursorStyle("cursor-crosshair");
  };

  const handleMouseLeave = () => {
    setIsDragging("none");
    dragStartPosRef.current = null;
    setCursorStyle("cursor-crosshair");
  };

  const moveSelection = (direction: "left" | "right") => {
    const duration = selectionEnd - selectionStart;
    const step = 0.5; // Move by 0.5 seconds

    if (direction === "left") {
      const newStart = Math.max(0, selectionStart - step);
      setSelectionStart(newStart);
      setSelectionEnd(newStart + duration);
    } else {
      const newEnd = Math.min(audioDuration, selectionEnd + step);
      setSelectionStart(newEnd - duration);
      setSelectionEnd(newEnd);
    }
  };

  const playSelection = async () => {
    if (!audioBuffer || !audioContextRef.current || isPlaying) return;

    stopPlayback();
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start(0, selectionStart, selectionEnd - selectionStart);
    sourceNodeRef.current = source;
    setIsPlaying(true);
    setPlaybackPosition(selectionStart);
    playbackStartTimeRef.current = audioContextRef.current.currentTime;

    // Animation loop to update playback position
    const updatePlaybackPosition = () => {
      if (audioContextRef.current && sourceNodeRef.current) {
        const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
        const newPosition = selectionStart + elapsed;
        
        if (newPosition <= selectionEnd) {
          setPlaybackPosition(newPosition);
          animationFrameRef.current = requestAnimationFrame(updatePlaybackPosition);
        } else {
          setPlaybackPosition(selectionEnd);
        }
      }
    };
    animationFrameRef.current = requestAnimationFrame(updatePlaybackPosition);

    source.onended = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsPlaying(false);
      setPlaybackPosition(0);
      sourceNodeRef.current = null;
    };
  };

  const stopPlayback = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackPosition(0);
  };

  const handleUseSelection = async () => {
    if (!audioBuffer || !audioContextRef.current) return;

    // Create a new buffer with only the selected portion
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(selectionStart * sampleRate);
    const endSample = Math.floor(selectionEnd * sampleRate);
    const length = endSample - startSample;

    const numberOfChannels = audioBuffer.numberOfChannels;
    const newBuffer = audioContextRef.current.createBuffer(numberOfChannels, length, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const oldData = audioBuffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        newData[i] = oldData[startSample + i];
      }
    }

    // Convert buffer to blob
    const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = newBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert to WAV blob
    const wavBlob = bufferToWave(renderedBuffer);
    onSelectionComplete(wavBlob, selectionStart, selectionEnd);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-white/10 bg-ink-950/50 p-4">
        <p className="text-xs font-medium text-slate-400 mb-3">
          Select a {maxDuration}-second window • Total: {formatTime(audioDuration)}
        </p>
        
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          className={`w-full h-32 rounded-xl bg-ink-900 ${cursorStyle}`}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => moveSelection("left")}
              disabled={selectionStart <= 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => moveSelection("right")}
              disabled={selectionEnd >= audioDuration}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 transition"
            >
              <ChevronRight size={16} />
            </button>
            <span className="text-xs text-slate-500 ml-2">
              {formatTime(selectionStart)} → {formatTime(selectionEnd)} ({formatTime(selectionEnd - selectionStart)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={isPlaying ? stopPlayback : playSelection}
              className="secondary-button px-4 py-2 text-xs"
            >
              {isPlaying ? "Stop Preview" : "Preview Selection"}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleUseSelection}
        className="primary-button w-full justify-center"
      >
        Use this recording
      </button>
    </div>
  );
}

// Helper function to convert AudioBuffer to WAV Blob
function bufferToWave(buffer: AudioBuffer): Blob {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  // Write WAV header
  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };
  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  setUint32(0x46464952); // "RIFF"
  setUint32(36 + length); // file length
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(buffer.numberOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
  setUint16(buffer.numberOfChannels * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length); // chunk length

  // Write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < arrayBuffer.byteLength) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
