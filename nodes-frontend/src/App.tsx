import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/widgets/Layout";
import ProtectedRoute from "@/widgets/ProtectedRoute";
import { useTranslation } from "react-i18next";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { lazy, Suspense, useEffect } from "react";

// Lazy-load devtools only in development to reduce production bundle
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() => import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })))
  : () => null;
import NodesListPage from "@/pages/NodesListPage";
import { useThemeStore } from "@/store/useThemeStore";
import { useMobileNavigation } from "@/hooks/useMobileNavigation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useStatusBarTheme } from "@/hooks/useStatusBarTheme";
import { useSyncManager } from "@/hooks/useSyncManager"

// IndexedDB persister for TanStack Query cache
const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key: string) => (await get<string>(key)) ?? null,
    setItem: async (key: string, value: string) => await set(key, value),
    removeItem: async (key: string) => await del(key),
  },
  key: "nodes-tanstack-cache",
  throttleTime: 1000,
});

// Create a client with offline-friendly defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours — keeps data for offline restart
      networkMode: "always", // Queue requests even when offline; retry when back
      retry: (failureCount) => failureCount < 3,
    },
    mutations: {
      retry: 3,
      networkMode: "always",
    },
  },
});

// Ленивая загрузка страниц
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const CreateNodePage = lazy(() => import("@/pages/CreateNodePage"));
const EditNodePage = lazy(() => import("@/pages/EditNodePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const GraphPage = lazy(() => import("@/pages/GraphPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const NotesPage = lazy(() => import("@/pages/NotesPage"));
const PublicGraphPage = lazy(() => import("@/pages/PublicGraphPage"));
const PublicNodePage = lazy(() => import("@/pages/PublicNodePage"));

function AppRouter() {
  const { t } = useTranslation();
  const location = useLocation();
  useMobileNavigation();
  useSyncManager();

  // Track page views in Google Analytics on route change
  useEffect(() => {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('config', 'G-D4PDMWV3T6', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return (
    <Suspense
      fallback={<div className="h-screen w-screen flex items-center justify-center animate-pulse">{t("common.loading")}</div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<AuthRedirect />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Neural Public Sharing — read-only, no auth required */}
        <Route path="/share/u/:slug" element={<PublicGraphPage />} />
        <Route path="/share/n/:token" element={<PublicNodePage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<NodesListPage />} />
          <Route path="nodes" element={<NodesListPage />} />
          <Route path="nodes/new" element={<CreateNodePage />} />
          <Route path="nodes/edit/:id" element={<EditNodePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="notes" element={<NotesPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function AuthRedirect() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

function App() {
  const applyTheme = useThemeStore((state) => state.applyTheme);
  const isOnline = useNetworkStatus();
  useStatusBarTheme();

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      <ErrorBoundary>
        {/* React Query Devtools для отладки кэша (только в dev) */}
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        
        {/* Offline banner */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center text-xs py-1 px-4 safe-top">
            Нет подключения к интернету
          </div>
        )}
        
        {/* Toaster вынесен за пределы Router для корректной работы уведомлений */}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className: "toast-notification",
          duration: 4000,
        }}
      />
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      </ErrorBoundary>
    </PersistQueryClientProvider>
  );
}

export default App;
