import { apiFetch } from "./client.js";

/** Lấy danh sách ngân sách (kèm spent_amount/remaining/percent). */
export function listBudgets() {
  return apiFetch("/budgets");
}

/**
 * Tạo ngân sách mới.
 *
 * @param {{period:string, limit_amount:number, category_id?:string|null}} payload
 * @returns {Promise<object>} BudgetRead.
 */
export function createBudget({ period, limit_amount, category_id = null }) {
  return apiFetch("/budgets", {
    method: "POST",
    body: JSON.stringify({ period, limit_amount: Number(limit_amount), category_id }),
  });
}

/**
 * Cập nhật ngân sách (partial).
 *
 * @param {string} id
 * @param {{period?:string, limit_amount?:number, category_id?:string|null}} patch
 * @returns {Promise<object>} BudgetRead.
 */
export function updateBudget(id, patch) {
  const body = { ...patch };
  if (body.limit_amount != null) body.limit_amount = Number(body.limit_amount);
  return apiFetch(`/budgets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Xoá ngân sách (204 → null). */
export function deleteBudget(id) {
  return apiFetch(`/budgets/${id}`, { method: "DELETE" });
}
