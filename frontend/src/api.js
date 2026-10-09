const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'hostelhub_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: t => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

async function request(method, path, body) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch { throw new Error('Cannot reach the server. Is the backend running?'); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const q = params => { const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString(); return s ? '?' + s : ''; };

// Download a CSV with the auth header (a plain link cannot send it).
async function download(path, filename) {
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
  if (!res.ok) throw new Error('Download failed');
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click(); URL.revokeObjectURL(url);
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  changePassword: b => request('POST', '/auth/change-password', b),

  dashboard: () => request('GET', '/dashboard'),

  students: (search = '', status = '') => request('GET', '/students' + q({ search, status })),
  addStudent: b => request('POST', '/students', b),
  updateStudent: (id, b) => request('PUT', `/students/${id}`, b),
  deleteStudent: id => request('DELETE', `/students/${id}`),

  rooms: () => request('GET', '/rooms'),
  room: id => request('GET', `/rooms/${id}`),
  addRoom: b => request('POST', '/rooms', b),
  updateRoom: (id, b) => request('PUT', `/rooms/${id}`, b),
  deleteRoom: id => request('DELETE', `/rooms/${id}`),

  fees: (status = '') => request('GET', '/fees' + q({ status })),
  addFee: b => request('POST', '/fees', b),
  updateFee: (id, b) => request('PUT', `/fees/${id}`, b),
  payFee: (id, amount) => request('POST', `/fees/${id}/payments`, { amount }),
  deleteFee: id => request('DELETE', `/fees/${id}`),

  attendance: date => request('GET', '/attendance' + q({ date })),
  saveAttendance: (date, records) => request('POST', '/attendance', { date, records }),
  attendanceSummary: month => request('GET', '/attendance/summary' + q({ month })),

  complaints: (status = '') => request('GET', '/complaints' + q({ status })),
  addComplaint: b => request('POST', '/complaints', b),
  setComplaintStatus: (id, status) => request('PATCH', `/complaints/${id}`, { status }),
  deleteComplaint: id => request('DELETE', `/complaints/${id}`),

  visitors: () => request('GET', '/visitors'),
  addVisitor: b => request('POST', '/visitors', b),
  checkoutVisitor: id => request('PATCH', `/visitors/${id}/checkout`),
  deleteVisitor: id => request('DELETE', `/visitors/${id}`),

  mess: () => request('GET', '/mess'),
  saveMeal: b => request('PUT', '/mess', b),
  deleteMeal: id => request('DELETE', `/mess/${id}`),

  leaves: (status = '') => request('GET', '/leaves' + q({ status })),
  addLeave: b => request('POST', '/leaves', b),
  setLeaveStatus: (id, status) => request('PATCH', `/leaves/${id}`, { status }),
  deleteLeave: id => request('DELETE', `/leaves/${id}`),

  staff: () => request('GET', '/staff'),
  addStaff: b => request('POST', '/staff', b),
  updateStaff: (id, b) => request('PUT', `/staff/${id}`, b),
  deleteStaff: id => request('DELETE', `/staff/${id}`),

  reportSummary: () => request('GET', '/reports/summary'),
  downloadFeeReport: () => download('/reports/fees.csv', 'fee-report.csv')
};
