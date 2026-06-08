import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuth,
  getAccessToken,
  getSpaceId,
  setSpace as persistSpace,
  setUnauthorizedHandler,
} from "../api/client.js";
import { getMe, login as apiLogin, register as apiRegister } from "../api/auth.js";
import { listSpaces } from "../api/spaces.js";

const AuthContext = createContext(null);

/** Hook truy cập trạng thái xác thực + hành động (login/register/logout/selectSpace). */
export function useAuth() {
  return useContext(AuthContext);
}

/** Provider quản lý phiên đăng nhập + không gian hiện tại. */
export default function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | authed | anon
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState(getSpaceId());

  /** Nạp user + spaces từ token hiện có, chọn không gian. */
  const loadSession = useCallback(async () => {
    const [me, sp] = [await getMe(), await listSpaces()];
    const list = Array.isArray(sp) ? sp : [];
    setUser(me);
    setSpaces(list);
    const saved = getSpaceId();
    const chosen = saved && list.some((s) => s.id === saved) ? saved : (list[0]?.id ?? null);
    persistSpace(chosen);
    setSpaceId(chosen);
    setStatus("authed");
  }, []);

  const resetToAnon = useCallback(() => {
    clearAuth();
    setUser(null);
    setSpaces([]);
    setSpaceId(null);
    setStatus("anon");
  }, []);

  const logout = useCallback(() => {
    resetToAnon();
    navigate("/login", { replace: true });
  }, [resetToAnon, navigate]);

  // Khi phiên hết hạn (refresh thất bại) → đăng xuất về /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetToAnon();
      navigate("/login", { replace: true });
    });
  }, [resetToAnon, navigate]);

  // Mount: nếu có token → nạp phiên; lỗi → anon.
  useEffect(() => {
    if (!getAccessToken()) {
      setStatus("anon");
      return;
    }
    loadSession().catch(() => resetToAnon());
  }, [loadSession, resetToAnon]);

  const login = useCallback(
    async (email, password) => {
      await apiLogin(email, password);
      await loadSession();
    },
    [loadSession]
  );

  const register = useCallback(
    async (payload) => {
      await apiRegister(payload);
      await apiLogin(payload.email, payload.password);
      await loadSession();
    },
    [loadSession]
  );

  const selectSpace = useCallback((id) => {
    persistSpace(id);
    setSpaceId(id);
  }, []);

  const value = useMemo(
    () => ({ status, user, spaces, spaceId, login, register, logout, selectSpace, reload: loadSession }),
    [status, user, spaces, spaceId, login, register, logout, selectSpace, loadSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
