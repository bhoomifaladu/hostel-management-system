import { useState } from 'react';
import { BedDouble, Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';
import { FormModal, Heading, Modal, Notice, Page, useLoad, attempt, confirmThen } from '../components/ui';

const types = ['Shared', 'Standard', 'Deluxe'].map(t => ({ value: t, label: t }));
const addFields = [
  { name: 'roomNo', label: 'Room number', required: true, placeholder: 'e.g. 201' },
  { name: 'capacity', label: 'Capacity (beds)', type: 'number', min: 1, required: true },
  { name: 'roomType', label: 'Room type', type: 'select', options: types }];
const editFields = addFields.slice(1);

export default function Rooms() {
  const { data, error, reload } = useLoad(api.rooms);
  const [modal, setModal] = useState(null); // 'add' | {edit: room} | {view: roomDetail}
  async function view(r) { try { setModal({ view: await api.room(r.id) }); } catch (e) { alert(e.message); } }

  return <Page title="Rooms" subtitle="Capacity and bed availability." action={<button className="primary-btn" onClick={() => setModal('add')}><Plus size={17} /> Add room</button>}>
    <Notice onRetry={reload}>{error}</Notice>
    <div className="panel"><Heading title="Room Management" subtitle="Click a room to see its residents" />
      <div className="room-grid">{(data || []).map(r => <div className="room-card" key={r.id}>
        <div className="room-top"><strong>Room {r.roomNo}</strong><span className={r.occupied >= r.capacity ? 'full' : 'available'}>{r.occupied >= r.capacity ? 'Full' : 'Available'}</span></div>
        <button className="room-body" onClick={() => view(r)}><BedDouble size={25} className="room-icon" /><p>{r.roomType} room</p></button>
        <div className="bar-track"><div className="bar-blue" style={{ width: `${r.capacity ? r.occupied / r.capacity * 100 : 0}%` }} /></div>
        <small>{r.occupied} of {r.capacity} beds occupied</small>
        <div className="row-actions card-actions">
          <button aria-label="Edit room" onClick={() => setModal({ edit: r })}><Pencil size={14} /></button>
          <button aria-label="Delete room" className="danger" onClick={() => confirmThen(`Delete room ${r.roomNo}?`, () => attempt(() => api.deleteRoom(r.id), reload))}><Trash2 size={14} /></button></div>
      </div>)}</div>
      {data && !data.length && <p className="empty">No rooms yet. Add one to get started.</p>}
    </div>
    {modal === 'add' && <FormModal title="Add Room" fields={addFields} initial={{ capacity: 2, roomType: 'Shared' }} onClose={() => setModal(null)} onSubmit={async v => { await api.addRoom(v); await reload(); }} />}
    {modal?.edit && <FormModal title={`Edit Room ${modal.edit.roomNo}`} fields={editFields} initial={modal.edit} onClose={() => setModal(null)} onSubmit={async v => { await api.updateRoom(modal.edit.id, v); await reload(); }} />}
    {modal?.view && <Modal title={`Room ${modal.view.roomNo}`} subtitle={`${modal.view.roomType} · ${modal.view.occupied}/${modal.view.capacity} beds`} onClose={() => setModal(null)}>
      {modal.view.students.length ? <ul className="plain-list">{modal.view.students.map(s => <li key={s.id}><strong>{s.fullName}</strong><span>{s.course}</span></li>)}</ul> : <p className="empty">No residents in this room.</p>}</Modal>}
  </Page>;
}
