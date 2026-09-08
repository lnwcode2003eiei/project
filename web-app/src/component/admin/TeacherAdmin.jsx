import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../config/api";

const empty = { group_name: "", full_name: "", position: "", profile_link: "", display_order: 0 };

export default function TeacherAdmin() {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const token = localStorage.getItem("token") || "";

  const load = () => fetch(apiUrl("/api/faculty-teachers")).then((response) => response.json()).then((data) => data.success && setTeachers(data.teachers));
  const resetForm = () => { setForm(empty); setEditing(null); setImageFile(null); setImagePreview(""); };
  useEffect(() => { load(); }, []);

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 5 * 1024 * 1024) {
      setMessage("กรุณาเลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB");
      event.target.value = "";
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.group_name.trim() || !form.full_name.trim() || !form.position.trim()) {
      setMessage("กรุณากรอกกลุ่มหลักสูตร ชื่อ–นามสกุล และตำแหน่งให้ครบ");
      return;
    }
    setMessage("");
    setIsSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (imageFile) payload.append("image", imageFile);
      const response = await fetch(apiUrl(editing ? `/api/admin/faculty-teachers/${editing}` : "/api/admin/faculty-teachers"), { method: editing ? "PATCH" : "POST", headers: { Authorization: `Bearer ${token}` }, body: payload });
      const data = await response.json();
      if (data.success) { setMessage(editing ? "แก้ไขรายชื่อแล้ว" : "เพิ่มรายชื่อแล้ว"); resetForm(); load(); } else setMessage(data.message || "ไม่สามารถบันทึกข้อมูลได้");
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อระบบเพื่อบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("ต้องการลบรายชื่อนี้หรือไม่?")) return;
    const response = await fetch(apiUrl(`/api/admin/faculty-teachers/${id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (data.success) { setMessage(data.message); load(); } else setMessage(data.message || "ไม่สามารถลบได้");
  };

  const beginEdit = (teacher) => {
    setEditing(teacher.id);
    setForm({ group_name: teacher.group_name, full_name: teacher.full_name, position: teacher.position, profile_link: teacher.profile_link || "", display_order: teacher.display_order || 0 });
    setImageFile(null);
    setImagePreview(teacher.image_filename ? apiUrl(`/uploads/teachers/${teacher.image_filename}`) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isError = message.includes("ไม่สามารถ") || message.includes("กรุณา") || message.includes("http");
  return <div className="mx-auto max-w-6xl"><Link to="/admin/recommend" className="text-sm font-bold text-[#7A0019]">กลับไปยังหัวข้อทั้งหมด</Link><div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.4fr]"><form onSubmit={save} className="rounded-2xl bg-white p-6 shadow-sm"><h1 className="text-xl font-bold">{editing ? "แก้ไขคณาจารย์" : "เพิ่มคณาจารย์ / นักวิจัย"}</h1>{message && <p className={`mt-3 rounded-lg p-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</p>}<div className="mt-5 space-y-4"><label className="block text-sm font-bold">กลุ่มหลักสูตร<input value={form.group_name} onChange={(event) => setForm({ ...form, group_name: event.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label><label className="block text-sm font-bold">ชื่อ–นามสกุล<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label><label className="block text-sm font-bold">ตำแหน่ง<input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label><label className="block text-sm font-bold">ลิงก์รายละเอียด<input type="url" value={form.profile_link} onChange={(event) => setForm({ ...form, profile_link: event.target.value })} placeholder="https://example.com" className="mt-2 w-full rounded-xl border p-3 font-normal" /><span className="mt-2 block text-xs font-normal text-gray-500">เมื่อกดรูปภาพบนหน้าเว็บ ระบบจะเปิดลิงก์นี้</span></label><label className="block text-sm font-bold">รูปภาพ<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} className="mt-2 block w-full cursor-pointer rounded-xl border p-3 text-sm font-normal" /><span className="mt-2 block text-xs font-normal text-gray-500">รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5 MB</span>{imagePreview && <img src={imagePreview} alt="ตัวอย่างรูปภาพ" className="mt-3 h-44 w-full rounded-xl border bg-gray-50 object-contain" />}</label><div className="flex gap-3"><button type="submit" disabled={isSaving} className="flex-1 rounded-xl bg-[#7A0019] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มรายชื่อ"}</button>{editing && <button type="button" onClick={resetForm} className="rounded-xl border px-4">ยกเลิก</button>}</div></div></form><section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">รายชื่อทั้งหมด</h2><div className="mt-4 space-y-3">{teachers.map((teacher) => <div key={teacher.id} className="flex items-center justify-between rounded-xl border p-4"><div className="flex items-center gap-3">{teacher.image_filename && <img src={apiUrl(`/uploads/teachers/${teacher.image_filename}`)} alt="" className="h-12 w-12 rounded-lg object-cover" />}<div><p className="font-bold">{teacher.full_name}</p><p className="text-sm text-gray-500">{teacher.group_name} · {teacher.position}</p>{teacher.profile_link && <p className="mt-1 text-xs text-[#7A0019]">มีลิงก์รายละเอียด</p>}</div></div><div className="flex gap-2"><button type="button" onClick={() => beginEdit(teacher)} className="rounded-lg border px-3 py-2 text-sm text-[#7A0019]">แก้ไข</button><button type="button" onClick={() => remove(teacher.id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600">ลบ</button></div></div>)}</div></section></div></div>;
}
