import { useRef, useCallback, useState } from "react";
import { noteToGrid, gridToFrequency, WAVEFORMS } from "@/lib/midi-utils";

interface OscillatorEntry {
  oscillator: OscillatorNode;
  gain: GainNode;
}

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const activeRef = useRef<Map<number, OscillatorEntry>>(new Map());
  const [waveformIndex, setWaveformIndex] = useState(0);
  const waveformRef = useRef<OscillatorType>(WAVEFORMS[0]);

  const waveform = WAVEFORMS[waveformIndex];
  waveformRef.current = waveform;

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playNote = useCallback(
    (note: number) => {
      if (activeRef.current.has(note)) return;

      const ctx = getContext();
      const grid = noteToGrid(note);
      const freq = grid ? gridToFrequency(grid.row, grid.col) : 440;

      const oscillator = ctx.createOscillator();
      oscillator.type = waveformRef.current;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();

      activeRef.current.set(note, { oscillator, gain });
    },
    [getContext],
  );

  const stopNote = useCallback(
    (note: number) => {
      const entry = activeRef.current.get(note);
      if (!entry) return;

      const ctx = getContext();
      entry.gain.gain.cancelScheduledValues(ctx.currentTime);
      entry.gain.gain.setValueAtTime(entry.gain.gain.value, ctx.currentTime);
      entry.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

      entry.oscillator.stop(ctx.currentTime + 0.15);
      activeRef.current.delete(note);
    },
    [getContext],
  );

  const resumeContext = useCallback(() => {
    getContext();
  }, [getContext]);

  const nextWaveform = useCallback(() => {
    setWaveformIndex((i) => (i + 1) % WAVEFORMS.length);
  }, []);

  const prevWaveform = useCallback(() => {
    setWaveformIndex((i) => (i - 1 + WAVEFORMS.length) % WAVEFORMS.length);
  }, []);

  return { playNote, stopNote, resumeContext, waveform, nextWaveform, prevWaveform };
}
