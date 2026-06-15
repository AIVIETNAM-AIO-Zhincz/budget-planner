import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PlusIcon, PencilSquareIcon, TrashIcon, TagIcon } from "@heroicons/react/24/outline";
import EmptyState from "../components/EmptyState.jsx";
import { formatAmount, categoryColor } from "../utils/format.js";
import { hexToRgba, lighten } from "../utils/badgeColors.js";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import CategoryFormDialog from "../components/CategoryFormDialog.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../api/categories.js";
import { ApiError } from "../api/client.js";

/** Gom danh mục thành cây cha–con (hàm thuần). */
function buildTree(categories) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const roots = [];
  const childrenOf = new Map();
  for (const c of categories) {
    const hasParent = c.parent_id && byId.has(c.parent_id);
    if (hasParent) {
      if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
      childrenOf.get(c.parent_id).push(c);
    } else {
      roots.push(c);
    }
  }
  return roots.map((root) => ({ ...root, children: childrenOf.get(root.id) || [] }));
}

/** Lấy ký tự đầu (in hoa) của tên danh mục cho avatar. */
function initialOf(name) {
  const ch = String(name || "").trim()[0];
  return ch ? ch.toUpperCase() : "?";
}

/** Một ô thống kê trong dải tổng quan. */
function StatCard({ label, value, tone }) {
  const color = tone === "neg" ? "error.main" : tone === "pos" ? "success.main" : "text.primary";
  return (
    <Paper
      sx={{
        flex: 1,
        minWidth: 180,
        p: 2,
        borderRadius: 3,
        border: (th) => `1px solid ${th.palette.divider}`,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "text.disabled",
        }}
      >
        {label}
      </Typography>
      <Typography
        className="tnum"
        sx={{ mt: 0.75, fontSize: 22, fontWeight: 800, lineHeight: 1.1, color }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

/** Một hàng danh mục (gốc hoặc con) — avatar màu + pill loại + hành động. */
function CategoryRow({ category, child, onEdit, onDelete }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isIncome = category.type === "income";

  const accent = categoryColor(category.name);
  const avSize = child ? 30 : 38;
  const avBg = hexToRgba(accent, isDark ? 0.18 : 0.14);
  const avText = isDark ? lighten(accent, 0.38) : accent;

  const tagColor = isIncome ? theme.palette.success.main : theme.palette.error.main;

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        position: "relative",
        gap: 2,
        py: 1.5,
        pl: child ? 5 : 2.5,
        pr: 2.5,
        borderTop: (th) => `1px solid ${th.palette.divider}`,
        transition: "background-color .14s",
        "&:first-of-type": { borderTop: 0 },
        "&:hover": { bgcolor: "background.subtle" },
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 14,
          bottom: 14,
          width: 3,
          borderRadius: "0 3px 3px 0",
          bgcolor: accent,
          opacity: 0,
          transition: "opacity .14s",
        },
        "&:hover::before": { opacity: 0.85 },
      }}
    >
      <Box
        sx={{
          width: avSize,
          height: avSize,
          flexShrink: 0,
          borderRadius: child ? 2.5 : "11px",
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: child ? 13 : 16,
          bgcolor: avBg,
          color: avText,
        }}
      >
        {initialOf(category.name)}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: child ? 500 : 600, fontSize: 15.5 }}>
          {category.name}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {t("categories.txStats", {
            count: category.tx_count || 0,
            total: formatAmount(category.tx_total),
          })}
        </Typography>
      </Box>

      {!isIncome && category.need_level && (
        <Chip
          size="small"
          label={t(`needLevel.${category.need_level}`)}
          color={
            category.need_level === "mandatory"
              ? "success"
              : category.need_level === "wasteful"
                ? "warning"
                : "default"
          }
          sx={{ fontWeight: 600 }}
        />
      )}

      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.5,
          py: 0.5,
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 700,
          color: tagColor,
          bgcolor: hexToRgba(tagColor, isDark ? 0.18 : 0.12),
        }}
      >
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "currentColor" }} />
        {isIncome ? t("categories.income") : t("categories.expense")}
      </Box>

      <Stack direction="row" sx={{ gap: 0.25 }}>
        <IconButton size="small" onClick={() => onEdit(category)} aria-label="edit">
          <PencilSquareIcon width={18} />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => onDelete(category)} aria-label="delete">
          <TrashIcon width={18} />
        </IconButton>
      </Stack>
    </Stack>
  );
}

/** Trang Categories — cây cha–con, CRUD nối API thật. */
export default function Categories() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
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
      const data = await listCategories();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("categories.loadError"));
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
  const openEdit = (category) => {
    setEditing(category);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) await updateCategory(editing.id, payload);
      else await createCategory(payload);
      setDialogOpen(false);
      setToast(editing ? t("categories.updated") : t("categories.created"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("categories.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCategory(confirmTarget.id);
      setConfirmTarget(null);
      setToast(t("categories.deleted"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("categories.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  const tree = buildTree(items);
  // Tổng quan: đếm theo danh mục, cộng số tiền theo loại (trên danh sách phẳng).
  const totalExpense = items
    .filter((c) => c.type !== "income")
    .reduce((s, c) => s + (Number(c.tx_total) || 0), 0);
  const totalIncome = items
    .filter((c) => c.type === "income")
    .reduce((s, c) => s + (Number(c.tx_total) || 0), 0);

  return (
    <>
      <PageHeader
        title={t("pages.categories")}
        description={t("pages.categoriesDesc")}
        actions={
          <Button variant="contained" startIcon={<PlusIcon width={18} />} onClick={openAdd}>
            {t("categories.add")}
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {!loading && items.length > 0 && (
        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.5, mb: 2.5 }}>
          <StatCard label={t("categories.totalCount")} value={items.length} />
          <StatCard label={t("categories.totalExpense")} value={`${formatAmount(totalExpense)} ₫`} tone="neg" />
          <StatCard label={t("categories.totalIncome")} value={`${formatAmount(totalIncome)} ₫`} tone="pos" />
        </Stack>
      )}

      {loading ? (
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<TagIcon width={26} />}
          title={t("categories.emptyTitle")}
          description={t("categories.empty")}
        />
      ) : (
        <Paper sx={{ borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}`, overflow: "hidden" }}>
          {tree.map((root) => (
            <Box key={root.id}>
              <CategoryRow category={root} onEdit={openEdit} onDelete={setConfirmTarget} />
              {root.children.map((c) => (
                <CategoryRow key={c.id} category={c} child onEdit={openEdit} onDelete={setConfirmTarget} />
              ))}
            </Box>
          ))}
        </Paper>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initial={editing}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={t("categories.deleteTitle")}
        message={t("categories.deleteConfirm", { name: confirmTarget?.name })}
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
