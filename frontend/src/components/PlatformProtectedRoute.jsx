import { Navigate } from 'react-router-dom';

export default function PlatformProtectedRoute({ children }) {
  const token = localStorage.getItem('platformAccessToken');

  if (!token) {
    return <Navigate to="/platform/login" />;
  }

  return children;
}
