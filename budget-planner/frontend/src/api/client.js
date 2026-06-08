// Client gọi backend Budget Planner.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Không gian tạm; thay bằng không gian của user sau khi có auth/RBAC.
export const SPACE_ID = "demo-space";

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

/**
 * Gọi API JSON, tự gắn header `X-Space-Id` và parse lỗi theo HTTP code.
 *
 * @param {string} path đường dẫn (vd "/transactions").
 * @param {RequestInit} [options] tuỳ chọn fetch.
 * @returns {Promise<any>} body JSON đã parse.
 * @throws {ApiError}
 */
export async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Space-Id": SPACE_ID,
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new ApiError(err?.message || "Không kết nối được máy chủ", 0);
  }
  if (!res.ok) {
    throw new ApiError(await extractMessage(res), res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

export default apiFetch;
