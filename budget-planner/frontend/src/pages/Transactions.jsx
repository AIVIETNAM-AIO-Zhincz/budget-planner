import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import CategoryChip from "../components/CategoryChip.jsx";
import TransactionFormDialog from "../components/TransactionFormDialog.jsx";
import { listTransactions, createTransaction } from "../api/transactions.js";
import { ApiError } from "../api/client.js";
import { formatAmount } from "../utils/format.js";

/** Trang Giao dịch — bảng + dialog thêm, nối API thật. */
export default function Transactions() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listTransactions();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("transactions.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      await createTransaction(payload);
      setDialogOpen(false);
      setToast(true);
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("transactions.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const parts = String(d).split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
  };

  return (
    <>
      <PageHeader
        title={t("transactions.title")}
        description={t("transactions.subtitle")}
        actions={
          <Button variant="contained" startIcon={<PlusIcon width={18} />} onClick={() => setDialogOpen(true)}>
            {t("transactions.add")}
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 5 }).map((__, j) => (
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
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && items.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("transactions.empty")}
            </Typography>
          </Box>
        )}
      </Paper>

      <TransactionFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        submitting={submitting}
      />

      <Snackbar
        open={toast}
        autoHideDuration={2500}
        onClose={() => setToast(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast(false)}>
          {t("transactions.created")}
        </Alert>
      </Snackbar>
    </>
  );
}
