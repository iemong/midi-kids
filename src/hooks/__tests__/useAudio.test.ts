import { renderHook, act } from "@testing-library/react";
import { useAudio } from "@/hooks/useAudio";

describe("useAudio", () => {
  it("provides initial waveform as triangle", () => {
    const { result } = renderHook(() => useAudio());
    expect(result.current.waveform).toBe("triangle");
  });

  it("cycles waveforms forward", () => {
    const { result } = renderHook(() => useAudio());

    act(() => result.current.nextWaveform());
    expect(result.current.waveform).toBe("sine");

    act(() => result.current.nextWaveform());
    expect(result.current.waveform).toBe("square");

    act(() => result.current.nextWaveform());
    expect(result.current.waveform).toBe("sawtooth");

    act(() => result.current.nextWaveform());
    expect(result.current.waveform).toBe("triangle");
  });

  it("cycles waveforms backward", () => {
    const { result } = renderHook(() => useAudio());

    act(() => result.current.prevWaveform());
    expect(result.current.waveform).toBe("sawtooth");
  });

  it("plays a note", () => {
    const { result } = renderHook(() => useAudio());
    act(() => result.current.playNote(44));
  });

  it("does not play duplicate notes", () => {
    const { result } = renderHook(() => useAudio());

    act(() => result.current.playNote(44));
    act(() => result.current.playNote(44));
  });

  it("stops a note", () => {
    const { result } = renderHook(() => useAudio());

    act(() => result.current.playNote(44));
    act(() => result.current.stopNote(44));
  });

  it("plays note with fallback frequency for invalid grid position", () => {
    const { result } = renderHook(() => useAudio());
    // Note 99 doesn't map to a valid grid position (noteToGrid returns null)
    // so it should use fallback frequency of 440Hz
    act(() => result.current.playNote(99));
    act(() => result.current.stopNote(99));
  });

  it("handles stopping a non-playing note gracefully", () => {
    const { result } = renderHook(() => useAudio());
    act(() => result.current.stopNote(99));
  });

  it("resumes context", () => {
    const { result } = renderHook(() => useAudio());
    act(() => result.current.resumeContext());
  });

  it("resumes suspended AudioContext", () => {
    const resumeMock = vi.fn().mockResolvedValue(undefined);
    const origAudioContext = globalThis.AudioContext;
    globalThis.AudioContext = function AudioContext() {
      return {
        currentTime: 0,
        state: "suspended" as AudioContextState,
        resume: resumeMock,
        destination: {},
        createOscillator: () => ({
          type: "triangle" as OscillatorType,
          frequency: { setValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {},
        }),
        createGain: () => ({
          gain: {
            setValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
            cancelScheduledValues: () => {},
            value: 0.3,
          },
          connect: () => {},
        }),
      };
    } as unknown as typeof AudioContext;

    const { result } = renderHook(() => useAudio());
    act(() => result.current.resumeContext());
    expect(resumeMock).toHaveBeenCalled();

    globalThis.AudioContext = origAudioContext;
  });
});
