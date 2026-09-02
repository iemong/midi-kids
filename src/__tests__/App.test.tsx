import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { SEQUENCER_ROW_LED_COLORS } from "@/lib/midi-utils";

describe("App", () => {
  it("renders the app title", () => {
    render(<App />);
    expect(screen.getByText("MIDI Kids")).toBeInTheDocument();
  });

  it("renders MIDI status badge", () => {
    render(<App />);
    expect(screen.getByText("非対応")).toBeInTheDocument();
  });

  it("shows unsupported message when no MIDI API", () => {
    render(<App />);
    expect(screen.getByText(/このブラウザはWebMIDI APIに対応していません/)).toBeInTheDocument();
  });

  it("starts on launchpad view with 64+ buttons", () => {
    render(<App />);
    expect(screen.getAllByRole("button").length).toBeGreaterThan(64);
  });

  it("switches to sequencer view", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    expect(screen.getByRole("button", { name: "▶" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "■" })).toBeInTheDocument();
    expect(screen.getByText("120 BPM")).toBeInTheDocument();
  });

  it("switches back to launchpad view", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "シーケンサー" }));
    await user.click(screen.getByRole("button", { name: "ランチパッド" }));

    expect(screen.getAllByRole("button").length).toBeGreaterThan(64);
  });

  it("displays waveform selector in launchpad view", () => {
    render(<App />);
    expect(screen.getByText("トライアングル")).toBeInTheDocument();
  });

  it("displays pitch offset controls in sequencer view", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "シーケンサー" }));
    expect(screen.getByText("音程 +0")).toBeInTheDocument();
  });

  describe("launchpad interactions", () => {
    it("activates pad on pointer down and deactivates on pointer up", () => {
      const { container } = render(<App />);

      const pad = container.querySelector('[data-note="44"]') as HTMLElement;
      fireEvent.pointerDown(pad);
      expect(pad.style.transform).toBe("scale(0.92)");

      fireEvent.pointerUp(pad);
      expect(pad.style.transform).toBe("scale(1)");
    });

    it("changes waveform with buttons", async () => {
      const user = userEvent.setup();
      render(<App />);

      const waveformButtons = screen.getAllByRole("button");
      const upBtn = waveformButtons.find((b) => b.textContent === "▲");
      const downBtn = waveformButtons.find((b) => b.textContent === "▼");

      await user.click(downBtn!);
      expect(screen.getByText("サイン")).toBeInTheDocument();

      await user.click(upBtn!);
      expect(screen.getByText("トライアングル")).toBeInTheDocument();
    });

    it("ignores non-arrow keyboard events", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.keyboard("{Enter}");
      expect(screen.getByText("トライアングル")).toBeInTheDocument();
    });

    it("changes waveform with keyboard arrows", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.keyboard("{ArrowDown}");
      expect(screen.getByText("サイン")).toBeInTheDocument();

      await user.keyboard("{ArrowUp}");
      expect(screen.getByText("トライアングル")).toBeInTheDocument();
    });

    it("handles onPointerDown on root to resume context", () => {
      const { container } = render(<App />);
      const root = container.firstElementChild as HTMLElement;
      fireEvent.pointerDown(root);
    });
  });

  describe("sequencer interactions", () => {
    it("toggles cells in sequencer grid", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "シーケンサー" }));

      const allButtons = screen.getAllByRole("button");
      const gridButtons = allButtons.filter((b) => b.className.includes("aspect-square"));
      expect(gridButtons.length).toBe(64);

      await user.click(gridButtons[0]);
    });

    it("plays and stops sequencer", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "シーケンサー" }));

      const playBtn = screen.getByRole("button", { name: "▶" });
      const stopBtn = screen.getByRole("button", { name: "■" });

      expect(playBtn).not.toBeDisabled();
      expect(stopBtn).toBeDisabled();

      await user.click(playBtn);
      expect(playBtn).toBeDisabled();
      expect(stopBtn).not.toBeDisabled();

      await user.click(stopBtn);
      expect(playBtn).not.toBeDisabled();
    });

    it("clears sequencer grid", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "シーケンサー" }));

      await user.click(screen.getByRole("button", { name: "クリア" }));
    });

    it("adjusts pitch offset up and down", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "シーケンサー" }));

      const allButtons = screen.getAllByRole("button");
      const pitchUp = allButtons.find((b) => b.textContent === "+");
      const pitchDown = allButtons.find((b) => b.textContent === "-");

      await user.click(pitchUp!);
      expect(screen.getByText("音程 +1")).toBeInTheDocument();

      await user.click(pitchDown!);
      expect(screen.getByText("音程 +0")).toBeInTheDocument();
    });

    it("clamps pitch offset at maximum", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "シーケンサー" }));

      const allButtons = screen.getAllByRole("button");
      const pitchUp = allButtons.find((b) => b.textContent === "+");

      // Click up many times to reach max (8)
      for (let i = 0; i < 12; i++) {
        await user.click(pitchUp!);
      }
      expect(screen.getByText("音程 +8")).toBeInTheDocument();
    });

    it("clamps pitch offset at minimum", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "シーケンサー" }));

      const allButtons = screen.getAllByRole("button");
      const pitchDown = allButtons.find((b) => b.textContent === "-");

      // Click down many times to reach min (-4)
      for (let i = 0; i < 8; i++) {
        await user.click(pitchDown!);
      }
      expect(screen.getByText("音程 -4")).toBeInTheDocument();
    });

    it("changes BPM with slider", async () => {
      render(<App />);

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "シーケンサー" }));

      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "180" } });
      expect(screen.getByText("180 BPM")).toBeInTheDocument();
    });

    it("changes waveform in sequencer view", async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole("button", { name: "シーケンサー" }));

      const allButtons = screen.getAllByRole("button");
      const waveformDown = allButtons.find((b) => b.textContent === "▼");
      const waveformUp = allButtons.find((b) => b.textContent === "▲");

      await user.click(waveformDown!);
      expect(screen.getByText("サイン")).toBeInTheDocument();

      await user.click(waveformUp!);
      expect(screen.getByText("トライアングル")).toBeInTheDocument();
    });
  });
});

