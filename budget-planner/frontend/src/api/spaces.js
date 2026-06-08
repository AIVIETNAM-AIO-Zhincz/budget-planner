import { apiFetch } from "./client.js";

/** Danh sách không gian mà user hiện tại là thành viên (kèm vai trò). */
export function listSpaces() {
  return apiFetch("/spaces");
}

/** Tạo không gian mới (user thành owner). */
export function createSpace({ name, currency }) {
  return apiFetch("/spaces", { method: "POST", body: JSON.stringify({ name, currency }) });
}

/** Sửa không gian hiện tại (tên/tiền tệ) — cần owner/admin. */
export function updateSpace(id, patch) {
  return apiFetch(`/spaces/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}
