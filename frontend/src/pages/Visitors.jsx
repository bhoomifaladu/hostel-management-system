import { useState } from 'react';
import { Plus, LogOut, Trash2 } from 'lucide-react';
import { api } from '../api';
import { FormModal, Heading, Notice, Page, Table, Status, useLoad, attempt, confirmThen, fmtDateTime } from '../components/ui';

export default function Visitors() {
  const { data, error, reload } = useLoad(api.visitors);
  const students = useLoad(() => api.students('', 'Active'));
  const [open, setOpen] = useState(false);
  const options = [{ value: '', label: 'Select student' }, ...(students.data || []).map(s => ({ value: s.id, label: `${s.fullName}${s.roomNo ? ` (Room ${s.roomNo})` : ''}` }))];

  return <Page title="Visitors" subtitle="Log visitor check-in and check-out." action={<button className="primary-btn" onClick={() => setOpen(true)}><Plus size={17} /> Check in visitor</button>}>
    <Notice onRetry={reload}>{error}</Notice>
    <div className="panel"><Heading title="Visitor Log" subtitle="Most recent first" />
      <Table rows={data || []} empty="No visitors logged." columns={[
        { label: 'Visitor', render: v => <><strong>{v.visitorName}</strong><br /><small>{[v.relation, v.phone].filter(Boolean).join(' · ')}</small></> },
        { label: 'Visiting', key: 'studentName' }, { label: 'Purpose', render: v => v.purpose || '—' },
        { label: 'In', render: v => fmtDateTime(v.checkIn) }, { label: 'Out', render: v => v.checkOut ? fmtDateTime(v.checkOut) : <Status value="Inside" /> },
        { label: 'Actions', render: v => <div className="row-actions">
          {!v.checkOut && <button title="Check out" aria-label="Check out" onClick={() => attempt(() => api.checkoutVisitor(v.id), reload)}><LogOut size={14} /></button>}
          <button aria-label="Delete" className="danger" onClick={() => confirmThen('Delete this visitor record?', () => attempt(() => api.deleteVisitor(v.id), reload))}><Trash2 size={14} /></button></div> }]} /></div>
    {open && <FormModal title="Check in visitor" submitLabel="Check in" fields={[
      { name: 'studentId', label: 'Student being visited', type: 'select', required: true, options }, { name: 'visitorName', label: 'Visitor name', required: true },
      { name: 'relation', label: 'Relation', placeholder: 'e.g. Father' }, { name: 'phone', label: 'Phone' }, { name: 'purpose', label: 'Purpose' }]}
      onClose={() => setOpen(false)} onSubmit={async v => { await api.addVisitor(v); await reload(); }} />}
  </Page>;
}
