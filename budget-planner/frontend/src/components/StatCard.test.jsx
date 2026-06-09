import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "./StatCard.jsx";

describe("StatCard", () => {
  it("hiển thị nhãn và giá trị", () => {
    render(<StatCard label="Tổng thu" value="1.000.000 ₫" />);
    expect(screen.getByText("Tổng thu")).toBeInTheDocument();
    expect(screen.getByText("1.000.000 ₫")).toBeInTheDocument();
  });
});
