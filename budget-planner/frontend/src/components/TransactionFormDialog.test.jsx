import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor, i18n } from "../test/utils.jsx";

vi.mock("../api/categories.js", () => ({
  listCategories: vi.fn().mockResolvedValue([{ id: "c1", name: "Ăn uống", type: "expense" }]),
}));
vi.mock("../api/wallets.js", () => ({
  listWallets: vi.fn().mockResolvedValue([{ id: "w1", name: "Tiền mặt", balance: 100000 }]),
}));

import TransactionFormDialog from "./TransactionFormDialog.jsx";

function setup(props = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  renderWithProviders(
    <TransactionFormDialog
      open
      onClose={() => {}}
      onSubmit={onSubmit}
      submitting={false}
      initial={null}
      {...props}
    />,
  );
  return { onSubmit };
}

describe("TransactionFormDialog", () => {
  it("submit gọi onSubmit với amount + type mặc định 'expense'", async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByLabelText(/Số tiền/), "50000");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("transactions.form.submit") }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "50000", type: "expense" }),
    );
  });

  it("amount trống → KHÔNG submit", async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("transactions.form.submit") }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
