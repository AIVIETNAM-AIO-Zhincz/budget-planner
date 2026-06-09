import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Grid, Paper, Skeleton, Snackbar, Stack, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useTheme } from "@mui/material/styles";
import ReactECharts from "echarts-for-react";
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { getSummary, exportCsv } from "../api/reports.js";
import { ApiError } from "../api/client.js";
import { formatAmount, categoryColor } from "../utils/format.js";
import { echartsAnimationDefaults } from "../utils/motion.js";
import { pieOption, lineOption } from "../utils/charts.js";

/** Biểu đồ cột ngang top danh mục chi. */
function barOption(theme, byCategory, animation) {
  const top = byCategory.slice(0, 6).reverse();
  return {
    ...animation,
    grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: "axis", valueFormatter: (v) => `${formatAmount(v)} ₫` },
    xAxis: {
      type: "value",
      axisLabel: {
        color: theme.palette.text.secondary,
        formatter: (v) => (v >= 1000 ? `${v / 1000}k` : v),
      },
      splitLine: { lineStyle: { color: theme.palette.divider } },
    },
    yAxis: {
      type: "category",
      data: top.map((c) => c.name),
      axisLabel: { color: theme.palette.text.secondary },
    },
    series: [
      {
        type: "bar",
        barWidth: "60%",
        data: top.map((c) => ({
          value: c.amount,
          itemStyle: { color: categoryColor(c.name), borderRadius: [0, 4, 4, 0] },
        })),
      },
    ],
  };
}

/** Card bao biểu đồ. */
function ChartCard({ title, children }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}`, height: "100%" }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

/** Trang Reports nâng cao — lọc khoảng, thẻ tổng, top danh mục, pie/line, xuất CSV. */
export default function Reports() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [from, setFrom] = useState(dayjs().startOf("month"));
  const [to, setTo] = useState(dayjs());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState("");

  const range = useMemo(
    () => ({
      from: from ? from.format("YYYY-MM-DD") : "",
      to: to ? to.format("YYYY-MM-DD") : "",
    }),
    [from, to]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSummary(await getSummary(range));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("reports.loadError"));
    } finally {
      setLoading(false);
    }
  }, [range, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      await exportCsv(range);
      setToast(t("reports.exported"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("reports.exportError"));
    } finally {
      setExporting(false);
    }
  };

  const animation = useMemo(() => echartsAnimationDefaults(theme), [theme]);
  const pieData = useMemo(
    () => (summary?.by_category || []).map((c) => ({ name: c.name, value: c.amount, color: categoryColor(c.name) })),
    [summary]
  );
  const flow = useMemo(() => {
    const days = summary?.by_day || [];
    return {
      dates: days.map((d) => d.date),
      income: days.map((d) => d.income),
      expense: days.map((d) => d.expense),
    };
  }, [summary]);

  const hasData = summary && (summary.total_income > 0 || summary.total_expense > 0);

  return (
    <>
      <PageHeader
        title={t("pages.reports")}
        description={t("pages.reportsDesc")}
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowDownTrayIcon width={18} />}
            onClick={handleExport}
            disabled={exporting}
            className="no-hover-lift"
          >
            {t("reports.exportCsv")}
          </Button>
        }
      />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
          <DatePicker
            label={t("reports.from")}
            value={from}
            onChange={(v) => setFrom(v)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
          />
          <DatePicker
            label={t("reports.to")}
            value={to}
            onChange={(v) => setTo(v)}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
          />
        </Stack>
      </LocalizationProvider>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
      ) : !hasData ? (
        <Paper sx={{ p: 5, borderRadius: 3, textAlign: "center", border: (th) => `1px dashed ${th.palette.divider}` }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("reports.empty")}
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={4}>
              <StatCard
                label={t("reports.totalIncome")}
                accent="#10b981"
                icon={<ArrowTrendingUpIcon width={22} />}
                value={`${formatAmount(summary.total_income)} ₫`}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                label={t("reports.totalExpense")}
                accent="#ef4444"
                icon={<ArrowTrendingDownIcon width={22} />}
                value={`${formatAmount(summary.total_expense)} ₫`}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                label={t("reports.balance")}
                accent="#6366f1"
                icon={<ScaleIcon width={22} />}
                value={`${formatAmount(summary.balance)} ₫`}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={7}>
              <ChartCard title={t("reports.topCategories")}>
                {pieData.length > 0 ? (
                  <ReactECharts option={barOption(theme, summary.by_category, animation)} style={{ height: 300 }} notMerge />
                ) : (
                  <Box sx={{ height: 300, display: "grid", placeItems: "center", color: "text.secondary" }}>
                    {t("reports.empty")}
                  </Box>
                )}
              </ChartCard>
            </Grid>
            <Grid item xs={12} md={5}>
              <ChartCard title={t("reports.byCategory")}>
                <ReactECharts option={pieOption(theme, pieData, animation)} style={{ height: 300 }} notMerge />
              </ChartCard>
            </Grid>
            <Grid item xs={12}>
              <ChartCard title={t("reports.overTime")}>
                <ReactECharts option={lineOption(theme, flow, animation)} style={{ height: 300 }} notMerge />
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2500}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast("")}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}
