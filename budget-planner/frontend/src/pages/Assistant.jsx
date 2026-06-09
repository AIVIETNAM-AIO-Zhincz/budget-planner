import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PaperAirplaneIcon, SparklesIcon } from "@heroicons/react/24/outline";
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
        sx={{
          px: 1.75,
          py: 1.25,
          maxWidth: "80%",
          borderRadius: 3,
          bgcolor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "#fff" : "text.primary",
          border: (th) => (isUser ? "none" : `1px solid ${th.palette.divider}`),
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}

/** Trang Trợ lý — chat nhập NL + hỏi-đáp số liệu. */
export default function Assistant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([{ role: "bot", text: t("assistant.greeting") }]);
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
      push({ role: "bot", text: res.reply, draft: res.kind === "transaction" ? res.draft : null });
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

  const quickPrompts = [t("assistant.q1"), t("assistant.q2"), t("assistant.q3")];

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
    <>
      <PageHeader title={t("pages.assistant")} description={t("pages.assistantDesc")} />

      <Paper
        sx={{
          maxWidth: 720,
          borderRadius: 3,
          border: (th) => `1px solid ${th.palette.divider}`,
          display: "flex",
          flexDirection: "column",
          height: { xs: "calc(100vh - 220px)", md: "calc(100vh - 200px)" },
        }}
      >
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {m.text}
              </Typography>
              {m.draft && <DraftCard draft={m.draft} onConfirm={openConfirm} />}
            </Bubble>
          ))}
          <Box ref={endRef} />
        </Box>

        {messages.length <= 1 && (
          <Stack direction="row" spacing={1} sx={{ px: 1.5, pb: 1, flexWrap: "wrap", gap: 1 }}>
            {quickPrompts.map((p) => (
              <Chip
                key={p}
                label={p}
                size="small"
                variant="outlined"
                color="primary"
                clickable
                onClick={() => send(p)}
              />
            ))}
          </Stack>
        )}

        <Box
          component="form"
          onSubmit={handleSend}
          sx={{
            p: 1.5,
            borderTop: (th) => `1px solid ${th.palette.divider}`,
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <TextField
            fullWidth
            placeholder={t("assistant.placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            InputProps={{
              startAdornment: <SparklesIcon width={18} style={{ marginRight: 8, opacity: 0.5 }} />,
            }}
          />
          <IconButton
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="send"
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              "&:hover": { bgcolor: "primary.dark" },
              "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "action.disabled" },
            }}
          >
            <PaperAirplaneIcon width={20} />
          </IconButton>
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
    </>
  );
}
