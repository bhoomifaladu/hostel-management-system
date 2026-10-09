import { useCallback, useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));
// API dates arrive as 'YYYY-MM-DD' / 'YYYY-MM-DD HH:MM:SS' strings; parse date-only values as local to avoid day shifts.
const parse = d => new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? d + 'T00:00:00' : String(d).replace(' ', 'T'));
export const fmtDate = d => (d ? parse(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = d => (d ? parse(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
// Value for <input type="date"> from an API date.
export const toInputDate = d => (d ? String(d).slice(0, 10) : '');

// Load data from the API and expose reload(). `fn` should be stable (wrap in useCallback or pass deps).
export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => { setLoading(true); return fn().then(d => { setData(d); setError(''); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, deps);
  useEffect(() => { run(); }, [run]);
  return { data, error, loading, reload: run };
}

export function Heading({ title, subtitle, action }) {
  return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>;
}

export function Stat({ title, value, icon, tone, caption }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-info"><span>{title}</span><strong>{value}</strong><small>{caption}</small></div></article>;
}

export function Notice({ children, onRetry }) {
  if (!children) return null;
  return <div className="notice"><AlertCircle size={17} />{children}{onRetry && <button onClick={onRetry}>Retry</button>}</div>;
}

export function Status({ value }) {
  const cls = String(value).toLowerCase().replace(/\s+/g, '-');
  return <span className={`status ${cls}`}>{value}</span>;
}

export function Page({ title, subtitle, action, children }) {
  return <>
    <div className="page-title"><div><p className="eyebrow">HOSTEL ADMINISTRATION</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>{action}</div>
    {children}
  </>;
}

export function Table({ columns, rows, empty = 'No records found.' }) {
  return <div className="table-wrap"><table>
    <thead><tr>{columns.map(c => <th key={c.label}>{c.label}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={r.id ?? i}>{columns.map(c => <td key={c.label}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
  </table>{!rows.length && <p className="empty">{empty}</p>}</div>;
}

export function Modal({ title, subtitle, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="close-modal" aria-label="Close" onClick={onClose}><X /></button></div>
      {children}
    </div>
  </div>;
}

/**
 * Generic form dialog.
 * fields: [{ name, label, type='text'|'email'|'number'|'date'|'select'|'textarea', required, options:[{value,label}], placeholder }]
 */
export function FormModal({ title, subtitle, fields, initial = {}, submitLabel = 'Save', onSubmit, onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = Object.fromEntries(fields.map(f => [f.name, String(fd.get(f.name) ?? '').trim()]));
    setBusy(true); setErr('');
    try { await onSubmit(values); onClose(); } catch (ex) { setErr(ex.message); setBusy(false); }
  }
  return <Modal title={title} subtitle={subtitle} onClose={onClose}>
    <form onSubmit={submit}>
      {fields.map(f => <label key={f.name}>{f.label}{f.required && ' *'}
        {f.type === 'select'
          ? <select name={f.name} required={f.required} defaultValue={initial[f.name] ?? ''}>{f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          : f.type === 'textarea'
            ? <textarea name={f.name} required={f.required} rows={3} defaultValue={initial[f.name] ?? ''} placeholder={f.placeholder} />
            : <input name={f.name} type={f.type || 'text'} required={f.required} min={f.min} step={f.step} defaultValue={initial[f.name] ?? ''} placeholder={f.placeholder} />}
      </label>)}
      {err && <p className="form-error">{err}</p>}
      <div className="modal-actions">
        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
        <button className="primary-btn" type="submit" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  </Modal>;
}

// Small helper: run an async action, show errors in an alert.
export async function attempt(fn, after) {
  try { await fn(); if (after) await after(); } catch (e) { alert(e.message); }
}
export const confirmThen = (msg, fn) => { if (window.confirm(msg)) fn(); };
