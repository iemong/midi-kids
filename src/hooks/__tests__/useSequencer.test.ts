import { renderHook, act } from "@testing-library/react";
import { useSequencer } from "@/hooks/useSequencer";

describe("useSequencer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with empty grid, stopped state, default BPM", () => {
    const onStep = vi.fn();
    const { result } = renderHook(() => useSequencer(onStep));

    expect(result.current.grid).toHaveLength(8);
    expect(result.current.grid[0]).toHaveLength(8);
    expect(result.current.grid.every((row) => row.every((cell) => cell === false))).toBe(true);
    expect(result.current.currentStep).toBe(-1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.bpm).toBe(120);
  });

  it("toggles cells", () => {
    const { result } = renderHook(() => useSequencer(vi.fn()));

    act(() => result.current.toggleCell(0, 0));
    expect(result.current.grid[0][0]).toBe(true);

    act(() => result.current.toggleCell(0, 0));
    expect(result.current.grid[0][0]).toBe(false);
  });

  it("plays and advances steps", () => {
    const onStep = vi.fn();
    const { result } = renderHook(() => useSequencer(onStep));

    act(() => result.current.toggleCell(0, 0));
    act(() => result.current.play());

    expect(result.current.isPlaying).toBe(true);

    // Advance one interval tick (at 120 BPM, 16th note = 125ms)
    act(() => vi.advanceTimersByTime(125));
    expect(result.current.currentStep).toBe(0);
    expect(onStep).toHaveBeenCalledWith([0]);
  });

  it("calls onStep only when there are active rows", () => {
    const onStep = vi.fn();
    const { result } = renderHook(() => useSequencer(onStep));

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(125));
    // Step 0 has no active rows
    expect(onStep).not.toHaveBeenCalled();
  });

  it("loops back to step 0 after last step", () => {
    const { result } = renderHook(() => useSequencer(vi.fn()));

    act(() => result.current.play());
    // Advance to step 7 (last step)
    act(() => vi.advanceTimersByTime(125 * 7));
    expect(result.current.currentStep).toBe(6);

    // One more step wraps to 7
    act(() => vi.advanceTimersByTime(125));
    expect(result.current.currentStep).toBe(7);

    // Next step wraps to 0
    act(() => vi.advanceTimersByTime(125));
    expect(result.current.currentStep).toBe(0);
  });

  it("stops playback", () => {
    const { result } = renderHook(() => useSequencer(vi.fn()));

    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(125));

    act(() => result.current.stop());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentStep).toBe(-1);
  });

  it("clears grid and stops", () => {
    const { result } = renderHook(() => useSequencer(vi.fn()));

    act(() => result.current.toggleCell(3, 5));
    act(() => result.current.play());
    act(() => result.current.clear());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.grid.every((row) => row.every((cell) => cell === false))).toBe(true);
  });

  it("changes BPM", () => {
    const { result } = renderHook(() => useSequencer(vi.fn()));

    act(() => result.current.setBpm(180));
    expect(result.current.bpm).toBe(180);
  });

  it("restarts interval when BPM changes during playback", () => {
    const onStep = vi.fn();
    const { result } = renderHook(() => useSequencer(onStep));

    act(() => result.current.toggleCell(0, 0));
    act(() => result.current.play());

    // Change BPM to 240 (period = 62.5ms)
    act(() => result.current.setBpm(240));

    onStep.mockClear();
    act(() => vi.advanceTimersByTime(63));
    expect(result.current.currentStep).toBeGreaterThanOrEqual(0);
  });

  it("reports multiple active rows per step", () => {
    const onStep = vi.fn();
    const { result } = renderHook(() => useSequencer(onStep));

    act(() => {
      result.current.toggleCell(0, 0);
      result.current.toggleCell(3, 0);
      result.current.toggleCell(7, 0);
    });
    act(() => result.current.play());
    act(() => vi.advanceTimersByTime(125));

    expect(onStep).toHaveBeenCalledWith([0, 3, 7]);
  });
});
