import { useRef, useCallback } from "react";
import { gridToFrequency } from "@/lib/midi-utils";

export function useSequencerAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playStepNote = useCallback(
    (rowIndex: number, waveform: OscillatorType) => {
      const ctx = getContext();
      const freq = gridToFrequency(0, rowIndex);

      const oscillator = ctx.createOscillator();
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    },
    [getContext]
  );

  const resumeContext = useCallback(() => {
    getContext();
  }, [getContext]);

  return { playStepNote, resumeContext };
}
