import { Card } from "@/components/ui/card";
import {
  SEQUENCER_ROW_LABELS,
  SEQUENCER_ROW_COLORS,
} from "@/lib/midi-utils";
import { cn } from "@/lib/utils";

interface SequencerGridProps {
  grid: boolean[][];
  currentStep: number;
  onToggleCell: (row: number, step: number) => void;
}

export function SequencerGrid({
  grid,
  currentStep,
  onToggleCell,
}: SequencerGridProps) {
  const rows: React.ReactNode[] = [];

  // Render rows top-down: highest pitch at top
  for (let row = grid.length - 1; row >= 0; row--) {
    const color = SEQUENCER_ROW_COLORS[row];
    const label = SEQUENCER_ROW_LABELS[row];

    const cells: React.ReactNode[] = [];
    for (let step = 0; step < grid[row].length; step++) {
      const active = grid[row][step];
      const isPlayhead = step === currentStep;
      const isDownbeat = step % 4 === 0;

      cells.push(
        <button
          key={step}
          onClick={() => onToggleCell(row, step)}
          className={cn(
            "aspect-square rounded-md transition-all duration-75 cursor-pointer select-none border-0",
            isPlayhead && "ring-2 ring-white/30"
          )}
          style={{
            backgroundColor: active
              ? color
              : isDownbeat
                ? "hsl(var(--secondary) / 0.8)"
                : "hsl(var(--secondary))",
            transform: active && isPlayhead ? "scale(0.9)" : "scale(1)",
            boxShadow:
              active && isPlayhead
                ? `0 0 12px ${color}80, 0 0 4px ${color}40`
                : "none",
          }}
        />
      );
    }

    rows.push(
      <div key={row} className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground w-6 text-right shrink-0 font-mono">
          {label}
        </span>
        <div className="grid grid-cols-16 gap-0.5 sm:gap-1 flex-1">
          {cells}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-3 sm:p-4 bg-card/50 border-border">
      <div className="flex flex-col gap-0.5 sm:gap-1">{rows}</div>
    </Card>
  );
}
