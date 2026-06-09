import { apiFetch } from "./client.js";

/** Danh sách thông báo của không gian (mới nhất trước). */
export function listNotifications() {
  return apiFetch("/notifications");
}

/** Số thông báo chưa đọc → {count}. */
export function unreadCount() {
  return apiFetch("/notifications/unread-count");
}

/** Đánh dấu một thông báo đã đọc. */
export function markRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

/** Đánh dấu tất cả đã đọc → {updated}. */
export function markAllRead() {
  return apiFetch("/notifications/read-all", { method: "POST" });
}
