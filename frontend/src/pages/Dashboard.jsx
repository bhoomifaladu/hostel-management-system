import { useNavigate } from 'react-router-dom';
import { Users, BedDouble, DoorOpen, HandCoins, ArrowRight, CreditCard, FileBarChart, MessageSquare, CalendarDays } from 'lucide-react';
import { api } from '../api';
import { Heading, Stat, Notice, Page, Table, Status, money, useLoad } from '../components/ui';

export default function Dashboard() {
  const nav = useNavigate();
  const dash = useLoad(api.dashboard);
  const students = useLoad(() => api.students());
  const fees = useLoad(() => api.fees());
  const d = dash.data, list = students.data || [], feeList = fees.data || [];
  const beds = d?.totalBeds ?? 0, occupied = d?.occupiedBeds ?? 0, available = Math.max(0, beds - occupied);
  const reload = () => { dash.reload(); students.reload(); fees.reload(); };

  return <Page title="Dashboard" subtitle="Manage your hostel from one place.">
    <Notice onRetry={reload}>{dash.error || students.error || fees.error}</Notice>
    <section className="stats">
      <Stat title="Total Students" value={d?.totalStudents ?? '—'} icon={<Users />} tone="blue" caption="Active residents" />
      <Stat title="Total Rooms" value={d?.totalRooms ?? '—'} icon={<BedDouble />} tone="green" caption={`${occupied} beds occupied`} />
      <Stat title="Available Beds" value={d ? available : '—'} icon={<DoorOpen />} tone="purple" caption="Ready for allocation" />
      <Stat title="Pending Fees" value={d ? money(d.pendingFees) : '—'} icon={<HandCoins />} tone="orange" caption="Outstanding balance" />
    </section>
    <section className="stats">
      <Stat title="Present Today" value={d?.presentToday ?? '—'} icon={<Users />} tone="green" caption="Marked present" />
      <Stat title="Open Complaints" value={d?.openComplaints ?? '—'} icon={<MessageSquare />} tone="orange" caption="Need attention" />
      <Stat title="Pending Leaves" value={d?.pendingLeaves ?? '—'} icon={<CalendarDays />} tone="purple" caption="Awaiting approval" />
      <Stat title="Visitors Inside" value={d?.visitorsInside ?? '—'} icon={<Users />} tone="blue" caption="Not checked out" />
    </section>
    <section className="dashboard-grid">
      <div className="column">
        <div className="panel"><Heading title="Room Occupancy" subtitle="Bed availability overview" />
          <div className="occupancy">
            <div className="donut" style={{ '--progress': `${beds ? occupied / beds * 100 : 0}%` }}><div className="donut-center"><strong>{beds ? Math.round(occupied / beds * 100) : 0}%</strong><span>Occupied</span></div></div>
            <div className="legend">
              <Legend color="blue-dot" label="Occupied beds" value={occupied} /><Legend color="pale-dot" label="Available beds" value={available} /><Legend color="gray-dot" label="Total beds" value={beds} />
            </div></div></div>
        <div className="panel"><Heading title="Recent Students" subtitle="Registered residents" action={<button className="link-btn" onClick={() => nav('/students')}>View all <ArrowRight size={14} /></button>} />
          <Table rows={list.slice(0, 5)} columns={[
            { label: 'Student', key: 'fullName' }, { label: 'Course', key: 'course' },
            { label: 'Room', render: s => <span className="room-tag">{s.roomNo || 'Unallocated'}</span> }, { label: 'Status', render: s => <Status value={s.status} /> }]} /></div>
      </div>
      <div className="column">
        <div className="panel"><Heading title="Fee Status" subtitle="Hostel payment records" />
          <div className="fee-highlight"><span>Outstanding balance</span><strong>{money(d?.pendingFees)}</strong></div>
          {['Paid', 'Partial', 'Pending'].map((status, i) => { const count = feeList.filter(f => f.status === status).length;
            return <div className="fee-row" key={status}><div><span>{status}</span><strong>{count}</strong></div><div className="bar-track"><div className={['bar-blue', 'bar-purple', 'bar-orange'][i]} style={{ width: `${feeList.length ? count / feeList.length * 100 : 0}%` }} /></div></div>; })}
          <button className="link-btn fee-link" onClick={() => nav('/fees')}>Manage fee records <ArrowRight size={14} /></button></div>
        <div className="panel"><Heading title="Quick Actions" subtitle="Common tasks" />
          <div className="quick-actions">
            <button onClick={() => nav('/students')}><Users size={17} />Manage students<ArrowRight size={14} /></button>
            <button onClick={() => nav('/rooms')}><BedDouble size={17} />Manage rooms<ArrowRight size={14} /></button>
            <button onClick={() => nav('/fees')}><CreditCard size={17} />View fees<ArrowRight size={14} /></button>
            <button onClick={() => nav('/reports')}><FileBarChart size={17} />View reports<ArrowRight size={14} /></button>
          </div></div>
      </div>
    </section>
  </Page>;
}
const Legend = ({ color, label, value }) => <div className="legend-row"><i className={color} /><span>{label}</span><strong>{value}</strong></div>;
