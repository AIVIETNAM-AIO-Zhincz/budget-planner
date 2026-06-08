import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

/** Guard: chặn route app khi chưa đăng nhập. */
export default function RequireAuth() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (status === "anon") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
