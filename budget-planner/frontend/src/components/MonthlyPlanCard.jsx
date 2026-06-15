import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getMonthlyPlan, saveMonthlyPlan } from "../api/plans.js";
import { ApiError } from "../api/client.js";
import { formatAmount } from "../utils/format.js";

/** Một dòng so sánh planned vs actual + badge đạt/chưa. */
function PlanRow({ label, planned, actual, goodWhenUp }) {
  const { t } = useTranslation();
  const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const good = goodWhenUp ? actual >= planned : actual <= planned;
  const showBadge = planned > 0;
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            variant="caption"
            sx={{ fontFamily: '"JetBrains Mono", monospace', color: "text.secondary" }}
          >
            {formatAmount(actual)} / {formatAmount(planned)} ₫
          </Typography>
          {showBadge && (
            <Chip
              size="small"
              color={good ? "success" : "error"}
              label={
                good
                  ? t("plan.met")
                  : goodWhenUp
                    ? t("plan.notMet")
                    : t("plan.over")
              }
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={good ? "success" : "error"}
        sx={{ height: 8, borderRadius: 4 }}
      />
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
