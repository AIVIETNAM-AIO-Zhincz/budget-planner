import { useState } from "react";
import {
  AppBar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BuildingOffice2Icon,
  CheckIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronDownIcon,
  LanguageIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useColorMode } from "../theme/ColorModeContext.jsx";
import { setLanguage } from "../i18n/index.js";
import { useAuth } from "../auth/AuthContext.jsx";

/** Suy ra key tiêu đề trang từ pathname hiện tại. */
function titleKeyFromPath(pathname) {
  const map = {
    "/": "nav.dashboard",
    "/transactions": "nav.transactions",
    "/reports": "nav.reports",
    "/categories": "nav.categories",
    "/budgets": "nav.budgets",
    "/wallets": "nav.wallets",
    "/members": "nav.members",
    "/settings": "nav.settings",
  };
  return map[pathname] || "app.title";
}

/**
 * Thanh trên cùng: menu/thu gọn sidebar, tiêu đề trang, chuyển không gian,
 * đổi ngôn ngữ, toggle sáng/tối, thông báo, menu user (đăng xuất).
 */
export default function TopBar({ drawerWidth, collapsed, onToggleCollapsed, onOpenMobile }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { mode, toggle } = useColorMode();
  const { user, spaces, spaceId, selectSpace, logout } = useAuth();
  const isDark = mode === "dark";
  const nextLang = i18n.language === "en" ? "vi" : "en";

  const [spaceAnchor, setSpaceAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const currentSpace = spaces.find((s) => s.id === spaceId);

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
          <IconButton
            onClick={onToggleCollapsed}
            sx={{ display: { xs: "none", md: "inline-flex" } }}
            edge="start"
          >
            {collapsed ? <ChevronDoubleRightIcon width={20} /> : <ChevronDoubleLeftIcon width={20} />}
          </IconButton>
        </Tooltip>

        <Typography variant="h6" sx={{ fontWeight: 700, ml: 0.5 }}>
          {t(titleKeyFromPath(location.pathname))}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {/* Chuyển không gian */}
        <Button
          onClick={(e) => setSpaceAnchor(e.currentTarget)}
          startIcon={<BuildingOffice2Icon width={18} />}
          endIcon={<ChevronDownIcon width={16} />}
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            textTransform: "none",
            color: "text.primary",
            fontWeight: 600,
          }}
          className="no-hover-lift"
        >
          {currentSpace?.name || t("topbar.space")}
        </Button>
        <Menu
          anchorEl={spaceAnchor}
          open={Boolean(spaceAnchor)}
          onClose={() => setSpaceAnchor(null)}
        >
          {spaces.map((s) => (
            <MenuItem
              key={s.id}
              selected={s.id === spaceId}
              onClick={() => {
                selectSpace(s.id);
                setSpaceAnchor(null);
              }}
            >
              <ListItemIcon>{s.id === spaceId ? <CheckIcon width={18} /> : null}</ListItemIcon>
              {s.name}
              <Typography component="span" sx={{ ml: 1, fontSize: 11, color: "text.disabled" }}>
                {s.role}
              </Typography>
            </MenuItem>
          ))}
        </Menu>

        <Tooltip title={`${t("topbar.language")} · ${nextLang.toUpperCase()}`}>
          <IconButton onClick={() => setLanguage(nextLang)}>
            <Badge
              badgeContent={i18n.language.toUpperCase()}
              color="primary"
              sx={{ "& .MuiBadge-badge": { fontSize: 8, height: 14, minWidth: 14 } }}
            >
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

        {/* Menu tài khoản */}
        <Tooltip title={t("topbar.account")}>
          <IconButton onClick={(e) => setUserAnchor(e.currentTarget)}>
            <UserCircleIcon width={23} />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
              {user?.name || user?.email}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setUserAnchor(null);
              logout();
            }}
          >
            <ListItemIcon>
              <ArrowRightOnRectangleIcon width={18} />
            </ListItemIcon>
            {t("topbar.logout")}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
