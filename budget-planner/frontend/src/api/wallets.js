import { apiFetch } from "./client.js";

/** Danh sách ví của không gian hiện tại. */
export function listWallets() {
  return apiFetch("/wallets");
}

/** Tạo ví mới. */
export function createWallet({ name, type, balance }) {
  return apiFetch("/wallets", {
    method: "POST",
    body: JSON.stringify({ name, type, balance: Number(balance) || 0 }),
  });
}

/** Cập nhật ví (partial). */
export function updateWallet(id, patch) {
  const body = { ...patch };
  if (body.balance != null) body.balance = Number(body.balance);
  return apiFetch(`/wallets/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

/** Xoá ví (204 → null). */
export function deleteWallet(id) {
  return apiFetch(`/wallets/${id}`, { method: "DELETE" });
}

/** Chuyển tiền giữa hai ví. */
export function transfer({ from_wallet_id, to_wallet_id, amount }) {
  return apiFetch("/wallets/transfer", {
    method: "POST",
    body: JSON.stringify({ from_wallet_id, to_wallet_id, amount: Number(amount) }),
  });
}
