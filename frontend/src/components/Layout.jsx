import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Users, BedDouble, CreditCard, ClipboardCheck, MessageSquare, UserRound, Utensils, CalendarDays, ShieldCheck, FileBarChart, Menu, X, Search, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../auth';

export const NAV = [
  ['Dashboard', '/', LayoutDashboard], ['Students', '/students', Users], ['Rooms', '/rooms', BedDouble], ['Fees', '/fees', CreditCard],
  ['Attendance', '/attendance', ClipboardCheck], ['Complaints', '/complaints', MessageSquare], ['Visitors', '/visitors', UserRound],
  ['Mess Management', '/mess', Utensils], ['Leave Requests', '/leaves', CalendarDays], ['Staff', '/staff', ShieldCheck], ['Reports', '/reports', FileBarChart]
];

export default function Layout() {
  const [mobile, setMobile] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const current = NAV.find(([, p]) => (p === '/' ? loc.pathname === '/' : loc.pathname.startsWith(p)))?.[0] || 'Dashboard';
  const initials = (user?.name || 'AD').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return <div className="app">
    {mobile && <button className="overlay" aria-label="Close navigation" onClick={() => setMobile(false)} />}
    <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-logo"><Home size={23} /></div><div><h2>Hostel<span>Hub</span></h2><p>Stay. Learn. Grow.</p></div>
        <button className="close-menu" aria-label="Close menu" onClick={() => setMobile(false)}><X /></button></div>
      <p className="nav-label">MAIN MENU</p>
      <nav>{NAV.map(([label, path, Icon]) =>
        <NavLink key={path} to={path} end={path === '/'} onClick={() => setMobile(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <button className="nav-item logout" onClick={logout}><LogOut size={18} /><span>Logout</span></button>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="topbar-left"><button className="menu-toggle" aria-label="Open menu" onClick={() => setMobile(true)}><Menu /></button>
          <div className="breadcrumb">Workspace <span>/</span> {current}</div></div>
        <div className="topbar-right">
          <label className="search-box"><Search size={17} /><input placeholder="Search students..." onKeyDown={e => { if (e.key === 'Enter') { nav('/students?search=' + encodeURIComponent(e.target.value)); e.target.value = ''; } }} /></label>
          <button className="bell" aria-label="Notifications" onClick={() => nav('/complaints')}><Bell size={20} /></button>
          <div className="admin"><div className="admin-avatar">{initials}</div><div><strong>{user?.name}</strong><small>{user?.role}</small></div></div>
        </div>
      </header>
      <div className="content"><Outlet /><footer><span>© 2026 HostelHub</span><span className="footer-status">● Hostel management system</span></footer></div>
    </main>
  </div>;
}
