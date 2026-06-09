import { describe, it, expect } from "vitest";
import { summarize, expenseByCategory, flowByDate } from "./charts.js";

const items = [
  { type: "income", amount: 1000, category_name: "Lương", date: "2026-06-01" },
  { type: "expense", amount: 300, category_name: "Ăn uống", date: "2026-06-01" },
  { type: "expense", amount: 200, category_name: "Ăn uống", date: "2026-06-02" },
  { type: "expense", amount: 100, category_name: "", date: "2026-06-02" },
];

describe("summarize", () => {
  it("tính income/expense/balance/count", () => {
    expect(summarize(items)).toEqual({ income: 1000, expense: 600, balance: 400, count: 4 });
  });

  it("mảng rỗng → 0", () => {
    expect(summarize([])).toEqual({ income: 0, expense: 0, balance: 0, count: 0 });
  });
});

describe("expenseByCategory", () => {
  it("bỏ income, gộp danh mục, sort giảm dần, 'Khác' cho rỗng", () => {
    const result = expenseByCategory(items);
    expect(result.map((x) => [x.name, x.value])).toEqual([
      ["Ăn uống", 500],
      ["Khác", 100],
    ]);
    expect(result[0].color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("flowByDate", () => {
  it("dates sắp xếp + mảng thu/chi khớp", () => {
    const flow = flowByDate(items);
    expect(flow.dates).toEqual(["2026-06-01", "2026-06-02"]);
    expect(flow.income).toEqual([1000, 0]);
    expect(flow.expense).toEqual([300, 300]);
  });
});
