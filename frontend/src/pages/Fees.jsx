import { useState } from 'react';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { api } from '../api';
import { FormModal, Heading, Notice, Page, Table, Status, useLoad, attempt, confirmThen, money, fmtDate, toInputDate } from '../components/ui';

export default function Fees() {
  const [filter, setFilter] = useState('');
  const { data, error, reload } = useLoad(() => api.fees(filter), [filter]);
  const students = useLoad(() => api.students());
  const [modal, setModal] = useState(null); // 'add' | {pay} | {edit}
  const studentOptions = [{ value: '', label: 'Select student' }, ...(students.data || []).map(s => ({ value: s.id, label: `${s.fullName} (${s.course})` }))];

  return <Page title="Fees" subtitle="Paid and outstanding amounts." action={<button className="primary-btn" onClick={() => setModal('add')}><Plus size={17} /> Add fee</button>}>
    <Notice onRetry={reload}>{error}</Notice>
    <div className="panel"><Heading title="Fee Records" subtitle="Record payments and track balances" action={
      <select className="inline-search" value={filter} onChange={e => setFilter(e.target.value)}><option value="">All statuses</option><option>Paid</option><option>Partial</option><option>Pending</option></select>} />
      <Table rows={data || []} empty="No fee records available." columns={[
        { label: 'Student', key: 'studentName' }, { label: 'Amount', render: f => money(f.amount) }, { label: 'Paid', render: f => money(f.paidAmount) },
        { label: 'Balance', render: f => money(f.balance) }, { label: 'Due', render: f => fmtDate(f.dueDate) }, { label: 'Status', render: f => <Status value={f.status} /> },
        { label: 'Actions', render: f => <div className="row-actions">
          {f.status !== 'Paid' && <button aria-label="Record payment" title="Record payment" onClick={() => setModal({ pay: f })}><Wallet size={14} /></button>}
          <button aria-label="Edit" onClick={() => setModal({ edit: f })}><Pencil size={14} /></button>
          <button aria-label="Delete" className="danger" onClick={() => confirmThen('Delete this fee record?', () => attempt(() => api.deleteFee(f.id), reload))}><Trash2 size={14} /></button></div> }]} />
    </div>
    {modal === 'add' && <FormModal title="Add Fee" fields={[
      { name: 'studentId', label: 'Student', type: 'select', required: true, options: studentOptions },
      { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1, required: true },
      { name: 'paidAmount', label: 'Already paid (₹)', type: 'number', min: 0 }, { name: 'dueDate', label: 'Due date', type: 'date' }]}
      onClose={() => setModal(null)} onSubmit={async v => { await api.addFee(v); await reload(); }} />}
    {modal?.pay && <FormModal title="Record Payment" subtitle={`${modal.pay.studentName} · balance ${money(modal.pay.balance)}`} submitLabel="Record payment"
      fields={[{ name: 'amount', label: 'Payment amount (₹)', type: 'number', min: 1, required: true }]} onClose={() => setModal(null)}
      onSubmit={async v => { await api.payFee(modal.pay.id, Number(v.amount)); await reload(); }} />}
    {modal?.edit && <FormModal title="Edit Fee" subtitle={modal.edit.studentName} fields={[
      { name: 'amount', label: 'Amount (₹)', type: 'number', min: 1, required: true }, { name: 'dueDate', label: 'Due date', type: 'date' }]}
      initial={{ amount: modal.edit.amount, dueDate: toInputDate(modal.edit.dueDate) }} onClose={() => setModal(null)}
      onSubmit={async v => { await api.updateFee(modal.edit.id, v); await reload(); }} />}
  </Page>;
}
