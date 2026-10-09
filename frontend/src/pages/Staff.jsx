import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { FormModal, Heading, Notice, Page, Table, Status, useLoad, attempt, confirmThen } from '../components/ui';

const fields = [{ name: 'fullName', label: 'Full name', required: true }, { name: 'role', label: 'Role', required: true, placeholder: 'e.g. Warden' }, { name: 'phone', label: 'Phone' }];

export default function Staff() {
  const { data, error, reload } = useLoad(api.staff);
  const [modal, setModal] = useState(null); // 'add' | staff member

  return <Page title="Staff" subtitle="Hostel employees." action={<button className="primary-btn" onClick={() => setModal('add')}><Plus size={17} /> Add staff</button>}>
    <Notice onRetry={reload}>{error}</Notice>
    <div className="panel"><Heading title="Staff Directory" subtitle="Wardens, accountants, security and more" />
      <Table rows={data || []} empty="No staff added." columns={[
        { label: 'Name', key: 'fullName' }, { label: 'Role', key: 'role' }, { label: 'Phone', render: s => s.phone || '—' }, { label: 'Status', render: s => <Status value={s.status} /> },
        { label: 'Actions', render: s => <div className="row-actions"><button aria-label="Edit" onClick={() => setModal(s)}><Pencil size={14} /></button>
          <button aria-label="Delete" className="danger" onClick={() => confirmThen(`Delete ${s.fullName}?`, () => attempt(() => api.deleteStaff(s.id), reload))}><Trash2 size={14} /></button></div> }]} /></div>
    {modal === 'add' && <FormModal title="Add Staff" fields={fields} onClose={() => setModal(null)} onSubmit={async v => { await api.addStaff(v); await reload(); }} />}
    {modal && modal !== 'add' && <FormModal title="Edit Staff" initial={{ ...modal, phone: modal.phone || '' }} onClose={() => setModal(null)}
      fields={[...fields, { name: 'status', label: 'Status', type: 'select', options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] }]}
      onSubmit={async v => { await api.updateStaff(modal.id, v); await reload(); }} />}
  </Page>;
}
