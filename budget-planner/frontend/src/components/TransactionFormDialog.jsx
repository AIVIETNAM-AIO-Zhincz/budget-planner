import { useState } from "react";
import {
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

/**
 * Dialog form thêm giao dịch. Gọi `onSubmit(payload)` (async) khi lưu hợp lệ.
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean}} props
 */
export default function TransactionFormDialog({ open, onClose, onSubmit, submitting }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(dayjs());
  const [touched, setTouched] = useState(false);

  const amountInvalid = !(Number(amount) > 0);

  const reset = () => {
    setAmount("");
    setType("expense");
    setNote("");
    setCategory("");
    setDate(dayjs());
    setTouched(false);
  };

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
    });
    reset();
  };

  return (
    <BrandDialog
      open={open}
      onClose={handleClose}
      title={t("transactions.form.title")}
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

        <TextField
          label={t("transactions.form.category")}
          helperText={t("transactions.form.categoryHint")}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          fullWidth
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
      </Stack>
    </BrandDialog>
  );
}
