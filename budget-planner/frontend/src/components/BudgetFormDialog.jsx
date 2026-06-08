import { useEffect, useState } from "react";
import { Button, InputAdornment, Stack, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";
import CategorySelect from "./CategorySelect.jsx";

/**
 * Dialog thêm/sửa ngân sách. `initial` có giá trị → chế độ sửa.
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean,
 *          initial?:{id:string,period:string,limit_amount:number,category_id:string|null}|null}} props
 */
export default function BudgetFormDialog({ open, onClose, onSubmit, submitting, initial }) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial);
  const [categoryId, setCategoryId] = useState(null);
  const [period, setPeriod] = useState(dayjs());
  const [limit, setLimit] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setCategoryId(initial?.category_id ?? null);
      setPeriod(initial?.period ? dayjs(initial.period) : dayjs());
      setLimit(initial?.limit_amount != null ? String(initial.limit_amount) : "");
      setTouched(false);
    }
  }, [open, initial]);

  const limitInvalid = !(Number(limit) > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (limitInvalid) return;
    await onSubmit({
      category_id: categoryId,
      period: period.format("YYYY-MM"),
      limit_amount: limit,
    });
  };

  return (
    <BrandDialog
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={isEdit ? t("budgets.form.editTitle") : t("budgets.form.addTitle")}
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
        <CategorySelect
          label={t("budgets.form.category")}
          value={categoryId}
          onChange={setCategoryId}
          typeFilter="expense"
          allowNone
          noneLabel={t("budgets.noCategory")}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={t("budgets.form.period")}
            views={["year", "month"]}
            value={period}
            onChange={(v) => v && setPeriod(v)}
            format="MM/YYYY"
            slotProps={{ textField: { fullWidth: true, size: "small" } }}
          />
        </LocalizationProvider>

        <TextField
          label={t("budgets.form.limit")}
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          error={touched && limitInvalid}
          helperText={touched && limitInvalid ? t("budgets.form.limitRequired") : " "}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          fullWidth
        />
      </Stack>
    </BrandDialog>
  );
}
