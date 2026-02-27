import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NodeCardStability } from "@/features/nodes/components/NodeCardStability";

describe("NodeCardStability", () => {
  it("должен отображать стабильность правильно", () => {
    render(<NodeCardStability stabilityScore={75} />);

    expect(screen.getByText("75/100")).toBeInTheDocument();
  });

  it("должен показывать зелёный цвет для высокой стабильности (>=70)", () => {
    const { container } = render(<NodeCardStability stabilityScore={85} />);

    const progressBar = container.querySelector(".bg-green-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("должен показывать жёлтый цвет для средней стабильности (30-70)", () => {
    const { container } = render(<NodeCardStability stabilityScore={50} />);

    const progressBar = container.querySelector(".bg-yellow-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("должен показывать красный цвет для низкой стабильности (<30)", () => {
    const { container } = render(<NodeCardStability stabilityScore={15} />);

    const progressBar = container.querySelector(".bg-red-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("должен отображать прогресс-бар с правильной шириной", () => {
    const { container } = render(<NodeCardStability stabilityScore={60} />);

    const progressBar = container.querySelector(
      ".bg-yellow-500",
    ) as HTMLDivElement;
    expect(progressBar).toHaveStyle("width: 60%");
  });

  it("должен округлять значения стабильности", () => {
    render(<NodeCardStability stabilityScore={75.7} />);

    expect(screen.getByText("76/100")).toBeInTheDocument();
  });
});
