import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, userEvent, i18n } from "../test/utils.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

describe("ConfirmDialog", () => {
  it("hiển thị title/message và gọi đúng callback", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <ConfirmDialog open title="Xoá ví" message="Chắc chưa?" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    expect(screen.getByText("Xoá ví")).toBeInTheDocument();
    expect(screen.getByText("Chắc chưa?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.cancel") }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.delete") }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("confirming → các nút bị vô hiệu", () => {
    renderWithProviders(
      <ConfirmDialog open title="t" message="m" onConfirm={() => {}} onCancel={() => {}} confirming />,
    );
    expect(screen.getByRole("button", { name: i18n.t("common.delete") })).toBeDisabled();
  });
});
