import { describe, it, expect } from "vitest";
import { renderWithProviders, screen } from "../test/utils.jsx";
import CountUpValue from "./CountUpValue.jsx";
import { formatCompactVnd } from "../utils/format.js";

describe("CountUpValue", () => {
  it("render giá trị cuối đã format + suffix (an toàn khi không animate)", () => {
    renderWithProviders(<CountUpValue value={15000000} format={formatCompactVnd} suffix="₫" />);
    expect(screen.getByText("15 tr")).toBeInTheDocument();
    expect(screen.getByText(/₫/)).toBeInTheDocument();
  });

  it("không suffix → chỉ số", () => {
    renderWithProviders(<CountUpValue value={50000} format={formatCompactVnd} />);
    expect(screen.getByText("50 k")).toBeInTheDocument();
  });
});
