import { useEffect, useState } from 'react';
import { api } from '../api';
import { Heading, Notice, Page, Table, useLoad, attempt, today } from '../components/ui';

const OPTIONS = ['Present', 'Absent', 'On Leave'];

export default function Attendance() {
  const [date, setDate] = useState(today());
  const { data, error, reload } = useLoad(() => api.attendance(date), [date]);
  const month = date.slice(0, 7);
  const summary = useLoad(() => api.attendanceSummary(month), [month]);
  const [marks, setMarks] = useState({});
  const [saved, setSaved] = useState('');

  useEffect(() => { setMarks(Object.fromEntries((data || []).map(r => [r.studentId, r.status || '']))); setSaved(''); }, [data]);
  const setAll = status => setMarks(Object.fromEntries((data || []).map(r => [r.studentId, status])));
  const save = () => attempt(async () => {
    const records = Object.entries(marks).filter(([, s]) => s).map(([studentId, status]) => ({ studentId: Number(studentId), status }));
    if (!records.length) throw new Error('Mark at least one student first');
    await api.saveAttendance(date, records);
    setSaved(`Saved ${records.length} records`);
  }, () => { reload(); summary.reload(); });

  return <Page title="Attendance" subtitle="Mark daily attendance for active residents.">
    <Notice onRetry={reload}>{error || summary.error}</Notice>
    <div className="panel"><Heading title="Daily Attendance" subtitle="Choose a date and mark each student" action={<input className="inline-search" type="date" value={date} max={today()} onChange={e => e.target.value && setDate(e.target.value)} />} />
      <div className="toolbar"><button className="secondary-btn" onClick={() => setAll('Present')}>Mark all present</button>
        <button className="primary-btn" onClick={save}>Save attendance</button>{saved && <span className="saved">{saved}</span>}</div>
      <Table rows={(data || []).map(r => ({ ...r, id: r.studentId }))} empty="No active students." columns={[
        { label: 'Student', key: 'studentName' }, { label: 'Room', render: r => <span className="room-tag">{r.roomNo || '—'}</span> },
        { label: 'Attendance', render: r => <div className="seg">{OPTIONS.map(o => <button key={o} type="button" className={marks[r.studentId] === o ? `on ${o.replace(' ', '-').toLowerCase()}` : ''} onClick={() => setMarks(m => ({ ...m, [r.studentId]: o }))}>{o}</button>)}</div> }]} /></div>
    <div className="panel" style={{ marginTop: 18 }}><Heading title="Monthly Summary" subtitle={`Totals for ${month}`} />
      <Table rows={(summary.data || []).map(r => ({ ...r, id: r.studentId }))} columns={[
        { label: 'Student', key: 'studentName' }, { label: 'Present', key: 'present' }, { label: 'Absent', key: 'absent' }, { label: 'On leave', key: 'onLeave' }]} /></div>
  </Page>;
}
