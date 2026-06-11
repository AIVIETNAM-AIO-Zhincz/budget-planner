import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import BudgetFormDialog from "../components/BudgetFormDialog.jsx";
import MonthlyPlanCard from "../components/MonthlyPlanCard.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../api/budgets.js";
import { listCategories } from "../api/categories.js";
import { ApiError } from "../api/client.js";
import { formatAmount, budgetTone } from "../utils/format.js";

/** Một thẻ ngân sách với thanh tiến độ. */
function BudgetCard({ budget, categoryName, onEdit, onDelete }) {
  const { t } = useTranslation();
  const percent = Math.round(budget.percent || 0);
  const tone = budgetTone(percent);
  const overspent = budget.remaining < 0;

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}`, height: "100%" }}>
      <Stack direction="row" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>
            {categoryName || t("budgets.noCategory")}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {budget.period}
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => onEdit(budget)} aria-label="edit">
          <PencilSquareIcon width={18} />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => onDelete(budget)} aria-label="delete">
          <TrashIcon width={18} />
        </IconButton>
      </Stack>

      <Stack direction="row" alignItems="center" sx={{ mb: 0.75, gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(percent, 100)}
          color={tone}
          sx={{ flex: 1, height: 8, borderRadius: 999 }}
        />
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700,
            fontSize: 13,
            color: `${tone}.main`,
            minWidth: 44,
            textAlign: "right",
          }}
        >
          {percent}%
        </Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {t("budgets.spentOf", {
          spent: formatAmount(budget.spent_amount),
          limit: formatAmount(budget.limit_amount),
        })}
      </Typography>
      <Typography variant="body2" sx={{ color: overspent ? "error.main" : "text.secondary", fontWeight: overspent ? 600 : 400 }}>
        {t("budgets.remaining", { remaining: formatAmount(budget.remaining) })}
      </Typography>
    </Paper>
  );
}

/** Trang Budgets — thẻ + progress, CRUD nối API thật. */
export default function Budgets() {
  const { t } = useTranslation();
  const [budgets, setBudgets] = useState([]);
  const [catNames, setCatNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bs, cats] = await Promise.all([listBudgets(), listCategories()]);
      setBudgets(Array.isArray(bs) ? bs : []);
      const map = {};
      for (const c of Array.isArray(cats) ? cats : []) map[c.id] = c.name;
      setCatNames(map);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("budgets.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (budget) => {
    setEditing(budget);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) await updateBudget(editing.id, payload);
      else await createBudget(payload);
      setDialogOpen(false);
      setToast(editing ? t("budgets.updated") : t("budgets.created"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("budgets.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteBudget(confirmTarget.id);
      setConfirmTarget(null);
      setToast(t("budgets.deleted"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("budgets.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("pages.budgets")}
        description={t("pages.budgetsDesc")}
        actions={
          <Button variant="contained" startIcon={<PlusIcon width={18} />} onClick={openAdd}>
            {t("budgets.add")}
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <MonthlyPlanCard onError={setError} onSaved={setToast} />

      {loading ? (
        <Grid container spacing={2.5}>
          {[0, 1, 2].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={150} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : budgets.length === 0 ? (
        <Paper sx={{ p: 5, borderRadius: 3, textAlign: "center", border: (th) => `1px dashed ${th.palette.divider}` }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("budgets.empty")}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {budgets.map((b) => (
            <Grid item xs={12} md={6} key={b.id}>
              <BudgetCard
                budget={b}
                categoryName={catNames[b.category_id]}
                onEdit={openEdit}
                onDelete={setConfirmTarget}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <BudgetFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initial={editing}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={t("budgets.deleteTitle")}
        message={t("budgets.deleteConfirm", { period: confirmTarget?.period })}
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
