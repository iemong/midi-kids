import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LaunchpadGrid } from "@/components/LaunchpadGrid";
import { SequencerGrid } from "@/components/SequencerGrid";
import { SequencerControls } from "@/components/SequencerControls";
import { useMidi } from "@/hooks/useMidi";
import { useAudio } from "@/hooks/useAudio";
import { useSequencer } from "@/hooks/useSequencer";
import { useSequencerAudio } from "@/hooks/useSequencerAudio";
import {
  randomCssColor,
  WAVEFORM_LABELS,
  noteToGrid,
  gridToNote,
  SEQUENCER_ROW_LED_COLORS,
  SEQUENCER_PLAYHEAD_LED_COLOR,
} from "@/lib/midi-utils";

interface PadState {
  color: string;
}

type View = "launchpad" | "sequencer";

const MIN_PITCH_OFFSET = -4;
const MAX_PITCH_OFFSET = 8;

function App() {
  const [view, setView] = useState<View>("launchpad");
  const [pitchOffset, setPitchOffset] = useState(0);
  const [activePads, setActivePads] = useState<Map<number, PadState>>(
    new Map()
  );
  const {
    playNote,
    stopNote,
    resumeContext,
    waveform,
    nextWaveform,
    prevWaveform,
  } = useAudio();

  const { playStepNote, resumeContext: resumeSeqContext } =
    useSequencerAudio();

  const handleStep = useCallback(
    (activeRows: number[]) => {
      for (const row of activeRows) {
        playStepNote(row, waveform, pitchOffsetRef.current);
      }
    },
    [playStepNote, waveform]
  );

  const sequencer = useSequencer(handleStep);

  const viewRef = useRef(view);
  viewRef.current = view;
  const pitchOffsetRef = useRef(pitchOffset);
  pitchOffsetRef.current = pitchOffset;

  // --- Launchpad mode handlers ---

  const handleNoteOn = useCallback(
    (note: number) => {
      playNote(note);
      sendLedOnRef.current(note);
      setActivePads((prev) => {
        const next = new Map(prev);
        next.set(note, { color: randomCssColor() });
        return next;
      });
    },
    [playNote]
  );

  const handleNoteOff = useCallback(
    (note: number) => {
      stopNote(note);
      sendLedOffRef.current(note);
      setActivePads((prev) => {
        const next = new Map(prev);
        next.delete(note);
        return next;
      });
    },
    [stopNote]
  );

  // --- Sequencer mode handlers ---

  const handleSeqNoteOn = useCallback(
    (note: number) => {
      const pos = noteToGrid(note);
      if (!pos) return;
      sequencer.toggleCell(pos.row, pos.col);
    },
    [sequencer.toggleCell]
  );

  // --- Unified MIDI handler ---

  const handleMidiNoteOn = useCallback(
    (note: number) => {
      if (viewRef.current === "sequencer") {
        handleSeqNoteOn(note);
      } else {
        handleNoteOn(note);
      }
    },
    [handleNoteOn, handleSeqNoteOn]
  );

  const handleMidiNoteOff = useCallback(
    (note: number) => {
      if (viewRef.current === "launchpad") {
        handleNoteOff(note);
      }
      // Sequencer mode: no action on note off (toggle is on note on)
    },
    [handleNoteOff]
  );

  const handleControlChange = useCallback(
    (cc: number, value: number) => {
      if (value === 0) return;
      if (viewRef.current === "sequencer") {
        if (cc === 104) setPitchOffset((p) => Math.max(MIN_PITCH_OFFSET, p - 1));
        else if (cc === 105) setPitchOffset((p) => Math.min(MAX_PITCH_OFFSET, p + 1));
        else if (cc === 106) prevWaveform();
        else if (cc === 107) nextWaveform();
      } else {
        if (cc === 104) prevWaveform();
        else if (cc === 105) nextWaveform();
      }
    },
    [nextWaveform, prevWaveform]
  );

  const { status, connect, sendLedOn, sendLedOff, sendLedOnWithColor, clearAllLeds } = useMidi({
    onNoteOn: handleMidiNoteOn,
    onNoteOff: handleMidiNoteOff,
    onControlChange: handleControlChange,
  });

  const sendLedOnRef = useRef(sendLedOn);
  const sendLedOffRef = useRef(sendLedOff);
  sendLedOnRef.current = sendLedOn;
  sendLedOffRef.current = sendLedOff;

  // --- LED feedback for sequencer ---

  const updateSequencerLeds = useCallback(() => {
    if (status !== "connected") return;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const note = gridToNote(row, col);
        const isActive = sequencer.grid[row]?.[col];
        const isPlayhead = col === sequencer.currentStep;

        if (isActive && isPlayhead) {
          // Active + playhead: bright white
          sendLedOnWithColor(note, 63);
        } else if (isActive) {
          // Active: row color
          sendLedOnWithColor(note, SEQUENCER_ROW_LED_COLORS[row]);
        } else if (isPlayhead) {
          // Playhead only: dim
          sendLedOnWithColor(note, SEQUENCER_PLAYHEAD_LED_COLOR);
        } else {
          sendLedOff(note);
        }
      }
    }
  }, [status, sequencer.grid, sequencer.currentStep, sendLedOnWithColor, sendLedOff]);

  // Update LEDs when in sequencer view
  useEffect(() => {
    if (view === "sequencer") {
      updateSequencerLeds();
    }
  }, [view, updateSequencerLeds]);

  // Clear LEDs when switching views
  useEffect(() => {
    if (status === "connected") {
      clearAllLeds();
    }
  }, [view, status, clearAllLeds]);

  const handleConnect = useCallback(() => {
    resumeContext();
    connect();
  }, [resumeContext, connect]);

  const handlePadOn = useCallback(
    (note: number) => {
      resumeContext();
      handleNoteOn(note);
    },
    [resumeContext, handleNoteOn]
  );

  const handleSeqPlay = useCallback(() => {
    resumeSeqContext();
    sequencer.play();
  }, [resumeSeqContext, sequencer.play]);

  // Keyboard: ArrowUp / ArrowDown to switch waveform
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        prevWaveform();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        nextWaveform();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextWaveform, prevWaveform]);

  const statusLabel: Record<string, string> = {
    disconnected: "未接続",
    connecting: "接続中...",
    connected: "接続済み",
    unsupported: "非対応",
  };

  const statusVariant =
    status === "connected"
      ? ("default" as const)
      : status === "unsupported"
        ? ("destructive" as const)
        : ("secondary" as const);

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center p-4 gap-6"
      onPointerDown={resumeContext}
    >
      <div
        className="w-full max-w-lg space-y-4"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">MIDI Kids</h1>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{statusLabel[status]}</Badge>
            {status !== "unsupported" && status !== "connected" && (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={status === "connecting"}
              >
                MIDI接続
              </Button>
            )}
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "launchpad" ? "default" : "outline"}
            onClick={() => setView("launchpad")}
          >
            ランチパッド
          </Button>
          <Button
            size="sm"
            variant={view === "sequencer" ? "default" : "outline"}
            onClick={() => setView("sequencer")}
          >
            シーケンサー
          </Button>
        </div>

        {view === "launchpad" && (
          <>
            <LaunchpadGrid
              activePads={activePads}
              onPadOn={handlePadOn}
              onPadOff={handleNoteOff}
            />

            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="outline" onClick={prevWaveform}>
                ▲
              </Button>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {WAVEFORM_LABELS[waveform] ?? waveform}
              </Badge>
              <Button size="sm" variant="outline" onClick={nextWaveform}>
                ▼
              </Button>
            </div>
          </>
        )}

        {view === "sequencer" && (
          <>
            <SequencerControls
              isPlaying={sequencer.isPlaying}
              bpm={sequencer.bpm}
              waveform={waveform}
              pitchOffset={pitchOffset}
              onPlay={handleSeqPlay}
              onStop={sequencer.stop}
              onClear={sequencer.clear}
              onBpmChange={sequencer.setBpm}
              onNextWaveform={nextWaveform}
              onPrevWaveform={prevWaveform}
              onPitchUp={() => setPitchOffset((p) => Math.min(MAX_PITCH_OFFSET, p + 1))}
              onPitchDown={() => setPitchOffset((p) => Math.max(MIN_PITCH_OFFSET, p - 1))}
            />
            <SequencerGrid
              grid={sequencer.grid}
              currentStep={sequencer.currentStep}
              pitchOffset={pitchOffset}
              onToggleCell={sequencer.toggleCell}
            />
          </>
        )}

        {status === "unsupported" && (
          <p className="text-sm text-muted-foreground text-center">
            このブラウザはWebMIDI APIに対応していません。Chrome/Edgeをお使いください。
            <br />
            画面のパッドをタップして音を鳴らすことはできます。
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
