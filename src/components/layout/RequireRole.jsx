import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { hasAnyRole } from "../../services/roleAdapter";
import Forbidden from "./Forbidden";

export default function RequireRole({ roles }) {
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

  if (!hasAnyRole(user, roles)) {
    return <Forbidden />;
  }

  return <Outlet />;
}
