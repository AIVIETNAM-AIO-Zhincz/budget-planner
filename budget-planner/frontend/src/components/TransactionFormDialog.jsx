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

/**
 * Dialog thêm/sửa giao dịch. `initial` có giá trị → chế độ sửa.
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean,
 *          initial?:object|null}} props
 */
export default function TransactionFormDialog({ open, onClose, onSubmit, submitting, initial }) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(dayjs());
  const [touched, setTouched] = useState(false);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [walletId, setWalletId] = useState("");

  // Nạp danh mục (gợi ý) + ví (chọn) khi mở dialog.
  useEffect(() => {
    if (!open) return;
    let active = true;
    listCategories()
      .then((data) => active && setCategories(Array.isArray(data) ? data : []))
      .catch(() => active && setCategories([]));
    listWallets()
      .then((data) => active && setWallets(Array.isArray(data) ? data : []))
      .catch(() => active && setWallets([]));
    return () => {
      active = false;
    };
  }, [open]);

  // Nạp lại giá trị mỗi khi mở (thêm mới hoặc sửa).
  useEffect(() => {
    if (open) {
      setAmount(initial?.amount != null ? String(initial.amount) : "");
      setType(initial?.type ?? "expense");
      setNote(initial?.note ?? "");
      setCategory(initial?.category_name ?? "");
      setDate(initial?.date ? dayjs(initial.date) : dayjs());
      setWalletId(initial?.wallet_id ?? "");
      setTouched(false);
    }
  }, [open, initial]);

  const amountInvalid = !(Number(amount) > 0);
  const categoryOptions = categories.filter((c) => c.type === type).map((c) => c.name);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (amountInvalid) return;
    await onSubmit({
      amount,
      type,
      note: note.trim(),
      category_name: category.trim(),
      date: date ? date.format("YYYY-MM-DD") : null,
      wallet_id: walletId || null,
    });
  };

  return (
    <BrandDialog
      open={open}
      onClose={handleClose}
      title={isEdit ? t("transactions.editTitle") : t("transactions.form.title")}
      description={t("transactions.subtitle")}
      PaperProps={{ component: "form", onSubmit: handleSubmit }}
      actions={
        <>
          <Button onClick={handleClose} disabled={submitting} className="no-hover-lift">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t("transactions.form.submit")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <ToggleButtonGroup
          value={type}
          exclusive
          onChange={(_, v) => v && setType(v)}
          fullWidth
          size="small"
        >
          <ToggleButton value="expense" color="error">
            {t("transactions.expense")}
          </ToggleButton>
          <ToggleButton value="income" color="success">
            {t("transactions.income")}
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField
          label={t("transactions.form.amount")}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={touched && amountInvalid}
          helperText={touched && amountInvalid ? t("transactions.form.amountRequired") : " "}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          autoFocus
          fullWidth
        />

        <TextField
          label={t("transactions.form.note")}
          placeholder={t("transactions.form.noteHint")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          fullWidth
        />

        <Autocomplete
          freeSolo
          options={categoryOptions}
          inputValue={category}
          onInputChange={(_, v) => setCategory(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("transactions.form.category")}
              helperText={t("transactions.form.categoryHint")}
            />
          )}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={t("transactions.form.date")}
            value={date}
            onChange={(v) => setDate(v)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { fullWidth: true, size: "small" } }}
          />
        </LocalizationProvider>

        <TextField
          select
          label={t("transactions.form.wallet")}
          value={walletId}
          onChange={(e) => setWalletId(e.target.value)}
          fullWidth
        >
          <MenuItem value="">{t("transactions.form.walletNone")}</MenuItem>
          {wallets.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </BrandDialog>
  );
}
