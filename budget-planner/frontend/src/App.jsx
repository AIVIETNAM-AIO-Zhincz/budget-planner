import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import RequireAuth from "./auth/RequireAuth.jsx";
import AppLayout from "./layout/AppLayout.jsx";

// Lazy-load từng trang để tách bundle (đặc biệt echarts chỉ tải khi vào trang biểu đồ).
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Transactions = lazy(() => import("./pages/Transactions.jsx"));
const Assistant = lazy(() => import("./pages/Assistant.jsx"));
const Categories = lazy(() => import("./pages/Categories.jsx"));
const Budgets = lazy(() => import("./pages/Budgets.jsx"));
const Wallets = lazy(() => import("./pages/Wallets.jsx"));
const Recurring = lazy(() => import("./pages/Recurring.jsx"));
const Goals = lazy(() => import("./pages/Goals.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const Members = lazy(() => import("./pages/Members.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

/** Fallback khi đang tải chunk của trang. */
function PageLoader() {
  return (
    <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
      <CircularProgress />
    </Box>
  );
}

/** Bọc một phần tử trong Suspense. */
function lazyEl(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

/** Router của ứng dụng: trang auth công khai + nhóm app cần đăng nhập. */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={lazyEl(<Login />)} />
      <Route path="/register" element={lazyEl(<Register />)} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={lazyEl(<Dashboard />)} />
          <Route path="transactions" element={lazyEl(<Transactions />)} />
          <Route path="assistant" element={lazyEl(<Assistant />)} />
          <Route path="categories" element={lazyEl(<Categories />)} />
          <Route path="budgets" element={lazyEl(<Budgets />)} />
          <Route path="wallets" element={lazyEl(<Wallets />)} />
          <Route path="recurring" element={lazyEl(<Recurring />)} />
          <Route path="goals" element={lazyEl(<Goals />)} />
          <Route path="reports" element={lazyEl(<Reports />)} />
          <Route path="members" element={lazyEl(<Members />)} />
          <Route path="settings" element={lazyEl(<Settings />)} />
          <Route path="*" element={lazyEl(<NotFound />)} />
        </Route>
      </Route>
    </Routes>
  );
}
