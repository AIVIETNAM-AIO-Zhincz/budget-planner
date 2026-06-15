import { useCallback, useEffect, useState } from "react";
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
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} from "../api/notifications.js";

/** Suy ra key tiêu đề trang từ pathname hiện tại. */
function titleKeyFromPath(pathname) {
  const map = {
    "/": "nav.dashboard",
    "/transactions": "nav.transactions",
    "/assistant": "nav.assistant",
    "/reports": "nav.reports",
    "/annual": "nav.annual",
    "/categories": "nav.categories",
    "/budgets": "nav.budgets",
    "/wallets": "nav.wallets",
    "/recurring": "nav.recurring",
    "/goals": "nav.goals",
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
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const currentSpace = spaces.find((s) => s.id === spaceId);

  // Đếm chưa đọc: lấy khi mount/đổi không gian + poll nhẹ 60s.
  const refreshUnread = useCallback(() => {
    unreadCount()
      .then((r) => setUnread(r?.count || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!spaceId) return undefined;
    refreshUnread();
    const id = setInterval(refreshUnread, 60000);
    return () => clearInterval(id);
  }, [spaceId, refreshUnread]);

  const openNotif = (e) => {
    setNotifAnchor(e.currentTarget);
    listNotifications()
      .then((r) => setNotifs(Array.isArray(r) ? r : []))
      .catch(() => setNotifs([]));
  };

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    try {
      await markRead(n.id);
    } catch {
      /* bỏ qua lỗi đánh dấu */
    }
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    refreshUnread();
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
    } catch {
      /* bỏ qua */
    }
    setNotifs((prev) => prev.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  };

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
          <Button
            onClick={() => setLanguage(nextLang)}
            startIcon={<LanguageIcon width={20} />}
            size="small"
            className="no-hover-lift"
            sx={{
              minWidth: 0,
              textTransform: "none",
              fontWeight: 700,
              color: "text.secondary",
              "& .MuiButton-startIcon": { mr: 0.5 },
            }}
          >
            {i18n.language.toUpperCase()}
          </Button>
        </Tooltip>

        <Tooltip title={t("topbar.toggleTheme")}>
          <IconButton onClick={toggle}>
            {isDark ? <SunIcon width={21} /> : <MoonIcon width={21} />}
          </IconButton>
        </Tooltip>

        <Tooltip title={t("topbar.notifications")}>
          <IconButton onClick={openNotif}>
            <Badge badgeContent={unread} color="error" max={99}>
              <BellIcon width={21} />
            </Badge>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          slotProps={{ paper: { sx: { width: 340, maxHeight: 440 } } }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{t("notifications.title")}</Typography>
            {notifs.some((n) => !n.is_read) && (
              <Button size="small" onClick={handleMarkAll} className="no-hover-lift">
                {t("notifications.markAll")}
              </Button>
            )}
          </Box>
          <Divider />
          {notifs.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {t("notifications.empty")}
              </Typography>
            </Box>
          ) : (
            notifs.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => handleMarkRead(n)}
                sx={{ whiteSpace: "normal", alignItems: "flex-start", py: 1 }}
              >
                <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                  {!n.is_read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "error.main",
                        mt: 0.7,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Box sx={{ minWidth: 0, ...(n.is_read ? { pl: "16px" } : {}) }}>
                    <Typography variant="body2" sx={{ fontWeight: n.is_read ? 400 : 600 }}>
                      {n.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {new Date(n.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))
          )}
        </Menu>

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
