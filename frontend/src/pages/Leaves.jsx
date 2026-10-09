import { useState } from 'react';
import { Plus, Check, X, Trash2 } from 'lucide-react';
import { api } from '../api';
import { FormModal, Heading, Notice, Page, Table, Status, useLoad, attempt, confirmThen, fmtDate, today } from '../components/ui';

export default function Leaves() {
  const [filter, setFilter] = useState('');
  const { data, error, reload } = useLoad(() => api.leaves(filter), [filter]);
  const students = useLoad(() => api.students('', 'Active'));
  const [open, setOpen] = useState(false);
  const options = [{ value: '', label: 'Select student' }, ...(students.data || []).map(s => ({ value: s.id, label: s.fullName }))];
  const set = (id, status) => attempt(() => api.setLeaveStatus(id, status), reload);

  return <Page title="Leave Requests" subtitle="Review and approve leave." action={<button className="primary-btn" onClick={() => setOpen(true)}><Plus size={17} /> New request</button>}>
    <Notice onRetry={reload}>{error}</Notice>
    <div className="panel"><Heading title="Leave Register" subtitle="Approve or reject pending requests" action={
      <select className="inline-search" value={filter} onChange={e => setFilter(e.target.value)}><option value="">All statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option></select>} />
      <Table rows={data || []} empty="No leave requests." columns={[
        { label: 'Student', key: 'studentName' }, { label: 'From', render: l => fmtDate(l.fromDate) }, { label: 'To', render: l => fmtDate(l.toDate) },
        { label: 'Reason', key: 'reason' }, { label: 'Status', render: l => <Status value={l.status} /> },
        { label: 'Actions', render: l => <div className="row-actions">
          {l.status === 'Pending' && <><button title="Approve" aria-label="Approve" onClick={() => set(l.id, 'Approved')}><Check size={14} /></button>
            <button title="Reject" aria-label="Reject" className="danger" onClick={() => set(l.id, 'Rejected')}><X size={14} /></button></>}
          <button aria-label="Delete" className="danger" onClick={() => confirmThen('Delete this request?', () => attempt(() => api.deleteLeave(l.id), reload))}><Trash2 size={14} /></button></div> }]} /></div>
    {open && <FormModal title="New Leave Request" fields={[
      { name: 'studentId', label: 'Student', type: 'select', required: true, options }, { name: 'fromDate', label: 'From', type: 'date', required: true },
      { name: 'toDate', label: 'To', type: 'date', required: true }, { name: 'reason', label: 'Reason', required: true }]}
      initial={{ fromDate: today(), toDate: today() }} onClose={() => setOpen(false)} onSubmit={async v => { await api.addLeave(v); await reload(); }} />}
  </Page>;
}
