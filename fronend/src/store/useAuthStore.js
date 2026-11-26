import { create } from "zustand";
import { setUnauthorizedHandler } from "@/services/api";
import { loginRequest, requestMe } from "@/services/authService";

function readStoredToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

function persistToken(token) {
  try {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}

const useAuthStore = create((set) => ({
  token: readStoredToken(),
  user: null,
  isAuthenticated: false,
  loading: true,
  darkMode: (() => {
    try { return localStorage.getItem("dark") === "true"; }
    catch { return false; }
  })(),

  toggleDarkMode: () => set((state) => {
    const darkMode = !state.darkMode;
    try { localStorage.setItem("dark", String(darkMode)); } catch { /* ignore unavailable storage */ }
    return { darkMode };
  }),

  setSession: ({ token, user }) => {
    persistToken(token);
    set({ token, user, isAuthenticated: Boolean(token && user), loading: false });
  },

  login: async (credentials) => {
    const result = await loginRequest(credentials);
    if (!result.token || !result.user) {
      throw new Error("The authentication server returned an incomplete login response.");
    }
    persistToken(result.token);
    set({ token: result.token, user: result.user, isAuthenticated: true, loading: false });
    return result.user;
  },

  hydrateSession: async () => {
    const token = readStoredToken();
    if (!token) {
      set({ token: null, user: null, isAuthenticated: false, loading: false });
      return null;
    }

    try {
      const user = await requestMe();
      // Only commit hydrated session if no newer login/logout overwrote the token mid-flight.
      if (readStoredToken() !== token) return null;
      set({ token, user, isAuthenticated: true, loading: false });
      return user;
    } catch (error) {
      if (readStoredToken() === token) {
        if (error?.status === 401 || error?.status === 403) {
          persistToken(null);
        }
        set({
          token: error?.status === 401 || error?.status === 403 ? null : token,
          user: null,
          isAuthenticated: false,
          loading: false,
        });
      }
      return null;
    }
  },

  logout: () => {
    persistToken(null);
    set({ token: null, user: null, isAuthenticated: false, loading: false });
  },
}));

setUnauthorizedHandler(() => {
  const { isAuthenticated, logout } = useAuthStore.getState();
  if (isAuthenticated) logout();
});

export default useAuthStore;
