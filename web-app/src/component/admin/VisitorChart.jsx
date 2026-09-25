import { useEffect, useState } from 'react';
import { apiUrl } from '../../config/api';
import { visitRange, visitBars, visitBarLink } from './visitChart';
import { Link } from 'react-router-dom';

const dateLabel = (value) => new Date(`${value}T00:00:00Z`).toLocaleDateString('th-TH', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
export default function VisitorChart() {
  const [mode, setMode] = useState('year');
  const [selected, setSelected] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  const [result, setResult] = useState({ key: '', rows: [], error: '' });
  const range = visitRange(mode, selected);
  const start = range?.start;
  const end = range?.end;
  const key = `${start}/${end}`;
  useEffect(() => {
    if (!start || !end) return;
    const controller = new AbortController();
    fetch(apiUrl(`/api/admin/dashboard/visits?start=${start}&end=${end}`), { signal: controller.signal, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(async response => {
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(response.status === 401 ? 'กรุณาเข้าสู่ระบบใหม่' : 'โหลดสถิติไม่สำเร็จ กรุณาลองเปลี่ยนช่วงเวลาอีกครั้ง');
        if (!controller.signal.aborted) setResult({ key, rows: body.data, error: '' });
      }).catch(error => { if (!controller.signal.aborted) setResult({ key, rows: [], error: error.message }); });
    return () => controller.abort();
  }, [start, end, key]);
  const loading = result.key !== key;
  const bars = visitBars(mode, range, result.rows);
  const total = bars.reduce((sum, item) => sum + item.value, 0);
  const peak = Math.max(0, ...bars.map(item => item.value));
  const scale = Math.max(4, Math.ceil(peak / 4) * 4);
  const peakLabels = bars.filter(item => item.value === peak).map(item => item.label).join(', ');
  return <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-xl font-bold text-black">สถิติผู้เข้าชมเว็บไซต์</h2>
    <div className="my-4 flex flex-wrap items-end gap-4">
      <label className="text-sm">รูปแบบการแสดงผล<select className="mt-1 block rounded-lg border border-gray-300 p-2" value={mode} onChange={e => setMode(e.target.value)}>
        <option value="week">รายสัปดาห์</option><option value="month">รายเดือน</option><option value="year">รายปี</option>
      </select></label>
      <label className="text-sm">{mode === 'year' ? 'เลือกปี (ค.ศ.)' : mode === 'month' ? 'เลือกเดือนและปี' : 'เลือกวันที่ในสัปดาห์ (จันทร์–อาทิตย์)'}
        <input className="mt-1 block rounded-lg border border-gray-300 p-2" type={mode === 'year' ? 'number' : mode === 'month' ? 'month' : 'date'}
          min={mode === 'year' ? '1900' : mode === 'month' ? '1900-01' : '1900-01-01'} max={mode === 'year' ? '9998' : mode === 'month' ? '9998-12' : '9998-12-31'}
          value={mode === 'year' ? selected.slice(0, 4) : mode === 'month' ? selected.slice(0, 7) : selected}
          onChange={e => setSelected(mode === 'year' ? `${e.target.value}-01-01` : mode === 'month' ? `${e.target.value}-01` : e.target.value)} />
      </label>
    </div>
    {!range ? <p role="alert">กรุณาเลือกวันที่หรือปีให้ถูกต้อง</p> : <>
      <p className="text-sm text-gray-600">{dateLabel(range.start)} – {dateLabel(range.last)}</p>
      <p className="mt-1 text-xs text-gray-500">นับตามวันที่บันทึกในระบบ เช่นเดียวกับสถิติเดิม</p>
      <p className="mt-2 text-sm text-[#701D10]">คลิกแท่งกราฟเพื่อดูรายชื่อผู้เข้าชมในช่วงนั้น</p>
      {loading ? <p role="status" className="py-20 text-center">กำลังโหลดสถิติ...</p> : result.error ? <p role="alert" className="py-10 text-red-700">{result.error}</p> : <>
        <div className="my-5 flex flex-wrap gap-4 border-b pb-4">
          <p>รวมช่วงที่เลือก <strong className="text-xl text-[#701D10]">{total.toLocaleString()}</strong> ครั้ง</p>
          <p title={peakLabels}>สูงสุด <strong>{peak.toLocaleString()}</strong> ครั้ง{peak > 0 && <span className="ml-2 text-sm text-gray-600">{bars.filter(item => item.value === peak).length > 1 ? 'หลายช่วงเท่ากัน' : peakLabels}</span>}</p>
        </div>
        {total === 0 && <p role="status" className="mb-3 text-gray-600">ไม่มีผู้เข้าชมในช่วงที่เลือก</p>}
        <div className="overflow-x-auto" role="region" aria-label="กราฟจำนวนผู้เข้าชม" tabIndex={0}>
          <div className="relative h-80" style={{ minWidth: Math.max(360, bars.length * 42) }}>
            <div className="absolute bottom-8 left-0 right-0 top-6 flex flex-col justify-between" aria-hidden="true">{[4, 3, 2, 1, 0].map(n => <div key={n} className="flex items-center"><span className="w-10 text-xs text-gray-600">{scale * n / 4}</span><div className="flex-1 border-t border-dashed border-gray-200" /></div>)}</div>
            <div className="absolute bottom-8 left-10 right-0 top-6 flex items-end gap-2">{bars.map(item => <div key={item.key} className="relative flex h-full min-w-0 flex-1 items-end justify-center" title={`${item.key}: ${item.value} ครั้ง`}>
              <Link to={visitBarLink(item.key)} aria-label={`ดูรายชื่อผู้เข้าชม ${item.key} จำนวน ${item.value} รายการ`} className="relative block w-full max-w-12 rounded-t-lg bg-[#701D10] hover:bg-[#a3311d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#701D10]" style={{ height: `${item.value / scale * 100}%`, minHeight: 4 }}><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-black">{item.value}</span></Link>
              <span className="absolute -bottom-7 whitespace-nowrap text-xs text-gray-700">{item.label}</span>
            </div>)}</div>
          </div>
        </div>
      </>}
    </>}
  </section>;
}
