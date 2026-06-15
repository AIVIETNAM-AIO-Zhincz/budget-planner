import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getMonthlyPlan, saveMonthlyPlan } from "../api/plans.js";
import { ApiError } from "../api/client.js";
import { formatAmount } from "../utils/format.js";

/** Một dòng so sánh planned vs actual: thanh gradient + pill đạt/chưa. */
function PlanRow({ label, planned, actual, goodWhenUp }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const good = goodWhenUp ? actual >= planned : actual <= planned;
  const showBadge = planned > 0;
  const statusColor = good ? theme.palette.success.main : theme.palette.error.main;
  const barFill = good
    ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
    : `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`;
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 1.5, mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography className="tnum" variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {formatAmount(actual)} / {formatAmount(planned)} ₫
          </Typography>
          {showBadge && (
            <Box
              sx={{
                px: 1.25,
                py: 0.375,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                bgcolor: statusColor,
                whiteSpace: "nowrap",
              }}
            >
              {good ? t("plan.met") : goodWhenUp ? t("plan.notMet") : t("plan.over")}
            </Box>
          )}
        </Stack>
      </Stack>
      <Box
        sx={{
          height: 11,
          borderRadius: 999,
          overflow: "hidden",
          bgcolor: "background.subtle",
          border: (th) => `1px solid ${th.palette.divider}`,
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: barFill,
            transition: "width 1s cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </Box>
    </Box>
  );
}

/** Card "Kế hoạch tháng" — đặt planned thu/chi & đối chiếu thực tế. */
export default function MonthlyPlanCard({ onError, onSaved }) {
  const { t } = useTranslation();
  const [month, setMonth] = useState(dayjs());
  const [data, setData] = useState(null);
  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [saving, setSaving] = useState(false);

  const period = month ? month.format("YYYY-MM") : "";

  const load = useCallback(async () => {
    if (!period) return;
    try {
      const d = await getMonthlyPlan(period);
      setData(d);
      setIncome(d.planned_income ? String(d.planned_income) : "");
      setExpense(d.planned_expense ? String(d.planned_expense) : "");
    } catch (e) {
      onError?.(e instanceof ApiError ? e.message : t("plan.loadError"));
    }
  }, [period, onError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const d = await saveMonthlyPlan(period, { planned_income: income, planned_expense: expense });
      setData(d);
      onSaved?.(t("plan.saved"));
    } catch (e) {
      onError?.(e instanceof ApiError ? e.message : t("plan.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const plannedNet = (Number(income) || 0) - (Number(expense) || 0);
  const actualNet = (data?.actual_income || 0) - (data?.actual_expense || 0);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}`, mb: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Typography variant="h6">{t("plan.title")}</Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={t("plan.month")}
            views={["year", "month"]}
            value={month}
            onChange={(v) => v && setMonth(v)}
            format="MM/YYYY"
            slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }}
          />
        </LocalizationProvider>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          label={t("plan.plannedIncome")}
          inputMode="numeric"
          size="small"
          value={income === "" ? "" : formatAmount(income)}
          onChange={(e) => setIncome(e.target.value.replace(/\D/g, ""))}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          fullWidth
        />
        <TextField
          label={t("plan.plannedExpense")}
          inputMode="numeric"
          size="small"
          value={expense === "" ? "" : formatAmount(expense)}
          onChange={(e) => setExpense(e.target.value.replace(/\D/g, ""))}
          InputProps={{ endAdornment: <InputAdornment position="end">₫</InputAdornment> }}
          fullWidth
        />
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ whiteSpace: "nowrap" }}>
          {t("plan.save")}
        </Button>
      </Stack>

      <Stack spacing={2}>
        <PlanRow
          label={t("plan.income")}
          planned={Number(income) || 0}
          actual={data?.actual_income || 0}
          goodWhenUp
        />
        <PlanRow
          label={t("plan.expense")}
          planned={Number(expense) || 0}
          actual={data?.actual_expense || 0}
          goodWhenUp={false}
        />
        <PlanRow label={t("plan.saving")} planned={plannedNet} actual={actualNet} goodWhenUp />
      </Stack>
    </Paper>
  );
}
