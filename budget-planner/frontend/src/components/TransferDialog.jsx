import { useEffect, useState } from "react";
import { Alert, Button, InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";
import { formatAmount } from "../utils/format.js";

/**
 * Dialog chuyển tiền giữa hai ví.
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean,
 *          wallets:Array, error?:string}} props
 */
export default function TransferDialog({ open, onClose, onSubmit, submitting, wallets, error }) {
  const { t } = useTranslation();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setFrom("");
      setTo("");
      setAmount("");
      setTouched(false);
    }
  }, [open]);

  const amountInvalid = !(Number(amount) > 0);
  const sameWallet = Boolean(from && to && from === to);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (amountInvalid || sameWallet || !from || !to) return;
    await onSubmit({ from_wallet_id: from, to_wallet_id: to, amount });
  };

  const option = (w) => `${w.name} (${formatAmount(w.balance)} ₫)`;

  return (
    <BrandDialog
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={t("wallets.transferForm.title")}
      PaperProps={{ component: "form", onSubmit: handleSubmit }}
      actions={
        <>
          <Button onClick={onClose} disabled={submitting} className="no-hover-lift">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t("wallets.transferForm.submit")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          select
          label={t("wallets.transferForm.from")}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          required
          fullWidth
        >
          {wallets.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {option(w)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t("wallets.transferForm.to")}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          error={sameWallet}
          helperText={sameWallet ? t("wallets.transferForm.sameWallet") : " "}
          required
          fullWidth
        >
          {wallets.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {option(w)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t("wallets.transferForm.amount")}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={touched && amountInvalid}
          helperText={touched && amountInvalid ? t("wallets.transferForm.amountRequired") : " "}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          fullWidth
        />
      </Stack>
    </BrandDialog>
  );
}
