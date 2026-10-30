import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authService from "../services/authService";
import { AuthContext } from "./useAuth";
import {
  fetchCurrentUser,
  getRoles,
  isAdmin,
  isCustomer,
  isTourGuide,
  isTourManager,
  resolveRole,
} from "../services/roleAdapter";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => authService.getSession());
  const [isLoadingUser, setIsLoadingUser] = useState(() =>
    Boolean(authService.getSession()?.token),
  );

  useEffect(() => {
    let cancelled = false;
    // Google OAuth returns to the homepage with the token in the query
    // string; absorb it into the storage-backed session before hydrating.
    authService.absorbGoogleTokenFromUrl();
    const stored = authService.getSession();
    if (!stored?.token) {
      return undefined;
    }

    (async () => {
      try {
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
    const user = await fetchCurrentUser(next);
    const fullSession = user ? { ...next, user } : next;
    setSession(fullSession);
    return fullSession;
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    await authService.logout();
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    return {
      user,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token),
      isLoading: isLoadingUser,
      roles: getRoles(user),
      role: resolveRole(user),
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
