import { apiFetch } from "./client.js";

/** Danh sách thành viên của không gian hiện tại. */
export function listMembers() {
  return apiFetch("/members");
}

/**
 * Mời một user (đã tồn tại) vào không gian hiện tại.
 *
 * @param {{email:string, role:string}} payload
 * @returns {Promise<object>} MemberRead.
 */
export function inviteMember({ email, role }) {
  return apiFetch("/members", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

/** Đổi vai trò một thành viên. */
export function updateMemberRole(id, role) {
  return apiFetch(`/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

/** Xoá một thành viên khỏi không gian (204 → null). */
export function removeMember(id) {
  return apiFetch(`/members/${id}`, { method: "DELETE" });
}
