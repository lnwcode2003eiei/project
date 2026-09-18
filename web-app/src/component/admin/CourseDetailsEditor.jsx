import { useEffect, useState } from "react";
import { apiUrl } from "../../config/api";
import { detailIcons } from "../../config/courseDetails";

const groups = [["objectives", "วัตถุประสงค์ของหลักสูตร"], ["standards", "มาตรฐานการเรียนรู้ / TQF"], ["plos", "ผลลัพธ์การเรียนรู้ระดับหลักสูตร (PLO)"], ["documents", "เอกสารที่เกี่ยวข้อง"], ["supports", "สิ่งสนับสนุนการเรียนการสอน"]];
const fieldClass = "mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#7A0019] focus:outline-none focus:ring-1 focus:ring-[#7A0019]";
function Field({ label, value, onChange, multiline = false, ...props }) {
  const Tag = multiline ? "textarea" : "input";
  return <label className="block text-sm font-medium">{label}<Tag {...props} rows={multiline ? 4 : undefined} className={fieldClass} value={value || ""} onChange={event => onChange(event.target.value)} /></label>;
}
export default function CourseDetailsEditor({ slug }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(`/api/course-details/${slug}`), { signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "โหลดข้อมูลไม่สำเร็จ");
      setData(body.data); setError("");
    }).catch(error => { if (error.name !== "AbortError") setError(error.message); });
    return () => controller.abort();
  }, [slug, retry]);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const change = (key, value) => { setData(previous => ({ ...previous, [key]: value })); setDirty(true); setMessage(""); };
  const changeRow = (key, index, field, value) => change(key, data[key].map((row, i) => i === index ? { ...row, [field]: value } : row));
  const save = async event => {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("กรุณาเข้าสู่ระบบ Admin ใหม่");
      const response = await fetch(apiUrl(`/api/course-details/${slug}`), { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "บันทึกไม่สำเร็จ");
      setData(body.data); setDirty(false); setMessage("บันทึกข้อมูลเพิ่มเติมแล้ว — แสดงในหน้าสาขาเมื่อโหลดหน้าใหม่");
    } catch (error) { setError(error.message); }
    finally { setSaving(false); }
  };
  return <details className="mb-8 rounded-2xl border border-rose-200 bg-white shadow-sm">
    <summary className="cursor-pointer p-5 text-lg font-bold text-[#7A0019]">ข้อมูลเพิ่มเติมของสาขา — ปรัชญา / มาตรฐาน & PLO / สิ่งสนับสนุน / ติดต่อ{dirty ? " (ยังไม่บันทึก)" : ""}</summary>
    {!data ? <div className="p-5" role="status">{error || "กำลังโหลดข้อมูล..."}{error && <button type="button" className="ml-3 underline" onClick={() => setRetry(value => value + 1)}>ลองใหม่</button>}</div> : <form onSubmit={save} className="space-y-8 border-t p-5 sm:p-8">
      <p className="text-sm text-gray-600">ข้อมูลแยกสำหรับสาขา {slug} เท่านั้น กรุณากรอกข้อมูลที่ยืนยันแล้ว ช่องว่างจะแสดงว่าอยู่ระหว่างจัดเตรียมข้อมูล ส่วนนี้มีปุ่มบันทึกแยกจากเนื้อหาหลักสูตรเดิม</p>
      <fieldset disabled={saving} className="space-y-8 disabled:opacity-60">
        <Field label="ปรัชญาของหลักสูตร" multiline maxLength={10000} value={data.philosophy} onChange={value => change("philosophy", value)} />
        <Field label="คำอธิบายมาตรฐานการเรียนรู้ / TQF และ PLO" multiline maxLength={10000} value={data.standardsIntro} onChange={value => change("standardsIntro", value)} />
        {groups.map(([key, title]) => <section key={key} className="space-y-4 rounded-xl border border-gray-200 p-4">
          <h3 className="text-lg font-bold text-[#7A0019]">{title}</h3>
          {data[key].map((row, index) => <div key={index} className="space-y-4 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3"><span className="font-semibold">รายการที่ {index + 1}</span><button type="button" className="text-red-700 underline" onClick={() => { if (window.confirm("ลบรายการนี้? การลบจะมีผลเมื่อกดบันทึก")) change(key, data[key].filter((_, i) => i !== index)); }}>ลบรายการ</button></div>
            <Field label="ชื่อ / หัวข้อ *" required maxLength={250} value={row.title} onChange={value => changeRow(key, index, "title", value)} />
            <Field label="รายละเอียด" multiline maxLength={5000} value={row.description} onChange={value => changeRow(key, index, "description", value)} />
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">ไอคอน<select className={fieldClass} value={row.icon} onChange={event => changeRow(key, index, "icon", event.target.value)}>{Object.entries(detailIcons).map(([id, [label]]) => <option key={id} value={id}>{label}</option>)}</select></label>
              <Field label="ลิงก์รายละเอียด / เอกสาร (http หรือ https)" type="url" maxLength={1000} value={row.url} onChange={value => changeRow(key, index, "url", value)} /></div>
          </div>)}
          <button type="button" disabled={data[key].length >= 40} className="rounded-lg border border-[#7A0019] px-4 py-2 font-semibold text-[#7A0019] disabled:opacity-40" onClick={() => change(key, [...data[key], { title: "", description: "", icon: "book", url: "" }])}>+ เพิ่มรายการ</button>
        </section>)}
        <section className="space-y-4 rounded-xl border border-gray-200 p-4"><h3 className="text-lg font-bold text-[#7A0019]">การติดต่อ</h3>
          {[["name", "ชื่อหน่วยงาน / ผู้ติดต่อ", "text", 250], ["phone", "โทรศัพท์", "tel", 100], ["email", "อีเมล", "email", 250], ["url", "ลิงก์เว็บไซต์ / ช่องทางติดต่อ", "url", 1000], ["address", "ที่อยู่ / สถานที่ติดต่อ", "text", 2000]].map(([key, label, type, maxLength]) => <Field key={key} label={label} type={type} maxLength={maxLength} multiline={key === "address"} value={data.contact[key]} onChange={value => change("contact", { ...data.contact, [key]: value })} />)}
        </section>
      </fieldset>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{message}</p>}
      <button type="submit" disabled={saving || !dirty} className="rounded-xl bg-[#7A0019] px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? "กำลังบันทึก..." : "บันทึกข้อมูลเพิ่มเติมของสาขา"}</button>
    </form>}
  </details>;
}
