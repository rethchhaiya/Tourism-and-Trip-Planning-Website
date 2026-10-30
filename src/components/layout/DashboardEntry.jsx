import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import DashboardOverview from "../../pages/admin/dashboard/DashboardOverview";

// The dashboard shell is available to every authenticated role, but its
// overview metrics are reserved for administrators.
export default function DashboardEntry() {
  const { isAdmin } = useAuth();

  return isAdmin ? <DashboardOverview /> : <Navigate to="/bookings" replace />;
}
