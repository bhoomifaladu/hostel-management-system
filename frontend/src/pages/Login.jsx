import { useState } from 'react';
import { Home } from 'lucide-react';
import { useAuth } from '../auth';

export default function Login() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true); setError('');
    try { await login(fd.get('email'), fd.get('password')); } catch (ex) { setError(ex.message); setBusy(false); }
  }
  return <div className="login-page"><form className="login-card" onSubmit={submit}>
    <div className="brand-logo"><Home size={23} /></div>
    <h1>Hostel<span>Hub</span></h1>
    <p>Sign in to manage your hostel.</p>
    <label>Email<input name="email" type="email" required autoComplete="username" placeholder="admin@hostel.com" /></label>
    <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
    {import.meta.env.DEV && <p className="login-hint">Default login: <b>admin@hostel.com</b> / <b>admin123</b></p>}
    {error && <p className="form-error">{error}</p>}
    <button className="primary-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
  </form></div>;
}
