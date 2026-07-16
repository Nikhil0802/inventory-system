import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AcceptInvite from './pages/AcceptInvite';
import TeamMembers from './pages/TeamMembers';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Transactions from './pages/Transactions';
import Scan from './pages/Scan';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import ProfitDashboard from './pages/ProfitDashboard';
import PlatformLogin from './pages/PlatformLogin';
import PlatformDashboard from './pages/PlatformDashboard';
import PlatformOrgDetail from './pages/PlatformOrgDetail';
import ProtectedRoute from './components/ProtectedRoute';
import PlatformProtectedRoute from './components/PlatformProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes — no login needed */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* Protected routes — redirect to /login if no token */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <Items />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <Scan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profit"
          element={
            <ProtectedRoute>
              <ProfitDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamMembers />
            </ProtectedRoute>
          }
        />

        {/* Platform admin — separate portal, not linked from the customer app */}
        <Route path="/platform/login" element={<PlatformLogin />} />
        <Route
          path="/platform"
          element={
            <PlatformProtectedRoute>
              <PlatformDashboard />
            </PlatformProtectedRoute>
          }
        />
        <Route
          path="/platform/organizations/:id"
          element={
            <PlatformProtectedRoute>
              <PlatformOrgDetail />
            </PlatformProtectedRoute>
          }
        />

        {/* Default — redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Catch-all — redirect unknown URLs to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
