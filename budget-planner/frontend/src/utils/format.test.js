import { describe, it, expect } from "vitest";
import { formatAmount, categoryColor, budgetTone, formatCompactVnd } from "./format.js";

describe("formatAmount", () => {
  it("định dạng số theo locale Việt Nam", () => {
    expect(formatAmount(50000)).toBe("50.000");
    expect(formatAmount(1250000)).toBe("1.250.000");
  });

  it("giá trị rỗng/không hợp lệ → '0'", () => {
    expect(formatAmount(0)).toBe("0");
    expect(formatAmount("abc")).toBe("0");
    expect(formatAmount(null)).toBe("0");
    expect(formatAmount(undefined)).toBe("0");
  });
});

describe("categoryColor", () => {
  it("ổn định theo tên + trả mã hex hợp lệ", () => {
    const c = categoryColor("Ăn uống");
    expect(c).toBe(categoryColor("Ăn uống"));
    expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    expect(categoryColor("Đi lại")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("các danh mục khác nhau → màu khác nhau", () => {
    const names = ["Ăn uống", "Lương", "Đi lại", "Giải trí", "Hoá đơn", "Sức khoẻ"];
    const colors = names.map(categoryColor);
    expect(new Set(colors).size).toBe(names.length);
  });
});

describe("budgetTone", () => {
  it("ngưỡng màu đúng", () => {
    expect(budgetTone(120)).toBe("error");
    expect(budgetTone(100)).toBe("error");
    expect(budgetTone(90)).toBe("warning");
    expect(budgetTone(80)).toBe("warning");
    expect(budgetTone(40)).toBe("success");
  });
});

describe("formatCompactVnd", () => {
  it("rút gọn theo đơn vị", () => {
    expect(formatCompactVnd(15000000)).toBe("15 tr");
    expect(formatCompactVnd(13645000)).toBe("13.6 tr");
    expect(formatCompactVnd(1300000000)).toBe("1.3 tỷ");
    expect(formatCompactVnd(50000)).toBe("50 k");
    expect(formatCompactVnd(999)).toBe("999");
    expect(formatCompactVnd(0)).toBe("0");
    expect(formatCompactVnd(-300000)).toBe("-300 k");
  });
});
