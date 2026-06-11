import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import CategoryChip from "../components/CategoryChip.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TransactionFormDialog from "../components/TransactionFormDialog.jsx";
import ImportDialog from "../components/ImportDialog.jsx";
import {
  listTransactions,
  transactionStats,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../api/transactions.js";
import { listCategories } from "../api/categories.js";
import { ApiError } from "../api/client.js";
import { formatAmount } from "../utils/format.js";

/** Trang Giao dịch — bảng + lọc/tìm + thêm/sửa/xoá. */
export default function Transactions() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Bộ lọc
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState(dayjs());
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Phân trang + tổng hợp (toàn bộ filter, từ backend).
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [stats, setStats] = useState({ total: 0, income: 0, expense: 0 });

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const filters = useMemo(
    () => ({ type, category, month: month ? month.format("YYYY-MM") : "", q: debouncedQ }),
    [type, category, month, debouncedQ]
  );
  const hasFilter = Boolean(type || category || month || debouncedQ);
  const summary = useMemo(
    () => ({ income: stats.income, expense: stats.expense, balance: stats.income - stats.expense }),
    [stats]
  );

  // Đổi bộ lọc → về trang đầu.
  useEffect(() => {
    setPage(0);
  }, [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, s] = await Promise.all([
        listTransactions({ ...filters, limit: rowsPerPage, offset: page * rowsPerPage }),
        transactionStats(filters),
      ]);
      setItems(Array.isArray(data) ? data : []);
      setStats(s || { total: 0, income: 0, expense: 0 });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("transactions.loadError"));
    } finally {
      setLoading(false);
    }
  }, [filters, page, rowsPerPage, t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Danh mục cho ô lọc (tải một lần).
  useEffect(() => {
    listCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) await updateTransaction(editing.id, payload);
      else await createTransaction(payload);
      setDialogOpen(false);
      setToast(editing ? t("transactions.updated") : t("transactions.created"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("transactions.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteTransaction(confirmTarget.id);
      setConfirmTarget(null);
      setToast(t("transactions.deleted"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("transactions.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setType("");
    setCategory("");
    setMonth(null);
    setQ("");
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const p = String(d).split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  };

  return (
    <>
      <PageHeader
        title={t("transactions.title")}
        description={t("transactions.subtitle")}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowUpTrayIcon width={18} />}
              onClick={() => setImportOpen(true)}
              className="no-hover-lift"
            >
              {t("transactions.import.button")}
            </Button>
            <Button variant="contained" startIcon={<PlusIcon width={18} />} onClick={openAdd}>
              {t("transactions.add")}
            </Button>
          </Stack>
        }
      />

      {/* Thanh lọc */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ mb: 2, flexWrap: "wrap", gap: 1.5 }}
      >
        <TextField
          select
          size="small"
          label={t("transactions.filter.type")}
          value={type}
          onChange={(e) => setType(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">{t("transactions.filter.all")}</MenuItem>
          <MenuItem value="expense">{t("transactions.expense")}</MenuItem>
          <MenuItem value="income">{t("transactions.income")}</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label={t("transactions.filter.category")}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{t("transactions.filter.all")}</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.name}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={t("transactions.filter.month")}
            views={["year", "month"]}
            value={month}
            onChange={(v) => setMonth(v)}
            format="MM/YYYY"
            slotProps={{
              textField: { size: "small", sx: { minWidth: 150 } },
              field: { clearable: true },
            }}
          />
        </LocalizationProvider>

        <TextField
          size="small"
          placeholder={t("transactions.filter.search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlassIcon width={18} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200, flex: 1 }}
        />

        {hasFilter && (
          <Button onClick={clearFilters} className="no-hover-lift" sx={{ alignSelf: "center" }}>
            {t("transactions.filter.clear")}
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {!loading && stats.total > 0 && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Chip
            color="success"
            variant="outlined"
            label={`${t("transactions.summary.income")}: ${formatAmount(summary.income)} ₫`}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            color="error"
            variant="outlined"
            label={`${t("transactions.summary.expense")}: ${formatAmount(summary.expense)} ₫`}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            color={summary.balance < 0 ? "error" : "primary"}
            variant="outlined"
            label={`${t("transactions.summary.balance")}: ${formatAmount(summary.balance)} ₫`}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      )}

      <Paper sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("transactions.colDate")}</TableCell>
                <TableCell>{t("transactions.colNote")}</TableCell>
                <TableCell>{t("transactions.colCategory")}</TableCell>
                <TableCell>{t("transactions.colType")}</TableCell>
                <TableCell align="right">{t("transactions.colAmount")}</TableCell>
                <TableCell align="right">{t("transactions.colActions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                items.map((row) => {
                  const isIncome = row.type === "income";
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell>{row.note || "—"}</TableCell>
                      <TableCell>
                        <CategoryChip name={row.category_name} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={isIncome ? t("transactions.income") : t("transactions.expense")}
                          color={isIncome ? "success" : "error"}
                          variant="outlined"
                          sx={{ height: 22, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                          color: isIncome ? "success.main" : "text.primary",
                        }}
                      >
                        {isIncome ? "+" : "-"}
                        {formatAmount(row.amount)} ₫
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(row)} aria-label="edit">
                          <PencilSquareIcon width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmTarget(row)}
                          aria-label="delete"
                        >
                          <TrashIcon width={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && items.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {hasFilter ? t("transactions.noResult") : t("transactions.empty")}
            </Typography>
          </Box>
        )}

        {!loading && stats.total > 0 && (
          <TablePagination
            component="div"
            count={stats.total}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage={t("transactions.rowsPerPage")}
          />
        )}
      </Paper>

      <TransactionFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initial={editing}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={async (created) => {
          setToast(t("transactions.import.imported", { count: created }));
          await refresh();
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={t("transactions.deleteTitle")}
        message={t("transactions.deleteConfirm", {
          note: confirmTarget?.note || "—",
          amount: formatAmount(confirmTarget?.amount),
        })}
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
