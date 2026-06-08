import {
  AppBar,
  Badge,
  Box,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  Bars3Icon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  LanguageIcon,
} from "@heroicons/react/24/outline";
import { useColorMode } from "../theme/ColorModeContext.jsx";
import { setLanguage } from "../i18n/index.js";
import { SPACE_ID } from "../api/client.js";

/** Suy ra key tiêu đề trang từ pathname hiện tại. */
function titleKeyFromPath(pathname) {
  const map = {
    "/": "nav.dashboard",
    "/transactions": "nav.transactions",
    "/reports": "nav.reports",
    "/categories": "nav.categories",
    "/budgets": "nav.budgets",
    "/members": "nav.members",
    "/settings": "nav.settings",
  };
  return map[pathname] || "app.title";
}

/**
 * Thanh trên cùng: nút menu/thu gọn sidebar, tiêu đề trang, badge không gian,
 * đổi ngôn ngữ, toggle sáng/tối, chuông thông báo.
 *
 * @param {{drawerWidth:number, collapsed:boolean, onToggleCollapsed:()=>void, onOpenMobile:()=>void}} props
 */
export default function TopBar({ drawerWidth, collapsed, onToggleCollapsed, onOpenMobile }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { mode, toggle } = useColorMode();
  const isDark = mode === "dark";
  const nextLang = i18n.language === "en" ? "vi" : "en";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="default"
      sx={(theme) => ({
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(["width", "margin"], {
          duration: theme.transitions.duration.short,
        }),
      })}
    >
      <Toolbar sx={{ minHeight: 70, gap: 1 }}>
        <IconButton onClick={onOpenMobile} sx={{ display: { md: "none" } }} edge="start">
          <Bars3Icon width={22} />
        </IconButton>
        <Tooltip title={t("topbar.toggleSidebar")}>
          <IconButton onClick={onToggleCollapsed} sx={{ display: { xs: "none", md: "inline-flex" } }} edge="start">
            {collapsed ? <ChevronDoubleRightIcon width={20} /> : <ChevronDoubleLeftIcon width={20} />}
          </IconButton>
        </Tooltip>

        <Typography variant="h6" sx={{ fontWeight: 700, ml: 0.5 }}>
          {t(titleKeyFromPath(location.pathname))}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Chip
          size="small"
          label={`${t("topbar.space")}: ${SPACE_ID}`}
          sx={{ display: { xs: "none", sm: "inline-flex" }, fontWeight: 600 }}
        />

        <Tooltip title={`${t("topbar.language")} · ${nextLang.toUpperCase()}`}>
          <IconButton onClick={() => setLanguage(nextLang)}>
            <Badge badgeContent={i18n.language.toUpperCase()} color="primary"
              sx={{ "& .MuiBadge-badge": { fontSize: 8, height: 14, minWidth: 14 } }}>
              <LanguageIcon width={21} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={t("topbar.toggleTheme")}>
          <IconButton onClick={toggle}>
            {isDark ? <SunIcon width={21} /> : <MoonIcon width={21} />}
          </IconButton>
        </Tooltip>

        <Tooltip title={t("topbar.notifications")}>
          <IconButton>
            <Badge color="error" variant="dot">
              <BellIcon width={21} />
            </Badge>
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
