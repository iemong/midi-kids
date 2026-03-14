import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WAVEFORM_LABELS } from "@/lib/midi-utils";

interface SequencerControlsProps {
  isPlaying: boolean;
  bpm: number;
  waveform: OscillatorType;
  pitchOffset: number;
  onPlay: () => void;
  onStop: () => void;
  onClear: () => void;
  onBpmChange: (bpm: number) => void;
  onNextWaveform: () => void;
  onPrevWaveform: () => void;
  onPitchUp: () => void;
  onPitchDown: () => void;
}

export function SequencerControls({
  isPlaying,
  bpm,
  waveform,
  pitchOffset,
  onPlay,
  onStop,
  onClear,
  onBpmChange,
  onNextWaveform,
  onPrevWaveform,
  onPitchUp,
  onPitchDown,
}: SequencerControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Button size="sm" onClick={onPlay} disabled={isPlaying}>
          ▶
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!isPlaying}
        >
          ■
        </Button>
        <Button size="sm" variant="outline" onClick={onClear}>
          クリア
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs px-2 py-0.5 tabular-nums">
          {bpm} BPM
        </Badge>
        <input
          type="range"
          min={60}
          max={240}
          step={1}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-24 sm:w-32 accent-[hsl(var(--primary))]"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Button size="xs" variant="outline" onClick={onPrevWaveform}>
          ▲
        </Button>
        <Badge variant="secondary" className="text-xs px-2 py-0.5">
          {WAVEFORM_LABELS[waveform] ?? waveform}
        </Badge>
        <Button size="xs" variant="outline" onClick={onNextWaveform}>
          ▼
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        <Button size="xs" variant="outline" onClick={onPitchDown}>
          -
        </Button>
        <Badge variant="secondary" className="text-xs px-2 py-0.5 tabular-nums">
          音程 {pitchOffset >= 0 ? `+${pitchOffset}` : pitchOffset}
        </Badge>
        <Button size="xs" variant="outline" onClick={onPitchUp}>
          +
        </Button>
      </div>
    </div>
  );
}
