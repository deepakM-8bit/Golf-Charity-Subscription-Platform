import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";

// ── pages ──
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Subscribe from "./pages/Subscribe.jsx";
import SubscribeSuccess from "./pages/SubscribeSuccess.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Charities from "./pages/Charities.jsx";
import CharityDetail from "./pages/CharityDetail.jsx";
import Draws from "./pages/Draws.jsx";

// ── admin pages ──
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminDraws from "./pages/admin/AdminDraws.jsx";
import AdminCharities from "./pages/admin/AdminCharities.jsx";
import AdminWinners from "./pages/admin/AdminWinners.jsx";

// ── protected route — requires auth ──
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

// ── subscriber route — requires active subscription ──
const SubscriberRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

// ── admin route — requires admin role ──
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      {/* ── public routes ── */}
      <Route path="/" element={<Landing />} />
      <Route path="/charities" element={<Charities />} />
      <Route path="/charities/:id" element={<CharityDetail />} />
      <Route path="/draws" element={<Draws />} />

      {/* ── auth routes ── */}
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
          ) : (
            <Auth />
          )
        }
      />

      {/* ── onboarding — after signup ── */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* ── subscription routes ── */}
      <Route path="/subscribe" element={<Subscribe />} />
      <Route
        path="/subscribe/success"
        element={
          <ProtectedRoute>
            <SubscribeSuccess />
          </ProtectedRoute>
        }
      />

      {/* ── subscriber dashboard ── */}
      <Route
        path="/dashboard"
        element={
          <SubscriberRoute>
            <Dashboard />
          </SubscriberRoute>
        }
      />

      {/* ── admin routes ── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/draws"
        element={
          <AdminRoute>
            <AdminDraws />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/charities"
        element={
          <AdminRoute>
            <AdminCharities />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/winners"
        element={
          <AdminRoute>
            <AdminWinners />
          </AdminRoute>
        }
      />

      {/* ── 404 ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid #3f3f46",
              fontFamily: "DM Sans, sans-serif",
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
