import { apiFetch } from "./client.js";

/** Danh sách mục tiêu (kèm tiến độ). */
export function listGoals() {
  return apiFetch("/goals");
}

/** Tạo mục tiêu. */
export function createGoal(payload) {
  return apiFetch("/goals", { method: "POST", body: JSON.stringify(payload) });
}

/** Cập nhật mục tiêu (partial). */
export function updateGoal(id, patch) {
  return apiFetch(`/goals/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

/** Xoá mục tiêu (204 → null). */
export function deleteGoal(id) {
  return apiFetch(`/goals/${id}`, { method: "DELETE" });
}

/** Góp tiền vào mục tiêu (chuyển từ ví nguồn). */
export function contribute(id, { from_wallet_id, amount }) {
  return apiFetch(`/goals/${id}/contribute`, {
    method: "POST",
    body: JSON.stringify({ from_wallet_id, amount: Number(amount) }),
  });
}
