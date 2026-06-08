import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import PageHeader from "../components/PageHeader.jsx";
import CurrencySelect from "../components/CurrencySelect.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { changePassword, updateProfile } from "../api/auth.js";
import { createSpace, updateSpace } from "../api/spaces.js";
import { ApiError } from "../api/client.js";

/** Thẻ một mục cài đặt. */
function SettingCard({ title, desc, children }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: (th) => `1px solid ${th.palette.divider}` }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {desc && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {desc}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

/** Trang Settings — hồ sơ, đổi mật khẩu, sửa & tạo không gian. */
export default function Settings() {
  const { t } = useTranslation();
  const { user, spaces, spaceId, selectSpace, reload } = useAuth();
  const currentSpace = spaces.find((s) => s.id === spaceId);
  const canEditSpace = currentSpace?.role === "owner" || currentSpace?.role === "admin";

  const [toast, setToast] = useState("");

  // Hồ sơ
  const [name, setName] = useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErr, setProfileErr] = useState("");

  // Mật khẩu
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwErr, setPwErr] = useState("");

  // Không gian hiện tại
  const [spaceName, setSpaceName] = useState(currentSpace?.name ?? "");
  const [spaceCurrency, setSpaceCurrency] = useState(currentSpace?.currency ?? "VND");
  const [savingSpace, setSavingSpace] = useState(false);
  const [spaceErr, setSpaceErr] = useState("");

  // Tạo không gian mới
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceCurrency, setNewSpaceCurrency] = useState("VND");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileErr("");
    try {
      await updateProfile({ name: name.trim() });
      await reload();
      setToast(t("settings.profile.saved"));
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : t("settings.saveError"));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwErr("");
    if (newPw !== confirmPw) {
      setPwErr(t("settings.password.mismatch"));
      return;
    }
    if (newPw.length < 8) {
      setPwErr(t("settings.password.tooShort"));
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({ current_password: curPw, new_password: newPw });
      setCurPw("");
      setNewPw("");
      setConfirmPw("");
      setToast(t("settings.password.changed"));
    } catch (err) {
      setPwErr(err instanceof ApiError ? err.message : t("settings.saveError"));
    } finally {
      setSavingPw(false);
    }
  };

  const saveSpace = async (e) => {
    e.preventDefault();
    setSavingSpace(true);
    setSpaceErr("");
    try {
      await updateSpace(spaceId, { name: spaceName.trim(), currency: spaceCurrency });
      await reload();
      setToast(t("settings.space.saved"));
    } catch (err) {
      setSpaceErr(err instanceof ApiError ? err.message : t("settings.saveError"));
    } finally {
      setSavingSpace(false);
    }
  };

  const createNewSpace = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateErr("");
    try {
      const space = await createSpace({ name: newSpaceName.trim(), currency: newSpaceCurrency });
      await reload();
      if (space?.id) selectSpace(space.id);
      setNewSpaceName("");
      setNewSpaceCurrency("VND");
      setToast(t("settings.createSpace.created"));
    } catch (err) {
      setCreateErr(err instanceof ApiError ? err.message : t("settings.saveError"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <PageHeader title={t("pages.settings")} description={t("pages.settingsDesc")} />

      <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
        {/* Hồ sơ */}
        <SettingCard title={t("settings.profile.title")} desc={t("settings.profile.desc")}>
          <Box component="form" onSubmit={saveProfile}>
            <Stack spacing={2}>
              {profileErr && <Alert severity="error">{profileErr}</Alert>}
              <TextField
                label={t("settings.profile.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="small"
                fullWidth
              />
              <Box>
                <Button type="submit" variant="contained" disabled={savingProfile}>
                  {t("settings.profile.save")}
                </Button>
              </Box>
            </Stack>
          </Box>
        </SettingCard>

        {/* Đổi mật khẩu */}
        <SettingCard title={t("settings.password.title")} desc={t("settings.password.desc")}>
          <Box component="form" onSubmit={savePassword}>
            <Stack spacing={2}>
              {pwErr && <Alert severity="error">{pwErr}</Alert>}
              <TextField
                label={t("settings.password.current")}
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                size="small"
                required
                fullWidth
              />
              <TextField
                label={t("settings.password.new")}
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                size="small"
                required
                fullWidth
              />
              <TextField
                label={t("settings.password.confirm")}
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                size="small"
                required
                fullWidth
              />
              <Box>
                <Button type="submit" variant="contained" disabled={savingPw}>
                  {t("settings.password.save")}
                </Button>
              </Box>
            </Stack>
          </Box>
        </SettingCard>

        {/* Không gian hiện tại */}
        <SettingCard title={t("settings.space.title")} desc={t("settings.space.desc")}>
          {canEditSpace ? (
            <Box component="form" onSubmit={saveSpace}>
              <Stack spacing={2}>
                {spaceErr && <Alert severity="error">{spaceErr}</Alert>}
                <TextField
                  label={t("settings.space.name")}
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  size="small"
                  required
                  fullWidth
                />
                <CurrencySelect
                  label={t("settings.space.currency")}
                  value={spaceCurrency}
                  onChange={setSpaceCurrency}
                />
                <Box>
                  <Button type="submit" variant="contained" disabled={savingSpace}>
                    {t("settings.space.save")}
                  </Button>
                </Box>
              </Stack>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("settings.space.readonly")} ({currentSpace?.name} · {currentSpace?.currency})
            </Typography>
          )}
        </SettingCard>

        {/* Tạo không gian mới */}
        <SettingCard
          title={t("settings.createSpace.title")}
          desc={t("settings.createSpace.desc")}
        >
          <Box component="form" onSubmit={createNewSpace}>
            <Stack spacing={2}>
              {createErr && <Alert severity="error">{createErr}</Alert>}
              <TextField
                label={t("settings.createSpace.name")}
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                size="small"
                required
                fullWidth
              />
              <CurrencySelect
                label={t("settings.createSpace.currency")}
                value={newSpaceCurrency}
                onChange={setNewSpaceCurrency}
              />
              <Box>
                <Button type="submit" variant="contained" disabled={creating}>
                  {t("settings.createSpace.create")}
                </Button>
              </Box>
            </Stack>
          </Box>
        </SettingCard>
      </Stack>

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
