import { apiFetch } from "./client.js";

/**
 * Gửi tin nhắn (không gắn thread) → {kind, reply, draft}. Giữ cho tương thích.
 *
 * @param {string} text câu người dùng nhập.
 * @returns {Promise<{kind:string, reply:string, draft:object|null}>}
 */
export function sendMessage(text) {
  return apiFetch("/assistant/message", { method: "POST", body: JSON.stringify({ text }) });
}

/** Danh sách thread chat của user (hoạt động gần nhất trước). */
export function listConversations() {
  return apiFetch("/assistant/conversations");
}

/** Tạo thread chat mới (rỗng). */
export function createConversation(title) {
  return apiFetch("/assistant/conversations", {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
  });
}

/** Chi tiết một thread kèm toàn bộ tin nhắn. */
export function getConversation(id) {
  return apiFetch(`/assistant/conversations/${id}`);
}

/** Đổi tên thread. */
export function renameConversation(id, title) {
  return apiFetch(`/assistant/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

/** Xoá thread. */
export function deleteConversation(id) {
  return apiFetch(`/assistant/conversations/${id}`, { method: "DELETE" });
}

/** Gửi tin nhắn trong một thread (lưu lịch sử) → {kind, reply, draft}. */
export function postConversationMessage(id, text) {
  return apiFetch(`/assistant/conversations/${id}/message`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
