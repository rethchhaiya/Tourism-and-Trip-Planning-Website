import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authService from "../services/authService";
import { AuthContext } from "./useAuth";
import {
  extractRole,
  fetchCurrentUser,
  isAdmin,
  isCustomer,
  isTourGuide,
  isTourManager,
} from "../services/roleAdapter";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => authService.getSession());
  const [isLoadingUser, setIsLoadingUser] = useState(() =>
    Boolean(authService.getSession()?.token),
  );

  useEffect(() => {
    let cancelled = false;
    const stored = authService.getSession();
    if (!stored?.token) {
      return undefined;
    }

    (async () => {
      try {
        // TODO(role-source): placeholder adapter — loads the user (incl. role)
        // from the stored session. Swap to GET /auth/me inside
        // fetchCurrentUser once the backend decides option (b).
        const user = await fetchCurrentUser(stored);
        if (cancelled) {
          return;
        }
        if (user) {
          const next = { ...stored, user };
          authService.persistSession(next);
          setSession(next);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUser(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const next = await authService.login(credentials);
    // TODO(role-source): if the backend picks option (a), the role is already
    // part of next.user; if option (b), call fetchCurrentUser(next) here to
    // hydrate the full user before storing it in state.
    const user = await fetchCurrentUser(next);
    const fullSession = user ? { ...next, user } : next;
    setSession(fullSession);
    return fullSession;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    return {
      user,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      isLoading: isLoadingUser,
      role: extractRole(user),
      isAdmin: isAdmin(user),
      isTourManager: isTourManager(user),
      isTourGuide: isTourGuide(user),
      isCustomer: isCustomer(user),
      login,
      logout,
    };
  }, [session, isLoadingUser, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
