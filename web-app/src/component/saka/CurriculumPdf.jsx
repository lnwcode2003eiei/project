import { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';

export function CurriculumTable({ data }) {
  const courses = (data.rows || []).filter(row => /^\d{6,8}$/.test(row.code) && !['category', 'total'].includes(row.type));
  return <div className="space-y-5 text-left">
    <div><h3 className="text-xl font-bold text-[#701D10]">{data.title || 'รายวิชาในหลักสูตร'}</h3>{data.year && <p className="mt-2 text-gray-600">ปีหลักสูตร {data.year}</p>}</div>
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xl"><table className="w-full min-w-[420px] border-collapse text-left text-sm">
      <thead className="bg-[#701D10] text-white"><tr><th className="w-32 px-5 py-4">รหัสวิชา</th><th className="px-5 py-4">ชื่อวิชา</th><th className="w-36 px-5 py-4 text-center">หน่วยกิต</th></tr></thead>
      <tbody>{courses.map((row, i) => <tr key={i} className="border-b border-gray-100 odd:bg-slate-50 text-gray-800"><td className="px-5 py-4 font-mono">{row.code}</td><td className="px-5 py-4 break-words">{row.name}</td><td className="px-5 py-4 text-center whitespace-nowrap">{row.credits}</td></tr>)}{!courses.length && <tr><td colSpan={3} className="p-8 text-center text-gray-500">ยังไม่มีรายวิชาที่ตรวจสอบแล้ว</td></tr>}</tbody>
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
  return <section className="bg-white px-5 py-12"><div className="mx-auto max-w-5xl"><CurriculumTable data={result.data} /></div></section>;
}
