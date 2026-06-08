import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Grid, Paper, Skeleton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ReactECharts from "echarts-for-react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { listTransactions } from "../api/transactions.js";
import { ApiError } from "../api/client.js";
import { formatAmount } from "../utils/format.js";
import { echartsAnimationDefaults } from "../utils/motion.js";
import { summarize, expenseByCategory, flowByDate, pieOption, lineOption } from "../utils/charts.js";

/** Card bao biểu đồ với tiêu đề. */
function ChartCard({ title, children, empty, emptyText }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, height: "100%" }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {empty ? (
        <Box sx={{ height: 280, display: "grid", placeItems: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {emptyText}
          </Typography>
        </Box>
      ) : (
        children
      )}
    </Paper>
  );
}

/** Bảng điều khiển — KPI + biểu đồ từ dữ liệu giao dịch thật. */
export default function Dashboard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listTransactions();
        if (active) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : t("common.error"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [t]);

  const stats = useMemo(() => summarize(items), [items]);
  const pieData = useMemo(() => expenseByCategory(items), [items]);
  const flow = useMemo(() => flowByDate(items), [items]);
  const animation = useMemo(() => echartsAnimationDefaults(theme), [theme]);

  const cards = [
    { key: "totalIncome", value: stats.income, accent: "#10b981", icon: <ArrowTrendingUpIcon width={22} /> },
    { key: "totalExpense", value: stats.expense, accent: "#ef4444", icon: <ArrowTrendingDownIcon width={22} /> },
    { key: "balance", value: stats.balance, accent: "#6366f1", icon: <ScaleIcon width={22} /> },
    { key: "txnCount", value: stats.count, accent: "#2563eb", icon: <ListBulletIcon width={22} />, raw: true },
  ];

  return (
    <>
      <PageHeader title={t("dashboard.title")} description={t("dashboard.subtitle")} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.key}>
            {loading ? (
              <Skeleton variant="rounded" height={108} sx={{ borderRadius: 3 }} />
            ) : (
              <StatCard
                label={t(`dashboard.${c.key}`)}
                accent={c.accent}
                icon={c.icon}
                value={c.raw ? c.value : `${formatAmount(c.value)} ₫`}
              />
            )}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={5}>
          <ChartCard title={t("dashboard.byCategory")} empty={!loading && pieData.length === 0} emptyText={t("dashboard.noData")}>
            {!loading && pieData.length > 0 && (
              <ReactECharts option={pieOption(theme, pieData, animation)} style={{ height: 300 }} notMerge />
            )}
            {loading && <Skeleton variant="rounded" height={300} />}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <ChartCard title={t("dashboard.overTime")} empty={!loading && flow.dates.length === 0} emptyText={t("dashboard.noData")}>
            {!loading && flow.dates.length > 0 && (
              <ReactECharts option={lineOption(theme, flow, animation)} style={{ height: 300 }} notMerge />
            )}
            {loading && <Skeleton variant="rounded" height={300} />}
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
}
