import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodeCardStats } from "@/features/nodes/components/NodeCardStats";

describe("NodeCardStats", () => {
  it("должен отображать счётчик выполнений", () => {
    render(<NodeCardStats completionCount={42} />);

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("должен отображать 'Выполнено:' label", () => {
    render(<NodeCardStats completionCount={10} />);

    expect(screen.getByText("Выполнено:")).toBeInTheDocument();
  });

  it("должен показывать CheckCircle иконку когда есть выполнения", () => {
    const { container } = render(<NodeCardStats completionCount={5} />);

    const checkIcon = container.querySelector("svg");
    expect(checkIcon).toBeInTheDocument();
  });

  it("должен показывать пустой Circle иконку когда нет выполнений", () => {
    const { container } = render(<NodeCardStats completionCount={0} />);

    const circleIcon = container.querySelector("svg");
    expect(circleIcon).toBeInTheDocument();
  });

  it("должен отображать большие числа корректно", () => {
    render(<NodeCardStats completionCount={1000} />);

    expect(screen.getByText("1000")).toBeInTheDocument();
  });
});
