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
