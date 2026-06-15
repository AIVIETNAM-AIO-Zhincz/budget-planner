import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BanknotesIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import GoalFormDialog from "../components/GoalFormDialog.jsx";
import ContributeDialog from "../components/ContributeDialog.jsx";
import { listGoals, createGoal, updateGoal, deleteGoal, contribute } from "../api/goals.js";
import { listWallets } from "../api/wallets.js";
import { ApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatAmount } from "../utils/format.js";

function fmtDate(s) {
  const p = String(s).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}

/** Dòng đánh giá khả thi của mục tiêu (ẩn khi đã đạt). */
function FeasibilityLine({ f, t }) {
  if (!f || f.verdict === "done") return null;
  if (f.verdict === "no_surplus") {
    return (
      <Typography variant="caption" sx={{ color: "warning.main" }}>
        {t("goals.feasibility.noSurplus")}
      </Typography>
    );
  }
  if (f.verdict === "tight") {
    return (
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.5 }}>
        <Chip
          size="small"
          color="warning"
          label={t("goals.feasibility.tight")}
          sx={{ height: 20, fontWeight: 600 }}
        />
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {t("goals.feasibility.needPerMonth", {
            need: formatAmount(f.required_monthly),
            cap: formatAmount(f.monthly_capacity),
          })}
        </Typography>
      </Stack>
    );
  }
  // on_track
  const eta = t("goals.feasibility.etaMonths", { months: f.months_needed });
  const text = f.months_left != null ? `${eta} · ${t("goals.feasibility.onDeadline")}` : eta;
  return (
    <Typography variant="caption" sx={{ color: "success.main" }}>
      {text}
    </Typography>
  );
}

/** Trang Mục tiêu tiết kiệm — card + tiến độ + góp, RBAC-aware. */
export default function Goals() {
  const { t } = useTranslation();
  const { spaces, spaceId } = useAuth();
  const role = useMemo(() => spaces.find((s) => s.id === spaceId)?.role, [spaces, spaceId]);
  const canManage = role === "owner" || role === "admin" || role === "member";

  const [items, setItems] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [contribTarget, setContribTarget] = useState(null);
  const [contributing, setContributing] = useState(false);
  const [contribErr, setContribErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [g, w] = await Promise.all([listGoals(), listWallets()]);
      setItems(Array.isArray(g) ? g : []);
      setWallets(Array.isArray(w) ? w : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("goals.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) await updateGoal(editing.id, payload);
      else await createGoal(payload);
      setDialogOpen(false);
      setToast(editing ? t("goals.updated") : t("goals.created"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("goals.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteGoal(confirmTarget.id);
      setConfirmTarget(null);
      setToast(t("goals.deleted"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("goals.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  const handleContribute = async (payload) => {
    setContributing(true);
    setContribErr("");
    try {
      await contribute(contribTarget.id, payload);
      setContribTarget(null);
      setToast(t("goals.contributed"));
      await refresh();
    } catch (e) {
      setContribErr(e instanceof ApiError ? e.message : t("goals.saveError"));
    } finally {
      setContributing(false);
    }
  };

  const FUND_COLOR = { emergency: "error", long_term: "info", general: "default" };
  const fundTotals = useMemo(() => {
    const acc = { emergency: 0, long_term: 0, general: 0 };
    for (const g of items) acc[g.fund_type] = (acc[g.fund_type] || 0) + (g.saved_amount || 0);
    return acc;
  }, [items]);

  return (
    <>
      <PageHeader
        title={t("pages.goals")}
        description={t("pages.goalsDesc")}
        actions={
          canManage && (
            <Button
              variant="contained"
              startIcon={<PlusIcon width={18} />}
              disabled={wallets.length === 0}
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              {t("goals.add")}
            </Button>
          )
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {!loading && wallets.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("goals.noWallets")}
        </Alert>
      )}

      {!loading && items.length > 0 && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: "wrap", gap: 1 }}>
          {["emergency", "long_term", "general"].map((ft) => (
            <Chip
              key={ft}
              variant="outlined"
              color={FUND_COLOR[ft] === "default" ? undefined : FUND_COLOR[ft]}
              label={`${t(`goals.fundTypes.${ft}`)}: ${formatAmount(fundTotals[ft] || 0)} ₫`}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
      )}

      <Grid container spacing={2.5}>
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={`sk-${i}`}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}

        {!loading &&
          items.map((g) => {
            const done = g.percent >= 100;
            return (
              <Grid item xs={12} sm={6} md={4} key={g.id}>
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: (th) => `1px solid ${th.palette.divider}`,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {g.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        size="small"
                        variant="outlined"
                        color={FUND_COLOR[g.fund_type] === "default" ? undefined : FUND_COLOR[g.fund_type]}
                        label={t(`goals.fundTypes.${g.fund_type}`)}
                        sx={{ height: 22, fontWeight: 600 }}
                      />
                      {done && (
                        <Chip size="small" color="success" label={t("goals.completed")} sx={{ height: 22, fontWeight: 600 }} />
                      )}
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
                    <WalletIcon width={15} />
                    <Typography variant="caption">{g.wallet_name}</Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(g.percent, 100)}
                    color={done ? "success" : "primary"}
                    sx={{ height: 8, borderRadius: 4, my: 0.5 }}
                  />
                  <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {t("goals.savedOf", {
                      saved: formatAmount(g.saved_amount),
                      target: formatAmount(g.target_amount),
                    })}{" "}
                    · {Math.round(g.percent)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {g.deadline ? t("goals.deadline", { date: fmtDate(g.deadline) }) : t("goals.noDeadline")}
                  </Typography>
                  <FeasibilityLine f={g.feasibility} t={t} />

                  {canManage && (
                    <Box sx={{ mt: "auto", pt: 1, display: "flex", gap: 1, alignItems: "center" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<BanknotesIcon width={16} />}
                        onClick={() => {
                          setContribErr("");
                          setContribTarget(g);
                        }}
                        className="no-hover-lift"
                      >
                        {t("goals.contribute")}
                      </Button>
                      <Box sx={{ flex: 1 }} />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditing(g);
                          setDialogOpen(true);
                        }}
                        aria-label="edit"
                      >
                        <PencilSquareIcon width={18} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setConfirmTarget(g)} aria-label="delete">
                        <TrashIcon width={18} />
                      </IconButton>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
      </Grid>

      {!loading && items.length === 0 && wallets.length > 0 && (
        <Paper sx={{ p: 5, borderRadius: 3, textAlign: "center", border: (th) => `1px dashed ${th.palette.divider}` }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("goals.empty")}
          </Typography>
        </Paper>
      )}

      <GoalFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initial={editing}
        wallets={wallets}
      />

      <ContributeDialog
        open={Boolean(contribTarget)}
        onClose={() => setContribTarget(null)}
        onSubmit={handleContribute}
        submitting={contributing}
        goal={contribTarget}
        wallets={wallets}
        error={contribErr}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={t("goals.deleteTitle")}
        message={t("goals.deleteConfirm", { name: confirmTarget?.name })}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
        confirming={deleting}
      />

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
