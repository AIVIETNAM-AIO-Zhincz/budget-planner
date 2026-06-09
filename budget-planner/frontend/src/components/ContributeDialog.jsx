import { useEffect, useState } from "react";
import { Alert, Button, InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";
import { formatAmount } from "../utils/format.js";

/**
 * Dialog góp tiền vào mục tiêu (chuyển từ ví nguồn → ví tiết kiệm).
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean,
 *          goal:object|null, wallets:Array, error?:string}} props
 */
export default function ContributeDialog({ open, onClose, onSubmit, submitting, goal, wallets, error }) {
  const { t } = useTranslation();
  const [from, setFrom] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);

  // Ví nguồn: loại trừ chính ví tiết kiệm của mục tiêu.
  const sources = wallets.filter((w) => w.id !== goal?.wallet_id);

  useEffect(() => {
    if (open) {
      setFrom(sources[0]?.id ?? "");
      setAmount("");
      setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal]);

  const amountInvalid = !(Number(amount) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (amountInvalid || !from) return;
    await onSubmit({ from_wallet_id: from, amount });
  };

  return (
    <BrandDialog
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={t("goals.contributeForm.title", { name: goal?.name || "" })}
      PaperProps={{ component: "form", onSubmit: handleSubmit }}
      actions={
        <>
          <Button onClick={onClose} disabled={submitting} className="no-hover-lift">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t("goals.contributeForm.submit")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          select
          label={t("goals.contributeForm.from")}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          required
          fullWidth
        >
          {sources.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.name} ({formatAmount(w.balance)} ₫)
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t("goals.contributeForm.amount")}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={touched && amountInvalid}
          helperText={touched && amountInvalid ? t("goals.contributeForm.amountRequired") : " "}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          required
          fullWidth
        />
      </Stack>
    </BrandDialog>
  );
}
