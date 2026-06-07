import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Users from './pages/Users';
import DataManagement from './pages/DataManagement';

// Доступ лише автентифікованим; за потреби — лише певній ролі.
function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/groups" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/groups" replace /> : <Login />} />
      <Route path="/groups" element={<Protected><Groups /></Protected>} />
      <Route path="/groups/:id" element={<Protected><GroupDetail /></Protected>} />
      <Route path="/users" element={<Protected role="admin"><Users /></Protected>} />
      <Route path="/data" element={<Protected role="admin"><DataManagement /></Protected>} />
      <Route path="*" element={<Navigate to={user ? '/groups' : '/login'} replace />} />
    </Routes>
  );
}
