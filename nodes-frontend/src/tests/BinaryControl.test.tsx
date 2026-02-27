import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BinaryControl } from "@/features/nodes/components/controls/BinaryControl";
import type { Node } from "@/types";

const mockNode: Node = {
  id: "test-node-id",
  user_id: "test-user",
  name: "Тестовый узел",
  description: "Описание",
  node_type: "binary",
  mass: 5,
  stability_score: 60,
  completion_count: 10,
  category: "default",
  frequency: "daily",
  color: "#8b5cf6",
  icon: "Circle",
  created_at: "2026-02-27T00:00:00Z",
  updated_at: "2026-02-27T00:00:00Z",
};

describe("BinaryControl", () => {
  it("должен отображать кнопку 'Отметить выполнение' когда не выполнено", () => {
    const handleImpulse = vi.fn();

    render(
      <BinaryControl
        node={mockNode}
        isCompletedToday={false}
        onImpulse={handleImpulse}
      />
    );

    expect(screen.getByText("Отметить выполнение")).toBeInTheDocument();
  });

  it("должен отображать 'Выполнено сегодня' когда выполнено", () => {
    const handleImpulse = vi.fn();

    render(
      <BinaryControl
        node={mockNode}
        isCompletedToday={true}
        onImpulse={handleImpulse}
      />
    );

    expect(screen.getByText("Выполнено сегодня")).toBeInTheDocument();
  });

  it("должен вызывать onImpulse с value=1 при клике", async () => {
    const handleImpulse = vi.fn().mockResolvedValue(undefined);

    render(
      <BinaryControl
        node={mockNode}
        isCompletedToday={false}
        onImpulse={handleImpulse}
      />
    );

    fireEvent.click(screen.getByText("Отметить выполнение"));

    await waitFor(() => {
      expect(handleImpulse).toHaveBeenCalledWith(1);
    });
  });

  it("должен показывать галочку когда выполнено", () => {
    const handleImpulse = vi.fn();

    const { container } = render(
      <BinaryControl
        node={mockNode}
        isCompletedToday={true}
        onImpulse={handleImpulse}
      />
    );

    // Проверяем, что есть иконка Check
    const checkIcon = container.querySelector("svg");
    expect(checkIcon).toBeInTheDocument();
  });

  it("должен быть отключён во время pending состояния", async () => {
    const handleImpulse = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <BinaryControl
        node={mockNode}
        isCompletedToday={false}
        onImpulse={handleImpulse}
      />
    );

    const button = screen.getByText("Отметить выполнение");
    fireEvent.click(button);

    // Сразу после клика кнопка должна быть disabled
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
