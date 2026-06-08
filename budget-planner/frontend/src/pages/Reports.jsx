import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Grid, Paper, Skeleton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ReactECharts from "echarts-for-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import ComingSoon from "../components/ComingSoon.jsx";
import { listTransactions } from "../api/transactions.js";
import { ApiError } from "../api/client.js";
import { echartsAnimationDefaults } from "../utils/motion.js";
import { expenseByCategory, flowByDate, pieOption, lineOption } from "../utils/charts.js";

/** Báo cáo — biểu đồ cơ bản (tái dùng helper), phân tích nâng cao để sau. */
export default function Reports() {
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

  const pieData = useMemo(() => expenseByCategory(items), [items]);
  const flow = useMemo(() => flowByDate(items), [items]);
  const animation = useMemo(() => echartsAnimationDefaults(theme), [theme]);

  const cardSx = { p: 2.5, borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}`, height: "100%" };
  const hasData = items.length > 0;

  return (
    <>
      <PageHeader title={t("pages.reports")} description={t("pages.reportsDesc")} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading && <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3, mb: 2.5 }} />}

      {!loading && hasData && (
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid item xs={12} md={5}>
            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {t("dashboard.byCategory")}
              </Typography>
              <ReactECharts option={pieOption(theme, pieData, animation)} style={{ height: 300 }} notMerge />
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {t("dashboard.overTime")}
              </Typography>
              <ReactECharts option={lineOption(theme, flow, animation)} style={{ height: 300 }} notMerge />
            </Paper>
          </Grid>
        </Grid>
      )}

      {!loading && !hasData && (
        <Box sx={{ mb: 2.5 }}>
          <ComingSoon hint={t("dashboard.noData")} />
        </Box>
      )}
    </>
  );
}
