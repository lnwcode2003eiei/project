import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../../config/api';
import { groupQuestions } from './knowledge-topics';

const field = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#701D10] focus:ring-2 focus:ring-orange-100';
const primary = 'rounded-xl bg-[#701D10] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8b2b1b] disabled:opacity-50';
const secondary = 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const fresh = branch => ({ branch, category: 'ทั่วไป', question: '', answer: '', aliases: [], metadata: { keywords: [], academicYear: '', source: '', notes: '' }, sourceQuestions: [] });
async function request(path = '', options = {}) {
  const response = await fetch(apiUrl('/api/admin/knowledge' + path), {
    ...options, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token'), ...options.headers },
  });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.message || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่');
  return body;
}

function Editor({ initial, data, busy, error, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const dialog = useRef(null);
  useEffect(() => { dialog.current.showModal(); }, []);
  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const setMeta = (key, value) => setForm(previous => ({ ...previous, metadata: { ...previous.metadata, [key]: value } }));
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} aria-labelledby="knowledge-editor-title" className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40">
    <form onSubmit={event => { event.preventDefault(); onSave(form); }}>
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div><h2 id="knowledge-editor-title" className="text-xl font-bold">{form.id ? 'แก้ไขข้อมูลให้ AI' : 'เพิ่มข้อมูลให้ AI'}</h2><p className="mt-1 text-sm text-slate-500">บันทึกแล้ว AI ใช้ข้อมูลนี้ตอบได้ทันที</p></div>
        <button type="button" disabled={busy} onClick={onClose} aria-label="ปิดหน้าต่าง" className={secondary}>ปิด</button>
      </header>
      <fieldset disabled={busy} className="space-y-5 px-6 py-5">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-semibold">แนวคำถาม<input autoFocus required maxLength={1000} className={field} value={form.question} onChange={e => set('question', e.target.value)} placeholder="เช่น วิธีสมัครเรียน หรือค่าเทอมวิศวกรรมคอมพิวเตอร์" /></label>
        <label className="block text-sm font-semibold">ข้อมูลคำตอบสำหรับ AI<textarea required maxLength={10000} rows={7} className={field + ' leading-7'} value={form.answer} onChange={e => set('answer', e.target.value)} placeholder="ใส่ข้อมูลที่ถูกต้อง พร้อมเงื่อนไขหรือรายละเอียดที่จำเป็น" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">ข้อมูลสำหรับ<select disabled={Boolean(form.id) || data.scope !== 'all'} className={field} value={form.branch} onChange={e => set('branch', e.target.value)}>{Object.entries(data.branches).filter(([key]) => key !== 'unassigned' && (data.scope === 'all' || key === data.scope)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="text-sm font-medium">ปีการศึกษา (ถ้ามี)<input maxLength={20} className={field} value={form.metadata?.academicYear || ''} onChange={e => setMeta('academicYear', e.target.value)} placeholder="เช่น 2570" /></label>
        </div>
        <details open={form.sourceQuestions?.length > 0 ? true : undefined} className="rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold">คำถามใกล้เคียงในแนวเดียวกัน ({form.aliases.filter(a => a.trim()).length})</summary>
          <p className="mt-3 text-xs leading-6 text-slate-500">รวมคำถามหลายรูปแบบให้ใช้คำตอบเดียวกัน ไม่ต้องเพิ่มหลายแถว • อย่ารวมคนละสาขา ปี หรือวุฒิผู้สมัคร</p>
          <label className="block text-sm"><span className="sr-only">คำถามใกล้เคียง</span><textarea rows={4} className={field} value={form.aliases.join('\n')} onChange={e => set('aliases', e.target.value.split('\n'))} placeholder="หนึ่งคำถามต่อบรรทัด สูงสุด 30 คำถาม" /></label>
        </details>
        <details className="rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold">รายละเอียดเพิ่มเติม (ไม่บังคับ)</summary>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">ประเภท<select className={field} value={form.category} onChange={e => set('category', e.target.value)}>{data.categories.map(category => <option key={category}>{category}</option>)}</select></label>
            <label className="block text-sm">แหล่งอ้างอิง<input type="url" maxLength={2000} className={field} value={form.metadata?.source || ''} onChange={e => setMeta('source', e.target.value)} placeholder="https://..." /></label>
            <label className="block text-sm">คำค้นเพิ่มเติม<input className={field} value={(form.metadata?.keywords || []).join(',')} onChange={e => setMeta('keywords', e.target.value.split(','))} placeholder="คั่นแต่ละคำด้วย ," /></label>
            <label className="block text-sm">หมายเหตุภายใน (ไม่ส่งให้ AI)<textarea rows={2} maxLength={10000} className={field} value={form.metadata?.notes || ''} onChange={e => setMeta('notes', e.target.value)} /></label>
          </div>
        </details>
        <p className="text-xs leading-6 text-slate-500">ตรวจข้อมูลก่อนบันทึก ไม่ใส่รหัสผ่านหรือข้อมูลส่วนบุคคล • ระบบไม่ส่งข้อความย้อนหลังไป LINE</p>
      </fieldset>
      <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
        <button type="button" disabled={busy} onClick={onClose} className={secondary}>ยกเลิก</button>
        <button disabled={busy} className={primary}>{busy ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}</button>
      </footer>
    </form>
  </dialog>;
}

