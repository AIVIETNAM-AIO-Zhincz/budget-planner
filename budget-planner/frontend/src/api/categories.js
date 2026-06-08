import { apiFetch } from "./client.js";

/** Lấy danh sách danh mục của không gian hiện tại. */
export function listCategories() {
  return apiFetch("/categories");
}

/**
 * Tạo danh mục mới.
 *
 * @param {{name:string, type?:string, parent_id?:string|null}} payload
 * @returns {Promise<object>} CategoryRead.
 */
export function createCategory({ name, type = "expense", parent_id = null }) {
  return apiFetch("/categories", {
    method: "POST",
    body: JSON.stringify({ name, type, parent_id }),
  });
}

/**
 * Cập nhật danh mục (partial — chỉ field gửi lên mới đổi).
 *
 * @param {string} id
 * @param {{name?:string, type?:string, parent_id?:string|null}} patch
 * @returns {Promise<object>} CategoryRead.
 */
export function updateCategory(id, patch) {
  return apiFetch(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** Xoá danh mục (204 → null). */
export function deleteCategory(id) {
  return apiFetch(`/categories/${id}`, { method: "DELETE" });
}
