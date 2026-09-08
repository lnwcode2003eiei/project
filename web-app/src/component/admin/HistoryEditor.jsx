import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../config/api";

const emptyEvent = { date_label: "", title: "", description: "", side: "left", icon: "lucide:building-2" };

export default function HistoryEditor() {
  const [form, setForm] = useState({ hero_title: "", hero_subtitle: "", events: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/faculty-history"), { signal: controller.signal })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถโหลดข้อมูลได้");
        setForm({ hero_title: data.history.hero_title, hero_subtitle: data.history.hero_subtitle, events: data.events });
      })
      .catch((loadError) => { if (loadError.name !== "AbortError") setError(loadError.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const updateEvent = (index, field, value) => setForm((current) => ({ ...current, events: current.events.map((event, eventIndex) => eventIndex === index ? { ...event, [field]: value } : event) }));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setMessage(""); setError("");
    try {
      const response = await fetch(apiUrl("/api/admin/faculty-history"), { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` }, body: JSON.stringify(form) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถบันทึกข้อมูลได้"); setMessage(data.message);
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-4xl"><Link to="/admin/recommend" className="text-sm font-bold text-[#7A0019]">กลับไปยังหัวข้อทั้งหมด</Link><form onSubmit={save} className="mt-5 space-y-6">{error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}{message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><h1 className="text-xl font-bold text-gray-900">แก้ไขประวัติและความเป็นมา</h1><p className="mt-1 text-sm text-gray-500">ข้อความส่วนหัวของหน้า</p>{loading ? <p className="py-10 text-center text-sm text-gray-400">กำลังโหลดข้อมูล...</p> : <div className="mt-5 space-y-4"><label className="block text-sm font-bold text-gray-700">หัวข้อ<input required value={form.hero_title} onChange={(event) => setForm({ ...form, hero_title: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#7A0019]" /></label><label className="block text-sm font-bold text-gray-700">คำโปรย<textarea required rows={3} value={form.hero_subtitle} onChange={(event) => setForm({ ...form, hero_subtitle: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#7A0019]" /></label></div>}</section>{!loading && <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-gray-900">ไทม์ไลน์</h2><p className="mt-1 text-sm text-gray-500">เพิ่ม แก้ไข หรือลบเหตุการณ์ได้</p></div><button type="button" onClick={() => setForm({ ...form, events: [...form.events, { ...emptyEvent, id: `new-${Date.now()}` }] })} className="rounded-xl bg-[#7A0019] px-4 py-2.5 text-sm font-bold text-white">เพิ่มเหตุการณ์</button></div><div className="mt-6 space-y-5">{form.events.map((item, index) => <article key={item.id || index} className="rounded-2xl border border-gray-100 bg-gray-50 p-5"><div className="flex items-center justify-between"><span className="font-bold text-[#7A0019]">เหตุการณ์ที่ {index + 1}</span><button type="button" onClick={() => setForm({ ...form, events: form.events.filter((_, eventIndex) => eventIndex !== index) })} className="text-sm font-bold text-red-600">ลบ</button></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-gray-700">ป้ายวันที่<input required value={item.date_label} onChange={(event) => updateEvent(index, "date_label", event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" /></label><label className="text-sm font-bold text-gray-700">ตำแหน่ง<select value={item.side} onChange={(event) => updateEvent(index, "side", event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5"><option value="left">ฝั่งซ้าย</option><option value="right">ฝั่งขวา</option></select></label></div><label className="mt-4 block text-sm font-bold text-gray-700">หัวข้อ<input required value={item.title} onChange={(event) => updateEvent(index, "title", event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5" /></label><label className="mt-4 block text-sm font-bold text-gray-700">รายละเอียด<textarea required rows={4} value={item.description} onChange={(event) => updateEvent(index, "description", event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 leading-7" /></label></article>)}</div></section>}<div className="flex justify-end"><button disabled={saving || loading} className="rounded-xl bg-[#7A0019] px-6 py-3 font-bold text-white disabled:bg-gray-400">{saving ? "กำลังบันทึก..." : "บันทึกข้อมูลทั้งหมด"}</button></div></form></div>;
}
