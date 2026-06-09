import { useEffect, useState } from "react";
import { Button, InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";

/**
 * Dialog thêm/sửa mục tiêu. `initial?.id` → chế độ sửa.
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean,
 *          initial?:object|null, wallets:Array}} props
 */
export default function GoalFormDialog({ open, onClose, onSubmit, submitting, initial, wallets }) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [walletId, setWalletId] = useState("");
  const [deadline, setDeadline] = useState(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setTarget(initial?.target_amount != null ? String(initial.target_amount) : "");
      setWalletId(initial?.wallet_id ?? (wallets[0]?.id ?? ""));
      setDeadline(initial?.deadline ? dayjs(initial.deadline) : null);
      setTouched(false);
    }
  }, [open, initial, wallets]);

  const targetInvalid = !(Number(target) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!name.trim() || targetInvalid || !walletId) return;
    await onSubmit({
      name: name.trim(),
      target_amount: Number(target),
      wallet_id: walletId,
      deadline: deadline ? deadline.format("YYYY-MM-DD") : null,
    });
  };

  return (
    <BrandDialog
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={isEdit ? t("goals.form.editTitle") : t("goals.form.addTitle")}
      PaperProps={{ component: "form", onSubmit: handleSubmit }}
      actions={
        <>
          <Button onClick={onClose} disabled={submitting} className="no-hover-lift">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <TextField
          label={t("goals.form.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          fullWidth
        />
        <TextField
          label={t("goals.form.target")}
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          error={touched && targetInvalid}
          helperText={touched && targetInvalid ? t("goals.contributeForm.amountRequired") : " "}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          required
          fullWidth
        />
        <TextField
          select
          label={t("goals.form.wallet")}
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          required
          fullWidth
        >
          {wallets.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.name}
            </MenuItem>
          ))}
        </TextField>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={t("goals.form.deadline")}
            value={deadline}
            onChange={(v) => setDeadline(v)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { fullWidth: true, size: "small" } }}
          />
        </LocalizationProvider>
      </Stack>
    </BrandDialog>
  );
}
