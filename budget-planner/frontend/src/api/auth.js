import { apiFetch, ApiError, BASE_URL, setTokens } from "./client.js";

/**
 * Đăng nhập bằng email + mật khẩu (OAuth2 form) → lưu token, trả về token.
 * Backend dùng OAuth2PasswordRequestForm nên body phải là form-urlencoded.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{access_token:string, refresh_token:string}>}
 * @throws {ApiError}
 */
export async function login(email, password) {
  const body = new URLSearchParams({ username: email, password });
  let res;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (err) {
    throw new ApiError(err?.message || "Không kết nối được máy chủ", 0);
  }
  if (!res.ok) {
    throw new ApiError("Email hoặc mật khẩu không đúng", res.status);
  }
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data;
}

/**
 * Đăng ký tài khoản mới (backend tự tạo không gian owner).
 *
 * @param {{email:string, password:string, name?:string}} payload
 * @returns {Promise<object>} UserRead.
 */
export function register({ email, password, name = "" }) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

/** Thông tin user đang đăng nhập. */
export function getMe() {
  return apiFetch("/auth/me");
}
