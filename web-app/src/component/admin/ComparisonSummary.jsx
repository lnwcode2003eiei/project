import { useState } from 'react';
import ComparisonNames from './ComparisonNames';
import ComparisonPeopleDialog from './ComparisonPeopleDialog';
import './comparison-dashboard.css';
import './comparison-people-dialog.css';

function Bar({ value, total, color = '#701D10' }) {
  return <div className="h-8 overflow-hidden rounded-lg bg-gray-100" aria-hidden="true"><div className="h-full rounded-lg" style={{ background: color, width: `${total ? Math.max(0, Math.min(100, value / total * 100)) : 0}%` }} /></div>;
}

export default function ComparisonSummary({ result }) {
  const { counts, metrics } = result; const [selection, setSelection] = useState(null);
  const keyOf = value => String(value || '').replace(/^(?:นางสาว|นาย|นาง|เด็กชาย|เด็กหญิง|ด\.?ช\.?|ด\.?ญ\.?|Mr\.?|Mrs\.?|Ms\.?)\s*/iu, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('th-TH');
  const unique = rows => [...new Map(rows.map(row => [keyOf(row.name), { ...row, key: keyOf(row.name) }]).filter(([key]) => key.split(' ').length >= 2)).values()];
  const visitors = unique(result.rosters?.visitors || []), interested = unique(result.rosters?.interested || []), people = result.people || [];
  const interestKeys = new Set(interested.map(row => row.key));
  const visitorInterested = visitors.filter(row => interestKeys.has(row.key));
  const interestedPassed = people.filter(row => row.interested), fullPath = people.filter(row => row.visitor && row.interested);
  const open = (title, rows) => setSelection({ title, rows });
  const cards = [['ผู้เข้าชม → สนใจ', metrics.visitorToInterest, visitorInterested], ['ผู้สนใจ → สอบผ่าน', metrics.interestToPass, interestedPassed], ['ผู้เข้าชม → สนใจ → สอบผ่าน', metrics.visitorToPass, fullPath], ['ผู้สอบผ่านที่ไม่พบชื่อในระบบ', metrics.outside, people.filter(row => row.state === 'notFound')]];
  const pathRows = [['ผู้เข้าชม', counts.visitors, visitors], ['ผู้เข้าชมที่สนใจ', counts.visitorInterested, visitorInterested], ['กลุ่มเดิมที่สอบผ่าน', counts.fullPath, fullPath]];
  const passRows = [['พบชื่อในระบบ', counts.inSystem, '#701D10', people.filter(row => row.state === 'matched')], ['ไม่พบชื่อที่ตรงกัน', counts.notFound, '#093341', people.filter(row => row.state === 'notFound')], ['ชื่อใกล้เคียง / ยังจับคู่ไม่ได้', counts.uncertain, '#F7941D', people.filter(row => row.state === 'uncertain')]];
  return <div className="comparison-dashboard space-y-6">
    <ComparisonNames result={result} />
    <div className="comparison-metrics grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, metric, rows]) => <button type="button" key={label} onClick={() => open(label, rows)} className="rounded-2xl border bg-white p-5 text-left transition hover:border-[#701D10] hover:shadow-md focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#c48759]"><h3 className="text-sm font-semibold">{label}</h3><p className="my-3 text-3xl font-bold text-[#701D10]">{metric.percent === null ? '—' : `${metric.percent}%`}</p><div className="comparison-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, metric.percent || 0))}%` }} /></div><p className="text-sm text-gray-600">{metric.numerator} จาก {metric.denominator} ชื่อ{!metric.denominator ? ' — ไม่มีฐานข้อมูลสำหรับคำนวณ' : ''}</p><span className="mt-3 block text-xs font-semibold text-[#701D10]">กดเพื่อดูรายชื่อ</span></button>)}</div>
    <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-bold">เส้นทางจากผู้เข้าชมจนสอบผ่าน</h3><p className="mt-1 text-xs text-gray-600">ทุกขั้นนับเฉพาะกลุ่มที่เริ่มจากผู้เข้าชมชื่อครบ</p>{pathRows.map(([label, value, rows]) => <button type="button" onClick={() => open(label, rows)} key={label} className="mt-5 block w-full text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#c48759]"><div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{value} ชื่อ</strong></div><Bar value={value} total={counts.visitors} /></button>)}</section>
      <section className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-bold">ผู้สอบผ่านที่อ่านชื่อได้ใน PDF</h3>{passRows.map(([label, value, color, rows]) => <button type="button" onClick={() => open(label, rows)} key={label} className="mt-5 block w-full text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#c48759]"><div className="mb-2 flex justify-between gap-3 text-sm"><span>{label}</span><strong>{value} ({counts.passed ? `${(value / counts.passed * 100).toFixed(1)}%` : '—'})</strong></div><Bar value={value} total={counts.passed} color={color} /></button>)}</section></div>
    <p className="text-xs text-gray-500">กดการ์ดหรือแถบกราฟเพื่อดูรายชื่อ • ยอดรวมด้านบนนับทุกรายการ ส่วนเปอร์เซ็นต์และกราฟใช้ชื่อครบที่ไม่ซ้ำ การจับคู่ชื่อไม่ใช่การยืนยันตัวบุคคล</p>
    {selection && <ComparisonPeopleDialog title={selection.title} people={selection.rows} onClose={() => setSelection(null)} />}
  </div>;
}
