import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import { listTransactions } from "../api/transactions.js";
import { listWallets } from "../api/wallets.js";
import { listBudgets } from "../api/budgets.js";
import { listRecurring } from "../api/recurring.js";
import { listCategories } from "../api/categories.js";
import { listGoals } from "../api/goals.js";
import { ApiError } from "../api/client.js";
import { formatAmount, formatCompactVnd, categoryColor } from "../utils/format.js";
import { useStaggerIn } from "../utils/gsap.js";
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

/** Card bao widget: tiêu đề + hành động (link) tuỳ chọn. */
function SectionCard({ title, action, children }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Typography variant="h6">{title}</Typography>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

/** "YYYY-MM-DD" → "DD/MM". */
function fmtDayMonth(s) {
  const p = String(s).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}` : s;
}

function EmptyRow({ text }) {
  return (
    <Typography variant="body2" sx={{ color: "text.secondary", py: 3, textAlign: "center" }}>
      {text}
    </Typography>
  );
}

/** Bảng điều khiển — KPI + biểu đồ + 4 widget tổng quan. */
export default function Dashboard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [goals, setGoals] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const [tx, wl, bg, rc, ct, gl] = await Promise.allSettled([
        listTransactions(),
        listWallets(),
        listBudgets(),
        listRecurring(),
        listCategories(),
        listGoals(),
      ]);
      if (!active) return;
      if (tx.status === "fulfilled") setItems(Array.isArray(tx.value) ? tx.value : []);
      else setError(tx.reason instanceof ApiError ? tx.reason.message : t("common.error"));
      if (wl.status === "fulfilled") setWallets(Array.isArray(wl.value) ? wl.value : []);
      if (bg.status === "fulfilled") setBudgets(Array.isArray(bg.value) ? bg.value : []);
      if (rc.status === "fulfilled") setRecurring(Array.isArray(rc.value) ? rc.value : []);
      if (gl.status === "fulfilled") setGoals(Array.isArray(gl.value) ? gl.value : []);
      if (ct.status === "fulfilled") {
        const map = {};
        for (const c of Array.isArray(ct.value) ? ct.value : []) map[c.id] = c.name;
        setCatMap(map);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [t]);

  const stats = useMemo(() => summarize(items), [items]);
  const pieData = useMemo(() => expenseByCategory(items), [items]);
  const flow = useMemo(() => flowByDate(items), [items]);
  const animation = useMemo(() => echartsAnimationDefaults(theme), [theme]);

  const recent = useMemo(() => items.slice(0, 5), [items]);
  const monthBudgets = useMemo(() => {
    const month = dayjs().format("YYYY-MM");
    return budgets.filter((b) => b.period === month);
  }, [budgets]);
  const walletTotal = useMemo(
    () => wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0),
    [wallets]
  );
  const upcoming = useMemo(() => {
    const limit = dayjs().add(7, "day").format("YYYY-MM-DD");
    return recurring
      .filter((r) => r.active && r.next_run <= limit)
      .sort((a, b) => (a.next_run < b.next_run ? -1 : 1));
  }, [recurring]);

  const rootRef = useRef(null);
  useStaggerIn(rootRef);

  const cards = [
    { key: "totalIncome", value: stats.income, accent: "#10b981", icon: <ArrowTrendingUpIcon width={22} /> },
    { key: "totalExpense", value: stats.expense, accent: "#ef4444", icon: <ArrowTrendingDownIcon width={22} /> },
    { key: "balance", value: stats.balance, accent: "#6366f1", icon: <ScaleIcon width={22} /> },
    { key: "txnCount", value: stats.count, accent: "#2563eb", icon: <ListBulletIcon width={22} />, raw: true },
  ];

  return (
    <Box ref={rootRef}>
      <PageHeader title={t("dashboard.title")} description={t("dashboard.subtitle")} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.key} className="gsap-in">
            {loading ? (
              <Skeleton variant="rounded" height={108} sx={{ borderRadius: 3 }} />
            ) : c.raw ? (
              <StatCard label={t(`dashboard.${c.key}`)} accent={c.accent} icon={c.icon} value={c.value} />
            ) : (
              <StatCard
                label={t(`dashboard.${c.key}`)}
                accent={c.accent}
                icon={c.icon}
                count={c.value}
                format={formatCompactVnd}
                suffix="₫"
              />
            )}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={5} className="gsap-in">
          <ChartCard title={t("dashboard.byCategory")} empty={!loading && pieData.length === 0} emptyText={t("dashboard.noData")}>
            {!loading && pieData.length > 0 && (
              <ReactECharts option={pieOption(theme, pieData, animation)} style={{ width: "100%", height: 300 }} opts={{ renderer: "svg" }} notMerge />
            )}
            {loading && <Skeleton variant="rounded" height={300} />}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={7} className="gsap-in">
          <ChartCard title={t("dashboard.overTime")} empty={!loading && flow.dates.length === 0} emptyText={t("dashboard.noData")}>
            {!loading && flow.dates.length > 0 && (
              <ReactECharts option={lineOption(theme, flow, animation)} style={{ width: "100%", height: 300 }} opts={{ renderer: "svg" }} notMerge />
            )}
            {loading && <Skeleton variant="rounded" height={300} />}
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        {/* Tổng quan ngân sách tháng này */}
        <Grid item xs={12} md={6}>
          <SectionCard title={t("dashboard.budgetOverview")}>
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : monthBudgets.length === 0 ? (
              <EmptyRow text={t("dashboard.noBudgetsThisMonth")} />
            ) : (
              <Stack spacing={2}>
                {monthBudgets.map((b) => {
                  const over = b.remaining < 0;
                  return (
                    <Box key={b.id}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {catMap[b.category_id] || t("budgets.noCategory")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: over ? "error.main" : "text.secondary", fontWeight: over ? 700 : 400 }}>
                          {t("budgets.spentOf", { spent: formatAmount(b.spent_amount), limit: formatAmount(b.limit_amount) })}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(Number(b.percent) || 0, 100)}
                        color={over ? "error" : "primary"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        {/* Số dư các ví */}
        <Grid item xs={12} md={6}>
          <SectionCard
            title={t("dashboard.walletBalances")}
            action={
              <Button size="small" component={RouterLink} to="/wallets" className="no-hover-lift">
                {t("dashboard.viewAll")}
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : wallets.length === 0 ? (
              <EmptyRow text={t("dashboard.noWallets")} />
            ) : (
              <Stack spacing={1.25}>
                {wallets.map((w) => (
                  <Box key={w.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {w.name}
                      </Typography>
                      <Chip size="small" label={t(`wallets.types.${w.type}`)} variant="outlined" sx={{ height: 20 }} />
                    </Stack>
                    <Typography
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 600,
                        color: w.balance < 0 ? "error.main" : "text.primary",
                      }}
                    >
                      {formatAmount(w.balance)} ₫
                    </Typography>
                  </Box>
                ))}
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700 }}>{t("dashboard.walletTotal")}</Typography>
                  <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: walletTotal < 0 ? "error.main" : "text.primary" }}>
                    {formatAmount(walletTotal)} ₫
                  </Typography>
                </Box>
              </Stack>
            )}
          </SectionCard>
        </Grid>

        {/* Giao dịch gần đây */}
        <Grid item xs={12} md={7}>
          <SectionCard
            title={t("dashboard.recentTransactions")}
            action={
              <Button size="small" component={RouterLink} to="/transactions" className="no-hover-lift">
                {t("dashboard.viewAll")}
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={200} />
            ) : recent.length === 0 ? (
              <EmptyRow text={t("dashboard.noRecentTx")} />
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {recent.map((tx) => (
                  <Box key={tx.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {tx.note || t(`transactions.${tx.type}`)}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {fmtDayMonth(tx.date)}
                        </Typography>
                        <Chip
                          size="small"
                          label={tx.category_name}
                          sx={{ height: 18, bgcolor: `${categoryColor(tx.category_name)}22`, color: categoryColor(tx.category_name), fontWeight: 600 }}
                        />
                      </Stack>
                    </Box>
                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, whiteSpace: "nowrap", color: tx.type === "income" ? "success.main" : "text.primary" }}>
                      {tx.type === "income" ? "+" : "−"}
                      {formatAmount(tx.amount)} ₫
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        {/* Định kỳ sắp đến hạn */}
        <Grid item xs={12} md={5}>
          <SectionCard
            title={t("dashboard.upcomingRecurring")}
            action={
              <Button size="small" component={RouterLink} to="/recurring" className="no-hover-lift">
                {t("dashboard.viewAll")}
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={200} />
            ) : upcoming.length === 0 ? (
              <EmptyRow text={t("dashboard.noUpcoming")} />
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {upcoming.map((r) => (
                  <Box key={r.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {r.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {t(`recurring.frequencies.${r.frequency}`)} · {fmtDayMonth(r.next_run)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, whiteSpace: "nowrap", color: r.type === "income" ? "success.main" : "text.primary" }}>
                      {r.type === "income" ? "+" : "−"}
                      {formatAmount(r.amount)} ₫
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        {/* Mục tiêu tiết kiệm */}
        <Grid item xs={12}>
          <SectionCard
            title={t("dashboard.goals")}
            action={
              <Button size="small" component={RouterLink} to="/goals" className="no-hover-lift">
                {t("dashboard.viewAll")}
              </Button>
            }
          >
            {loading ? (
              <Skeleton variant="rounded" height={120} />
            ) : goals.length === 0 ? (
              <EmptyRow text={t("dashboard.noGoals")} />
            ) : (
              <Grid container spacing={2.5}>
                {goals.slice(0, 6).map((g) => {
                  const done = g.percent >= 100;
                  return (
                    <Grid item xs={12} sm={6} key={g.id}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                          {g.name}
                        </Typography>
                        {done ? (
                          <Chip size="small" color="success" label={t("goals.completed")} sx={{ height: 20, fontWeight: 600 }} />
                        ) : (
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {Math.round(g.percent)}%
                          </Typography>
                        )}
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(g.percent, 100)}
                        color={done ? "success" : "primary"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {t("goals.savedOf", {
                          saved: formatAmount(g.saved_amount),
                          target: formatAmount(g.target_amount),
                        })}
                      </Typography>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
