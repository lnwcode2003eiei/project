import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';

const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') });
export default function KnowledgeDocuments() {
  const [data, setData] = useState(null), [file, setFile] = useState(null), [title, setTitle] = useState(''), [type, setType] = useState('หลักสูตร'), [branch, setBranch] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    const response = await fetch(apiUrl('/api/admin/knowledge/documents'), { headers: headers() }); const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.message || 'โหลดเอกสารไม่สำเร็จ');
    setData(body); setBranch(current => current || (body.scope === 'all' ? 'all' : body.scope));
  }, []);
  useEffect(() => { const timer = setTimeout(() => load().catch(error => setError(error.message)), 0); return () => clearTimeout(timer); }, [load]);
  const upload = async event => {
    event.preventDefault(); if (!file || busy) return;
    setBusy(true); setError(''); setNotice(''); const body = new FormData(); body.append('pdf', file); body.append('title', title || file.name.replace(/\.pdf$/i, '')); body.append('type', type); body.append('branch', branch);
    try { const response = await fetch(apiUrl('/api/admin/knowledge/documents'), { method: 'POST', headers: headers(), body }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || 'อัปโหลดไม่สำเร็จ'); setFile(null); setTitle(''); setNotice('อัปโหลดแล้ว N8N ค้นข้อมูลจากเอกสารนี้ได้'); await load(); }
    catch (error) { setError(error.message); } finally { setBusy(false); }
  };
  const remove = async row => {
    if (busy || !window.confirm(`ลบเอกสาร “${row.title}” ใช่หรือไม่? N8N จะไม่ใช้ข้อมูลนี้ในการค้นครั้งถัดไป`)) return;
    setBusy(true); setError(''); try { const response = await fetch(apiUrl('/api/admin/knowledge/documents/' + row.id), { method: 'DELETE', headers: headers() }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || 'ลบไม่สำเร็จ'); setNotice('ลบเอกสารออกจากคลัง AI แล้ว'); await load(); } catch (error) { setError(error.message); } finally { setBusy(false); }
  };
  if (!data) return <section className="rounded-2xl border bg-white p-6 text-sm text-slate-500">กำลังโหลดคลังเอกสาร AI…</section>;
  const editable = data.canEdit, label = key => data.branches[key] || key;
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
    <header><h2 className="text-xl font-bold text-[#701D10]">เอกสาร PDF สำหรับ AI</h2><p className="mt-2 text-sm leading-6 text-slate-500">อัปโหลดเอกสารหลักสูตรหรือข้อมูลสาขา ระบบอ่านข้อความจาก PDF เพื่อให้ N8N ค้นหาเฉพาะสาขาที่เกี่ยวข้อง ข้อมูลส่วนกลางใช้สำหรับค่าเทอม วันสมัคร และประกาศร่วมกัน</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {editable && <form onSubmit={upload} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
      <label className="text-sm font-semibold">ชื่อเอกสาร<input maxLength="250" value={title} onChange={event => setTitle(event.target.value)} className="mt-2 w-full rounded-lg border bg-white p-3" placeholder="เช่น หลักสูตรวิศวกรรมไฟฟ้า 2569" /></label>
      <label className="text-sm font-semibold">ประเภท<select value={type} onChange={event => setType(event.target.value)} className="mt-2 w-full rounded-lg border bg-white p-3">{data.types.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-sm font-semibold">ข้อมูลสำหรับ<select value={branch} disabled={data.scope !== 'all'} onChange={event => setBranch(event.target.value)} className="mt-2 w-full rounded-lg border bg-white p-3">{Object.entries(data.branches).filter(([key]) => key !== 'unassigned' && (data.scope === 'all' || key === data.scope)).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
      <label className="text-sm font-semibold">ไฟล์ PDF<input required type="file" accept="application/pdf,.pdf" onChange={event => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full rounded-lg border bg-white p-2 file:mr-3 file:rounded-md file:border-0 file:bg-[#701D10] file:px-3 file:py-2 file:text-white" /></label>
      <div className="md:col-span-2"><button disabled={!file || busy} className="rounded-xl bg-[#701D10] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'กำลังอ่าน PDF…' : 'อัปโหลดเข้าคลัง AI'}</button></div>
    </form>}
    <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b text-slate-500"><tr><th className="p-3">เอกสาร</th><th className="p-3">ขอบเขตข้อมูล</th><th className="p-3">รายละเอียด</th><th className="p-3">อัปเดต</th><th className="p-3">จัดการ</th></tr></thead><tbody>{data.documents.map(row => <tr key={row.id} className="border-b"><td className="p-3"><strong>{row.title}</strong><p className="mt-1 text-xs text-slate-500">{row.filename}</p></td><td className="p-3">{label(row.branch)}</td><td className="p-3">{row.type} · {row.pages} หน้า{row.text_truncated ? ' · ข้อความยาว ตัดบางส่วน' : ''}</td><td className="p-3 text-xs">{new Date(row.updated_at).toLocaleString('th-TH')}</td><td className="p-3">{editable && (data.scope === 'all' || row.branch === data.scope) ? <button type="button" disabled={busy} onClick={() => remove(row)} className="text-red-700 hover:underline disabled:opacity-50">ลบ</button> : <span className="text-slate-400">ดูข้อมูล</span>}</td></tr>)}{!data.documents.length && <tr><td colSpan="5" className="p-8 text-center text-slate-500">ยังไม่มีเอกสาร PDF ในคลัง AI</td></tr>}</tbody></table></div>
  </section>;
}
