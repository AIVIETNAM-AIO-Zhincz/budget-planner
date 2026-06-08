import { apiFetch } from "./client.js";

/**
 * Lấy danh sách giao dịch của không gian hiện tại.
 *
 * @returns {Promise<Array>} mảng TransactionRead.
 */
export function listTransactions() {
  return apiFetch("/transactions");
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
