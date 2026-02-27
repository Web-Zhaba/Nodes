import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuantityControl } from "@/features/nodes/components/controls/QuantityControl";
import type { Node } from "@/types";

const mockNode: Node = {
  id: "test-node-id",
  user_id: "test-user",
  name: "Пить воду",
  description: "Пить достаточно воды",
  node_type: "quantity",
  mass: 3,
  stability_score: 40,
  completion_count: 15,
  target_value: 8,
  category: "default",
  frequency: "daily",
  color: "#22c55e",
  icon: "Droplet",
  created_at: "2026-02-27T00:00:00Z",
  updated_at: "2026-02-27T00:00:00Z",
};

describe("QuantityControl", () => {
  it("должен отображать текущее значение", () => {
    const handleImpulse = vi.fn();
    const handleUpdateValue = vi.fn();

    render(
      <QuantityControl
        node={mockNode}
        currentValue={3}
        onImpulse={handleImpulse}
        onUpdateValue={handleUpdateValue}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("должен отображать прогресс", () => {
    const handleImpulse = vi.fn();
    const handleUpdateValue = vi.fn();

    render(
      <QuantityControl
        node={mockNode}
        currentValue={3}
        onImpulse={handleImpulse}
        onUpdateValue={handleUpdateValue}
      />,
    );

    expect(screen.getByText("3 / 8")).toBeInTheDocument();
  });

  it("должен увеличивать значение при клике на +", () => {
    const handleImpulse = vi.fn();
    const handleUpdateValue = vi.fn();

    render(
      <QuantityControl
        node={mockNode}
        currentValue={3}
        onImpulse={handleImpulse}
        onUpdateValue={handleUpdateValue}
      />,
    );

    fireEvent.click(screen.getByTestId("increment-button"));

    expect(handleUpdateValue).toHaveBeenCalledWith(4);
  });

  it("должен уменьшать значение при клике на -", () => {
    const handleImpulse = vi.fn();
    const handleUpdateValue = vi.fn();

    render(
      <QuantityControl
        node={mockNode}
        currentValue={3}
        onImpulse={handleImpulse}
        onUpdateValue={handleUpdateValue}
      />,
    );

    fireEvent.click(screen.getByTestId("decrement-button"));

    expect(handleUpdateValue).toHaveBeenCalledWith(2);
  });

  it("не должен уменьшать значение ниже 0", () => {
    const handleImpulse = vi.fn();
    const handleUpdateValue = vi.fn();

    render(
      <QuantityControl
        node={mockNode}
        currentValue={0}
        onImpulse={handleImpulse}
        onUpdateValue={handleUpdateValue}
      />,
    );

    const minusButton = screen.getByTestId("decrement-button");
    expect(minusButton).toBeDisabled();
  });

  it("должен показывать 'Сохранить успех!' когда значение >= цели", () => {
    const handleImpulse = vi.fn();
    const handleUpdateValue = vi.fn();

    render(
      <QuantityControl
        node={mockNode}
        currentValue={8}
        onImpulse={handleImpulse}
        onUpdateValue={handleUpdateValue}
      />,
    );

    expect(screen.getByText("Сохранить успех!")).toBeInTheDocument();
  });

  it("должен вызывать onImpulse при сохранении", async () => {
    const handleImpulse = vi.fn().mockResolvedValue(undefined);
    const handleUpdateValue = vi.fn();

    render(
      <QuantityControl
        node={mockNode}
        currentValue={5}
        onImpulse={handleImpulse}
        onUpdateValue={handleUpdateValue}
      />,
    );

    fireEvent.click(screen.getByText("Сохранить прогресс"));

    await waitFor(() => {
      expect(handleImpulse).toHaveBeenCalledWith(5);
    });
  });

  it("должен быть отключён когда значение 0", () => {
    const handleImpulse = vi.fn();
    const handleUpdateValue = vi.fn();

    render(
      <QuantityControl
        node={mockNode}
        currentValue={0}
        onImpulse={handleImpulse}
        onUpdateValue={handleUpdateValue}
      />,
    );

    const saveButton = screen.getByText("Сохранить прогресс");
    expect(saveButton).toBeDisabled();
  });
});
