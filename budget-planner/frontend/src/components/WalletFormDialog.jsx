import { useEffect, useState } from "react";
import { Button, InputAdornment, MenuItem, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";

const TYPES = ["cash", "bank", "e-wallet"];

/**
 * Dialog thêm/sửa ví. `initial` có giá trị → chế độ sửa.
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean,
 *          initial?:object|null}} props
 */
export default function WalletFormDialog({ open, onClose, onSubmit, submitting, initial }) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial);
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "cash");
      setBalance(initial?.balance != null ? String(initial.balance) : "0");
    }
  }, [open, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({ name: name.trim(), type, balance });
  };

  return (
    <BrandDialog
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={isEdit ? t("wallets.form.editTitle") : t("wallets.form.addTitle")}
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
          label={t("wallets.form.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          fullWidth
        />
        <TextField
          select
          label={t("wallets.form.type")}
          value={type}
          onChange={(e) => setType(e.target.value)}
          fullWidth
        >
          {TYPES.map((ty) => (
            <MenuItem key={ty} value={ty}>
              {t(`wallets.types.${ty}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t("wallets.form.balance")}
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          fullWidth
        />
      </Stack>
    </BrandDialog>
  );
}
