import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/widgets/Layout";
import ProtectedRoute from "@/widgets/ProtectedRoute";
import { useTranslation } from "react-i18next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { lazy, Suspense, useEffect } from "react";
import NodesListPage from "@/pages/NodesListPage";
import { useThemeStore } from "@/store/useThemeStore";
import { useMobileNavigation } from "@/hooks/useMobileNavigation";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Не рефетчить при возврате на вкладку
      staleTime: 1000 * 60 * 5, // Кэш живет 5 минут
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
const PublicGraphPage = lazy(() => import("@/pages/PublicGraphPage"));
const PublicNodePage = lazy(() => import("@/pages/PublicNodePage"));

function AppRouter() {
  const { t } = useTranslation();
  useMobileNavigation();

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

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  return (
    <QueryClientProvider client={queryClient}>
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
      <HashRouter>
        <AppRouter />
      </HashRouter>
      <Analytics />
        <SpeedInsights />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
