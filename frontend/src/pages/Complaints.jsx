import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import { FormModal, Heading, Notice, Page, Table, Status, useLoad, attempt, confirmThen, fmtDate } from '../components/ui';

export default function Complaints() {
  const [filter, setFilter] = useState('');
  const { data, error, reload } = useLoad(() => api.complaints(filter), [filter]);
  const students = useLoad(() => api.students());
  const [open, setOpen] = useState(false);
  const options = [{ value: '', label: 'Not linked to a student' }, ...(students.data || []).map(s => ({ value: s.id, label: s.fullName }))];

  return <Page title="Complaints" subtitle="Track and resolve resident issues." action={<button className="primary-btn" onClick={() => setOpen(true)}><Plus size={17} /> New complaint</button>}>
    <Notice onRetry={reload}>{error}</Notice>
    <div className="panel"><Heading title="Complaint Register" subtitle="Update status as work progresses" action={
      <select className="inline-search" value={filter} onChange={e => setFilter(e.target.value)}><option value="">All statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option></select>} />
      <Table rows={data || []} empty="No complaints." columns={[
        { label: 'Title', render: c => <><strong>{c.title}</strong><br /><small>{c.description}</small></> }, { label: 'Student', render: c => c.studentName || '—' },
        { label: 'Raised', render: c => fmtDate(c.createdAt) }, { label: 'Status', render: c => <Status value={c.status} /> },
        { label: 'Update', render: c => <select value={c.status} onChange={e => attempt(() => api.setComplaintStatus(c.id, e.target.value), reload)}><option>Open</option><option>In Progress</option><option>Resolved</option></select> },
        { label: '', render: c => <div className="row-actions"><button aria-label="Delete" className="danger" onClick={() => confirmThen('Delete this complaint?', () => attempt(() => api.deleteComplaint(c.id), reload))}><Trash2 size={14} /></button></div> }]} /></div>
    {open && <FormModal title="New Complaint" fields={[
      { name: 'studentId', label: 'Student', type: 'select', options }, { name: 'title', label: 'Title', required: true, placeholder: 'e.g. Fan not working' },
      { name: 'description', label: 'Details', type: 'textarea' }]} onClose={() => setOpen(false)} onSubmit={async v => { await api.addComplaint(v); await reload(); }} />}
  </Page>;
}
