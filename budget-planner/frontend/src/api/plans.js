import { apiFetch } from "./client.js";

/**
 * Kế hoạch tháng (planned thu/chi) kèm actual.
 *
 * @param {string} period "YYYY-MM".
 * @returns {Promise<{period,planned_income,planned_expense,actual_income,actual_expense}>}
 */
export function getMonthlyPlan(period) {
  return apiFetch(`/monthly-plan/${period}`);
}

/**
 * Đặt/cập nhật kế hoạch thu/chi cho tháng (member+).
 *
 * @param {string} period "YYYY-MM".
 * @param {{planned_income:number|string, planned_expense:number|string}} payload
 * @returns {Promise<object>} MonthlyPlanRead.
 */
export function saveMonthlyPlan(period, { planned_income, planned_expense }) {
  return apiFetch(`/monthly-plan/${period}`, {
    method: "PUT",
    body: JSON.stringify({
      planned_income: Number(planned_income) || 0,
      planned_expense: Number(planned_expense) || 0,
    }),
  });
}
