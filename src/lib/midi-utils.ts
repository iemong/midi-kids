/** Launchpad note number → grid position */
export function noteToGrid(note: number): { row: number; col: number } | null {
  const row = Math.floor(note / 10) - 1;
  const col = (note % 10) - 1;
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return { row, col };
}

/** Grid position → Launchpad note number */
export function gridToNote(row: number, col: number): number {
  return (row + 1) * 10 + (col + 1);
}

/** Pentatonic scale semitone steps from base */
const PENTATONIC_SEMITONES = [0, 2, 4, 7, 9, 12, 14, 16];
const C3_FREQ = 130.81;

/** Grid position → frequency (row shifts pitch, col selects pentatonic note) */
export function gridToFrequency(row: number, col: number): number {
  const semitone = PENTATONIC_SEMITONES[col % PENTATONIC_SEMITONES.length];
  const rowOffset = row * 3; // each row shifts ~minor 3rd (3 semitones)
  return C3_FREQ * Math.pow(2, (semitone + rowOffset) / 12);
}

/** Available oscillator waveforms */
export const WAVEFORMS: OscillatorType[] = ["triangle", "sine", "square", "sawtooth"];

export const WAVEFORM_LABELS: Record<string, string> = {
  triangle: "トライアングル",
  sine: "サイン",
  square: "スクエア",
  sawtooth: "ノコギリ",
};

/** Bright LED color velocity values for Launchpad */
export const BRIGHT_COLORS = [5, 9, 13, 21, 29, 37, 45, 53, 57, 61] as const;

/** Get a random bright color velocity */
export function randomColor(): number {
  return BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)];
}

/** CSS colors matching the Launchpad LED colors for on-screen display */
const PAD_CSS_COLORS = [
  "#ff3333", "#ff8833", "#ffff33", "#33ff33",
  "#33ffff", "#3388ff", "#8833ff", "#ff33ff",
  "#ff6666", "#66ff99",
];

export function randomCssColor(): string {
  return PAD_CSS_COLORS[Math.floor(Math.random() * PAD_CSS_COLORS.length)];
}

/** Step sequencer constants */
export const SEQUENCER_NUM_STEPS = 8;
export const SEQUENCER_DEFAULT_BPM = 120;

/** Note labels for each sequencer row (pentatonic scale from C3) */
export const SEQUENCER_ROW_LABELS = [
  "C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4",
];

/** Colors for each sequencer row */
export const SEQUENCER_ROW_COLORS = [
  "#ff3333", "#ff8833", "#ffff33", "#33ff33",
  "#33ffff", "#3388ff", "#8833ff", "#ff33ff",
];

/** Launchpad LED velocities for sequencer rows (one per row, bright colors) */
export const SEQUENCER_ROW_LED_COLORS = [5, 9, 13, 21, 29, 37, 45, 53] as const;

/** Playhead LED velocity (white/bright) */
export const SEQUENCER_PLAYHEAD_LED_COLOR = 3;
