import { useState } from "react";
import { Alert, Box, Button, Link, Stack, TextField } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { ApiError } from "../api/client.js";

/** Trang đăng ký (đăng ký xong tự đăng nhập + tạo không gian owner). */
export default function Register() {
  const { t } = useTranslation();
  const { status, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "authed") return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ email, password, name });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.registerError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.registerTitle")}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t("auth.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            inputProps={{ minLength: 8 }}
            helperText={t("auth.passwordHint")}
          />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {t("auth.register")}
          </Button>
          <Link component={RouterLink} to="/login" sx={{ textAlign: "center" }}>
            {t("auth.haveAccount")}
          </Link>
        </Stack>
      </Box>
    </AuthShell>
  );
}
