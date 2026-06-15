import { createTheme } from "@mui/material/styles";
import { viVN as muiViVN, enUS as muiEnUS } from "@mui/material/locale";

/**
 * Dựng MUI theme cho Budget Planner theo design system InTraAI-WebTracking.
 * Token màu/typography/override được port để đồng bộ look-and-feel.
 *
 * @param {"light"|"dark"} mode chế độ màu.
 * @param {"vi"|"en"} language ngôn ngữ (dùng cho locale của MUI component).
 * @returns {import("@mui/material/styles").Theme}
 */
export function buildTheme(mode = "light", language = "vi") {
  const reducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const muiLocale = language === "en" ? muiEnUS : muiViVN;

  return createTheme(
    {
      palette: {
        mode,
        primary: { main: "#6366f1" },
        success: { main: "#10b981" },
        warning: { main: "#f59e0b" },
        error: { main: "#ef4444" },
        info: { main: "#2563eb" },
        background:
          mode === "dark"
            ? { default: "#0e1016", paper: "#171a22", subtle: "#21242f" }
            : { default: "#f8fafc", paper: "#ffffff", subtle: "#F4F6FA" },
        text:
          mode === "dark"
            ? { primary: "#ffffff", secondary: "#c9d1d9", disabled: "#94a3b8" }
            : { primary: "#0f172a", secondary: "#475569", disabled: "#94a3b8" },
        divider: mode === "dark" ? "#2a2f3a" : "#e2e8f0",
      },
      customShadows: {
        dialog:
          "0 24px 48px -12px rgba(15, 23, 42, 0.25), 0 8px 16px -8px rgba(15, 23, 42, 0.18)",
      },
      typography: {
        fontFamily: "'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: 16,
        htmlFontSize: 16,
        h1: { fontSize: 36, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.028em" },
        h2: { fontSize: 30, fontWeight: 800, lineHeight: 1.18, letterSpacing: "-0.024em" },
        h3: { fontSize: 24, fontWeight: 700, lineHeight: 1.22, letterSpacing: "-0.022em" },
        h4: { fontSize: 20, fontWeight: 700, lineHeight: 1.28, letterSpacing: "-0.018em" },
        h5: { fontSize: 18, fontWeight: 700, lineHeight: 1.32, letterSpacing: "-0.016em" },
        h6: { fontSize: 15, fontWeight: 700, lineHeight: 1.4, letterSpacing: "-0.012em" },
        subtitle1: { fontSize: 15, lineHeight: 1.6, letterSpacing: "-0.005em" },
        subtitle2: { fontSize: 14, lineHeight: 1.6, letterSpacing: "-0.005em" },
        body1: { fontSize: 15, lineHeight: 1.6, letterSpacing: "-0.005em" },
        body2: { fontSize: 14, lineHeight: 1.6, letterSpacing: "-0.005em" },
        caption: { fontSize: 13, lineHeight: 1.45, letterSpacing: "-0.002em" },
        overline: { fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" },
        button: { fontSize: 15, letterSpacing: "-0.005em", textTransform: "capitalize" },
      },
      transitions: {
        duration: {
          shortest: 100,
          shorter: 150,
          short: 200,
          standard: 250,
          complex: 300,
          enteringScreen: 225,
          leavingScreen: 195,
        },
        easing: {
          easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
          easeIn: "cubic-bezier(0.4, 0, 1, 1)",
          easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
          sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
        },
      },
      motion: { reducedMotion },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              fontFeatureSettings: "'kern' 1, 'liga' 1, 'calt' 1, 'ss01' 1",
              fontOpticalSizing: "auto",
            },
          },
        },
        MuiButton: {
          defaultProps: { disableElevation: true },
          styleOverrides: {
            root: ({ theme }) => ({
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 8,
              transition: theme.motion?.reducedMotion
                ? "none"
                : `transform ${theme.transitions.duration.shorter}ms ${theme.transitions.easing.easeOut}, box-shadow ${theme.transitions.duration.shorter}ms ${theme.transitions.easing.easeOut}`,
              "&:hover": theme.motion?.reducedMotion
                ? {}
                : { transform: "translateY(-1px)", boxShadow: theme.shadows[2] },
              "&:active": { transform: "translateY(0)" },
              '&.no-hover-lift:hover, &[data-no-hover-lift="true"]:hover': {
                transform: "none",
                boxShadow: "none",
              },
            }),
          },
        },
        MuiTextField: { defaultProps: { size: "small" } },
        MuiOutlinedInput: {
          styleOverrides: {
            // Viền rõ hơn (cả light/dark) cho dễ đọc, đạt độ tương phản tốt.
            notchedOutline: ({ theme }) => ({
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.23)"
                  : "rgba(15, 23, 42, 0.23)",
            }),
            root: ({ theme }) => ({
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.4)"
                    : "rgba(15, 23, 42, 0.42)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.mode === "dark" ? "#7eb8f7" : theme.palette.primary.main,
                borderWidth: 1.5,
              },
            }),
            // Placeholder rõ hơn (mặc định MUI quá mờ).
            input: { "&::placeholder": { opacity: 0.72 } },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: { fontSize: 12, fontWeight: 500, padding: "6px 10px", borderRadius: 6 },
          },
        },
        MuiIconButton: {
          // Vùng chạm to hơn cho nút icon nhỏ (dễ bấm, đạt chuẩn a11y).
          styleOverrides: {
            sizeSmall: { padding: 8 },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              fontWeight: 700,
              fontSize: 13,
              color: mode === "dark" ? "#94a3b8" : "#334155",
              letterSpacing: "-0.005em",
            },
            body: { fontSize: 13.5, color: mode === "dark" ? "#e2e8f0" : "#0f172a" },
          },
        },
        MuiChip: { styleOverrides: { root: { letterSpacing: 0 } } },
        MuiDialog: {
          styleOverrides: {
            paper: ({ theme }) => ({
              borderRadius: 12,
              boxShadow: theme.customShadows?.dialog ?? theme.shadows[24],
            }),
          },
        },
        MuiDialogTitle: {
          styleOverrides: {
            root: ({ theme }) => ({
              paddingLeft: theme.spacing(3),
              paddingRight: theme.spacing(3),
              paddingTop: theme.spacing(2),
              paddingBottom: theme.spacing(2),
              fontSize: 18,
            }),
          },
        },
        MuiDialogContent: {
          styleOverrides: {
            root: ({ theme }) => ({
              padding: theme.spacing(3),
              overflowY: "auto",
              ".MuiDialogTitle-root + &": { paddingTop: theme.spacing(3) },
            }),
          },
        },
        MuiDialogActions: {
          styleOverrides: {
            root: ({ theme }) => ({
              paddingLeft: theme.spacing(3),
              paddingRight: theme.spacing(3),
              paddingTop: theme.spacing(2),
              paddingBottom: theme.spacing(2),
              gap: theme.spacing(1),
              borderTop: `1px solid ${theme.palette.divider}`,
              justifyContent: "flex-end",
            }),
          },
        },
        MuiBackdrop: {
          styleOverrides: {
            root: ({ theme }) => {
              const reduced = theme.motion?.reducedMotion === true;
              return {
                backgroundColor: reduced ? "rgba(15, 23, 42, 0.45)" : "rgba(15, 23, 42, 0.55)",
                backdropFilter: reduced ? "none" : "blur(6px)",
                WebkitBackdropFilter: reduced ? "none" : "blur(6px)",
              };
            },
          },
        },
      },
    },
    muiLocale
  );
}

export default buildTheme;
