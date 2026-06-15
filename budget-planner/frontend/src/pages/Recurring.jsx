import { useCallback, useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import RecurringFormDialog from "../components/RecurringFormDialog.jsx";
import {
  listRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  runRecurring,
} from "../api/recurring.js";
import { ApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatAmount } from "../utils/format.js";

/** "YYYY-MM-DD" → "DD/MM/YYYY". */
function fmtDate(s) {
  const p = String(s).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
}

/** Trang Định kỳ — CRUD mẫu + "Chạy ngay", RBAC-aware. */
export default function Recurring() {
  const { t } = useTranslation();
  const { spaces, spaceId } = useAuth();
  const role = useMemo(() => spaces.find((s) => s.id === spaceId)?.role, [spaces, spaceId]);
  const canManage = role === "owner" || role === "admin" || role === "member";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [running, setRunning] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listRecurring();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("recurring.loadError"));
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
      if (editing) await updateRecurring(editing.id, payload);
      else await createRecurring(payload);
      setDialogOpen(false);
      setToast(editing ? t("recurring.updated") : t("recurring.created"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("recurring.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecurring(confirmTarget.id);
      setConfirmTarget(null);
      setToast(t("recurring.deleted"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("recurring.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await runRecurring();
      setToast(t("recurring.ranDone", { count: res?.created ?? 0 }));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("recurring.saveError"));
    } finally {
      setRunning(false);
    }
  };

  // Tổng định kỳ quy đổi về mỗi tháng (chỉ tính khoản đang chạy).
  const monthlyTotals = useMemo(() => {
    const factor = { daily: 30, weekly: 4.33, monthly: 1 };
    let income = 0;
    let expense = 0;
    for (const r of items) {
      if (!r.active) continue;
      const m = (Number(r.amount) || 0) * (factor[r.frequency] || 1);
      if (r.type === "income") income += m;
      else expense += m;
    }
    return { income, expense };
  }, [items]);

  return (
    <>
      <PageHeader
        title={t("pages.recurring")}
        description={t("pages.recurringDesc")}
        actions={
          <Stack direction="row" spacing={1}>
            {canManage && (
              <Button
                variant="outlined"
                startIcon={<ArrowPathIcon width={18} />}
                onClick={handleRun}
                disabled={running}
                className="no-hover-lift"
              >
                {t("recurring.runNow")}
              </Button>
            )}
            {canManage && (
              <Button
                variant="contained"
                startIcon={<PlusIcon width={18} />}
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                {t("recurring.add")}
              </Button>
            )}
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {!loading && items.length > 0 && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Chip
            color="error"
            variant="outlined"
            label={`${t("recurring.monthlyExpense")}: ${formatAmount(Math.round(monthlyTotals.expense))} ₫`}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            color="success"
            variant="outlined"
            label={`${t("recurring.monthlyIncome")}: ${formatAmount(Math.round(monthlyTotals.income))} ₫`}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      )}

      <Paper sx={{ borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}`, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("recurring.colName")}</TableCell>
                <TableCell align="right">{t("recurring.colAmount")}</TableCell>
                <TableCell>{t("recurring.colFrequency")}</TableCell>
                <TableCell>{t("recurring.colNextRun")}</TableCell>
                <TableCell>{t("recurring.colStatus")}</TableCell>
                {canManage && <TableCell align="right">{t("recurring.colActions")}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: canManage ? 6 : 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                items.map((r) => (
                  <TableRow key={r.id} hover sx={{ opacity: r.active ? 1 : 0.55 }}>
                    <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 600,
                        color: r.type === "income" ? "success.main" : "text.primary",
                      }}
                    >
                      {r.type === "income" ? "+" : "−"}
                      {formatAmount(r.amount)} ₫
                    </TableCell>
                    <TableCell>{t(`recurring.frequencies.${r.frequency}`)}</TableCell>
                    <TableCell>{fmtDate(r.next_run)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={r.active ? t("recurring.active") : t("recurring.inactive")}
                        color={r.active ? "success" : "default"}
                        variant="outlined"
                        sx={{ height: 22, fontWeight: 600 }}
                      />
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditing(r);
                            setDialogOpen(true);
                          }}
                          aria-label="edit"
                        >
                          <PencilSquareIcon width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmTarget(r)}
                          aria-label="delete"
                        >
                          <TrashIcon width={18} />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && items.length === 0 && (
          <EmptyState
            bare
            icon={<ArrowPathIcon width={26} />}
            title={t("recurring.emptyTitle")}
            description={t("recurring.empty")}
          />
        )}
      </Paper>

      <RecurringFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initial={editing}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={t("recurring.deleteTitle")}
        message={t("recurring.deleteConfirm", { name: confirmTarget?.name })}
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
