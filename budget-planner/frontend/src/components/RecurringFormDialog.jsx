import { useEffect, useState } from "react";
import {
  Autocomplete,
  Button,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";
import { listCategories } from "../api/categories.js";
import { listWallets } from "../api/wallets.js";

const FREQUENCIES = ["daily", "weekly", "monthly"];

/**
 * Dialog thêm/sửa mẫu định kỳ. `initial?.id` → chế độ sửa.
 */
export default function RecurringFormDialog({ open, onClose, onSubmit, submitting, initial }) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [walletId, setWalletId] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [start, setStart] = useState(dayjs());
  const [end, setEnd] = useState(null);
  const [touched, setTouched] = useState(false);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    listCategories()
      .then((d) => active && setCategories(Array.isArray(d) ? d : []))
      .catch(() => active && setCategories([]));
    listWallets()
      .then((d) => active && setWallets(Array.isArray(d) ? d : []))
      .catch(() => active && setWallets([]));
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setAmount(initial?.amount != null ? String(initial.amount) : "");
      setType(initial?.type ?? "expense");
      setCategory(initial?.category_name ?? "");
      setWalletId(initial?.wallet_id ?? "");
      setFrequency(initial?.frequency ?? "monthly");
      setStart(initial?.start_date ? dayjs(initial.start_date) : dayjs());
      setEnd(initial?.end_date ? dayjs(initial.end_date) : null);
      setTouched(false);
    }
  }, [open, initial]);

  const amountInvalid = !(Number(amount) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!name.trim() || amountInvalid || !start) return;
    await onSubmit({
      name: name.trim(),
      amount: Number(amount),
      type,
      category_name: category.trim(),
      wallet_id: walletId || null,
      frequency,
      start_date: start.format("YYYY-MM-DD"),
      end_date: end ? end.format("YYYY-MM-DD") : null,
    });
  };

  return (
    <BrandDialog
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={isEdit ? t("recurring.form.editTitle") : t("recurring.form.addTitle")}
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
          label={t("recurring.form.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          fullWidth
        />
        <ToggleButtonGroup
          exclusive
          color="primary"
          value={type}
          onChange={(_, v) => v && setType(v)}
          fullWidth
        >
          <ToggleButton value="expense">{t("transactions.expense")}</ToggleButton>
          <ToggleButton value="income">{t("transactions.income")}</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          label={t("recurring.form.amount")}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={touched && amountInvalid}
          helperText={touched && amountInvalid ? t("recurring.form.amountRequired") : " "}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          required
          fullWidth
        />
        <Autocomplete
          freeSolo
          options={categories.map((c) => c.name)}
          value={category}
          onInputChange={(_, v) => setCategory(v)}
          renderInput={(params) => (
            <TextField {...params} label={t("recurring.form.category")} fullWidth />
          )}
        />
        <TextField
          select
          label={t("recurring.form.wallet")}
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          fullWidth
        >
          <MenuItem value="">{t("recurring.form.walletNone")}</MenuItem>
          {wallets.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label={t("recurring.form.frequency")}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          fullWidth
        >
          {FREQUENCIES.map((f) => (
            <MenuItem key={f} value={f}>
              {t(`recurring.frequencies.${f}`)}
            </MenuItem>
          ))}
        </TextField>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <DatePicker
              label={t("recurring.form.start")}
              value={start}
              onChange={(v) => setStart(v)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true, size: "small", required: true } }}
            />
            <DatePicker
              label={t("recurring.form.end")}
              value={end}
              onChange={(v) => setEnd(v)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Stack>
        </LocalizationProvider>
      </Stack>
    </BrandDialog>
  );
}
