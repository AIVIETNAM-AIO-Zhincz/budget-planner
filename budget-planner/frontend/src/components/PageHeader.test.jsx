import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../test/utils.jsx";
import PageHeader from "./PageHeader.jsx";

describe("PageHeader", () => {
  it("hiển thị title, description và actions", () => {
    renderWithProviders(
      <PageHeader title="Giao dịch" description="Quản lý thu chi" actions={<button>Thêm</button>} />,
    );
    expect(screen.getByText("Giao dịch")).toBeInTheDocument();
    expect(screen.getByText("Quản lý thu chi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm" })).toBeInTheDocument();
  });
});
