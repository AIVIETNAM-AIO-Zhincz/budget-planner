import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { getAnnual } from "../api/reports.js";
import { ApiError } from "../api/client.js";
import { formatAmount, formatCompactVnd } from "../utils/format.js";
import { annualOption } from "../utils/charts.js";
import { echartsAnimationDefaults } from "../utils/motion.js";
import { useStaggerIn } from "../utils/gsap.js";

/** Trang Tổng quan năm — 12 tháng thu/chi + số dư luỹ kế. */
export default function Annual() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [yearDate, setYearDate] = useState(dayjs());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = yearDate.year();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getAnnual(year));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("reports.loadError"));
    } finally {
      setLoading(false);
    }
  }, [year, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const animation = useMemo(() => echartsAnimationDefaults(theme), [theme]);
  const months = data?.months || [];
  const totals = useMemo(
    () => ({
      income: months.reduce((s, m) => s + m.income, 0),
      expense: months.reduce((s, m) => s + m.expense, 0),
      balance: months.length ? months[months.length - 1].balance : 0,
    }),
    [months]
  );
  const hasData = totals.income > 0 || totals.expense > 0;

  const rootRef = useRef(null);
  useStaggerIn(rootRef, { deps: [hasData, loading] });

  return (
    <Box ref={rootRef}>
      <PageHeader
        title={t("pages.annual")}
        description={t("pages.annualDesc")}
        actions={
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t("annual.year")}
              views={["year"]}
              value={yearDate}
              onChange={(v) => v && setYearDate(v)}
              slotProps={{ textField: { size: "small", sx: { minWidth: 130 } } }}
            />
          </LocalizationProvider>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
      ) : !hasData ? (
        <Paper sx={{ p: 5, borderRadius: 3, textAlign: "center", border: (th) => `1px dashed ${th.palette.divider}` }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("annual.empty", { year })}
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={4} className="gsap-in">
              <StatCard
                label={t("annual.totalIncome")}
                accent="#10b981"
                icon={<ArrowTrendingUpIcon width={22} />}
                count={totals.income}
                format={formatCompactVnd}
                suffix="₫"
              />
            </Grid>
            <Grid item xs={12} sm={4} className="gsap-in">
              <StatCard
                label={t("annual.totalExpense")}
                accent="#ef4444"
                icon={<ArrowTrendingDownIcon width={22} />}
                count={totals.expense}
                format={formatCompactVnd}
                suffix="₫"
              />
            </Grid>
            <Grid item xs={12} sm={4} className="gsap-in">
              <StatCard
                label={t("annual.endBalance")}
                accent="#6366f1"
                icon={<ScaleIcon width={22} />}
                count={totals.balance}
                format={formatCompactVnd}
                suffix="₫"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} className="gsap-in">
              <Paper sx={{ p: 2.5, borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}` }}>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  {t("annual.chartTitle")}
                </Typography>
                <ReactECharts
                  option={annualOption(theme, months, animation, {
                    income: t("annual.income"),
                    expense: t("annual.expense"),
                    cumulative: t("annual.cumulative"),
                  })}
                  style={{ width: "100%", height: 400 }}
                  opts={{ renderer: "svg" }}
                  notMerge
                />
              </Paper>
            </Grid>

            <Grid item xs={12} className="gsap-in">
              <Paper sx={{ borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}`, overflow: "hidden" }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t("annual.month")}</TableCell>
                        <TableCell align="right">{t("annual.income")}</TableCell>
                        <TableCell align="right">{t("annual.expense")}</TableCell>
                        <TableCell align="right">{t("annual.cumulative")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {months.map((m) => (
                        <TableRow key={m.month} hover>
                          <TableCell>{`T${m.month.slice(5)}`}</TableCell>
                          <TableCell align="right" sx={{ color: "success.main", fontFamily: '"JetBrains Mono", monospace' }}>
                            {formatAmount(m.income)} ₫
                          </TableCell>
                          <TableCell align="right" sx={{ color: "error.main", fontFamily: '"JetBrains Mono", monospace' }}>
                            {formatAmount(m.expense)} ₫
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontFamily: '"JetBrains Mono", monospace' }}>
                            {formatAmount(m.balance)} ₫
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
