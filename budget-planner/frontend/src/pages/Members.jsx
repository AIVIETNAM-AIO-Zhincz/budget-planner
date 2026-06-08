import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import InviteMemberDialog from "../components/InviteMemberDialog.jsx";
import { listMembers, inviteMember, updateMemberRole, removeMember } from "../api/members.js";
import { ApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

const ASSIGNABLE = ["admin", "member", "viewer"];

const ROLE_COLOR = { owner: "primary", admin: "info", member: "success", viewer: "default" };

/** Trang Members — quản lý thành viên, UI nhận biết vai trò. */
export default function Members() {
  const { t } = useTranslation();
  const { user, spaces, spaceId } = useAuth();

  const currentRole = useMemo(
    () => spaces.find((s) => s.id === spaceId)?.role,
    [spaces, spaceId]
  );
  const canManage = currentRole === "owner" || currentRole === "admin";
  const isOwner = currentRole === "owner";
  const currentUserId = user?.id;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("members.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openInvite = () => {
    setDialogError("");
    setDialogOpen(true);
  };

  const handleInvite = async (payload) => {
    setInviting(true);
    setDialogError("");
    try {
      await inviteMember(payload);
      setDialogOpen(false);
      setToast(t("members.invited"));
      await refresh();
    } catch (e) {
      setDialogError(e instanceof ApiError ? e.message : t("members.saveError"));
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (member, role) => {
    try {
      await updateMemberRole(member.id, role);
      setToast(t("members.updated"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("members.saveError"));
    }
  };

  const confirmRemove = async () => {
    setDeleting(true);
    try {
      await removeMember(confirmTarget.id);
      setConfirmTarget(null);
      setToast(t("members.removed"));
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("members.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  const roleOptions = isOwner ? ["owner", ...ASSIGNABLE] : ASSIGNABLE;

  return (
    <>
      <PageHeader
        title={t("pages.members")}
        description={t("pages.membersDesc")}
        actions={
          canManage && (
            <Button variant="contained" startIcon={<PlusIcon width={18} />} onClick={openInvite}>
              {t("members.invite")}
            </Button>
          )
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
                <TableCell>{t("members.colMember")}</TableCell>
                <TableCell>{t("members.colRole")}</TableCell>
                <TableCell align="right">{t("members.colActions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {Array.from({ length: 3 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                members.map((m) => {
                  const isSelf = m.user_id === currentUserId;
                  const editable = canManage && m.role !== "owner" && !isSelf;
                  return (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {m.name || m.email}
                          {isSelf && (
                            <Typography component="span" sx={{ ml: 1, fontSize: 12, color: "text.disabled" }}>
                              {t("members.you")}
                            </Typography>
                          )}
                        </Typography>
                        {m.name && (
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {m.email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editable ? (
                          <TextField
                            select
                            size="small"
                            value={m.role}
                            onChange={(e) => handleRoleChange(m, e.target.value)}
                            sx={{ minWidth: 140 }}
                          >
                            {roleOptions.map((r) => (
                              <MenuItem key={r} value={r}>
                                {t(`members.roles.${r}`)}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : (
                          <Chip
                            size="small"
                            label={t(`members.roles.${m.role}`)}
                            color={ROLE_COLOR[m.role] || "default"}
                            variant={m.role === "owner" ? "filled" : "outlined"}
                            sx={{ height: 24, fontWeight: 600 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {editable && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setConfirmTarget(m)}
                            aria-label="remove"
                          >
                            <TrashIcon width={18} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && members.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("members.empty")}
            </Typography>
          </Box>
        )}
      </Paper>

      <InviteMemberDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleInvite}
        submitting={inviting}
        allowOwner={isOwner}
        error={dialogError}
      />

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={t("members.removeTitle")}
        message={t("members.removeConfirm", { name: confirmTarget?.name || confirmTarget?.email })}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmRemove}
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
