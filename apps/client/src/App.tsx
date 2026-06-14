import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyPage from './pages/VerifyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import RoomPage from './pages/RoomPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import Navbar from './components/Navbar';

import PublicRoute from './routes/PublicRoute';

function AppContent() {
  const location = useLocation();
  // Hide Navbar when inside a room
  const showNavbar = !location.pathname.startsWith('/rooms/');

  return (
    <>
      {showNavbar && <Navbar />}
      <div style={{ paddingTop: showNavbar ? '64px' : '0px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          {/* Public routes (Redirect to dashboard if logged in) */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Legacy Next.js paths → redirect to new paths */}
          <Route path="/sign-in" element={<Navigate to="/login" replace />} />
          <Route path="/sign-up" element={<Navigate to="/signup" replace />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create-room" element={<CreateRoomPage />} />
            <Route path="/join-room" element={<JoinRoomPage />} />
            <Route path="/rooms/:roomId" element={<RoomPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
