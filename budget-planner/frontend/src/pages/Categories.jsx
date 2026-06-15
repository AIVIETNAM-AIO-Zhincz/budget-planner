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
import { PlusIcon, PencilSquareIcon, TrashIcon, TagIcon } from "@heroicons/react/24/outline";
import EmptyState from "../components/EmptyState.jsx";
import { formatAmount } from "../utils/format.js";
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

/** Một hàng danh mục (gốc hoặc con). */
function CategoryRow({ category, child, onEdit, onDelete }) {
  const { t } = useTranslation();
  const isIncome = category.type === "income";
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        py: 1,
        pl: child ? 4.5 : 1.5,
        pr: 1,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        gap: 1,
      }}
    >
      {child && <Box sx={{ color: "text.disabled", mr: 0.5 }}>└</Box>}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: child ? 400 : 600 }}>
          {category.name}
        </Typography>
        {category.tx_count > 0 && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {t("categories.txStats", {
              count: category.tx_count,
              total: formatAmount(category.tx_total),
            })}
          </Typography>
        )}
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
          sx={{ height: 20, fontWeight: 600 }}
        />
      )}
      <Chip
        size="small"
        label={isIncome ? t("categories.income") : t("categories.expense")}
        color={isIncome ? "success" : "error"}
        variant="outlined"
        sx={{ height: 22, fontWeight: 600 }}
      />
      <IconButton size="small" onClick={() => onEdit(category)} aria-label="edit">
        <PencilSquareIcon width={18} />
      </IconButton>
      <IconButton size="small" color="error" onClick={() => onDelete(category)} aria-label="delete">
        <TrashIcon width={18} />
      </IconButton>
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