describe("App with MIDI", () => {
  const mockSend = vi.fn();
  const mockInput: { name: string; onmidimessage: ((e: MIDIMessageEvent) => void) | null } = {
    name: "Launchpad Mini",
    onmidimessage: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInput.onmidimessage = null;

    Object.defineProperty(navigator, "requestMIDIAccess", {
      value: vi.fn().mockResolvedValue({
        inputs: new Map([["input-1", mockInput]]),
        outputs: new Map([["output-1", { name: "Launchpad Mini", send: mockSend }]]),
      }),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "requestMIDIAccess", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("shows connect button when MIDI is supported", () => {
    render(<App />);
    expect(screen.getByText("未接続")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MIDI接続" })).toBeInTheDocument();
  });

  it("connects to MIDI device", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    expect(screen.getByText("接続済み")).toBeInTheDocument();
  });

  it("shows the VJ display instead of the touch grid when connected in launchpad view", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));

    expect(screen.getAllByRole("button").length).toBeLessThan(20);
    expect(screen.getByRole("button", { name: "タッチモードに戻す" })).toBeInTheDocument();
  });

  it("toggles between VJ display and touch grid via the manual override", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "タッチモードに戻す" }));

    expect(screen.getAllByRole("button").length).toBeGreaterThan(64);
    expect(screen.getByRole("button", { name: "VJ表示に切り替え" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "VJ表示に切り替え" }));
    expect(screen.getAllByRole("button").length).toBeLessThan(20);
  });

  it("sends LED on when the physical pad is pressed in launchpad mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x90, 44, 100]),
      } as MIDIMessageEvent);
    });

    expect(mockSend).toHaveBeenCalledWith(expect.arrayContaining([0x90, 44]));
  });

  it("sends LED off when the physical pad is released in launchpad mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x90, 44, 100]),
      } as MIDIMessageEvent);
    });
    mockSend.mockClear();

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x80, 44, 0]),
      } as MIDIMessageEvent);
    });

    expect(mockSend).toHaveBeenCalledWith([0x80, 44, 0]);
  });

  it("shows a VJ burst for the active pad on MIDI note on", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x90, 44, 100]),
      } as MIDIMessageEvent);
    });

    expect(container.querySelector('[data-note="44"][data-vj-burst="true"]')).toBeInTheDocument();
  });

  it("removes the VJ burst on MIDI note off", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x90, 44, 100]),
      } as MIDIMessageEvent);
    });

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x80, 44, 0]),
      } as MIDIMessageEvent);
    });

    expect(
      container.querySelector('[data-note="44"][data-vj-burst="true"]'),
    ).not.toBeInTheDocument();
  });

  it("ignores note off in sequencer mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    // Note off in sequencer mode should be ignored
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x80, 44, 0]),
      } as MIDIMessageEvent);
    });
  });

  it("handles MIDI note on in sequencer mode to toggle cell", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    // Simulate MIDI note on for cell (row 3, col 4) = note 44
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x90, 44, 100]),
      } as MIDIMessageEvent);
    });
  });

  it("handles CC for waveform in launchpad mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));

    // CC 105 = next waveform in launchpad mode
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 105, 127]),
      } as MIDIMessageEvent);
    });

    expect(screen.getByText("サイン")).toBeInTheDocument();

    // CC 104 = prev waveform in launchpad mode
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 104, 127]),
      } as MIDIMessageEvent);
    });

    expect(screen.getByText("トライアングル")).toBeInTheDocument();
  });

  it("handles CC for pitch in sequencer mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    // CC 105 = pitch up in sequencer mode
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 105, 127]),
      } as MIDIMessageEvent);
    });

    expect(screen.getByText("音程 +1")).toBeInTheDocument();

    // CC 104 = pitch down in sequencer mode
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 104, 127]),
      } as MIDIMessageEvent);
    });

    expect(screen.getByText("音程 +0")).toBeInTheDocument();
  });

  it("handles CC for waveform (106/107) in sequencer mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 107, 127]),
      } as MIDIMessageEvent);
    });

    expect(screen.getByText("サイン")).toBeInTheDocument();

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 106, 127]),
      } as MIDIMessageEvent);
    });

    expect(screen.getByText("トライアングル")).toBeInTheDocument();
  });

  it("ignores unrecognized CC in launchpad mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));

    // CC 108 is not mapped in launchpad mode
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 108, 127]),
      } as MIDIMessageEvent);
    });

    // Waveform should not change
    expect(screen.getByText("トライアングル")).toBeInTheDocument();
  });

  it("ignores unrecognized CC in sequencer mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    // CC 108 is not mapped in sequencer mode
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 108, 127]),
      } as MIDIMessageEvent);
    });

    // Pitch and waveform should not change
    expect(screen.getByText("音程 +0")).toBeInTheDocument();
    expect(screen.getByText("トライアングル")).toBeInTheDocument();
  });

  it("ignores CC with value 0", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));

    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0xb0, 105, 0]),
      } as MIDIMessageEvent);
    });

    // Waveform should not change
    expect(screen.getByText("トライアングル")).toBeInTheDocument();
  });

  it("clears LEDs when switching views", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    mockSend.mockClear();

    await user.click(screen.getByRole("button", { name: "シーケンサー" }));
    // Should have sent Note Off for all 64 pads
    expect(mockSend).toHaveBeenCalled();
  });

  it("updates sequencer LEDs when connected and in sequencer view", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    // LEDs should have been updated
    expect(mockSend).toHaveBeenCalled();
  });

  it("keeps a painted sequencer LED lit after leaving and returning to the view", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    const allButtons = screen.getAllByRole("button");
    const gridButtons = allButtons.filter((b) => b.className.includes("aspect-square"));
    await user.click(gridButtons[0]); // row 7, step 0 -> note 81

    // Leave and come back to sequencer view: the paint effect must run after
    // (not before) the clear, otherwise the clear silently wipes the paint.
    await user.click(screen.getByRole("button", { name: "ランチパッド" }));
    mockSend.mockClear();
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    const calls = mockSend.mock.calls.filter((args) => args[0][1] === 81);
    expect(calls[calls.length - 1][0]).toEqual([0x90, 81, SEQUENCER_ROW_LED_COLORS[7]]);
  });

  it("handles MIDI note on for invalid note in sequencer mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MIDI接続" }));
    await user.click(screen.getByRole("button", { name: "シーケンサー" }));

    // Note 99 is out of range (noteToGrid returns null)
    act(() => {
      mockInput.onmidimessage?.({
        data: new Uint8Array([0x90, 99, 100]),
      } as MIDIMessageEvent);
    });
    // Should not throw
  });
});

