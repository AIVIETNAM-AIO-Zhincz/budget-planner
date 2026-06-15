import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TablePagination,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
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
import { formatAmount, categoryColor } from "../utils/format.js";

const FALLBACK_CAT = "#8B8C96";
// Font hiển thị cho số/tiêu đề số liệu — lining + tabular nums (số đứng, đều bề rộng).
const DISPLAY = '"Bricolage Grotesque", "Be Vietnam Pro", system-ui, sans-serif';

/** Định dạng tiền có dấu +/− và đơn vị ₫. */
function signedAmount(value, isIncome) {
  return `${isIncome ? "+" : "−"}${formatAmount(value)} ₫`;
}

/** Trang Giao dịch — hero số dư + sổ cái nhóm theo ngày + lọc/tìm thật. */
export default function Transactions() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  // Thu = jade (xanh ngọc), Chi = coral (cam-hồng); biến thể sáng hơn ở dark mode.
  const POS = isDark ? "#2fcaa0" : "#0f9d74";
  const NEG = isDark ? "#f0807f" : "#dc5757";
  const POS_SOFT = isDark ? "rgba(47,202,160,0.16)" : "#e4f6ef";
  const NEG_SOFT = isDark ? "rgba(240,128,127,0.16)" : "#fceaea";
  const cardShadow = isDark
    ? "0 8px 28px -10px rgba(0,0,0,0.55)"
    : "0 6px 24px -8px rgba(16,26,46,0.12), 0 2px 8px -4px rgba(16,26,46,0.08)";
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
  const spentPct = stats.income ? Math.round((stats.expense / stats.income) * 100) : 0;

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

  // Gom giao dịch của trang hiện tại theo ngày, mới nhất trước.
  const groups = useMemo(() => {
    const map = new Map();
    for (const row of items) {
      if (!map.has(row.date)) map.set(row.date, []);
      map.get(row.date).push(row);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

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

  // Nhãn ngày/thứ theo ngôn ngữ hiện tại.
  const localeTag = i18n.language === "en" ? "en-US" : "vi-VN";
  const dayLabel = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return i18n.language === "en"
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : `${d.getDate()} tháng ${d.getMonth() + 1}`;
  };
  const weekdayLabel = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(localeTag, { weekday: "long" });
  };

  const periodLabel = month ? month.format("MM/YYYY") : t("transactions.filter.all");
  const negative = summary.balance < 0;

  /** Một dòng giao dịch trong sổ cái. */
  const renderRow = (row, idx) => {
    const isIncome = row.type === "income";
    const color = row.category_name ? categoryColor(row.category_name) || FALLBACK_CAT : FALLBACK_CAT;
    return (
      <Stack
        key={row.id}
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          px: 3,
          py: 1.5,
          borderTop: idx > 0 ? (th) => `1px solid ${alpha(th.palette.divider, 0.6)}` : "none",
          transition: "background-color .12s",
          "&:hover": { bgcolor: "background.subtle" },
          "&:hover .rowTools": { opacity: 1 },
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            flex: "none",
            borderRadius: "13px",
            display: "grid",
            placeItems: "center",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 17,
            color,
            bgcolor: alpha(color, 0.16),
          }}
        >
          {(row.category_name || "?").charAt(0).toUpperCase()}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 500, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {row.note || "—"}
          </Typography>
          {row.category_name && (
            <Box sx={{ mt: 0.5 }}>
              <CategoryChip name={row.category_name} />
            </Box>
          )}
        </Box>

        <Typography
          sx={{
            fontFamily: DISPLAY,
            fontVariantNumeric: "lining-nums tabular-nums",
            fontWeight: 600,
            fontSize: 15.5,
            whiteSpace: "nowrap",
            color: isIncome ? POS : NEG,
          }}
        >
          {signedAmount(row.amount, isIncome)}
        </Typography>

        <Stack
          className="rowTools"
          direction="row"
          spacing={0.5}
          sx={{ flex: "none", opacity: { xs: 1, md: 0 }, transition: "opacity .15s" }}
        >
          <IconButton size="small" onClick={() => openEdit(row)} aria-label={t("transactions.edit")}>
            <PencilSquareIcon width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => setConfirmTarget(row)}
            aria-label={t("common.delete")}
          >
            <TrashIcon width={18} />
          </IconButton>
        </Stack>
      </Stack>
    );
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Hero: số dư + dòng thu/chi + thanh tỉ lệ đã chi */}
      {!loading && stats.total > 0 && (
        <Paper
          sx={{
            mb: 2.5,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: "24px",
            border: (th) => `1px solid ${th.palette.divider}`,
            boxShadow: cardShadow,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0,1fr) auto minmax(260px,1fr)" },
            gap: { xs: 3, md: 4 },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {t("transactions.hero.balanceLabel")} · {periodLabel}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
              <Typography
                component="span"
                sx={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: { xs: 42, md: 54 },
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "lining-nums tabular-nums",
                  color: negative ? NEG : "text.primary",
                }}
              >
                {formatAmount(summary.balance)}
              </Typography>
              <Typography
                component="span"
                sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: "text.secondary" }}
              >
                ₫
              </Typography>
              <Box
                component="span"
                sx={{
                  ml: 1,
                  alignSelf: "center",
                  px: 1.1,
                  py: 0.4,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  color: negative ? NEG : POS,
                  bgcolor: negative ? NEG_SOFT : POS_SOFT,
                }}
              >
                {negative ? t("transactions.hero.negative") : t("transactions.hero.positive")}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: { xs: "none", md: "block" }, width: "1px", alignSelf: "stretch", bgcolor: "divider" }} />

          <Stack spacing={1.75}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box sx={{ width: 9, height: 9, borderRadius: 0.75, bgcolor: POS }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {t("transactions.hero.inflow")}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontFamily: DISPLAY,
                  fontVariantNumeric: "lining-nums tabular-nums",
                  fontWeight: 600,
                  color: POS,
                }}
              >
                {signedAmount(summary.income, true)}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box sx={{ width: 9, height: 9, borderRadius: 0.75, bgcolor: NEG }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {t("transactions.hero.outflow")}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontFamily: DISPLAY,
                  fontVariantNumeric: "lining-nums tabular-nums",
                  fontWeight: 600,
                  color: NEG,
                }}
              >
                {signedAmount(summary.expense, false)}
              </Typography>
            </Stack>

            <Box>
              <Box sx={{ height: 8, borderRadius: 6, bgcolor: "background.subtle", overflow: "hidden" }}>
                <Box
                  sx={{
                    height: "100%",
                    width: `${Math.min(spentPct, 100)}%`,
                    borderRadius: 6,
                    background: `linear-gradient(90deg, #E8744F, ${NEG})`,
                  }}
                />
              </Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("transactions.hero.spentRatio", { pct: spentPct })}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {t("transactions.hero.leftRatio", { pct: Math.max(0, 100 - spentPct) })}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Thanh công cụ: loại / danh mục / tháng / tìm */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ mb: 2, flexWrap: "wrap", gap: 1.5, alignItems: { md: "center" } }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={type}
          onChange={(_e, v) => v !== null && setType(v)}
          sx={{
            bgcolor: "background.subtle",
            border: (th) => `1px solid ${th.palette.divider}`,
            borderRadius: "12px",
            p: 0.5,
            gap: 0.25,
            "& .MuiToggleButton-root": {
              textTransform: "none",
              fontWeight: 600,
              px: 1.75,
              border: "none",
              borderRadius: "9px !important",
              color: "text.secondary",
            },
            "& .Mui-selected": {
              bgcolor: "background.paper",
              color: "text.primary",
              boxShadow: cardShadow,
              "&:hover": { bgcolor: "background.paper" },
            },
          }}
        >
          <ToggleButton value="">{t("transactions.filter.all")}</ToggleButton>
          <ToggleButton value="income">{t("transactions.income")}</ToggleButton>
          <ToggleButton value="expense">{t("transactions.expense")}</ToggleButton>
        </ToggleButtonGroup>

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

      {/* Sổ cái */}
      <Paper
        sx={{
          borderRadius: "20px",
          border: (th) => `1px solid ${th.palette.divider}`,
          boxShadow: cardShadow,
          overflow: "hidden",
        }}
      >
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <Stack key={`sk-${i}`} direction="row" spacing={2} alignItems="center" sx={{ px: 3, py: 1.5 }}>
              <Skeleton variant="rounded" width={38} height={38} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="40%" />
                <Skeleton width="22%" />
              </Box>
              <Skeleton width={90} />
            </Stack>
          ))}

        {!loading &&
          groups.map(([date, rows], gi) => {
            const net = rows.reduce((s, r) => s + (r.type === "income" ? r.amount : -r.amount), 0);
            return (
              <Box key={date} sx={{ borderTop: gi > 0 ? (th) => `1px solid ${th.palette.divider}` : "none" }}>
                <Stack
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                  sx={{ px: 3, py: 1.5, bgcolor: "background.subtle" }}
                >
                  <Stack direction="row" alignItems="baseline" spacing={1.25}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>{dayLabel(date)}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: "text.secondary", textTransform: "capitalize" }}>
                      {weekdayLabel(date)}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{
                      fontFamily: DISPLAY,
                      fontVariantNumeric: "lining-nums tabular-nums",
                      fontSize: 13,
                      fontWeight: 600,
                      color: net >= 0 ? POS : NEG,
                    }}
                  >
                    {signedAmount(Math.abs(net), net >= 0)}
                  </Typography>
                </Stack>
                {rows.map((row, ri) => renderRow(row, ri))}
              </Box>
            );
          })}

        {!loading && items.length === 0 && (
          <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
            <Box sx={{ color: "text.disabled", display: "flex", justifyContent: "center", mb: 1.5 }}>
              <MagnifyingGlassIcon width={40} />
            </Box>
            {hasFilter ? (
              <>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{t("transactions.emptyResultTitle")}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {t("transactions.emptyResultDesc")}
                </Typography>
                <Button onClick={clearFilters} sx={{ mt: 2 }}>
                  {t("transactions.filter.clear")}
                </Button>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t("transactions.empty")}
              </Typography>
            )}
          </Box>
        )}

        {!loading && stats.total > 0 && (
          <Box sx={{ borderTop: (th) => `1px solid ${th.palette.divider}` }}>
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
          </Box>
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
