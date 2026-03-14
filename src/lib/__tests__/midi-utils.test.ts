import {
  noteToGrid,
  gridToNote,
  gridToFrequency,
  WAVEFORMS,
  WAVEFORM_LABELS,
  BRIGHT_COLORS,
  randomColor,
  randomCssColor,
  SEQUENCER_NUM_STEPS,
  SEQUENCER_DEFAULT_BPM,
  getSequencerRowLabels,
  SEQUENCER_ROW_COLORS,
  SEQUENCER_ROW_LED_COLORS,
  SEQUENCER_PLAYHEAD_LED_COLOR,
} from "@/lib/midi-utils";

describe("noteToGrid", () => {
  it("converts valid note to grid position", () => {
    expect(noteToGrid(11)).toEqual({ row: 0, col: 0 });
    expect(noteToGrid(88)).toEqual({ row: 7, col: 7 });
    expect(noteToGrid(45)).toEqual({ row: 3, col: 4 });
  });

  it("returns null for out-of-range notes", () => {
    expect(noteToGrid(0)).toBeNull();
    expect(noteToGrid(1)).toBeNull();
    expect(noteToGrid(10)).toBeNull();
    expect(noteToGrid(89)).toBeNull();
    expect(noteToGrid(99)).toBeNull();
    expect(noteToGrid(19)).toBeNull();
  });
});

describe("gridToNote", () => {
  it("converts grid position to note number", () => {
    expect(gridToNote(0, 0)).toBe(11);
    expect(gridToNote(7, 7)).toBe(88);
    expect(gridToNote(3, 4)).toBe(45);
  });

  it("is inverse of noteToGrid for valid positions", () => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const note = gridToNote(row, col);
        expect(noteToGrid(note)).toEqual({ row, col });
      }
    }
  });
});

describe("gridToFrequency", () => {
  it("returns C3 frequency for (0, 0)", () => {
    expect(gridToFrequency(0, 0)).toBeCloseTo(130.81, 1);
  });

  it("returns higher frequency for higher columns", () => {
    const f0 = gridToFrequency(0, 0);
    const f1 = gridToFrequency(0, 1);
    expect(f1).toBeGreaterThan(f0);
  });

  it("shifts frequency up with row offset", () => {
    const f00 = gridToFrequency(0, 0);
    const f10 = gridToFrequency(1, 0);
    // Row 1 adds 3 semitones
    const expected = 130.81 * Math.pow(2, 3 / 12);
    expect(f10).toBeCloseTo(expected, 1);
    expect(f10).toBeGreaterThan(f00);
  });

  it("wraps pentatonic scale for col >= 8", () => {
    const f0 = gridToFrequency(0, 0);
    const f8 = gridToFrequency(0, 8);
    expect(f8).toBeCloseTo(f0, 5);
  });
});

describe("constants", () => {
  it("WAVEFORMS has 4 entries", () => {
    expect(WAVEFORMS).toEqual(["triangle", "sine", "square", "sawtooth"]);
  });

  it("WAVEFORM_LABELS has Japanese labels for all waveforms", () => {
    for (const w of WAVEFORMS) {
      expect(WAVEFORM_LABELS[w]).toBeDefined();
    }
  });

  it("BRIGHT_COLORS has 10 entries", () => {
    expect(BRIGHT_COLORS).toHaveLength(10);
  });

  it("SEQUENCER_NUM_STEPS is 8", () => {
    expect(SEQUENCER_NUM_STEPS).toBe(8);
  });

  it("SEQUENCER_DEFAULT_BPM is 120", () => {
    expect(SEQUENCER_DEFAULT_BPM).toBe(120);
  });

  it("SEQUENCER_ROW_COLORS has 8 entries", () => {
    expect(SEQUENCER_ROW_COLORS).toHaveLength(8);
  });

  it("SEQUENCER_ROW_LED_COLORS has 8 entries", () => {
    expect(SEQUENCER_ROW_LED_COLORS).toHaveLength(8);
  });

  it("SEQUENCER_PLAYHEAD_LED_COLOR is a number", () => {
    expect(typeof SEQUENCER_PLAYHEAD_LED_COLOR).toBe("number");
  });
});

describe("randomColor", () => {
  it("returns a value from BRIGHT_COLORS", () => {
    for (let i = 0; i < 20; i++) {
      const c = randomColor();
      expect(BRIGHT_COLORS).toContain(c);
    }
  });
});

describe("randomCssColor", () => {
  it("returns a hex color string", () => {
    for (let i = 0; i < 20; i++) {
      const c = randomCssColor();
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("getSequencerRowLabels", () => {
  it("returns 8 labels at offset 0", () => {
    const labels = getSequencerRowLabels(0);
    expect(labels).toHaveLength(8);
    expect(labels[0]).toBe("C3");
  });

  it("shifts labels with positive offset", () => {
    const labels = getSequencerRowLabels(1);
    expect(labels).toHaveLength(8);
    // Offset 1 = +3 semitones, C3 + 3 = D#3
    expect(labels[0]).toBe("D#3");
  });

  it("shifts labels with negative offset", () => {
    const labels = getSequencerRowLabels(-1);
    expect(labels).toHaveLength(8);
    // Offset -1 = -3 semitones, C3 - 3 = A2
    expect(labels[0]).toBe("A2");
  });

  it("handles large positive offset", () => {
    const labels = getSequencerRowLabels(4);
    expect(labels).toHaveLength(8);
    // Offset 4 = +12 semitones = 1 octave, C3 -> C4
    expect(labels[0]).toBe("C4");
  });
});
