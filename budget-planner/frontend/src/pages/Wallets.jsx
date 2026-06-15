import { useCallback, useEffect, useMemo, useState } from "react";
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
  ArrowsRightLeftIcon,
  WalletIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
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
import { hexToRgba, lighten } from "../utils/badgeColors.js";

/** Bảng màu nhấn cho ví — xoay vòng theo thứ tự để các ví khác màu nhau. */
const WALLET_ACCENTS = ["#0f9d74", "#3f72d6", "#8868e0", "#e09a3d", "#d8568c"];

/** Icon Heroicon theo loại ví. */
const TYPE_ICON = {
  cash: BanknotesIcon,
  bank: BuildingLibraryIcon,
  "e-wallet": CreditCardIcon,
};

/** Lấy bộ màu nhấn (accent + nền + chữ) cho ví thứ `i`, nhận biết dark mode. */
function walletAccent(i, isDark) {
  const accent = WALLET_ACCENTS[i % WALLET_ACCENTS.length];
  return {
    accent,
    bg: hexToRgba(accent, isDark ? 0.18 : 0.12),
    text: isDark ? lighten(accent, 0.4) : accent,
  };
}

/** Một thẻ ví: icon theo loại, tên, pill loại, số dư + hành động. */
function WalletCard({ wallet, index, canManage, onEdit, onDelete }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { accent, bg, text } = walletAccent(index, isDark);
  const Icon = TYPE_ICON[wallet.type] || WalletIcon;
  const negative = wallet.balance < 0;

  return (
    <Paper
      sx={{
        position: "relative",
        overflow: "hidden",
        p: 2.5,
        borderRadius: 4,
        height: "100%",
        border: (th) => `1px solid ${th.palette.divider}`,
        transition: "box-shadow .16s, transform .16s",
        "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: accent,
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" sx={{ gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: "13px",
            display: "grid",
            placeItems: "center",
            bgcolor: bg,
            color: text,
          }}
        >
          <Icon width={22} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 16 }} noWrap>
            {wallet.name}
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              mt: 0.75,
              px: 1.25,
              py: 0.375,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              bgcolor: bg,
              color: text,
            }}
          >
            {t(`wallets.types.${wallet.type}`)}
          </Box>
        </Box>
        {canManage && (
          <Stack direction="row" sx={{ gap: 0.25 }}>
            <IconButton size="small" onClick={() => onEdit(wallet)} aria-label="edit">
              <PencilSquareIcon width={16} />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onDelete(wallet)} aria-label="delete">
              <TrashIcon width={16} />
            </IconButton>
          </Stack>
        )}
      </Stack>

      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "text.disabled",
        }}
      >
        {t("wallets.form.balance")}
      </Typography>
      <Typography
        className="tnum"
        sx={{
          mt: 0.25,
          fontSize: 25,
          fontWeight: 800,
          lineHeight: 1.1,
          color: negative ? "error.main" : "text.primary",
        }}
      >
        {formatAmount(wallet.balance)}
        <Box component="span" sx={{ fontSize: 15, color: "text.secondary", fontWeight: 600, ml: 0.5 }}>
          ₫
        </Box>
      </Typography>

      {wallet.tx_count > 0 && (
        <Typography variant="caption" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
          {t("wallets.txStats", { count: wallet.tx_count })} ·{" "}
          <Box component="span" sx={{ color: "success.main" }}>
            +{formatAmount(wallet.tx_income)}
          </Box>{" "}
          /{" "}
          <Box component="span" sx={{ color: "error.main" }}>
            −{formatAmount(wallet.tx_expense)}
          </Box>
        </Typography>
      )}
    </Paper>
  );
}

/** Hero tổng số dư: số lớn + thanh xếp chồng theo tỉ trọng từng ví + chú thích. */
function TotalHero({ wallets, total }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const positiveTotal = wallets.reduce((s, w) => s + Math.max(Number(w.balance) || 0, 0), 0);

  return (
    <Paper
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 3, sm: 3.5 },
        mb: 2.5,
        borderRadius: 5,
        border: (th) => `1px solid ${th.palette.divider}`,
        "&::after": {
          content: '""',
          position: "absolute",
          right: -70,
          top: -80,
          width: 240,
          height: 240,
          background: `radial-gradient(circle, ${hexToRgba(theme.palette.success.main, 0.1)}, transparent 65%)`,
          pointerEvents: "none",
        },
      }}
    >
      <Typography
        sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "text.disabled" }}
      >
        {t("wallets.total").toUpperCase()} · {t("wallets.countWallets", { count: wallets.length })}
      </Typography>
      <Typography
        className="tnum"
        sx={{
          mt: 1,
          mb: 2.25,
          fontSize: { xs: 36, sm: 44 },
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: total < 0 ? "error.main" : "text.primary",
        }}
      >
        {formatAmount(total)}
        <Box component="span" sx={{ fontSize: 22, color: "text.secondary", fontWeight: 600, ml: 0.75 }}>
          ₫
        </Box>
      </Typography>

      <Box
        sx={{
          display: "flex",
          height: 14,
          borderRadius: 999,
          overflow: "hidden",
          bgcolor: "background.subtle",
          border: (th) => `1px solid ${th.palette.divider}`,
        }}
      >
        {wallets.map((w, i) => {
          const share =
            positiveTotal > 0 ? (Math.max(Number(w.balance) || 0, 0) / positiveTotal) * 100 : 0;
          return (
            <Box
              key={w.id}
              sx={{
                width: `${share}%`,
                bgcolor: walletAccent(i, isDark).accent,
                transition: "width 1s cubic-bezier(.2,.8,.2,1)",
              }}
            />
          );
        })}
      </Box>

      <Stack direction="row" flexWrap="wrap" sx={{ gap: 2, mt: 1.75 }}>
        {wallets.map((w, i) => (
          <Stack key={w.id} direction="row" alignItems="center" sx={{ gap: 1 }}>
            <Box
              sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: walletAccent(i, isDark).accent }}
            />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {w.name} ·{" "}
              <Box component="span" className="tnum" sx={{ fontWeight: 600, color: "text.primary" }}>
                {formatAmount(w.balance)} ₫
              </Box>
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

/** Trang Ví — CRUD + chuyển tiền, hero tổng số dư + thẻ ví, RBAC-aware. */
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

      {loading ? (
        <>
          <Skeleton variant="rounded" height={170} sx={{ borderRadius: 5, mb: 2.5 }} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={170} sx={{ borderRadius: 4 }} />
            ))}
          </Box>
        </>
      ) : items.length === 0 ? (
        <Paper sx={{ borderRadius: 4, border: (th) => `1px solid ${th.palette.divider}`, overflow: "hidden" }}>
          <EmptyState
            bare
            icon={<WalletIcon width={26} />}
            title={t("wallets.emptyTitle")}
            description={t("wallets.empty")}
          />
        </Paper>
      ) : (
        <>
          <TotalHero wallets={items} total={total} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {items.map((w, i) => (
              <WalletCard
                key={w.id}
                wallet={w}
                index={i}
                canManage={canManage}
                onEdit={(wallet) => {
                  setEditing(wallet);
                  setDialogOpen(true);
                }}
                onDelete={setConfirmTarget}
              />
            ))}
          </Box>
        </>
      )}

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
