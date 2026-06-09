import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../test/utils.jsx";
import CategoryChip from "./CategoryChip.jsx";

describe("CategoryChip", () => {
  it("hiển thị tên danh mục", () => {
    renderWithProviders(<CategoryChip name="Ăn uống" />);
    expect(screen.getByText("Ăn uống")).toBeInTheDocument();
  });

  it("tên rỗng → không render chip", () => {
    const { container } = renderWithProviders(<CategoryChip name="" />);
    expect(container.querySelector(".MuiChip-root")).toBeNull();
  });
});
