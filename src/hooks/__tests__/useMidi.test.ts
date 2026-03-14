import { renderHook, act } from "@testing-library/react";
import { useMidi } from "@/hooks/useMidi";

describe("useMidi", () => {
  it("reports unsupported when no MIDI API", () => {
    const { result } = renderHook(() => useMidi());
    expect(result.current.status).toBe("unsupported");
  });

  it("does not connect when unsupported", async () => {
    const { result } = renderHook(() => useMidi());

    await act(async () => {
      result.current.connect();
    });
    expect(result.current.status).toBe("unsupported");
  });

  it("sendLedOn does nothing without output", () => {
    const { result } = renderHook(() => useMidi());
    // Should not throw
    act(() => result.current.sendLedOn(44));
  });

  it("sendLedOff does nothing without output", () => {
    const { result } = renderHook(() => useMidi());
    act(() => result.current.sendLedOff(44));
  });

  it("sendLedOnWithColor does nothing without output", () => {
    const { result } = renderHook(() => useMidi());
    act(() => result.current.sendLedOnWithColor(44, 63));
  });

  it("clearAllLeds does nothing without output", () => {
    const { result } = renderHook(() => useMidi());
    act(() => result.current.clearAllLeds());
  });

  describe("with MIDI API", () => {
    const mockSend = vi.fn();
    const mockInput = {
      name: "Launchpad Mini",
      onmidimessage: null as ((e: MIDIMessageEvent) => void) | null,
    };
    const mockOutput = {
      name: "Launchpad Mini",
      send: mockSend,
    };

    beforeEach(() => {
      vi.clearAllMocks();
      mockInput.onmidimessage = null;

      Object.defineProperty(navigator, "requestMIDIAccess", {
        value: vi.fn().mockResolvedValue({
          inputs: new Map([["input-1", mockInput]]),
          outputs: new Map([["output-1", mockOutput]]),
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

    it("connects to MIDI device", async () => {
      const { result } = renderHook(() => useMidi());

      await act(async () => {
        await result.current.connect();
      });
      expect(result.current.status).toBe("connected");
    });

    it("sends LED on with color", async () => {
      const { result } = renderHook(() => useMidi());

      await act(async () => {
        await result.current.connect();
      });

      act(() => result.current.sendLedOn(44));
      expect(mockSend).toHaveBeenCalledWith(expect.arrayContaining([0x90, 44]));
    });

    it("sends LED off", async () => {
      const { result } = renderHook(() => useMidi());

      await act(async () => {
        await result.current.connect();
      });

      act(() => result.current.sendLedOff(44));
      expect(mockSend).toHaveBeenCalledWith([0x80, 44, 0]);
    });

    it("sends LED on with specific color", async () => {
      const { result } = renderHook(() => useMidi());

      await act(async () => {
        await result.current.connect();
      });

      act(() => result.current.sendLedOnWithColor(44, 63));
      expect(mockSend).toHaveBeenCalledWith([0x90, 44, 63]);
    });

    it("clears all LEDs", async () => {
      const { result } = renderHook(() => useMidi());

      await act(async () => {
        await result.current.connect();
      });

      mockSend.mockClear();
      act(() => result.current.clearAllLeds());
      // 8x8 = 64 Note Off messages
      expect(mockSend).toHaveBeenCalledTimes(64);
    });

    it("handles note on MIDI message", async () => {
      const onNoteOn = vi.fn();
      const { result } = renderHook(() => useMidi({ onNoteOn }));

      await act(async () => {
        await result.current.connect();
      });

      // Simulate Note On message
      act(() => {
        mockInput.onmidimessage?.({
          data: new Uint8Array([0x90, 44, 100]),
        } as MIDIMessageEvent);
      });

      expect(onNoteOn).toHaveBeenCalledWith(44, 100);
    });

    it("handles note off MIDI message (0x80)", async () => {
      const onNoteOff = vi.fn();
      const { result } = renderHook(() => useMidi({ onNoteOff }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        mockInput.onmidimessage?.({
          data: new Uint8Array([0x80, 44, 0]),
        } as MIDIMessageEvent);
      });

      expect(onNoteOff).toHaveBeenCalledWith(44, 0);
    });

    it("handles note off as note on with velocity 0", async () => {
      const onNoteOff = vi.fn();
      const { result } = renderHook(() => useMidi({ onNoteOff }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        mockInput.onmidimessage?.({
          data: new Uint8Array([0x90, 44, 0]),
        } as MIDIMessageEvent);
      });

      expect(onNoteOff).toHaveBeenCalledWith(44, 0);
    });

    it("handles control change MIDI message", async () => {
      const onControlChange = vi.fn();
      const { result } = renderHook(() => useMidi({ onControlChange }));

      await act(async () => {
        await result.current.connect();
      });

      act(() => {
        mockInput.onmidimessage?.({
          data: new Uint8Array([0xb0, 104, 127]),
        } as MIDIMessageEvent);
      });

      expect(onControlChange).toHaveBeenCalledWith(104, 127);
    });

    it("ignores unrecognized MIDI commands", async () => {
      const onNoteOn = vi.fn();
      const onNoteOff = vi.fn();
      const onControlChange = vi.fn();
      const { result } = renderHook(() => useMidi({ onNoteOn, onNoteOff, onControlChange }));

      await act(async () => {
        await result.current.connect();
      });

      // Send a Program Change message (0xC0) - should be ignored
      act(() => {
        mockInput.onmidimessage?.({
          data: new Uint8Array([0xc0, 5, 0]),
        } as MIDIMessageEvent);
      });

      expect(onNoteOn).not.toHaveBeenCalled();
      expect(onNoteOff).not.toHaveBeenCalled();
      expect(onControlChange).not.toHaveBeenCalled();
    });

    it("falls back to first available device when no Launchpad", async () => {
      const genericInput = { name: "Generic MIDI", onmidimessage: null };
      const genericOutput = { name: "Generic MIDI", send: mockSend };

      vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce({
        inputs: new Map([["input-1", genericInput]]),
        outputs: new Map([["output-1", genericOutput]]),
      } as unknown as MIDIAccess);

      const { result } = renderHook(() => useMidi());

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe("connected");
    });

    it("stays disconnected when no inputs available", async () => {
      vi.mocked(navigator.requestMIDIAccess).mockResolvedValueOnce({
        inputs: new Map(),
        outputs: new Map(),
      } as unknown as MIDIAccess);

      const { result } = renderHook(() => useMidi());

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe("disconnected");
    });

    it("handles connection error", async () => {
      vi.mocked(navigator.requestMIDIAccess).mockRejectedValueOnce(
        new Error("denied")
      );

      const { result } = renderHook(() => useMidi());

      await act(async () => {
        await result.current.connect();
      });

      expect(result.current.status).toBe("disconnected");
    });
  });
});
