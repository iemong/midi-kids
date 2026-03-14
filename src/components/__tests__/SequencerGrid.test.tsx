import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SequencerGrid } from "@/components/SequencerGrid";

function createGrid(rows = 8, steps = 8, fill = false): boolean[][] {
  return Array.from({ length: rows }, () => Array(steps).fill(fill));
}

describe("SequencerGrid", () => {
  it("renders 8x8 grid of buttons", () => {
    render(
      <SequencerGrid grid={createGrid()} currentStep={-1} pitchOffset={0} onToggleCell={vi.fn()} />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(64);
  });

  it("displays row labels based on pitch offset", () => {
    render(
      <SequencerGrid grid={createGrid()} currentStep={-1} pitchOffset={0} onToggleCell={vi.fn()} />,
    );

    expect(screen.getByText("C3")).toBeInTheDocument();
    expect(screen.getByText("E4")).toBeInTheDocument();
  });

  it("updates labels when pitch offset changes", () => {
    const { rerender } = render(
      <SequencerGrid grid={createGrid()} currentStep={-1} pitchOffset={0} onToggleCell={vi.fn()} />,
    );

    expect(screen.getByText("C3")).toBeInTheDocument();

    rerender(
      <SequencerGrid grid={createGrid()} currentStep={-1} pitchOffset={4} onToggleCell={vi.fn()} />,
    );

    expect(screen.getByText("C4")).toBeInTheDocument();
  });

  it("calls onToggleCell when a cell is clicked", async () => {
    const user = userEvent.setup();
    const onToggleCell = vi.fn();

    render(
      <SequencerGrid
        grid={createGrid()}
        currentStep={-1}
        pitchOffset={0}
        onToggleCell={onToggleCell}
      />,
    );

    const buttons = screen.getAllByRole("button");
    // First visible row is row 7 (highest pitch), first column is step 0
    await user.click(buttons[0]);
    expect(onToggleCell).toHaveBeenCalledWith(7, 0);
  });

  it("shows active cell with row color", () => {
    const grid = createGrid();
    grid[0][0] = true;

    render(<SequencerGrid grid={grid} currentStep={-1} pitchOffset={0} onToggleCell={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    // Row 0, step 0 is the last row visually (bottom), first column
    const activeButton = buttons[56]; // row 0 is at index 7*8=56
    expect(activeButton.style.backgroundColor).toBe("rgb(255, 51, 51)"); // #ff3333
  });

  it("applies glow and scale to active cell at playhead position", () => {
    const grid = createGrid();
    grid[7][3] = true; // Row 7 (top visually), step 3

    render(<SequencerGrid grid={grid} currentStep={3} pitchOffset={0} onToggleCell={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    // Row 7 is first visually, step 3 = index 3
    expect(buttons[3].style.transform).toBe("scale(0.9)");
    expect(buttons[3].style.boxShadow).not.toBe("none");
  });

  it("applies playhead ring to current step column", () => {
    render(
      <SequencerGrid grid={createGrid()} currentStep={3} pitchOffset={0} onToggleCell={vi.fn()} />,
    );

    const buttons = screen.getAllByRole("button");
    // Step 3 of first visible row (row 7) = index 3
    expect(buttons[3].className).toContain("ring-2");
  });
});
