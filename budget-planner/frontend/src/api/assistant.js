import { apiFetch } from "./client.js";

/**
 * Gửi tin nhắn cho trợ lý → {kind, reply, draft}.
 *
 * @param {string} text câu người dùng nhập.
 * @returns {Promise<{kind:string, reply:string, draft:object|null}>}
 */
export function sendMessage(text) {
  return apiFetch("/assistant/message", { method: "POST", body: JSON.stringify({ text }) });
}
