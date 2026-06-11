import { categoryColor, formatCompactVnd } from "./format.js";

/** Tổng hợp KPI từ danh sách giao dịch (hàm thuần). */
export function summarize(items) {
  let income = 0;
  let expense = 0;
  for (const it of items) {
    const amt = Number(it.amount) || 0;
    if (it.type === "income") income += amt;
    else expense += amt;
  }
  return { income, expense, balance: income - expense, count: items.length };
}

/** Gom tổng chi theo danh mục → mảng {name, value, color}. */
export function expenseByCategory(items) {
  const map = new Map();
  for (const it of items) {
    if (it.type === "income") continue;
    const name = it.category_name || "Khác";
    map.set(name, (map.get(name) || 0) + (Number(it.amount) || 0));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, color: categoryColor(name) }))
    .sort((a, b) => b.value - a.value);
}

/** Gom thu & chi theo ngày → {dates, income[], expense[]}. */
export function flowByDate(items) {
  const map = new Map();
  for (const it of items) {
    const day = it.date || "—";
    const cur = map.get(day) || { income: 0, expense: 0 };
    if (it.type === "income") cur.income += Number(it.amount) || 0;
    else cur.expense += Number(it.amount) || 0;
    map.set(day, cur);
  }
  const dates = Array.from(map.keys()).sort();
  return {
    dates,
    income: dates.map((d) => map.get(d).income),
    expense: dates.map((d) => map.get(d).expense),
  };
}

/** Option ECharts: donut chi theo danh mục. */
export function pieOption(theme, data, animation) {
  const textColor = theme.palette.text.secondary;
  return {
    ...animation,
    tooltip: { trigger: "item", valueFormatter: (v) => `${Number(v).toLocaleString("vi-VN")} ₫` },
    legend: { bottom: 0, textStyle: { color: textColor }, type: "scroll" },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: theme.palette.background.paper, borderWidth: 2, borderRadius: 6 },
        label: { show: false },
        data: data.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
      },
    ],
  };
}

/** Option ECharts: đường thu/chi theo thời gian. */
export function lineOption(theme, flow, animation) {
  const textColor = theme.palette.text.secondary;
  const grid = theme.palette.divider;
  return {
    ...animation,
    tooltip: { trigger: "axis", valueFormatter: (v) => `${Number(v).toLocaleString("vi-VN")} ₫` },
    legend: { top: 0, textStyle: { color: textColor } },
    grid: { left: 8, right: 16, bottom: 8, top: 36, containLabel: true },
    xAxis: {
      type: "category",
      data: flow.dates,
      axisLine: { lineStyle: { color: grid } },
      axisLabel: { color: textColor },
    },
    // Hai trục Y riêng: Thu (trái) và Chi (phải) có thang đo độc lập → cả hai đường đọc được.
    yAxis: [
      {
        type: "value",
        name: "Thu",
        nameTextStyle: { color: theme.palette.success.main, align: "left" },
        splitLine: { lineStyle: { color: grid } },
        axisLabel: { color: textColor, formatter: (v) => formatCompactVnd(v) },
      },
      {
        type: "value",
        name: "Chi",
        nameTextStyle: { color: theme.palette.error.main, align: "right" },
        splitLine: { show: false },
        axisLabel: { color: textColor, formatter: (v) => formatCompactVnd(v) },
      },
    ],
    series: [
      {
        name: "Thu",
        type: "line",
        smooth: true,
        yAxisIndex: 0,
        data: flow.income,
        itemStyle: { color: theme.palette.success.main },
        areaStyle: { opacity: 0.12 },
      },
      {
        name: "Chi",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: flow.expense,
        itemStyle: { color: theme.palette.error.main },
        areaStyle: { opacity: 0.12 },
      },
    ],
  };
}

/**
 * Option ECharts cho Tổng quan năm: 12 tháng — cột Thu/Chi + đường số dư luỹ kế.
 *
 * @param {object} theme MUI theme.
 * @param {Array<{month:string, income:number, expense:number, balance:number}>} months
 * @param {object} animation spread option animation.
 * @param {{income:string, expense:string, cumulative:string}} labels nhãn series (i18n).
 */
export function annualOption(
  theme,
  months,
  animation,
  labels = { income: "Thu", expense: "Chi", cumulative: "Số dư luỹ kế" },
) {
  const textColor = theme.palette.text.secondary;
  const grid = theme.palette.divider;
  return {
    ...animation,
    tooltip: { trigger: "axis", valueFormatter: (v) => `${Number(v).toLocaleString("vi-VN")} ₫` },
    legend: { top: 0, textStyle: { color: textColor } },
    grid: { left: 8, right: 16, bottom: 8, top: 36, containLabel: true },
    xAxis: {
      type: "category",
      data: months.map((m) => `T${m.month.slice(5)}`),
      axisLine: { lineStyle: { color: grid } },
      axisLabel: { color: textColor },
    },
    yAxis: [
      {
        type: "value",
        splitLine: { lineStyle: { color: grid } },
        axisLabel: { color: textColor, formatter: (v) => formatCompactVnd(v) },
      },
      {
        type: "value",
        splitLine: { show: false },
        axisLabel: { color: textColor, formatter: (v) => formatCompactVnd(v) },
      },
    ],
    series: [
      {
        name: labels.income,
        type: "bar",
        data: months.map((m) => m.income),
        itemStyle: { color: theme.palette.success.main, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: labels.expense,
        type: "bar",
        data: months.map((m) => m.expense),
        itemStyle: { color: theme.palette.error.main, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: labels.cumulative,
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: months.map((m) => m.balance),
        itemStyle: { color: theme.palette.info.main },
        areaStyle: { opacity: 0.1 },
      },
    ],
  };
}
