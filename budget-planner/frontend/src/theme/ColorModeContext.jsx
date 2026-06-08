import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useTranslation } from "react-i18next";
import { buildTheme } from "./index.js";

const STORAGE_KEY = "bp-color-mode";

const ColorModeContext = createContext({ mode: "light", toggle: () => {} });

/** Hook lấy chế độ màu hiện tại + hàm toggle sáng/tối. */
export function useColorMode() {
  return useContext(ColorModeContext);
}

/** Đọc chế độ màu khởi tạo: localStorage → prefers-color-scheme → light. */
function getInitialMode() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/**
 * Provider gộp ColorMode + MUI ThemeProvider + CssBaseline.
 * Theme được dựng lại theo `mode` và ngôn ngữ hiện tại (i18n).
 */
export default function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);
  const { i18n } = useTranslation();
  const language = i18n.language === "en" ? "en" : "vi";

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const theme = useMemo(() => buildTheme(mode, language), [mode, language]);
  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
