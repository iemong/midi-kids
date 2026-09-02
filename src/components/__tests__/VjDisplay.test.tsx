import { render, screen, fireEvent } from "@testing-library/react";
import { VjDisplay } from "@/components/VjDisplay";

describe("VjDisplay", () => {
  it("renders the exit button", () => {
    render(<VjDisplay activePads={new Map()} waveform="sine" onExit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "タッチモードに戻す" })).toBeInTheDocument();
  });

  it("shows the current waveform label", () => {
    render(<VjDisplay activePads={new Map()} waveform="square" onExit={vi.fn()} />);
    expect(screen.getByText("スクエア")).toBeInTheDocument();
  });

  it("calls onExit when the exit button is clicked", () => {
    const onExit = vi.fn();
    render(<VjDisplay activePads={new Map()} waveform="sine" onExit={onExit} />);

    fireEvent.click(screen.getByRole("button", { name: "タッチモードに戻す" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("renders no bursts when there are no active pads", () => {
    const { container } = render(
      <VjDisplay activePads={new Map()} waveform="sine" onExit={vi.fn()} />,
    );
    expect(container.querySelectorAll("[data-vj-burst]")).toHaveLength(0);
  });

  it("renders a burst for each active pad with its color", () => {
    const activePads = new Map([[44, { color: "#ff3333" }]]);
    const { container } = render(
      <VjDisplay activePads={activePads} waveform="sine" onExit={vi.fn()} />,
    );

    const burst = container.querySelector('[data-note="44"][data-vj-burst="true"]') as HTMLElement;
    expect(burst).toBeInTheDocument();
    expect(burst.style.backgroundColor).toBe("rgb(255, 51, 51)");
  });

  it("skips notes outside the valid grid range", () => {
    const activePads = new Map([[99, { color: "#ff3333" }]]);
    const { container } = render(
      <VjDisplay activePads={activePads} waveform="sine" onExit={vi.fn()} />,
    );

    expect(container.querySelectorAll("[data-vj-burst]")).toHaveLength(0);
  });
});
