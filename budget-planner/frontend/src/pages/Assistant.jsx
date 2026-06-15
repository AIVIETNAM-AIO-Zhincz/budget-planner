import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  AcademicCapIcon,
  ChartBarIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  PlusCircleIcon,
  SparklesIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import TransactionFormDialog from "../components/TransactionFormDialog.jsx";
import { sendMessage } from "../api/assistant.js";
import { createTransaction } from "../api/transactions.js";
import { ApiError } from "../api/client.js";
import { formatAmount } from "../utils/format.js";

/** Thẻ nháp giao dịch trong bong bóng bot. */
function DraftCard({ draft, onConfirm }) {
  const { t } = useTranslation();
  const p = String(draft.date).split("-");
  const dateStr = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : draft.date;
  return (
    <Paper
      variant="outlined"
      sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: "background.subtle" }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {t("assistant.draftTitle")}
      </Typography>
      <Typography sx={{ fontWeight: 700 }}>
        {draft.type === "income" ? t("transactions.income") : t("transactions.expense")}{" "}
        {formatAmount(draft.amount)} ₫
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {draft.category_name} · {dateStr}
      </Typography>
      <Button size="small" variant="contained" sx={{ mt: 1 }} onClick={() => onConfirm(draft)}>
        {t("assistant.openForm")}
      </Button>
    </Paper>
  );
}

