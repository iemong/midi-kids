import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SequencerControls } from "@/components/SequencerControls";

function renderControls(overrides = {}) {
  const props = {
    isPlaying: false,
    bpm: 120,
    waveform: "triangle" as OscillatorType,
    pitchOffset: 0,
    onPlay: vi.fn(),
    onStop: vi.fn(),
    onClear: vi.fn(),
    onBpmChange: vi.fn(),
    onNextWaveform: vi.fn(),
    onPrevWaveform: vi.fn(),
    onPitchUp: vi.fn(),
    onPitchDown: vi.fn(),
    ...overrides,
  };
  return { ...render(<SequencerControls {...props} />), props };
}

describe("SequencerControls", () => {
  it("renders play, stop, clear buttons", () => {
    renderControls();

    expect(screen.getByRole("button", { name: "▶" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "■" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "クリア" })).toBeInTheDocument();
  });

  it("disables play when playing", () => {
    renderControls({ isPlaying: true });

    expect(screen.getByRole("button", { name: "▶" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "■" })).not.toBeDisabled();
  });

  it("disables stop when not playing", () => {
    renderControls({ isPlaying: false });

    expect(screen.getByRole("button", { name: "■" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "▶" })).not.toBeDisabled();
  });

  it("calls onPlay when play is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderControls();

    await user.click(screen.getByRole("button", { name: "▶" }));
    expect(props.onPlay).toHaveBeenCalled();
  });

  it("calls onStop when stop is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderControls({ isPlaying: true });

    await user.click(screen.getByRole("button", { name: "■" }));
    expect(props.onStop).toHaveBeenCalled();
  });

  it("calls onClear when clear is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderControls();

    await user.click(screen.getByRole("button", { name: "クリア" }));
    expect(props.onClear).toHaveBeenCalled();
  });

  it("displays BPM value", () => {
    renderControls({ bpm: 180 });

    expect(screen.getByText("180 BPM")).toBeInTheDocument();
  });

  it("calls onBpmChange when slider changes", () => {
    const onBpmChange = vi.fn();
    renderControls({ onBpmChange });

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "180" } });
    expect(onBpmChange).toHaveBeenCalledWith(180);
  });

  it("displays waveform label", () => {
    renderControls({ waveform: "sine" as OscillatorType });

    expect(screen.getByText("サイン")).toBeInTheDocument();
  });

  it("calls waveform change callbacks", async () => {
    const user = userEvent.setup();
    const { props } = renderControls();

    const buttons = screen.getAllByRole("button");
    const prevBtn = buttons.find((b) => b.textContent === "▲");
    const nextBtn = buttons.find((b) => b.textContent === "▼");

    await user.click(prevBtn!);
    expect(props.onPrevWaveform).toHaveBeenCalled();

    await user.click(nextBtn!);
    expect(props.onNextWaveform).toHaveBeenCalled();
  });

  it("displays raw waveform name when no label exists", () => {
    renderControls({ waveform: "custom" as OscillatorType });
    expect(screen.getByText("custom")).toBeInTheDocument();
  });

  it("displays pitch offset", () => {
    renderControls({ pitchOffset: 3 });
    expect(screen.getByText("音程 +3")).toBeInTheDocument();
  });

  it("displays negative pitch offset", () => {
    renderControls({ pitchOffset: -2 });
    expect(screen.getByText("音程 -2")).toBeInTheDocument();
  });

  it("calls pitch change callbacks", async () => {
    const user = userEvent.setup();
    const { props } = renderControls();

    const buttons = screen.getAllByRole("button");
    const pitchDown = buttons.find((b) => b.textContent === "-");
    const pitchUp = buttons.find((b) => b.textContent === "+");

    await user.click(pitchDown!);
    expect(props.onPitchDown).toHaveBeenCalled();

    await user.click(pitchUp!);
    expect(props.onPitchUp).toHaveBeenCalled();
  });
});
