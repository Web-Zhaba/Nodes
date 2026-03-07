import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/widgets/Layout";
import ProtectedRoute from "@/widgets/ProtectedRoute";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { lazy, Suspense } from "react";
import NodesListPage from "@/pages/NodesListPage";

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

function AuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {/* React Query Devtools для отладки кэша (только в dev) */}
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        
        {/* Toaster вынесен за пределы BrowserRouter для корректной работы уведомлений */}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className: "toast-notification",
          duration: 4000,
        }}
      />
      <BrowserRouter>
        <Suspense
          fallback={<div className="h-screen w-screen flex items-center justify-center animate-pulse">Загрузка Nodes...</div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<AuthRedirect />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

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
              <Route
                path="graph"
                element={<GraphPage />}
              />
              <Route
                path="analytics"
                element={<div className="p-4">Analytics Page (WIP)</div>}
              />

            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Analytics />
        <SpeedInsights />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
