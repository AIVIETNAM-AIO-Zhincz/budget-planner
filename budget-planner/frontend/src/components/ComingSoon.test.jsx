import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, i18n } from "../test/utils.jsx";
import ComingSoon from "./ComingSoon.jsx";

describe("ComingSoon", () => {
  it("hiển thị tiêu đề 'sắp ra mắt'", () => {
    renderWithProviders(<ComingSoon />);
    expect(screen.getByText(i18n.t("common.comingSoon"))).toBeInTheDocument();
  });

  it("hiển thị hint tuỳ chỉnh khi truyền", () => {
    renderWithProviders(<ComingSoon hint="Tính năng X đang phát triển" />);
    expect(screen.getByText("Tính năng X đang phát triển")).toBeInTheDocument();
  });
});
