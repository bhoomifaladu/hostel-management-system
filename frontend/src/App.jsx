import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Rooms from './pages/Rooms';
import Fees from './pages/Fees';
import Attendance from './pages/Attendance';
import Complaints from './pages/Complaints';
import Visitors from './pages/Visitors';
import Mess from './pages/Mess';
import Leaves from './pages/Leaves';
import Staff from './pages/Staff';
import Reports from './pages/Reports';

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <p className="loading" style={{ padding: 30 }}>Loading…</p>;
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>;
  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<Dashboard />} />
      <Route path="students" element={<Students />} />
      <Route path="rooms" element={<Rooms />} />
      <Route path="fees" element={<Fees />} />
      <Route path="attendance" element={<Attendance />} />
      <Route path="complaints" element={<Complaints />} />
      <Route path="visitors" element={<Visitors />} />
      <Route path="mess" element={<Mess />} />
      <Route path="leaves" element={<Leaves />} />
      <Route path="staff" element={<Staff />} />
      <Route path="reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>;
}
