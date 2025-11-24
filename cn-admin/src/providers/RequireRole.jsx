import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireRole({ role: required, children }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div>로딩중...</div>;

  if (!user) return <Navigate to="/" replace />;

  if (role !== required) {
    return <Navigate to={role === "admin" ? "/admin" : "/app"} replace />;
  }

  return children;
}
