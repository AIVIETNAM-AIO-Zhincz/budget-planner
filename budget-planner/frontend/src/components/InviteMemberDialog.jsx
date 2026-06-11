import { useEffect, useState } from "react";
import { Alert, Button, MenuItem, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import BrandDialog from "./BrandDialog.jsx";

const BASE_ROLES = ["admin", "member", "viewer"];

/**
 * Dialog mời thành viên: email + vai trò.
 *
 * @param {{open:boolean, onClose:Function, onSubmit:Function, submitting:boolean,
 *          allowOwner:boolean, error?:string}} props
 */
export default function InviteMemberDialog({ open, onClose, onSubmit, submitting, allowOwner, error }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("member");
      setTouched(false);
    }
  }, [open]);

  const roles = allowOwner ? ["owner", ...BASE_ROLES] : BASE_ROLES;
  const emailInvalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (emailInvalid) return;
    await onSubmit({ email: email.trim(), role });
  };

  return (
    <BrandDialog
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={t("members.form.title")}
      PaperProps={{ component: "form", onSubmit: handleSubmit }}
      actions={
        <>
          <Button onClick={onClose} disabled={submitting} className="no-hover-lift">
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {t("members.form.submit")}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={t("members.form.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={touched && emailInvalid}
          helperText={touched && emailInvalid ? t("members.form.emailInvalid") : t("members.form.emailHint")}
          required
          autoFocus
          fullWidth
        />
        <TextField
          select
          label={t("members.form.role")}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          fullWidth
        >
          {roles.map((r) => (
            <MenuItem key={r} value={r}>
              {t(`members.roles.${r}`)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </BrandDialog>
  );
}
