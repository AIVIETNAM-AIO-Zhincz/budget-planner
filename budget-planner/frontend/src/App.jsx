import { useEffect, useState } from "react";
import { createTransaction, listTransactions } from "./api.js";

export default function App() {
  const [items, setItems] = useState([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setItems(await listTransactions());
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      // Bỏ trống category_name → backend (AI) tự gợi ý danh mục.
      await createTransaction({ amount, note, category_name: "" });
      setAmount("");
      setNote("");
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h1>Budget Planner</h1>
      <p>Nhập giao dịch — AI sẽ tự gợi ý danh mục.</p>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="number"
          placeholder="Số tiền"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          placeholder="Ghi chú (vd: ăn trưa)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit">Thêm</button>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <table width="100%" cellPadding="6">
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
            <th>Ngày</th>
            <th>Ghi chú</th>
            <th>Danh mục (AI)</th>
            <th style={{ textAlign: "right" }}>Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{t.date}</td>
              <td>{t.note}</td>
              <td>{t.category_name}</td>
              <td style={{ textAlign: "right" }}>{t.amount.toLocaleString("vi-VN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
