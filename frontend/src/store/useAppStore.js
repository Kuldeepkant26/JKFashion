import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      /**
       * Distinguishes "not signed in" from "haven't checked yet".
       *
       * Without it the route guard bounces an authenticated admin to the login
       * screen for one frame on every reload, before the session is restored.
       */
      isBootstrapping: true,

      setAuth: ({ user, accessToken }) =>
        set({ user, accessToken, isAuthenticated: !!user, isBootstrapping: false }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      finishBootstrap: () => set({ isBootstrapping: false }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isBootstrapping: false,
        }),

      // Sidebar collapse survives a reload — a control that resets itself is
      // indistinguishable from a broken one.
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    {
      name: 'jk-admin',

      /**
       * Exhaustive allowlist — anything omitted is forgotten on reload.
       *
       * accessToken MUST be here: without it a refresh restores
       * isAuthenticated:true with no token, so the panel looks signed in while
       * every request 401s.
       */
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
      }),

      // Persisted state means the session is already known, so the guard can
      // render immediately instead of flashing a spinner.
      onRehydrateStorage: () => (state) => state?.finishBootstrap?.(),
    }
  )
);

/** Non-reactive read, for use inside the axios interceptors. */
export const getAppState = () => useAppStore.getState();
