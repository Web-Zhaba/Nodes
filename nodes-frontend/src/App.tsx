import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/widgets/Layout";
import ProtectedRoute from "@/widgets/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import NotFoundPage from "@/pages/NotFoundPage";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
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
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
