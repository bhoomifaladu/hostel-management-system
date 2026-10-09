import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { api } from '../api';
import { FormModal, Heading, Notice, Page, useLoad } from '../components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

export default function Mess() {
  const { data, error, reload } = useLoad(api.mess);
  const [slot, setSlot] = useState(null); // { day, meal, items }
  const find = (day, meal) => (data || []).find(m => m.day === day && m.meal === meal)?.items || '';

  return <Page title="Mess Management" subtitle="Weekly menu. Click any cell to edit it.">
    <Notice onRetry={reload}>{error}</Notice>
    <div className="panel"><Heading title="Weekly Menu" subtitle="Breakfast, lunch, snacks and dinner" />
      <div className="table-wrap"><table className="menu-table"><thead><tr><th>Day</th>{MEALS.map(m => <th key={m}>{m}</th>)}</tr></thead>
        <tbody>{DAYS.map(day => <tr key={day}><td><strong>{day}</strong></td>
          {MEALS.map(meal => { const items = find(day, meal); return <td key={meal}><button className="menu-cell" onClick={() => setSlot({ day, meal, items })}>{items || <em>Add</em>}<Pencil size={11} /></button></td>; })}</tr>)}</tbody></table></div></div>
    {slot && <FormModal title={`${slot.day} · ${slot.meal}`} subtitle="Separate items with commas." fields={[{ name: 'items', label: 'Menu items', required: true }]} initial={slot}
      onClose={() => setSlot(null)} onSubmit={async v => { await api.saveMeal({ day: slot.day, meal: slot.meal, items: v.items }); await reload(); }} />}
  </Page>;
}
