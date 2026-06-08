// Client gọi backend Budget Planner.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SPACE = "demo-space"; // tạm; thay bằng không gian của user sau khi có auth/RBAC

const headers = { "Content-Type": "application/json", "X-Space-Id": SPACE };

export async function listTransactions() {
  const res = await fetch(`${BASE}/transactions`, { headers });
  if (!res.ok) throw new Error("Không tải được giao dịch");
  return res.json();
}

export async function createTransaction({ amount, note, category_name }) {
  const res = await fetch(`${BASE}/transactions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount: Number(amount), note, category_name }),
  });
  if (!res.ok) throw new Error("Không tạo được giao dịch");
  return res.json();
}
