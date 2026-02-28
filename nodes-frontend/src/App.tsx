import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/widgets/Layout";
import ProtectedRoute from "@/widgets/ProtectedRoute";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { lazy, Suspense } from "react";
import NodesListPage from "@/pages/NodesListPage";

// Ленивая загрузка страниц
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const CreateNodePage = lazy(() => import("@/pages/CreateNodePage"));
const EditNodePage = lazy(() => import("@/pages/EditNodePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));

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
    <ErrorBoundary>
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
              <Route
                path="graph"
                element={<div className="p-4">Graph Page (WIP)</div>}
              />
              <Route
                path="analytics"
                element={<div className="p-4">Analytics Page (WIP)</div>}
              />
              <Route
                path="profile"
                element={<div className="p-4">Profile Page (WIP)</div>}
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
  );
}

export default App;
