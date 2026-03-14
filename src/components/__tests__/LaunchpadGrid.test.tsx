import { render, screen, fireEvent } from "@testing-library/react";
import { LaunchpadGrid } from "@/components/LaunchpadGrid";

describe("LaunchpadGrid", () => {
  it("renders 64 pad buttons", () => {
    render(
      <LaunchpadGrid
        activePads={new Map()}
        onPadOn={vi.fn()}
        onPadOff={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(64);
  });

  it("shows active pad with color", () => {
    const activePads = new Map([[44, { color: "#ff0000" }]]);

    const { container } = render(
      <LaunchpadGrid
        activePads={activePads}
        onPadOn={vi.fn()}
        onPadOff={vi.fn()}
      />
    );

    const activeButton = container.querySelector('[data-note="44"]') as HTMLElement;
    expect(activeButton).toBeTruthy();
    expect(activeButton.style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(activeButton.style.transform).toBe("scale(0.92)");
  });

  it("calls onPadOn on pointer down", () => {
    const onPadOn = vi.fn();

    const { container } = render(
      <LaunchpadGrid
        activePads={new Map()}
        onPadOn={onPadOn}
        onPadOff={vi.fn()}
      />
    );

    const button = container.querySelector('[data-note="81"]') as HTMLElement;
    fireEvent.pointerDown(button);
    expect(onPadOn).toHaveBeenCalledWith(81);
  });

  it("calls onPadOff on pointer up", () => {
    const onPadOff = vi.fn();

    const { container } = render(
      <LaunchpadGrid
        activePads={new Map()}
        onPadOn={vi.fn()}
        onPadOff={onPadOff}
      />
    );

    const button = container.querySelector('[data-note="81"]') as HTMLElement;
    fireEvent.pointerUp(button);
    expect(onPadOff).toHaveBeenCalledWith(81);
  });

  it("calls onPadOff on pointer cancel", () => {
    const onPadOff = vi.fn();

    const { container } = render(
      <LaunchpadGrid
        activePads={new Map()}
        onPadOn={vi.fn()}
        onPadOff={onPadOff}
      />
    );

    const button = container.querySelector('[data-note="81"]') as HTMLElement;
    fireEvent.pointerCancel(button);
    expect(onPadOff).toHaveBeenCalledWith(81);
  });

  it("renders inactive pads with default scale", () => {
    render(
      <LaunchpadGrid
        activePads={new Map()}
        onPadOn={vi.fn()}
        onPadOff={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons[0].style.transform).toBe("scale(1)");
  });
});
