import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { gridToNote } from "@/lib/midi-utils";

interface PadState {
  color: string;
}

interface LaunchpadGridProps {
  activePads: Map<number, PadState>;
  onPadOn: (note: number) => void;
  onPadOff: (note: number) => void;
}

export function LaunchpadGrid({ activePads, onPadOn, onPadOff }: LaunchpadGridProps) {
  const handlePointerDown = useCallback(
    (note: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onPadOn(note);
    },
    [onPadOn],
  );

  const handlePointerUp = useCallback(
    (note: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      onPadOff(note);
    },
    [onPadOff],
  );

  const pads: React.ReactNode[] = [];
  // Rows 8→1 (top to bottom, matching Launchpad layout)
  for (let row = 7; row >= 0; row--) {
    for (let col = 0; col < 8; col++) {
      const note = gridToNote(row, col);
      const pad = activePads.get(note);
      const isActive = !!pad;

      pads.push(
        <button
          key={note}
          data-note={note}
          onPointerDown={handlePointerDown(note)}
          onPointerUp={handlePointerUp(note)}
          onPointerCancel={handlePointerUp(note)}
          className="aspect-square rounded-lg transition-all duration-75 cursor-pointer select-none touch-none border-0"
          style={{
            backgroundColor: isActive ? pad.color : "hsl(var(--secondary))",
            transform: isActive ? "scale(0.92)" : "scale(1)",
            boxShadow: isActive ? `0 0 16px ${pad.color}80, 0 0 4px ${pad.color}40` : "none",
          }}
        />,
      );
    }
  }

  return (
    <Card className="p-3 sm:p-4 bg-card/50 border-border">
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2">{pads}</div>
    </Card>
  );
}
