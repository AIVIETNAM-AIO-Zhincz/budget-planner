import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  AcademicCapIcon,
  Bars3Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TransactionFormDialog from "../components/TransactionFormDialog.jsx";
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  postConversationMessage,
  renameConversation,
} from "../api/assistant.js";
import { createTransaction } from "../api/transactions.js";
import { ApiError } from "../api/client.js";
import { formatAmount } from "../utils/format.js";

const SIDEBAR_WIDTH = 270;

/** Thẻ nháp giao dịch trong bong bóng bot. */
function DraftCard({ draft, onConfirm }) {
  const { t } = useTranslation();
  const p = String(draft.date).split("-");
  const dateStr = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : draft.date;
  return (
    <Paper variant="outlined" sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: "background.subtle" }}>
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

/** Trang Trợ lý — chat nhập NL + hỏi-đáp số liệu, lưu lịch sử theo thread. */
export default function Assistant() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const JADE = isDark ? "#2fcaa0" : "#0f9d74";
  const JADE_DEEP = isDark ? "#23b58e" : "#0a7a59";
  const userBubble = `linear-gradient(140deg, ${JADE}, ${JADE_DEEP})`;
  const cardShadow = isDark
    ? "0 8px 28px -10px rgba(0,0,0,0.55)"
    : "0 6px 24px -8px rgba(16,26,46,0.12), 0 2px 8px -4px rgba(16,26,46,0.08)";

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menu, setMenu] = useState(null); // { anchor, conv }
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const endRef = useRef(null);

  const loadList = useCallback(async () => {
    try {
      const data = await listConversations();
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      return list;
    } catch {
      setConversations([]);
      return [];
    }
  }, []);

  const openConversation = useCallback(async (id) => {
    setDrawerOpen(false);
    try {
      const detail = await getConversation(id);
      setActiveId(id);
      setMessages(
        (detail.messages || []).map((m) => ({
          role: m.role,
          text: m.text,
          kind: m.kind,
          draft: m.kind === "transaction" ? m.draft : null,
        }))
      );
    } catch {
      /* bỏ qua: thread có thể đã bị xoá */
    }
  }, []);

  // Tải danh sách thread khi vào trang; mở thread gần nhất nếu có.
  useEffect(() => {
    loadList().then((list) => {
      if (list.length) openConversation(list[0].id);
    });
  }, [loadList, openConversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const push = (msg) => setMessages((prev) => [...prev, msg]);

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setDrawerOpen(false);
  };

  const send = async (raw) => {
    const text = (raw || "").trim();
    if (!text || sending) return;
    setSending(true);
    push({ role: "user", text });
    setInput("");
    try {
      let id = activeId;
      if (!id) {
        const conv = await createConversation();
        id = conv.id;
        setActiveId(id);
      }
      const res = await postConversationMessage(id, text);
      push({
        role: "bot",
        text: res.reply,
        draft: res.kind === "transaction" ? res.draft : null,
        kind: res.kind,
      });
      loadList();
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

  const submitRename = async () => {
    const title = renameText.trim();
    if (!title || !renameTarget) return;
    try {
      await renameConversation(renameTarget.id, title);
      await loadList();
    } catch {
      /* bỏ qua */
    }
    setRenameTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConversation(deleteTarget.id);
      if (deleteTarget.id === activeId) newChat();
      await loadList();
    } catch {
      /* bỏ qua */
    }
    setDeleteTarget(null);
  };

  const threadTitle = (c) => c.title?.trim() || t("assistant.threads.untitled");

  /** Nội dung danh sách thread (dùng cho cả sidebar desktop & drawer mobile). */
  const threadList = (
    <Stack sx={{ height: "100%", minHeight: 0 }}>
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<PlusIcon width={18} />}
          onClick={newChat}
          sx={{ justifyContent: "flex-start", borderRadius: "12px" }}
        >
          {t("assistant.threads.new")}
        </Button>
      </Box>
      <Box sx={{ px: 1, flex: 1, minHeight: 0, overflowY: "auto" }}>
        {conversations.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 3 }}>
            {t("assistant.threads.empty")}
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <Box
                  key={c.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "10px",
                    bgcolor: active ? (th) => alpha(JADE, th.palette.mode === "dark" ? 0.18 : 0.12) : "transparent",
                    "&:hover": { bgcolor: active ? undefined : "background.subtle" },
                    "&:hover .threadMenu": { opacity: 1 },
                  }}
                >
                  <ButtonBase
                    onClick={() => openConversation(c.id)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      justifyContent: "flex-start",
                      gap: 1,
                      px: 1.25,
                      py: 1,
                      borderRadius: "10px",
                    }}
                  >
                    <ChatBubbleLeftRightIcon
                      width={16}
                      style={{ flexShrink: 0, color: active ? JADE_DEEP : "var(--mui-ink-3, #8593a8)" }}
                    />
                    <Typography
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 13.5,
                        fontWeight: active ? 600 : 500,
                        color: active ? "text.primary" : "text.secondary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      {threadTitle(c)}
                    </Typography>
                  </ButtonBase>
                  <IconButton
                    className="threadMenu"
                    size="small"
                    onClick={(e) => setMenu({ anchor: e.currentTarget, conv: c })}
                    sx={{ mr: 0.5, opacity: { xs: 1, md: 0 }, transition: "opacity .15s" }}
                    aria-label="menu"
                  >
                    <EllipsisVerticalIcon width={16} />
                  </IconButton>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Stack>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 1120,
        mx: "auto",
        // Lấp đầy chiều cao thực: 100dvh − toolbar (70) − padding của AppLayout (xs 32 / md 48).
        height: { xs: "calc(100dvh - 70px - 32px)", md: "calc(100dvh - 70px - 48px)" },
      }}
    >
      <PageHeader
        title={t("pages.assistant")}
        description={t("pages.assistantDesc")}
        actions={
          <Stack direction="row" spacing={1}>
            {!isDesktop && (
              <Button
                variant="outlined"
                startIcon={<Bars3Icon width={18} />}
                onClick={() => setDrawerOpen(true)}
              >
                {t("assistant.threads.title")}
              </Button>
            )}
            <Button variant="outlined" startIcon={<PlusIcon width={18} />} onClick={newChat}>
              {t("assistant.threads.new")}
            </Button>
          </Stack>
        }
      />

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", gap: 2 }}>
        {isDesktop && (
          <Paper
            sx={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              borderRadius: "20px",
              border: (th) => `1px solid ${th.palette.divider}`,
              boxShadow: cardShadow,
              overflow: "hidden",
            }}
          >
            {threadList}
          </Paper>
        )}

        <Paper
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
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
                "&:focus-within": { borderColor: JADE, bgcolor: "background.paper" },
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
      </Box>

      {/* Drawer danh sách thread (mobile) */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: SIDEBAR_WIDTH, height: "100%" }}>{threadList}</Box>
      </Drawer>

      {/* Menu thao tác thread */}
      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setRenameTarget(menu.conv);
            setRenameText(menu.conv.title || "");
            setMenu(null);
          }}
        >
          <PencilSquareIcon width={16} style={{ marginRight: 8 }} />
          {t("assistant.threads.rename")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteTarget(menu.conv);
            setMenu(null);
          }}
          sx={{ color: "error.main" }}
        >
          <TrashIcon width={16} style={{ marginRight: 8 }} />
          {t("assistant.threads.delete")}
        </MenuItem>
      </Menu>

      {/* Dialog đổi tên */}
      <Dialog open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{t("assistant.threads.renameTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("assistant.threads.nameLabel")}
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameTarget(null)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={submitRename}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <TransactionFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        initial={prefill}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("assistant.threads.deleteTitle")}
        message={t("assistant.threads.deleteConfirm", { title: deleteTarget ? threadTitle(deleteTarget) : "" })}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
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
