import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { isAccessAllowed } from "../../routes/routeAccess";
import Forbidden from "./Forbidden";

export default function RequirePermission({
  permission,
  permissions,
  adminOnly = false,
  staff = false,
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (isLoading) {
    return null;
  }

  if (!isAccessAllowed(user, { permission, permissions, adminOnly, staff })) {
    return <Forbidden />;
  }

  return <Outlet />;
}
