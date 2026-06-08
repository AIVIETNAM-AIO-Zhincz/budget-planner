import { useCallback, useEffect, useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar, { DRAWER_WIDTH, COLLAPSED_WIDTH } from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

const COLLAPSE_KEY = "bp-sidebar-collapsed";

/**
 * Khung ứng dụng: Sidebar (trái) + TopBar (trên) + vùng nội dung <Outlet/>.
 * Trạng thái thu gọn sidebar lưu vào localStorage.
 */
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY) === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    }
  }, [collapsed]);

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const { spaceId } = useAuth();

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onMobileClose={closeMobile} />
      <TopBar
        drawerWidth={drawerWidth}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onOpenMobile={openMobile}
      />
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          transition: theme.transitions.create("width", {
            duration: theme.transitions.duration.short,
          }),
          minWidth: 0,
        })}
      >
        <Toolbar sx={{ minHeight: 70 }} />
        {/* key theo space → remount nội dung khi đổi không gian (tự refetch). */}
        <Box key={spaceId} sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
