import { useState } from 'react';
function Names({ title, rows }) {
  const [open, setOpen] = useState(false), [search, setSearch] = useState(''), [page, setPage] = useState(0);
  const filtered = rows.filter(row => (row.name || '').toLowerCase().includes(search.trim().toLowerCase()));
  return <section className="min-w-0 rounded-2xl border border-gray-200 border-t-4 border-t-[#701D10] bg-white p-5">
    <h3 className="font-bold">{title}</h3><p className="my-3 text-3xl font-bold">{rows.length.toLocaleString()} <span className="text-sm font-normal">รายการ</span></p>
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="rounded-lg bg-[#701D10] px-4 py-2 text-sm text-white">{open ? 'ปิดรายชื่อ' : 'ดูรายชื่อ'}</button>
    {open && <div className="mt-4">
      <input aria-label={'ค้นหา' + title} placeholder="ค้นหาชื่อ…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="w-full rounded-lg border p-2" />
      <ol className="my-3 text-sm">{filtered.slice(page * 10, page * 10 + 10).map((row, i) => <li key={i} className="break-words border-b py-2">{page * 10 + i + 1}. {row.name || 'ไม่ระบุชื่อ'}{row.page ? ` · หน้า ${row.page}` : ''}</li>)}</ol>
      {!filtered.length && <p>ไม่พบรายชื่อ</p>}
      <div className="flex items-center justify-between gap-2 text-sm"><button type="button" disabled={!page} onClick={() => setPage(p => p - 1)} className="rounded border p-2 disabled:opacity-40">ก่อนหน้า</button><span>{page + 1}/{Math.max(1, Math.ceil(filtered.length / 10))}</span><button type="button" disabled={(page + 1) * 10 >= filtered.length} onClick={() => setPage(p => p + 1)} className="rounded border p-2 disabled:opacity-40">ถัดไป</button></div>
    </div>}
  </section>;
}
export default function ComparisonNames({ result }) {
  const rosters = result.rosters || { visitors: [], interested: [], passed: result.people || [] };
  return <div className="grid gap-4 lg:grid-cols-3">{[['visitors', 'ผู้เข้าชมทั้งหมด'], ['interested', 'ผู้สนใจทั้งหมด'], ['passed', 'ผู้สอบผ่านที่อ่านได้']].map(([key, title]) => <Names key={key + result.generatedAt} title={title} rows={rosters[key] || []} />)}</div>;
}
