import { apiFetch, ApiError, BASE_URL, getAccessToken, getSpaceId } from "./client.js";

function buildQuery({ from, to } = {}) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

/** Lấy tổng hợp báo cáo theo khoảng thời gian. */
export function getSummary(range = {}) {
  return apiFetch(`/reports/summary${buildQuery(range)}`);
}

/** Đánh giá phân bổ 50/30/20 + đề xuất trong khoảng thời gian. */
export function getAllocation(range = {}) {
  return apiFetch(`/reports/allocation${buildQuery(range)}`);
}

/** Dự báo chi tháng tới (tổng + theo danh mục) bằng trung bình trượt. */
export function getForecast() {
  return apiFetch("/reports/forecast");
}

/** Tóm tắt tài chính tuần (thu/chi/net + cảnh báo bất thường). */
export function getWeeklySummary() {
  return apiFetch("/reports/weekly-summary");
}

/**
 * Tổng quan năm: 12 tháng thu/chi + số dư luỹ kế.
 *
 * @param {number} year
 * @returns {Promise<{year:number, months:Array}>}
 */
export function getAnnual(year) {
  return apiFetch(`/reports/annual?year=${year}`);
}

/**
 * Tải file CSV giao dịch trong khoảng (dùng fetch thô vì cần header auth + blob).
 *
 * @param {{from?:string, to?:string}} [range]
 */
export async function exportCsv(range = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/reports/export.csv${buildQuery(range)}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "X-Space-Id": getSpaceId() || "",
      },
    });
  } catch (err) {
    throw new ApiError(err?.message || "Không kết nối được máy chủ", 0);
  }
  if (!res.ok) {
    throw new ApiError("Không xuất được CSV", res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
