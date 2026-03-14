import { renderHook, act } from "@testing-library/react";
import { useSequencerAudio } from "@/hooks/useSequencerAudio";

describe("useSequencerAudio", () => {
  it("plays a step note with default pitch offset", () => {
    const { result } = renderHook(() => useSequencerAudio());
    act(() => result.current.playStepNote(0, "sine"));
  });

  it("plays a step note with custom pitch offset", () => {
    const { result } = renderHook(() => useSequencerAudio());
    act(() => result.current.playStepNote(3, "square", 2));
  });

  it("resumes context", () => {
    const { result } = renderHook(() => useSequencerAudio());
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

    const { result } = renderHook(() => useSequencerAudio());
    act(() => result.current.resumeContext());
    expect(resumeMock).toHaveBeenCalled();

    globalThis.AudioContext = origAudioContext;
  });
});
