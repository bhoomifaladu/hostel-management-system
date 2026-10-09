import { Download } from 'lucide-react';
import { api } from '../api';
import { Heading, Notice, Page, useLoad, attempt, money, fmtDate } from '../components/ui';

function Bars({ rows, labelKey, valueKey = 'count' }) {
  const max = Math.max(1, ...rows.map(r => r[valueKey]));
  if (!rows.length) return <p className="empty">No data yet.</p>;
  return rows.map(r => <div className="fee-row" key={r[labelKey]}><div><span>{r[labelKey]}</span><strong>{r[valueKey]}</strong></div>
    <div className="bar-track"><div className="bar-blue" style={{ width: `${r[valueKey] / max * 100}%` }} /></div></div>);
}

export default function Reports() {
  const { data: d, error, reload } = useLoad(api.reportSummary);
  const pct = d && d.fees.billed ? Math.round(d.fees.collected / d.fees.billed * 100) : 0;
  const occ = d && d.occupancy.beds ? Math.round(d.occupancy.occupied / d.occupancy.beds * 100) : 0;

  return <Page title="Reports" subtitle="Summaries across the hostel." action={<button className="primary-btn" onClick={() => attempt(api.downloadFeeReport)}><Download size={16} /> Fee report (CSV)</button>}>
    <Notice onRetry={reload}>{error}</Notice>
    {d && <section className="report-grid">
      <div className="panel"><Heading title="Occupancy" subtitle={`${d.occupancy.occupied} of ${d.occupancy.beds} beds`} /><div className="big-number">{occ}%</div><div className="bar-track"><div className="bar-blue" style={{ width: `${occ}%` }} /></div></div>
      <div className="panel"><Heading title="Fee collection" subtitle={`${money(d.fees.collected)} of ${money(d.fees.billed)}`} /><div className="big-number">{pct}%</div><div className="bar-track"><div className="bar-purple" style={{ width: `${pct}%` }} /></div><p className="subtitle" style={{ marginTop: 10 }}>Outstanding: {money(d.fees.outstanding)}</p></div>
      <div className="panel"><Heading title="Students by course" subtitle="Active residents" /><Bars rows={d.courses} labelKey="course" /></div>
      <div className="panel"><Heading title="Fees by status" subtitle="Number of records" /><Bars rows={d.fees.byStatus} labelKey="status" /></div>
      <div className="panel"><Heading title="Complaints" subtitle="By status" /><Bars rows={d.complaints} labelKey="status" /></div>
      <div className="panel"><Heading title="Leave requests" subtitle="By status" /><Bars rows={d.leaves} labelKey="status" /></div>
      <div className="panel wide"><Heading title="Attendance — last 7 days" subtitle="Students marked present each day" />
        <Bars rows={d.attendance.map(a => ({ ...a, label: fmtDate(a.date), count: a.present }))} labelKey="label" /></div>
    </section>}
  </Page>;
}
