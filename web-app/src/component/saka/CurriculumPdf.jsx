import { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';
import { curriculumTotal, rowType } from '../../config/curriculumTable';

export function CurriculumTable({ data }) {
  return <div className="space-y-5 text-left">
    <div><h3 className="text-xl font-bold text-[#701D10]">{data.title || 'โครงสร้างหลักสูตรและรายวิชา'}</h3>{data.year && <p className="mt-2 text-gray-600">ปีหลักสูตร {data.year}</p>}</div>
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xl"><table className="w-full min-w-[420px] border-collapse text-left text-sm">
      <thead className="bg-black text-white"><tr><th className="border-r border-gray-800 px-5 py-4 text-center">รายละเอียดหมวดวิชา</th><th className="w-32 px-5 py-4 text-center sm:w-40">หน่วยกิต</th></tr></thead>
      <tbody>{(data.rows || []).filter(row => rowType(row) !== 'total').map((row, i) => {
        const category = rowType(row) === 'category';
        return <tr key={i} className={category ? 'border-b border-red-900 bg-[#701D10] font-bold text-white' : 'border-b border-gray-100 bg-slate-50/50 text-gray-700'}><td className={`whitespace-pre-wrap break-words py-3.5 pr-5 ${category ? 'pl-5' : 'pl-10'}`}>{row.code ? row.code + ' ' : ''}{row.name}</td><td className={`border-l px-5 py-3.5 text-center ${category ? 'border-red-800' : 'border-gray-100'}`}>{row.credits || '—'}</td></tr>;
      })}{!data.rows?.length && <tr><td colSpan={2} className="p-8 text-center text-gray-500">อัปโหลด PDF หรือเพิ่มหมวดวิชาเพื่อแสดงข้อมูลในตารางนี้</td></tr>}</tbody>
      <tfoot className="bg-black font-bold text-white"><tr><td className="px-5 py-4 text-right">รวมจำนวนหน่วยกิตตลอดหลักสูตร</td><td className="border-l border-gray-800 px-5 py-4 text-center text-red-300">{curriculumTotal(data.rows || [])}</td></tr></tfoot>
    </table></div>
  </div>;
}
export default function CurriculumPdf({ slug, children }) {
  const [result, setResult] = useState({ loading: true, data: null, error: false });
  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(`/api/curriculum-pdf/${slug}`), { signal: controller.signal }).then(async res => {
      const body = await res.json(); if (!res.ok || !body.success) throw new Error();
      setResult({ loading: false, data: body.data, error: false });
    }).catch(e => { if (e.name !== 'AbortError') setResult({ loading: false, data: null, error: true }); });
    return () => controller.abort();
  }, [slug]);
  if (result.loading) return <p className="p-8 text-center" role="status">กำลังโหลดหลักสูตร…</p>;
  if (!result.data) return <>{result.error && <p role="alert" className="p-4 text-center text-red-700">โหลดข้อมูล PDF ไม่สำเร็จ แสดงข้อมูลหลักสูตรเดิม</p>}{children}</>;
  return <section className="bg-white px-5 py-12"><div className="mx-auto max-w-5xl space-y-6"><CurriculumTable data={result.data} /><a className="inline-flex rounded-xl bg-[#701D10] px-5 py-3 font-semibold text-white" href={apiUrl(`/api/curriculum-pdf/${slug}/files/${result.data.fileId}`)} target="_blank" rel="noopener noreferrer">ดูรายละเอียดหลักสูตร PDF ↗<span className="sr-only"> (เปิดหน้าต่างใหม่)</span></a></div></section>;
}
