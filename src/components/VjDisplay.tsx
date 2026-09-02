import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { noteToGrid, WAVEFORM_LABELS } from "@/lib/midi-utils";

interface PadState {
  color: string;
}

interface VjDisplayProps {
  activePads: Map<number, PadState>;
  waveform: OscillatorType;
  onExit: () => void;
}

export function VjDisplay({ activePads, waveform, onExit }: VjDisplayProps) {
  const bursts = Array.from(activePads.entries()).flatMap(([note, pad]) => {
    const pos = noteToGrid(note);
    return pos ? [{ note, color: pad.color, ...pos }] : [];
  });

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden touch-none">
      <Button size="sm" variant="outline" onClick={onExit} className="absolute top-3 right-3 z-10">
        タッチモードに戻す
      </Button>

      <Badge variant="secondary" className="absolute top-3 left-3 z-10 text-xs px-2 py-0.5">
        {WAVEFORM_LABELS[waveform]}
      </Badge>

      {bursts.map(({ note, color, row, col }) => (
        <div
          key={note}
          data-note={note}
          data-vj-burst="true"
          className="absolute rounded-full vj-burst-pulse"
          style={{
            left: `${(col / 7) * 100}%`,
            top: `${((7 - row) / 7) * 100}%`,
            width: "18vmin",
            height: "18vmin",
            backgroundColor: color,
            boxShadow: `0 0 8vmin ${color}`,
          }}
        />
      ))}
    </div>
  );
}
