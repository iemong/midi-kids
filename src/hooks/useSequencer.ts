import { useState, useCallback, useRef, useEffect } from "react";
import { SEQUENCER_NUM_STEPS, SEQUENCER_DEFAULT_BPM } from "@/lib/midi-utils";

function createEmptyGrid(rows: number, steps: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(steps).fill(false));
}

export function useSequencer(onStep: (activeRows: number[]) => void) {
  const [grid, setGrid] = useState(() =>
    createEmptyGrid(8, SEQUENCER_NUM_STEPS)
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(SEQUENCER_DEFAULT_BPM);

  const intervalRef = useRef<number | null>(null);
  const stepRef = useRef(-1);
  const gridRef = useRef(grid);
  const onStepRef = useRef(onStep);

  gridRef.current = grid;
  onStepRef.current = onStep;

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(
    (currentBpm: number) => {
      clearInterval_();
      const periodMs = (60 / currentBpm / 4) * 1000;

      intervalRef.current = window.setInterval(() => {
        const nextStep = (stepRef.current + 1) % SEQUENCER_NUM_STEPS;
        stepRef.current = nextStep;
        setCurrentStep(nextStep);

        const activeRows: number[] = [];
        for (let row = 0; row < gridRef.current.length; row++) {
          if (gridRef.current[row][nextStep]) {
            activeRows.push(row);
          }
        }
        if (activeRows.length > 0) {
          onStepRef.current(activeRows);
        }
      }, periodMs);
    },
    [clearInterval_]
  );

  const play = useCallback(() => {
    setIsPlaying(true);
    stepRef.current = -1;
    startInterval(bpm);
  }, [bpm, startInterval]);

  const stop = useCallback(() => {
    clearInterval_();
    setIsPlaying(false);
    stepRef.current = -1;
    setCurrentStep(-1);
  }, [clearInterval_]);

  const clear = useCallback(() => {
    stop();
    setGrid(createEmptyGrid(8, SEQUENCER_NUM_STEPS));
  }, [stop]);

  const toggleCell = useCallback((row: number, step: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][step] = !next[row][step];
      return next;
    });
  }, []);

  // Restart interval when BPM changes during playback
  useEffect(() => {
    if (isPlaying) {
      startInterval(bpm);
    }
    return () => {
      clearInterval_();
    };
  }, [bpm, isPlaying, startInterval, clearInterval_]);

  return {
    grid,
    currentStep,
    isPlaying,
    bpm,
    toggleCell,
    play,
    stop,
    clear,
    setBpm,
  };
}
