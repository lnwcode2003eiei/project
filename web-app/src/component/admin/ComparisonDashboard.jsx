import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../../config/api';
import './comparison-dashboard.css';

const pct = value => value === null ? '—' : `${value}%`;
const labels = { matched: 'พบชื่อในระบบ', notFound: 'ไม่พบชื่อที่ตรงกัน', uncertain: 'ชื่อใกล้เคียง / จับคู่ไม่ได้แน่ชัด' };
export default function ComparisonDashboard() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function upload(event) {
    event.preventDefault();
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 10 * 1024 * 1024) { setError('กรุณาเลือก PDF ขนาดไม่เกิน 10 MB'); return; }
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setBusy(true); setError(''); setResult(null); setPage(0); setFilter('all'); setSearch('');
    const body = new FormData(); body.append('pdf', file);
    try {
      const response = await fetch(apiUrl('/api/admin/comparison'), { method: 'POST', body, signal: request.signal, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'ประมวลผลไม่สำเร็จ');
      if (!request.signal.aborted) setResult({ ...payload.data, filename: file.name });
    } catch (err) { if (!request.signal.aborted) setError(err.message || 'ไม่สามารถเชื่อมต่อ Server ได้'); }
    finally { if (!request.signal.aborted) setBusy(false); }
  }
  const people = result?.people.filter(person => (filter === 'all' || person.state === filter) && person.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) || [];
  const cards = result ? [
    ['ผู้เข้าชม → สนใจ', result.metrics.visitorToInterest],
    ['ผู้สนใจ → สอบผ่าน', result.metrics.interestToPass],
    ['ผู้เข้าชม → สนใจ → สอบผ่าน', result.metrics.visitorToPass],
    ['ผู้สอบผ่านที่ไม่พบชื่อในระบบ', result.metrics.outside],
  ] : [];
  return <div className="comparison-dashboard space-y-6">
    <header className="comparison-hero">
      <div><p className="comparison-eyebrow">ภาพรวมการเปรียบเทียบข้อมูล</p><h2>จากความสนใจ สู่การสอบผ่าน</h2><p>ติดตามเส้นทางผู้เข้าชม ผู้สนใจ และรายชื่อผู้สอบผ่านในมุมมองเดียว</p></div>
      <span className="comparison-status">{result ? 'ประมวลผลแล้ว' : busy ? 'กำลังประมวลผล' : 'รออัปโหลดเอกสาร'}</span>
    </header>
    <section className="comparison-upload rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">อัปโหลดรายชื่อผู้สอบผ่าน</h2>
      <p className="mt-2 text-sm leading-7 text-gray-600">เลือกเอกสารที่มีเฉพาะรายชื่อผู้สอบผ่าน ระบบจะเทียบกับข้อมูลผู้เข้าชมและผู้สนใจทั้งหมดในปัจจุบันโดยอัตโนมัติ ไม่แยกปีหรือรอบสอบ</p>
      <form onSubmit={upload} className="mt-4 flex flex-wrap items-end gap-4">
        <label className="min-w-0 flex-1 text-sm font-semibold">ไฟล์ PDF (ไม่เกิน 10 MB / 30 หน้า)
          <input type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e => { setFile(e.target.files[0] || null); setResult(null); setError(''); }} className="mt-2 block w-full rounded-xl border border-gray-300 p-3 file:mr-3 file:rounded-lg file:border-0 file:bg-[#701D10] file:px-4 file:py-2 file:text-white" />
        </label>
        <button type="submit" disabled={!file || busy} className="rounded-xl bg-[#701D10] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'กำลังอ่าน PDF…' : 'อัปโหลดและเปรียบเทียบ'}</button>
        {busy && <button type="button" className="rounded-xl border px-4 py-3" onClick={() => { controller.current?.abort(); setBusy(false); }}>ยกเลิก</button>}
      </form>
      <p className="mt-3 text-xs leading-6 text-gray-500">ประมวลผลใน Server ไม่ส่งบริการภายนอก ไม่เก็บ PDF หรือผลถาวร เปลี่ยนหน้าหรือรีเฟรชแล้วต้องอัปโหลดใหม่ • หน้าสแกนรองรับ OCR สูงสุด 10 หน้า และแยกเป็นรายการที่ยังยืนยันชื่อไม่ได้</p>
      {busy && <p role="status" className="mt-4 text-[#701D10]">กำลังอ่านและจับคู่รายชื่อ ไฟล์สแกนอาจใช้เวลาประมาณ 1–2 นาที</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    </section>
    {!result && !busy && <section className="comparison-empty">
      <h3>เริ่มดูภาพรวมได้ใน 3 ขั้นตอน</h3>
      <div>{[['01', 'เลือกไฟล์ PDF', 'ใช้เอกสารรายชื่อผู้สอบผ่านเท่านั้น'], ['02', 'จับคู่ชื่อในระบบ', 'เทียบกับผู้เข้าชมและผู้สนใจ'], ['03', 'ดูผลเปรียบเทียบ', 'ยอดรวม เปอร์เซ็นต์ และรายชื่อ']].map(([number, title, detail]) => <article key={number}><span>{number}</span><h4>{title}</h4><p>{detail}</p></article>)}</div>
      <p className="mt-5 text-sm text-gray-500">ยังไม่มีผลเปรียบเทียบ อัปโหลดเอกสารเพื่อแสดงข้อมูลจริง</p>
    </section>}
    {result && <>
      <section className="comparison-notice rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-black">
        <p className="font-bold break-all">ผลจาก {result.filename} • {result.pages} หน้า (OCR {result.ocrPages} หน้า)</p>
        <p>ผลจับคู่ตามชื่อ–นามสกุล ไม่ใช่การยืนยันตัวบุคคล • ไม่นับข้อมูลชื่อไม่ครบและ OCR ในเปอร์เซ็นต์</p>
        <details><summary className="cursor-pointer font-semibold">วิธีนับและข้อจำกัดของข้อมูล</summary>
        <p>เปอร์เซ็นต์ใช้เฉพาะชื่อ–นามสกุลที่อ่านได้ โดยรวมชื่อซ้ำเป็น 1 กลุ่มชื่อ ไม่ใช่จำนวนบุคคลที่ยืนยันตัวตนแล้ว ชื่อเหมือนกันอาจเป็นคนละคน และไม่พบชื่อไม่ได้แปลว่าไม่เคยเข้าเว็บหรือสอบไม่ผ่าน</p>
        <p>ไม่นำมาคิดเปอร์เซ็นต์: ผู้เข้าชมไม่ระบุชื่อ/ชื่อไม่ครบ {result.excluded.visitors} รายการ • ผู้สนใจชื่อไม่ครบ {result.excluded.interested} รายการ • แถว PDF ไม่ชัดเจน/OCR {result.excluded.pdf} รายการ</p>
        <p>แถวชื่อที่อ่านได้ใน PDF {result.records.pdf} แถว รวมเป็น {result.counts.passed} ชื่อไม่ซ้ำ • อาจมีแถวที่ระบบตรวจไม่พบชื่อ จึงไม่ถือว่าจำนวนนี้คือยอดผู้สอบผ่านทั้งเอกสาร</p>
        </details>
      </section>
      <div className="comparison-totals grid gap-4 sm:grid-cols-3">{[['ผู้เข้าชมที่มีชื่อครบ', result.counts.visitors], ['ผู้สนใจที่มีชื่อครบ', result.counts.interested], ['ชื่อผู้สอบผ่านที่อ่านได้', result.counts.passed]].map(([label, value], index) => <div key={label} className="rounded-2xl border bg-white p-5"><span className="comparison-step">0{index + 1}</span><p className="text-sm text-gray-600">{label}</p><p className="mt-2 text-3xl font-bold">{value.toLocaleString()} <span className="text-sm font-normal">ชื่อ</span></p></div>)}</div>
      <div className="comparison-metrics grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, metric]) => <div key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm font-semibold">{label}</p><p className="my-3 text-3xl font-bold text-[#701D10]">{pct(metric.percent)}</p><div className="comparison-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, metric.percent || 0))}%` }} /></div><p className="text-sm text-gray-600">{metric.numerator} จาก {metric.denominator} ชื่อ{metric.denominator === 0 ? ' — ไม่มีฐานข้อมูลสำหรับคำนวณ' : ''}</p></div>)}</div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-bold">เส้นทางจากผู้เข้าชมจนสอบผ่าน</h3><p className="mt-1 text-xs text-gray-600">ทุกขั้นนับเฉพาะกลุ่มที่เริ่มจากผู้เข้าชมชื่อครบ</p>
          {[['ผู้เข้าชม', result.counts.visitors], ['ผู้เข้าชมที่สนใจ', result.counts.visitorInterested], ['กลุ่มเดิมที่สอบผ่าน', result.counts.fullPath]].map(([label, value]) => <div key={label} className="mt-5"><div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{value} ชื่อ</strong></div><div className="h-8 overflow-hidden rounded-lg bg-gray-100"><div className="h-full bg-[#701D10]" style={{ width: `${result.counts.visitors ? value / result.counts.visitors * 100 : 0}%` }} /></div></div>)}
        </section>
        <section className="rounded-2xl border bg-white p-6"><h3 className="text-lg font-bold">ผู้สอบผ่านที่อ่านชื่อได้ใน PDF</h3>
          {[['พบชื่อในระบบ', result.counts.inSystem, '#701D10'], ['ไม่พบชื่อที่ตรงกัน', result.counts.notFound, '#093341'], ['ชื่อใกล้เคียง / ยังจับคู่ไม่ได้', result.counts.uncertain, '#F7941D']].map(([label, value, color]) => <div key={label} className="mt-5"><div className="mb-2 flex justify-between gap-3 text-sm"><span>{label}</span><strong>{value} ({result.counts.passed ? (value / result.counts.passed * 100).toFixed(1) + '%' : '—'})</strong></div><div className="h-8 rounded-lg bg-gray-100"><div className="h-full rounded-lg" style={{ background: color, width: `${result.counts.passed ? value / result.counts.passed * 100 : 0}%` }} /></div></div>)}
        </section>
      </div>
      <section className="comparison-table rounded-2xl border bg-white p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><label className="text-sm font-medium">ค้นหาชื่อผู้สอบผ่าน<input type="search" placeholder="พิมพ์ชื่อหรือนามสกุล…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="ml-3 rounded-xl border border-gray-200 p-3" /></label><span className="text-sm text-gray-600">แสดง {people.length.toLocaleString()} จาก {result.people.length.toLocaleString()} ชื่อ</span></div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">ผลการจับคู่รายชื่อผู้สอบผ่าน</h3><select aria-label="กรองผลการจับคู่" className="rounded-lg border p-2" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}><option value="all">ทั้งหมด</option>{Object.entries(labels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b"><th className="p-3">ชื่อ–นามสกุล</th><th className="p-3">ผู้เข้าชม</th><th className="p-3">ผู้สนใจ</th><th className="p-3">ผลการจับคู่</th></tr></thead><tbody>{people.slice(page * 50, (page + 1) * 50).map((person, index) => <tr key={index} className="border-b"><td className="p-3">{person.name}</td><td className="p-3">{person.visitor ? 'พบชื่อ' : 'ไม่พบ'}</td><td className="p-3">{person.interested ? 'พบชื่อ' : 'ไม่พบ'}</td><td className="p-3">{labels[person.state]}</td></tr>)}{!people.length && <tr><td colSpan={4} className="p-8 text-center text-gray-500">ไม่มีรายการที่แสดงได้</td></tr>}</tbody></table></div>
        <div className="mt-4 flex items-center justify-end gap-4 text-sm"><button disabled={page === 0} onClick={() => setPage(value => value - 1)} className="rounded-lg border p-2 disabled:opacity-40">ก่อนหน้า</button><span>หน้า {page + 1} / {Math.max(1, Math.ceil(people.length / 50))}</span><button disabled={(page + 1) * 50 >= people.length} onClick={() => setPage(value => value + 1)} className="rounded-lg border p-2 disabled:opacity-40">ถัดไป</button></div>
      </section>
      {!!result.unresolved.length && <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">รายการที่อ่านได้ไม่ชัดเจน / OCR ({result.unresolved.length}) — ไม่นับเป็นผู้สอบผ่านนอกระบบ</summary><ul className="mt-4 max-h-80 overflow-y-auto text-sm">{result.unresolved.map((row, index) => <li key={index} className="border-b py-3 break-words">หน้า {row.page}: {row.text} <span className="text-gray-500">({row.reason})</span></li>)}</ul></details>}
    </>}
  </div>;
}
