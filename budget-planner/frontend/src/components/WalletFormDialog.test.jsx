import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, i18n } from "../test/utils.jsx";
import WalletFormDialog from "./WalletFormDialog.jsx";

function setup(props = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  renderWithProviders(
    <WalletFormDialog
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

describe("WalletFormDialog", () => {
  it("submit gọi onSubmit với payload đúng", async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByLabelText(/Tên ví/), "Tiền mặt");
    const balance = screen.getByLabelText(/Số dư/);
    await userEvent.clear(balance);
    await userEvent.type(balance, "5000");

    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.save") }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Tiền mặt", type: "cash", balance: "5000" }),
    );
  });

  it("tên rỗng → KHÔNG submit", async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.save") }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
