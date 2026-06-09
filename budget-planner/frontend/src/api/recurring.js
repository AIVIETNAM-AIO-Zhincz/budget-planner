import { apiFetch } from "./client.js";

/** Danh sách mẫu định kỳ của không gian hiện tại. */
export function listRecurring() {
  return apiFetch("/recurring");
}

/** Tạo mẫu định kỳ. */
export function createRecurring(payload) {
  return apiFetch("/recurring", { method: "POST", body: JSON.stringify(payload) });
}

/** Cập nhật mẫu định kỳ (partial). */
export function updateRecurring(id, patch) {
  return apiFetch(`/recurring/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

/** Xoá mẫu định kỳ (204 → null). */
export function deleteRecurring(id) {
  return apiFetch(`/recurring/${id}`, { method: "DELETE" });
}

/** Chạy sinh giao dịch đến hạn → {created}. */
export function runRecurring() {
  return apiFetch("/recurring/run", { method: "POST" });
}
