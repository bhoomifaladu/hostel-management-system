import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { FormModal, Heading, Notice, Page, Table, Status, useLoad, attempt, confirmThen, fmtDate } from '../components/ui';

const fields = [
  { name: 'fullName', label: 'Full name', required: true, placeholder: 'Student name' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'student@example.com' },
  { name: 'phone', label: 'Phone', placeholder: 'Phone number' },
  { name: 'course', label: 'Course / Year', required: true, placeholder: 'e.g. MCA (1st Year)' },
  { name: 'roomNo', label: 'Room number', placeholder: 'e.g. 101 (leave empty if unallocated)' }
];
const editFields = [...fields, { name: 'status', label: 'Status', type: 'select', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive (releases bed)' }] }];

export default function Students() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const { data, error, loading, reload } = useLoad(() => api.students(search), [search]);
  const [modal, setModal] = useState(null); // null | 'add' | student

  return <Page title="Students" subtitle="Search and manage residents." action={<button className="primary-btn" onClick={() => setModal('add')}><Plus size={17} /> Add student</button>}>
    <Notice onRetry={reload}>{error}</Notice>
    <div className="panel"><Heading title="Student Records" subtitle="Search by name, course or room" action={
      <input className="inline-search" placeholder="Search…" value={search} onChange={e => setParams(e.target.value ? { search: e.target.value } : {})} />} />
      {loading && !data ? <p className="loading">Loading…</p> : <Table rows={data || []} columns={[
        { label: 'Student', render: s => <div className="student-name"><div className="student-avatar">{s.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div><div><strong>{s.fullName}</strong><br /><small>{s.email || s.phone || ''}</small></div></div> },
        { label: 'Course', key: 'course' }, { label: 'Admitted', render: s => fmtDate(s.admissionDate) },
        { label: 'Room', render: s => <span className="room-tag">{s.roomNo || 'Unallocated'}</span> },
        { label: 'Status', render: s => <Status value={s.status} /> },
        { label: 'Actions', render: s => <div className="row-actions">
          <button aria-label="Edit" onClick={() => setModal(s)}><Pencil size={14} /></button>
          <button aria-label="Delete" className="danger" onClick={() => confirmThen(`Delete ${s.fullName}? Their fees and attendance are also removed.`, () => attempt(() => api.deleteStudent(s.id), reload))}><Trash2 size={14} /></button></div> }]} />}
    </div>
    {modal === 'add' && <FormModal title="Add Student" subtitle="Enter the student's details." fields={fields} submitLabel="Save Student" onClose={() => setModal(null)} onSubmit={async v => { await api.addStudent(v); await reload(); }} />}
    {modal && modal !== 'add' && <FormModal title="Edit Student" fields={editFields} initial={{ ...modal, roomNo: modal.roomNo || '' }} onClose={() => setModal(null)} onSubmit={async v => { await api.updateStudent(modal.id, v); await reload(); }} />}
  </Page>;
}