/** Bong bóng chat. */
function Bubble({ role, children }) {
  const isUser = role === "user";
  return (
    <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", mb: 1.25 }}>
      <Paper
        elevation={0}
        sx={{
          px: 1.75,
          py: 1.25,
          maxWidth: "80%",
          borderRadius: "16px",
          borderTopRightRadius: isUser ? "5px" : "16px",
          borderTopLeftRadius: isUser ? "16px" : "5px",
          background: (th) =>
            isUser
              ? th.palette.mode === "dark"
                ? "linear-gradient(140deg, #2fcaa0, #23b58e)"
                : "linear-gradient(140deg, #0f9d74, #0a7a59)"
              : th.palette.background.subtle,
          color: isUser ? "#fff" : "text.primary",
          border: (th) => (isUser ? "none" : `1px solid ${th.palette.divider}`),
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}

/** Nhãn nhỏ phía trên mỗi nhóm gợi ý. */
function GroupLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        mb: 1,
        color: "text.secondary",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Typography>
  );
}

/**
 * Trạng thái màn hình trống — lời chào căn giữa + 2 nhóm gợi ý.
 * @param {{onPick: (text: string) => void}} props
 */
function EmptyState({ onPick }) {
  const { t } = useTranslation();
  const quickPrompts = [
    { label: t("assistant.q1"), icon: <ChartBarIcon width={15} /> },
    { label: t("assistant.q2"), icon: <PlusCircleIcon width={15} /> },
    { label: t("assistant.q3"), icon: <WalletIcon width={15} /> },
  ];
  const faqPrompts = [t("assistant.faq1"), t("assistant.faq2"), t("assistant.faq3")];

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 3,
        py: 4,
      }}
    >
      <Stack alignItems="center" spacing={1.25} sx={{ maxWidth: 440 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: (th) => (th.palette.mode === "dark" ? "#2fcaa0" : "#0a7a59"),
            bgcolor: (th) => (th.palette.mode === "dark" ? "rgba(47,202,160,0.16)" : "#e4f6ef"),
            boxShadow: "0 12px 30px -14px rgba(15,157,116,0.6)",
          }}
        >
          <SparklesIcon width={30} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t("assistant.emptyTitle")}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("assistant.emptyDesc")}
        </Typography>
      </Stack>

      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <GroupLabel>{t("assistant.quickStart")}</GroupLabel>
        <Stack direction="row" justifyContent="center" sx={{ flexWrap: "wrap", gap: 1 }}>
          {quickPrompts.map((q) => (
            <Chip
              key={q.label}
              icon={q.icon}
              label={q.label}
              clickable
              onClick={() => onPick(q.label)}
              sx={{
                bgcolor: "background.subtle",
                color: "text.primary",
                fontWeight: 500,
                border: "none",
                "& .MuiChip-icon": { color: "primary.main", ml: 1 },
                "&:hover": { bgcolor: (th) => alpha(th.palette.primary.main, 0.1) },
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <GroupLabel>{t("assistant.knowledgeGroup")}</GroupLabel>
        <Stack spacing={1}>
          {faqPrompts.map((p) => (
            <ButtonBase
              key={p}
              onClick={() => onPick(p)}
              sx={{
                width: "100%",
                gap: 1.25,
                px: 1.75,
                py: 1.25,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: (th) => `1px solid ${th.palette.divider}`,
                transition: "background-color .15s, border-color .15s",
                "&:hover": {
                  bgcolor: "background.subtle",
                  borderColor: (th) => alpha(th.palette.primary.main, 0.4),
                },
              }}
            >
              <Box sx={{ color: "primary.main", display: "flex" }}>
                <AcademicCapIcon width={18} />
              </Box>
              <Typography variant="body2" sx={{ flex: 1, textAlign: "left" }}>
                {p}
              </Typography>
              <Box sx={{ color: "text.disabled", display: "flex" }}>
                <ChevronRightIcon width={16} />
              </Box>
            </ButtonBase>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

/** Trang Trợ lý — chat nhập NL + hỏi-đáp số liệu. */
export default function Assistant() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const JADE = isDark ? "#2fcaa0" : "#0f9d74";
  const JADE_DEEP = isDark ? "#23b58e" : "#0a7a59";
  const userBubble = `linear-gradient(140deg, ${JADE}, ${JADE_DEEP})`;
  const cardShadow = isDark
    ? "0 8px 28px -10px rgba(0,0,0,0.55)"
    : "0 6px 24px -8px rgba(16,26,46,0.12), 0 2px 8px -4px rgba(16,26,46,0.08)";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const push = (msg) => setMessages((prev) => [...prev, msg]);

  const send = async (raw) => {
    const text = (raw || "").trim();
    if (!text || sending) return;
    push({ role: "user", text });
    setInput("");
    setSending(true);
    try {
      const res = await sendMessage(text);
      push({
        role: "bot",
        text: res.reply,
        draft: res.kind === "transaction" ? res.draft : null,
        kind: res.kind,
      });
    } catch (err) {
      push({ role: "bot", text: err instanceof ApiError ? err.message : t("assistant.error") });
    } finally {
      setSending(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    send(input);
  };

  const openConfirm = (draft) => {
    setPrefill(draft);
    setDialogOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await createTransaction(payload);
      setDialogOpen(false);
      setToast(t("assistant.saved"));
      push({ role: "bot", text: t("assistant.saved") });
    } catch (err) {
      push({ role: "bot", text: err instanceof ApiError ? err.message : t("assistant.error") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 900,
        mx: "auto",
        // Lấp đầy chiều cao thực: 100dvh − toolbar (70) − padding của AppLayout (xs 32 / md 48).
        height: { xs: "calc(100dvh - 70px - 32px)", md: "calc(100dvh - 70px - 48px)" },
      }}
    >
      <PageHeader title={t("pages.assistant")} description={t("pages.assistantDesc")} />

      <Paper
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: "22px",
          border: (th) => `1px solid ${th.palette.divider}`,
          boxShadow: cardShadow,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column" }}>
          {messages.length === 0 ? (
            <EmptyState onPick={send} />
          ) : (
            <>
              {messages.map((m, i) => (
                <Bubble key={i} role={m.role}>
                  {m.kind === "faq" && (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{ mb: 0.5, color: "primary.main" }}
                    >
                      <SparklesIcon width={14} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {t("assistant.knowledgeTag")}
                      </Typography>
                    </Stack>
                  )}
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </Typography>
                  {m.draft && <DraftCard draft={m.draft} onConfirm={openConfirm} />}
                </Bubble>
              ))}
              <Box ref={endRef} />
            </>
          )}
        </Box>

        <Box
          component="form"
          onSubmit={handleSend}
          sx={{ p: 1.5, borderTop: (th) => `1px solid ${th.palette.divider}` }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pl: 2,
              pr: 0.75,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "background.subtle",
              border: (th) => `1px solid ${th.palette.divider}`,
              transition: "border-color .15s, background-color .15s",
              "&:focus-within": {
                borderColor: "primary.main",
                bgcolor: "background.paper",
              },
            }}
          >
            <TextField
              fullWidth
              variant="standard"
              placeholder={t("assistant.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              InputProps={{ disableUnderline: true }}
            />
            <IconButton
              type="submit"
              disabled={sending || !input.trim()}
              aria-label={t("assistant.send")}
              sx={{
                background: userBubble,
                color: "#fff",
                flexShrink: 0,
                boxShadow: `0 8px 18px -8px ${alpha(JADE, 0.7)}`,
                "&:hover": { background: userBubble, filter: "brightness(1.05)" },
                "&.Mui-disabled": {
                  background: "none",
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                  boxShadow: "none",
                },
              }}
            >
              <PaperAirplaneIcon width={20} />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <TransactionFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initial={prefill}
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
    </Box>
  );
}
