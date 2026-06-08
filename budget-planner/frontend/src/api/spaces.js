import { apiFetch } from "./client.js";

/** Danh sách không gian mà user hiện tại là thành viên (kèm vai trò). */
export function listSpaces() {
  return apiFetch("/spaces");
}
