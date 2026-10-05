import { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';
import ComparisonSummary from './ComparisonSummary';
import DeleteReportDialog from './DeleteReportDialog';
export default function ComparisonHistory({ revision = 0 }) {
  const [refresh, setRefresh] = useState(0), [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null), [deleteError, setDeleteError] = useState('');
  const [canDelete] = useState(() => { try { const admin = JSON.parse(localStorage.getItem('adminUser') || '{}'); return admin.saka_path === 'all' && Number(admin.can_edit) === 1; } catch { return false; } });
  const [reports, setReports] = useState([]), [year, setYear] = useState(''), [id, setId] = useState(''), [data, setData] = useState(null), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl('/api/admin/comparison/reports'), { signal: controller.signal, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then(async res => {
      const body = await res.json(); if (!res.ok || !body.success) throw new Error('โหลดรายการอัปโหลดไม่สำเร็จ');
      setError(''); setData(null); setReports(body.reports); setYear(body.reports[0] ? String(body.reports[0].academic_year) : ''); setId(body.reports[0] ? String(body.reports[0].id) : '');
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [revision, refresh]);
  useEffect(() => {
    const controller = new AbortController();
    if (id) fetch(apiUrl('/api/admin/comparison/reports/' + id), { signal: controller.signal, headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then(async res => {
      const body = await res.json(); if (!res.ok || !body.success) throw new Error('โหลดข้อมูลไม่สำเร็จ'); setError(''); setData({ ...body.data, reportId: id });
    }).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [id, revision, refresh]);
  async function deleteReport() {
    if (!pendingDelete || deleting) return;
    setDeleting(true); setDeleteError('');
    try {
      const response = await fetch(apiUrl('/api/admin/comparison/reports/' + pendingDelete.id), { method: 'DELETE', headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'ลบไม่สำเร็จ');
      setPendingDelete(null); setData(null); setId(''); setRefresh(value => value + 1);
    } catch (e) { setDeleteError(e.message); }
    finally { setDeleting(false); }
  }
  return <section className="my-6 space-y-4 rounded-2xl border bg-white p-5">
    <h2 className="text-xl font-bold text-[#701D10]">จำนวนผู้เข้าชม ผู้สนใจ และผู้สอบผ่าน แยกชุดอัปโหลด</h2>
    {canDelete && id && <button type="button" disabled={deleting} onClick={() => { setDeleteError(''); setPendingDelete(reports.find(row => String(row.id) === id)); }} className="rounded-lg bg-[#701D10] px-4 py-2 font-semibold text-white disabled:opacity-50">ลบชุดอัปโหลดที่เลือก</button>}
    {pendingDelete && <DeleteReportDialog report={pendingDelete} busy={deleting} error={deleteError} onCancel={() => setPendingDelete(null)} onConfirm={deleteReport} />}
    <p className="text-sm text-gray-600">ปีการศึกษาอ้างอิงรายชื่อใน PDF ส่วนผู้เข้าชมและผู้สนใจเป็นข้อมูลทั้งหมด ณ เวลาอัปโหลด ไม่ใช่ยอดที่กรองตามปีการศึกษา ไม่รวมหลายไฟล์เข้าด้วยกันอัตโนมัติ</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!!reports.length && <div className="flex flex-wrap gap-3"><label>ปีการศึกษา <select className="rounded border p-2" value={year} onChange={e => { setYear(e.target.value); setId(String(reports.find(r => String(r.academic_year) === e.target.value).id)); }}>{[...new Set(reports.map(r => String(r.academic_year)))].map(y => <option key={y}>{y}</option>)}</select></label><label>ชุดอัปโหลด <select className="max-w-full rounded border p-2" value={id} onChange={e => setId(e.target.value)}>{reports.filter(r => String(r.academic_year) === year).map(r => <option key={r.id} value={r.id}>{r.filename} · {new Date(r.uploaded_at).toLocaleString('th-TH')}</option>)}</select></label></div>}
    {!reports.length && !error && <p className="text-gray-500">ยังไม่มีผลที่บันทึก อัปโหลดรายชื่อในหน้าเปรียบเทียบข้อมูลเพื่อเริ่มต้น</p>}
    {data?.reportId === id && <><p className="break-words text-sm">ปีการศึกษา {data.academicYear} · อัปโหลด {new Date(data.generatedAt).toLocaleString('th-TH')} · {data.filename}</p><ComparisonSummary result={data} /><p className="text-xs text-gray-500">ผู้สอบผ่านที่อ่านไม่ชัด/OCR แยกตรวจสอบ {data.unresolved.length} รายการ ไม่ถือว่าอ่านครบทั้งเอกสาร</p></>}
  </section>;
}
