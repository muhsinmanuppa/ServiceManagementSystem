import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ClientLayout from "./pages/client/ClientLayout";
import ProviderLayout from "./pages/provider/ProviderLayout";
import AdminLayout from "./pages/admin/AdminLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthGuard from "./components/AuthGuard";
import VerifyOtp from "./pages/auth/VerifyOtp";
import LoadingSpinner from "./components/LoadingSpinner";
import Notification from './components/Notification';  
import {
  validateLocalSession,
  validateSessionAsync,
} from "./store/slices/authSlice"; 

// Client module pages
import BookingDetail from "./pages/client/BookingDetail";

// Provider module pages

import AdminRoutes from './routes/AdminRoutes';
import ClientRoutes from './routes/ClientRoutes';  
import ProviderRoutes from './routes/ProviderRoutes';
import Home from "./pages/Home";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const defaultPath = getDefaultPath(user.role);
    return <Navigate to={defaultPath} />;
  }

  return children;
};

const getDefaultPath = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "provider":
      return "/provider";
    case "client":
      return "/client";
    default:
      return "/";
  }
};

const RootRedirect = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const path = getDefaultPath(user.role);
      navigate(path, { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return <LoadingSpinner />;
};

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // local session
    dispatch(validateLocalSession());
    // validate server
    dispatch(validateSessionAsync());
  }, [dispatch]);

  // router configuration
  const routerConfig = {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  };

  return (
    <ErrorBoundary>
      <Router {...routerConfig}>
        <Notification />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Client routes with layout */}
          <Route path="/client/*" element={
            <AuthGuard allowedRoles={["client"]}>
              <ClientLayout>
                <ClientRoutes />
              </ClientLayout>
            </AuthGuard>
          } />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public routes */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-otp" element={<VerifyOtp />} />

          {/* Protected routes with layouts */}
          <Route
            path="/admin/*"
            element={
              <AuthGuard allowedRoles={["admin"]}>
                <AdminLayout>
                  <AdminRoutes />
                </AdminLayout>
              </AuthGuard>
            }
          />

          <Route
            path="/client/*"
            element={
              <AuthGuard allowedRoles={["client"]}>
                <ClientLayout>
                  <ClientRoutes />
                </ClientLayout>
              </AuthGuard>
            }
          />

          <Route
            path="/provider/*"
            element={
              <AuthGuard allowedRoles={["provider"]}>
                <ProviderLayout>
                  <ProviderRoutes />
                </ProviderLayout>
              </AuthGuard>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />

          <Route path="/client/bookings/:id" element={<BookingDetail />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
