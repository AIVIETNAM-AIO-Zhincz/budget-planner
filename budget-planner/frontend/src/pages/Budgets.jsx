import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import BudgetFormDialog from "../components/BudgetFormDialog.jsx";
import MonthlyPlanCard from "../components/MonthlyPlanCard.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../api/budgets.js";
import { listCategories } from "../api/categories.js";
import { ApiError } from "../api/client.js";
import { formatAmount, categoryColor } from "../utils/format.js";
import { hexToRgba, lighten } from "../utils/badgeColors.js";

/** Lấy ký tự đầu (in hoa) của tên danh mục cho avatar. */
function initialOf(name) {
  const ch = String(name || "").trim()[0];
  return ch ? ch.toUpperCase() : "?";
}

/**
 * Một thẻ ngân sách: avatar màu theo danh mục, thanh tiến độ gradient,
 * dòng "đã chi / còn lại" và chip cảnh báo khi vượt hạn mức.
 */
function BudgetCard({ budget, categoryName, onEdit, onDelete }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const name = categoryName || t("budgets.noCategory");
  const percent = Math.round(budget.percent || 0);
  const overspent = budget.remaining < 0;

  const accent = categoryColor(name);
  const avBg = hexToRgba(accent, isDark ? 0.18 : 0.14);
  const avText = isDark ? lighten(accent, 0.38) : accent;

  const barFill = overspent
    ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`
    : `linear-gradient(90deg, ${lighten(theme.palette.success.main, 0.18)}, ${theme.palette.success.main})`;
  const pctColor = overspent ? theme.palette.error.main : theme.palette.success.main;

  return (
    <Paper
      sx={{
        p: 2.75,
        borderRadius: 4,
        height: "100%",
        border: (th) => `1px solid ${overspent ? hexToRgba(th.palette.error.main, 0.45) : th.palette.divider}`,
        transition: "box-shadow .16s, border-color .16s",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <Stack direction="row" alignItems="flex-start" sx={{ gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "11px",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: 15,
            bgcolor: avBg,
            color: avText,
          }}
        >
          {initialOf(name)}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 16 }} noWrap>
            {name}
          </Typography>
          <Typography className="tnum" variant="caption" sx={{ color: "text.secondary" }}>
            {budget.period}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 0.25 }}>
          <IconButton size="small" onClick={() => onEdit(budget)} aria-label="edit">
            <PencilSquareIcon width={17} />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(budget)} aria-label="delete">
            <TrashIcon width={17} />
          </IconButton>
        </Stack>
      </Stack>

      <Stack direction="row" alignItems="center" sx={{ mb: 1.5, gap: 1.5 }}>
        <Box
          sx={{
            flex: 1,
            height: 10,
            borderRadius: 999,
            overflow: "hidden",
            bgcolor: "background.subtle",
            border: (th) => `1px solid ${th.palette.divider}`,
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${Math.min(percent, 100)}%`,
              borderRadius: 999,
              background: barFill,
              transition: "width 1s cubic-bezier(.2,.8,.2,1)",
            }}
          />
        </Box>
        <Typography
          className="tnum"
          sx={{ fontWeight: 800, fontSize: 14, color: pctColor, minWidth: 46, textAlign: "right" }}
        >
          {percent}%
        </Typography>
      </Stack>

      <Typography className="tnum" variant="body2" sx={{ color: "text.secondary" }}>
        {t("budgets.spentOf", {
          spent: formatAmount(budget.spent_amount),
          limit: formatAmount(budget.limit_amount),
        })}
      </Typography>
      <Typography
        className="tnum"
        variant="body2"
        sx={{ mt: 0.5, color: overspent ? "error.main" : "text.secondary", fontWeight: overspent ? 600 : 400 }}
      >
        {t("budgets.remaining", { remaining: formatAmount(budget.remaining) })}
      </Typography>

      {overspent && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            mt: 1.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 600,
            color: "error.main",
            bgcolor: (th) => hexToRgba(th.palette.error.main, isDark ? 0.18 : 0.12),
          }}
        >
          <ExclamationTriangleIcon width={14} />
          {t("budgets.overLimit")}
        </Box>
      )}
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
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={172} sx={{ borderRadius: 4 }} />
          ))}
        </Box>
      ) : budgets.length === 0 ? (
        <Paper sx={{ p: 5, borderRadius: 3, textAlign: "center", border: (th) => `1px dashed ${th.palette.divider}` }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("budgets.empty")}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              categoryName={catNames[b.category_id]}
              onEdit={openEdit}
              onDelete={setConfirmTarget}
            />
          ))}
        </Box>
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
