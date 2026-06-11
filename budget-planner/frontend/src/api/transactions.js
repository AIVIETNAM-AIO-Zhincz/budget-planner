import { apiFetch, ApiError, BASE_URL, getAccessToken, getSpaceId } from "./client.js";

/**
 * Lấy danh sách giao dịch, lọc theo {type, category, month, q} (bỏ field rỗng).
 * Phân trang tuỳ chọn: truyền `limit` (kèm `offset`) để lấy 1 trang.
 *
 * @param {{type?:string, category?:string, month?:string, q?:string,
 *          limit?:number, offset?:number}} [filters]
 * @returns {Promise<Array>} mảng TransactionRead.
 */
export function listTransactions(filters = {}) {
  const params = new URLSearchParams();
  for (const key of ["type", "category", "month", "q", "limit", "offset"]) {
    if (filters[key]) params.set(key, filters[key]);
  }
  const qs = params.toString();
  return apiFetch(`/transactions${qs ? `?${qs}` : ""}`);
}

/**
 * Tổng hợp trên toàn bộ bộ lọc (không phân trang): {total, income, expense}.
 *
 * @param {{type?:string, category?:string, month?:string, q?:string}} [filters]
 * @returns {Promise<{total:number, income:number, expense:number}>}
 */
export function transactionStats(filters = {}) {
  const params = new URLSearchParams();
  for (const key of ["type", "category", "month", "q"]) {
    if (filters[key]) params.set(key, filters[key]);
  }
  const qs = params.toString();
  return apiFetch(`/transactions/stats${qs ? `?${qs}` : ""}`);
}

/**
 * Tạo giao dịch mới. Để trống `category_name` thì backend (AI) tự gợi ý.
 * Field khớp schema `TransactionCreate` của backend.
 *
 * @param {{amount:number|string, type?:string, note?:string,
 *          category_name?:string, date?:string|null, wallet_id?:string|null}} payload
 * @returns {Promise<object>} TransactionRead vừa tạo.
 */
export function createTransaction({
  amount,
  type = "expense",
  note = "",
  category_name = "",
  date = null,
  wallet_id = null,
}) {
  const body = { amount: Number(amount), type, note, category_name };
  if (date) body.date = date;
  if (wallet_id) body.wallet_id = wallet_id;
  return apiFetch("/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Cập nhật giao dịch (partial).
 *
 * @param {string} id
 * @param {object} patch các field cần đổi (amount/type/note/category_name/date/...).
 * @returns {Promise<object>} TransactionRead.
 */
export function updateTransaction(id, patch) {
  const body = { ...patch };
  if (body.amount != null) body.amount = Number(body.amount);
  return apiFetch(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Xoá giao dịch (204 → null). */
export function deleteTransaction(id) {
  return apiFetch(`/transactions/${id}`, { method: "DELETE" });
}

/**
 * Nhập giao dịch từ file CSV (multipart). `dryRun` chỉ xem trước, không tạo.
 *
 * @param {File} file
 * @param {boolean} dryRun
 * @returns {Promise<{dry_run:boolean, valid_count:number, error_count:number,
 *   created:number, errors:Array, preview:Array}>}
 */
export async function importTransactions(file, dryRun) {
  const form = new FormData();
  form.append("file", file);
  let res;
  try {
    res = await fetch(`${BASE_URL}/transactions/import?dry_run=${dryRun ? "true" : "false"}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAccessToken()}`, "X-Space-Id": getSpaceId() || "" },
      body: form,
    });
  } catch (err) {
    throw new ApiError(err?.message || "Không kết nối được máy chủ", 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.detail || "Nhập CSV thất bại", res.status);
  }
  return data;
}
