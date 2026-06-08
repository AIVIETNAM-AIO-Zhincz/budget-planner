import { useState } from "react";
import { Alert, Box, Button, Link, Stack, TextField } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { ApiError } from "../api/client.js";

/** Trang đăng nhập. */
export default function Login() {
  const { t } = useTranslation();
  const { status, login } = useAuth();
  const navigate = useNavigate();
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
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.loginError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.loginTitle")}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={busy}>
            {t("auth.login")}
          </Button>
          <Link component={RouterLink} to="/register" sx={{ textAlign: "center" }}>
            {t("auth.noAccount")}
          </Link>
        </Stack>
      </Box>
    </AuthShell>
  );
}
