import "@testing-library/jest-dom/vitest";

// Mock setPointerCapture / releasePointerCapture (not available in jsdom)
if (typeof HTMLElement !== "undefined") {
  HTMLElement.prototype.setPointerCapture = HTMLElement.prototype.setPointerCapture ?? (() => {});
  HTMLElement.prototype.releasePointerCapture =
    HTMLElement.prototype.releasePointerCapture ?? (() => {});
}

// Global AudioContext mock
globalThis.AudioContext = function AudioContext() {
  return {
    currentTime: 0,
    state: "running" as AudioContextState,
    resume: () => Promise.resolve(),
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
