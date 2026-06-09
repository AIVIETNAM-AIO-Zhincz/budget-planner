import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, i18n } from "../test/utils.jsx";
import ContributeDialog from "./ContributeDialog.jsx";

const wallets = [
  { id: "w1", name: "Tiền mặt", balance: 100000 },
  { id: "w2", name: "Quỹ du lịch", balance: 0 },
];
const goal = { id: "g1", name: "Du lịch", wallet_id: "w2" };

function setup(props = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  renderWithProviders(
    <ContributeDialog
      open
      onClose={() => {}}
      onSubmit={onSubmit}
      submitting={false}
      goal={goal}
      wallets={wallets}
      error=""
      {...props}
    />,
  );
  return { onSubmit };
}

describe("ContributeDialog", () => {
  it("góp hợp lệ → onSubmit với ví nguồn (loại ví tiết kiệm) + amount", async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByLabelText(/Số tiền góp/), "30000");
    await userEvent.click(
      screen.getByRole("button", { name: i18n.t("goals.contributeForm.submit") }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ from_wallet_id: "w1", amount: "30000" }),
    );
  });

  it("amount trống → KHÔNG submit", async () => {
    const { onSubmit } = setup();
    await userEvent.click(
      screen.getByRole("button", { name: i18n.t("goals.contributeForm.submit") }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("hiển thị Alert khi có prop error", () => {
    setup({ error: "Số dư không đủ" });
    expect(screen.getByText("Số dư không đủ")).toBeInTheDocument();
  });
});
