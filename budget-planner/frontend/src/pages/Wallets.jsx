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
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowsRightLeftIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import WalletFormDialog from "../components/WalletFormDialog.jsx";
import TransferDialog from "../components/TransferDialog.jsx";
import {
  listWallets,
  createWallet,
  updateWallet,
  deleteWallet,
  transfer,
} from "../api/wallets.js";
import { ApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatAmount } from "../utils/format.js";

const TYPE_COLOR = { cash: "success", bank: "info", "e-wallet": "warning" };

/** Trang Ví — CRUD + chuyển tiền, hiển thị số dư, RBAC-aware. */
export default function Wallets() {
  const { t } = useTranslation();
  const { spaces, spaceId } = useAuth();
  const role = useMemo(() => spaces.find((s) => s.id === spaceId)?.role, [spaces, spaceId]);
  const canManage = role === "owner" || role === "admin";
  const canTransfer = canManage || role === "member";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferErr, setTransferErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listWallets();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("wallets.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const total = items.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) await updateWallet(editing.id, payload);
      else await createWallet(payload);
      setDialogOpen(false);
      setToast(editing ? t("wallets.updated") : t("wallets.created"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("wallets.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteWallet(confirmTarget.id);
      setConfirmTarget(null);
      setToast(t("wallets.deleted"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("wallets.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  const handleTransfer = async (payload) => {
    setTransferring(true);
    setTransferErr("");
    try {
      await transfer(payload);
      setTransferOpen(false);
      setToast(t("wallets.transferred"));
      await refresh();
    } catch (e) {
      setTransferErr(e instanceof ApiError ? e.message : t("wallets.saveError"));
    } finally {
      setTransferring(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("pages.wallets")}
        description={t("pages.walletsDesc")}
        actions={
          <Stack direction="row" spacing={1}>
            {canTransfer && items.length >= 2 && (
              <Button
                variant="outlined"
                startIcon={<ArrowsRightLeftIcon width={18} />}
                onClick={() => setTransferOpen(true)}
                className="no-hover-lift"
              >
                {t("wallets.transfer")}
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
                {t("wallets.add")}
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

      <Paper sx={{ borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}`, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("wallets.form.name")}</TableCell>
                <TableCell>{t("wallets.form.type")}</TableCell>
                <TableCell align="right">{t("wallets.form.balance")}</TableCell>
                {canManage && <TableCell align="right">{t("transactions.colActions")}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: canManage ? 4 : 3 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                items.map((w) => (
                  <TableRow key={w.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {w.name}
                      {w.tx_count > 0 && (
                        <Typography
                          component="div"
                          variant="caption"
                          sx={{ fontWeight: 400, color: "text.secondary", mt: 0.25 }}
                        >
                          {t("wallets.txStats", { count: w.tx_count })} ·{" "}
                          <Box component="span" sx={{ color: "success.main" }}>
                            +{formatAmount(w.tx_income)}
                          </Box>{" "}
                          /{" "}
                          <Box component="span" sx={{ color: "error.main" }}>
                            −{formatAmount(w.tx_expense)}
                          </Box>
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`wallets.types.${w.type}`)}
                        color={TYPE_COLOR[w.type] || "default"}
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
                        color: w.balance < 0 ? "error.main" : "text.primary",
                      }}
                    >
                      {formatAmount(w.balance)} ₫
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditing(w);
                            setDialogOpen(true);
                          }}
                          aria-label="edit"
                        >
                          <PencilSquareIcon width={18} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmTarget(w)}
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
            icon={<WalletIcon width={26} />}
            title={t("wallets.emptyTitle")}
            description={t("wallets.empty")}
          />
        )}

        {!loading && items.length > 0 && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              justifyContent: "space-between",
              borderTop: (th) => `1px solid ${th.palette.divider}`,
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>{t("wallets.total")}</Typography>
            <Typography
              sx={{
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                color: total < 0 ? "error.main" : "text.primary",
              }}
            >
              {formatAmount(total)} ₫
            </Typography>
          </Box>
        )}
      </Paper>

      <WalletFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initial={editing}
      />

      <TransferDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSubmit={handleTransfer}
        submitting={transferring}
        wallets={items}
        error={transferErr}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={t("wallets.deleteTitle")}
        message={t("wallets.deleteConfirm", { name: confirmTarget?.name })}
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
