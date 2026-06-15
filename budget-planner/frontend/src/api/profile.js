import { apiFetch } from "./client.js";

/** Lấy hồ sơ tài chính của user hiện tại (rỗng nếu chưa đặt). */
export function getProfile() {
  return apiFetch("/profile");
}

/** Tạo/cập nhật hồ sơ tài chính (partial). */
export function saveProfile(payload) {
  return apiFetch("/profile", { method: "PUT", body: JSON.stringify(payload) });
}
