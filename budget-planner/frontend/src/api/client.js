// Client gọi backend Budget Planner: gắn JWT + không gian, tự refresh khi 401.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const BASE_URL = BASE;

const ACCESS_KEY = "bp-access";
const REFRESH_KEY = "bp-refresh";
const SPACE_KEY = "bp-space";

/* ----- localStorage helpers (token + không gian hiện tại) ----- */
export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}
export function getSpaceId() {
  return localStorage.getItem(SPACE_KEY);
}
export function setTokens(access, refresh) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
export function setSpace(id) {
  if (id) localStorage.setItem(SPACE_KEY, id);
  else localStorage.removeItem(SPACE_KEY);
}
export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(SPACE_KEY);
}

// Callback do AuthProvider đăng ký: gọi khi phiên hết hạn (refresh thất bại).
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

/** Lỗi API có kèm HTTP status để UI map sang thông báo phù hợp. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Cố gắng rút thông điệp lỗi từ body FastAPI (422 có `detail`). */
async function extractMessage(res) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  } catch {
    /* body không phải JSON */
  }
  return `HTTP ${res.status}`;
}

/** Gọi /auth/refresh để lấy access mới; trả true nếu thành công. */
async function tryRefresh() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gọi API JSON: tự gắn Authorization + X-Space-Id, parse lỗi theo HTTP code.
 * Gặp 401 (không phải /auth/*) → thử refresh rồi retry 1 lần; thất bại → logout.
 *
 * @param {string} path đường dẫn (vd "/transactions").
 * @param {RequestInit} [options] tuỳ chọn fetch.
 * @param {boolean} [_retry] cờ nội bộ tránh refresh lặp vô hạn.
 * @returns {Promise<any>} body JSON đã parse (null nếu 204).
 * @throws {ApiError}
 */
export async function apiFetch(path, options = {}, _retry = false) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const space = getSpaceId();
  if (space) headers["X-Space-Id"] = space;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiError(err?.message || "Không kết nối được máy chủ", 0);
  }

  if (res.status === 401 && !_retry && !path.startsWith("/auth/") && getRefreshToken()) {
    if (await tryRefresh()) return apiFetch(path, options, true);
    clearAuth();
    if (onUnauthorized) onUnauthorized();
    throw new ApiError("Phiên đăng nhập đã hết hạn", 401);
  }

  if (!res.ok) {
    throw new ApiError(await extractMessage(res), res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

export default apiFetch;
