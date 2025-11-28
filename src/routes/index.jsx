import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../shared/pages/LoginPage";
import AdminLayout from "../layouts/AdminLayout";
import AppLayout from "../layouts/AppLayout";
import RequireRole from "../providers/RequireRole";

import AdminRoutes from "./admin.routes";
import AppRoutes from "./app.routes";

const router = createBrowserRouter(
  [
    { path: "/", element: <LoginPage /> },

    {
      path: "/admin",
      element: (
        <RequireRole role="admin">
          <AdminLayout />
        </RequireRole>
      ),
      children: AdminRoutes,
    },

    {
      path: "/app",
      element: (
        <RequireRole role="learner">
          <AppLayout />
        </RequireRole>
      ),
      children: AppRoutes,
    },
  ],
  {
    // 🔥 여기 추가
    basename: "/cnapp", // 또는 import.meta.env.BASE_URL 써도 됨
    // basename: import.meta.env.BASE_URL.replace(/\/$/, ""),
  }
);

export default router;