export default function KnowledgeAdmin() {
  const [data, setData] = useState(null), [search, setSearch] = useState(''), [branch, setBranch] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null), [editorError, setEditorError] = useState(''), [selected, setSelected] = useState([]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await request()); setSelected([]); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [load]);
  const open = value => { setEditorError(''); setForm(value); };
  const save = async value => {
    if (busy) return;
    setBusy(true); setEditorError(''); setNotice('');
    const body = { ...value, status: 'published', aliases: [...new Set(value.aliases.map(a => a.trim()).filter(Boolean))], metadata: { ...value.metadata, keywords: [...new Set((value.metadata?.keywords || []).map(k => k.trim()).filter(Boolean))] } };
    try {
      await request(value.id ? '/answers/' + value.id : '/answers', { method: value.id ? 'PUT' : 'POST', body: JSON.stringify(body) });
      setForm(null); setNotice('บันทึกแล้ว AI ใช้ข้อมูลนี้ตอบได้ทันที'); await load();
    } catch (e) { setEditorError(e.message); }
    finally { setBusy(false); }
  };
  const remove = async row => {
    if (busy || !window.confirm('ลบแนวคำถาม “' + row.question + '” ใช่ไหม? AI จะไม่ใช้ข้อมูลนี้ในการค้นครั้งถัดไป')) return;
    setBusy(true); setError(''); setNotice('');
    try { await request('/answers/' + row.id, { method: 'DELETE', body: JSON.stringify({ version: row.version }) }); setNotice('ลบออกจากข้อมูลที่ AI ใช้งานแล้ว'); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const topics = useMemo(() => data?.answers.filter(row => row.status !== 'disabled') || [], [data]);
  const suggestions = useMemo(() => groupQuestions(data?.questions || []), [data]);
  const rows = topics.filter(row => (!branch || row.branch === branch) && [row.question, row.answer, row.aliases.join(' '), row.metadata?.academicYear || ''].join(' ').toLowerCase().includes(search.toLowerCase()));
  const addFromQuestions = () => {
    const sourceRows = suggestions.filter(group => selected.includes(group.key)).flatMap(group => group.rows);
    if (!sourceRows.length) return;
    if (new Set(sourceRows.map(row => row.branch)).size !== 1) { setError('เลือกคำถามในสาขาเดียวกันก่อนรวมเป็นแนวเดียว'); return; }
    if (sourceRows.length > 30) { setError('รวมได้ครั้งละไม่เกิน 30 รายการ'); return; }
    const first = sourceRows[0], targetBranch = first.branch === 'unassigned' ? data.scope : first.branch;
    open({ ...fresh(targetBranch), question: first.triage?.summary || first.question, category: first.category,
      aliases: [...new Set(sourceRows.map(row => row.triage?.summary || row.question))],
      sourceQuestions: sourceRows.map(({ id, version }) => ({ id, version })) });
  };
  return <div className="mx-auto max-w-6xl space-y-5 text-slate-900">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div><h1 className="text-2xl font-bold">ข้อมูลให้ AI</h1><p className="mt-2 text-sm text-slate-500">เพิ่มข้อมูลที่ถูกต้อง แล้วให้ AI ช่วยตอบคำถามแทนคุณ</p></div>
      {data?.canEdit && <button disabled={busy} className={primary} onClick={() => open(fresh(data.scope))}>+ เพิ่มข้อมูลให้ AI</button>}
    </header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
    {loading && <p role="status" className="text-sm text-slate-500">กำลังโหลดข้อมูล…</p>}
    {data && <>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <input aria-label="ค้นหาข้อมูลให้ AI" className={field + ' !mt-0 min-w-48 flex-1'} placeholder="ค้นหาแนวคำถามหรือคำตอบ…" value={search} onChange={e => setSearch(e.target.value)} />
          {data.scope === 'all' && <select aria-label="กรองสาขา" className={field + ' !mt-0 sm:!w-56'} value={branch} onChange={e => setBranch(e.target.value)}><option value="">ทุกสาขา</option>{Object.entries(data.branches).filter(([key]) => key !== 'unassigned').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>}
          <button disabled={loading || busy} onClick={load} className={secondary}>รีเฟรช</button>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="w-[30%] px-5 py-4 font-medium">แนวคำถาม</th><th className="px-5 py-4 font-medium">ข้อมูลคำตอบสำหรับ AI</th><th className="w-40 px-5 py-4 font-medium">จัดการ</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-orange-50/20">
            <td className="break-words px-5 py-5"><p className="font-semibold leading-6">{row.question}</p><p className="mt-2 text-xs text-slate-500">{data.branches[row.branch]}{row.metadata?.academicYear ? ' · ปี ' + row.metadata.academicYear : ''}</p>{row.aliases.length > 0 && <details className="mt-3 text-xs text-slate-500"><summary className="cursor-pointer">คำถามในแนวนี้อีก {row.aliases.length} แบบ</summary><ul className="mt-2 list-disc space-y-2 pl-4">{row.aliases.map((alias, i) => <li key={i}>{alias}</li>)}</ul></details>}</td>
            <td className="max-w-lg break-words px-5 py-5"><p className="line-clamp-3 whitespace-pre-wrap leading-7">{row.answer || 'ยังไม่ได้เพิ่มข้อมูลคำตอบ'}</p>{row.answer.length > 160 && <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-[#701D10]">อ่านทั้งหมด</summary><p className="mt-2 whitespace-pre-wrap leading-7">{row.answer}</p></details>}</td>
            <td className="px-5 py-5">{data.canEdit ? <div className="flex gap-3"><button disabled={busy} className="font-medium text-[#701D10] hover:underline disabled:opacity-50" onClick={() => open({ ...row, sourceQuestions: [] })}>แก้ไข</button><button disabled={busy} className="text-slate-500 hover:text-red-700 hover:underline disabled:opacity-50" onClick={() => remove(row)}>ลบ</button></div> : <span className="text-xs text-slate-400">ดูข้อมูล</span>}</td>
          </tr>)}{!rows.length && <tr><td colSpan={3} className="px-6 py-14 text-center"><p className="font-semibold">{topics.length ? 'ไม่พบข้อมูลที่ค้นหา' : 'เริ่มเพิ่มข้อมูลให้ AI'}</p><p className="mt-2 text-sm text-slate-500">{topics.length ? 'ลองเปลี่ยนคำค้นหรือเลือกสาขาอื่น' : 'เพิ่มแนวคำถามและคำตอบครั้งเดียว เพื่อให้ AI ใช้ตอบคำถามหลายรูปแบบ'}</p></td></tr>}</tbody>
        </table></div>
        <footer className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">{rows.length} แนวคำถาม · แสดงข้อมูลล่าสุดไม่เกิน {data.limit} รายการ{data.scope !== 'all' ? ' · ' + data.branches[data.scope] : ''}</footer>
      </section>
      <details className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-semibold">คำถามที่ควรเพิ่มข้อมูล <span className="ml-2 rounded-full bg-orange-50 px-2.5 py-1 text-xs text-[#701D10]">{suggestions.length}</span></summary>
        <p className="my-4 text-sm leading-6 text-slate-500">เรื่องที่ AI ยังไม่มีข้อมูลเพียงพอ เลือกคำถามที่ใช้คำตอบเดียวกันเพื่อเพิ่มเป็นแนวเดียว • คำถามต่างสาขา ปี หรือคุณสมบัติควรแยกกัน</p>
        {!suggestions.length ? <p className="py-4 text-sm text-slate-400">ยังไม่มีคำถามที่ต้องเพิ่มข้อมูล</p> : <>
          {data.canEdit && <button disabled={busy || !selected.length} onClick={addFromQuestions} className={primary + ' mb-4'}>เพิ่มข้อมูลจากคำถามที่เลือก ({selected.length})</button>}
          <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">{suggestions.map(group => <div key={group.key} className="flex items-start gap-3 py-4">
            {data.canEdit && <input type="checkbox" disabled={busy} aria-label={'เลือก ' + group.title} checked={selected.includes(group.key)} onChange={e => setSelected(previous => e.target.checked ? [...previous, group.key] : previous.filter(key => key !== group.key))} className="mt-1 h-4 w-4 accent-[#701D10]" />}
            <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{group.title}</p><p className="mt-1 text-xs text-slate-500">{data.branches[group.branch]} · ถาม {group.occurrences} ครั้ง</p><details className="mt-2 text-xs text-slate-500"><summary className="cursor-pointer">ดูข้อความที่ผู้ใช้ถาม</summary><ul className="mt-2 list-disc space-y-2 pl-4">{group.rows.map(row => <li className="whitespace-pre-wrap break-words" key={row.id}>{row.question}</li>)}</ul></details></div>
          </div>)}</div>
        </>}
      </details>
    </>}
    {form && <Editor initial={form} data={data} busy={busy} error={editorError} onSave={save} onClose={() => setForm(null)} />}
  </div>;
}
