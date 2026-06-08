import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { BanknotesIcon } from "@heroicons/react/24/solid";
import { navSections } from "../constants/nav.js";

export const DRAWER_WIDTH = 256;
export const COLLAPSED_WIDTH = 76;

/** Logo + tên app ở đầu sidebar. */
function Brand({ collapsed }) {
  const { t } = useTranslation();
  return (
    <Toolbar sx={{ minHeight: 70, gap: 1.25, px: collapsed ? 0 : 2.5, justifyContent: collapsed ? "center" : "flex-start" }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <BanknotesIcon width={22} />
      </Box>
      {!collapsed && (
        <Box sx={{ overflow: "hidden" }}>
          <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>
            {t("app.title")}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
            {t("app.subtitle")}
          </Typography>
        </Box>
      )}
    </Toolbar>
  );
}

/** Nội dung điều hướng (dùng chung cho drawer desktop & mobile). */
function SidebarContent({ collapsed, onNavigate }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const go = (path) => {
    navigate(path);
    if (onNavigate) onNavigate();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Brand collapsed={collapsed} />
      <Box sx={{ flex: 1, overflowY: "auto", px: collapsed ? 1 : 1.5, pb: 2 }}>
        {navSections.map((section) => (
          <Box key={section.titleKey} sx={{ mt: 1.5 }}>
            {!collapsed && (
              <Typography
                variant="overline"
                sx={{ px: 1.5, color: "text.disabled", display: "block", mb: 0.5 }}
              >
                {t(section.titleKey)}
              </Typography>
            )}
            <List dense disablePadding sx={{ display: "grid", gap: 0.25 }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const button = (
                  <ListItemButton
                    key={item.path}
                    onClick={() => go(item.path)}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      minHeight: 44,
                      justifyContent: collapsed ? "center" : "flex-start",
                      px: collapsed ? 0 : 1.5,
                      color: active ? "primary.main" : "text.secondary",
                      "&.Mui-selected": {
                        backgroundColor: "rgba(99, 102, 241, 0.12)",
                        "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.18)" },
                      },
                      "&:hover": { color: "text.primary" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? 0 : 36,
                        color: "inherit",
                        justifyContent: "center",
                      }}
                    >
                      <Icon width={21} />
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={t(item.labelKey)}
                        primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }}
                      />
                    )}
                  </ListItemButton>
                );
                return collapsed ? (
                  <Tooltip key={item.path} title={t(item.labelKey)} placement="right">
                    {button}
                  </Tooltip>
                ) : (
                  button
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Sidebar: Drawer permanent (desktop, thu gọn được) + temporary (mobile).
 *
 * @param {{collapsed:boolean, mobileOpen:boolean, onMobileClose:()=>void}} props
 */
export default function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  const width = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const paperSx = (theme) => ({
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    boxShadow:
      theme.palette.mode === "dark"
        ? "4px 0 24px rgba(0,0,0,0.35)"
        : "4px 0 24px rgba(0,0,0,0.02)",
    transition: theme.transitions.create("width", {
      duration: theme.transitions.duration.short,
    }),
    overflowX: "hidden",
  });

  return (
    <>
      {/* Desktop */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width, ...{}, boxSizing: "border-box" },
        }}
        PaperProps={{ sx: paperSx }}
      >
        <SidebarContent collapsed={collapsed} />
      </Drawer>

      {/* Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}
        PaperProps={{ sx: paperSx }}
      >
        <SidebarContent collapsed={false} onNavigate={onMobileClose} />
      </Drawer>
    </>
  );
}
