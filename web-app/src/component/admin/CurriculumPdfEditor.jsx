import { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';
import { CurriculumTable } from '../saka/CurriculumPdf';
import { rowType } from '../../config/curriculumTable';
const blank = { title: '', year: '', rows: [], fileId: '', version: 0 };
const field = 'w-full rounded-lg border border-gray-300 bg-white p-3 text-black';
export default function CurriculumPdfEditor({ slug }) {
  const [data, setData] = useState(blank), [busy, setBusy] = useState(false), [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [text, setText] = useState(''), [reviewed, setReviewed] = useState(false), [dirty, setDirty] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(`/api/curriculum-pdf/${slug}`), { signal: controller.signal }).then(async res => {
      const body = await res.json(); if (!res.ok || !body.success) throw new Error('โหลดหลักสูตร PDF ไม่สำเร็จ กรุณาโหลดหน้าใหม่');
      setData(body.data || blank); setLoaded(true);
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [slug]);
  useEffect(() => { const warn = e => { e.preventDefault(); e.returnValue = ''; }; if (dirty) window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const change = patch => { setData(v => ({ ...v, ...patch })); setDirty(true); setReviewed(false); setNotice(''); };
  const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') });
  const upload = async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;

    if ((data.fileId || data.rows.length) && !window.confirm('อ่าน PDF ใหม่แทนร่างในหน้าจอ? ข้อมูลที่เผยแพร่เดิมยังคงอยู่จนกดบันทึก')) return;
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('pdf', file);
      const res = await fetch(apiUrl(`/api/curriculum-pdf/${slug}/upload`), { method: 'POST', headers: headers(), body });
      const result = await res.json(); if (!res.ok || !result.success) throw new Error(result.message || 'อัปโหลดไม่สำเร็จ');
      change({ fileId: result.fileId, rows: result.rows.map(row => ({ ...row, type: rowType(row) })) }); setText(result.text); setNotice(result.warning + (result.truncated ? ' ข้อความตัวอย่างแสดงเพียง 100,000 ตัวอักษรแรก' : ''));
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const previewPdf = async () => {
    setBusy(true); setError('');
    try {
      const res = await fetch(apiUrl(`/api/curriculum-pdf/${slug}/drafts/${data.fileId}`), { headers: headers() });
      if (!res.ok) throw new Error('เปิด PDF ไม่สำเร็จ');
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'curriculum-review.pdf'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const save = async event => {
    event.preventDefault(); if (!reviewed || !data.fileId) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(apiUrl(`/api/curriculum-pdf/${slug}`), { method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, reviewed }) });
      const result = await res.json(); if (!res.ok || !result.success) throw new Error(result.message || 'บันทึกไม่สำเร็จ');
      setData(result.data); setDirty(false); setReviewed(false); setNotice('บันทึกแล้ว ตารางและ PDF จะแสดงบนหน้าสาขาเมื่อโหลดใหม่');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <section className="my-6 rounded-2xl border border-rose-200 bg-white p-6 sm:p-8">
    <h2 className="text-2xl font-bold text-[#701D10]">โครงสร้างหลักสูตรและรายวิชา</h2>
    <p className="my-3 text-sm leading-7 text-gray-600">อัปโหลด PDF → ตรวจแก้ตาราง → ยืนยันบันทึก ข้อมูลหลักสูตรเดิมไม่ถูกลบ ไฟล์สแกนยังไม่รองรับ OCR: กรอกตารางเองหรือแสดงเฉพาะ PDF ได้</p>
    {error && <p role="alert" className="my-3 text-red-700">{error}</p>}{notice && <p role="status" className="my-3 rounded-lg bg-amber-50 p-3 text-amber-900">{notice}</p>}
    <form onSubmit={save}><fieldset disabled={busy || !loaded} className="space-y-5">
      <label className="block font-medium">อัปโหลด PDF หลักสูตร<input className={field + ' mt-2 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-red-700 file:px-5 file:py-3 file:font-semibold file:text-white file:transition-colors hover:file:bg-red-800 disabled:file:cursor-not-allowed disabled:file:opacity-50'} type="file" accept="application/pdf,.pdf" onChange={upload} /></label>
      {busy && <p role="status">กำลังดำเนินการ…</p>}
      <div className="grid gap-4 sm:grid-cols-2"><label>ชื่อหลักสูตร<input className={field} maxLength={250} value={data.title} onChange={e => change({ title: e.target.value })} /></label><label>ปีหลักสูตร<input className={field} maxLength={30} value={data.year} onChange={e => change({ year: e.target.value })} /></label></div>
      {data.fileId && <button type="button" onClick={previewPdf} className="font-semibold text-[#701D10] underline">ดาวน์โหลด PDF เพื่อตรวจเทียบ</button>}
      {text && <details><summary className="cursor-pointer">ข้อความที่อ่านได้จาก PDF (อาจไม่ครบ)</summary><pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-xs">{text}</pre></details>}
      <div className="rounded-xl bg-slate-100/70 p-4 sm:p-6"><p className="mb-4 font-bold">ตัวอย่างตารางแสดงผล — อัปเดตทันทีจาก PDF และการแก้ไข</p><CurriculumTable data={data} /></div>
      <p className="text-sm text-gray-600">เลือกประเภทแถว: หมวดวิชาเป็นแถบแดง รายการย่อยเป็นแถวสีอ่อน และยอดรวมแสดงท้ายตาราง หากไม่มีแถวยอดรวมจะรวมเฉพาะหมวดวิชาเพื่อไม่ให้นับรายการย่อยซ้ำ กรุณาตรวจว่าหมวดวิชาครบตาม PDF</p>
      <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr><th className="p-2">ประเภทแถว</th><th className="p-2">รหัส (ถ้ามี)</th><th className="p-2">รายละเอียดหมวดวิชา</th><th className="p-2">หน่วยกิต</th><th className="p-2">จัดการ</th></tr></thead><tbody>{data.rows.map((row, i) => <tr key={i}><td className="p-2"><select aria-label={`ประเภทแถว ${i + 1}`} className={field} value={rowType(row)} onChange={e => change({ rows: data.rows.map((r, index) => index === i ? { ...r, type: e.target.value } : r) })}><option value="category">หมวดวิชา</option><option value="item">รายการย่อย</option><option value="total">ยอดรวมทั้งหมด</option></select></td>{[['code', 50], ['name', 500], ['credits', 40]].map(([key, max]) => <td key={key} className="p-2"><input aria-label={`${key} แถว ${i + 1}`} required={key === 'name'} maxLength={max} className={field} value={row[key]} onChange={e => change({ rows: data.rows.map((r, index) => index === i ? { ...r, [key]: e.target.value } : r) })} /></td>)}<td><button type="button" className="text-red-700" onClick={() => change({ rows: data.rows.filter((_, index) => index !== i) })}>ลบแถว {i + 1}</button></td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap gap-3">{[['category', 'หมวดวิชา'], ['item', 'รายการย่อย'], ['total', 'ยอดรวมทั้งหมด']].map(([type, label]) => <button key={type} type="button"  className="rounded-lg border px-4 py-2" onClick={() => change({ rows: [...data.rows, { code: '', name: type === 'total' ? 'รวมจำนวนหน่วยกิตตลอดหลักสูตร' : '', credits: '', type }] })}>+ เพิ่ม{label}</button>)}</div>
      {!data.rows.length && <p className="text-sm text-gray-600">ยังไม่มีแถวข้อมูล: สามารถบันทึกเพื่อแสดงเฉพาะปุ่มเปิด PDF ได้</p>}
      <label className="flex items-start gap-3"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} className="mt-1" />ตรวจเทียบข้อมูลกับ PDF แล้ว และยืนยันให้แสดงบนเว็บไซต์</label>
      <button disabled={!dirty || !reviewed || !data.fileId} className="rounded-xl bg-[#701D10] px-5 py-3 font-semibold text-white disabled:opacity-40">บันทึกตารางและ PDF</button>
    </fieldset></form>
  </section>;
}