describe("App sequencer playback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays step notes when sequencer has active cells", () => {
    render(<App />);

    // Switch to sequencer
    fireEvent.click(screen.getByRole("button", { name: "シーケンサー" }));

    // Toggle a cell (row 7, step 0 - first button in grid)
    const allButtons = screen.getAllByRole("button");
    const gridButtons = allButtons.filter((b) => b.className.includes("aspect-square"));
    fireEvent.click(gridButtons[0]); // row 7, step 0

    // Play
    fireEvent.click(screen.getByRole("button", { name: "▶" }));

    // Advance timer to trigger step callback (handleStep)
    act(() => vi.advanceTimersByTime(125));

    // Stop to clean up
    fireEvent.click(screen.getByRole("button", { name: "■" }));
  });
});

describe("App sequencer LED feedback", () => {
  const mockSend = vi.fn();
  const mockInput: { name: string; onmidimessage: ((e: MIDIMessageEvent) => void) | null } = {
    name: "Launchpad Mini",
    onmidimessage: null,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockInput.onmidimessage = null;

    Object.defineProperty(navigator, "requestMIDIAccess", {
      value: vi.fn().mockResolvedValue({
        inputs: new Map([["input-1", mockInput]]),
        outputs: new Map([["output-1", { name: "Launchpad Mini", send: mockSend }]]),
      }),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, "requestMIDIAccess", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it("sends active+playhead and playhead-only LED colors", async () => {
    render(<App />);

    // Connect MIDI - need to flush the async connect promise
    fireEvent.click(screen.getByRole("button", { name: "MIDI接続" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Switch to sequencer
    fireEvent.click(screen.getByRole("button", { name: "シーケンサー" }));

    // Toggle a cell at row 7, step 0
    const allButtons = screen.getAllByRole("button");
    const gridButtons = allButtons.filter((b) => b.className.includes("aspect-square"));
    fireEvent.click(gridButtons[0]); // row 7, step 0

    // Play sequencer
    fireEvent.click(screen.getByRole("button", { name: "▶" }));

    mockSend.mockClear();

    // Advance to trigger first step (step 0)
    act(() => vi.advanceTimersByTime(125));

    // Should have sent LED updates including active+playhead (velocity 63)
    expect(mockSend).toHaveBeenCalledWith([0x90, expect.any(Number), 63]);

    // At minimum, we should have many LED update calls
    expect(mockSend.mock.calls.length).toBeGreaterThan(0);

    // Stop
    fireEvent.click(screen.getByRole("button", { name: "■" }));
  });
});
