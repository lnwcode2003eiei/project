import ImageFileInput from "./ImageFileInput";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../../config/api";

export default function StructureAdmin() {
  const [files, setFiles] = useState([]);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token") || "";
  const load = useCallback(() => fetch(apiUrl("/api/faculty-structure-images")).then((response) => response.json()).then((data) => data.success && setImages(data.images || [])).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const chooseImages = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    if (selected.length > 10 || selected.some((file) => !file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 8 * 1024 * 1024)) {
      setMessage("เลือกรูปได้ครั้งละไม่เกิน 10 รูป และแต่ละรูปต้องเป็น JPG, PNG หรือ WebP ขนาดไม่เกิน 8 MB");
      event.target.value = "";
      return;
    }
    setFiles(selected);
    setMessage("");
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!files.length) { setMessage("กรุณาเลือกรูปผังองค์กรก่อน"); return; }
    setSaving(true); setMessage("");
    try {
      const payload = new FormData(); files.forEach((file) => payload.append("images", file));
      const response = await fetch(apiUrl("/api/admin/faculty-structure-images"), { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: payload });
      const data = await response.json(); setMessage(data.message); if (data.success) { setFiles([]); load(); }
    } catch { setMessage("ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง"); }
    finally { setSaving(false); }
  };

  const remove = async (image) => {
    if (!window.confirm("ต้องการลบรูปผังองค์กรนี้หรือไม่?")) return;
    const response = await fetch(apiUrl(`/api/admin/faculty-structure-images/${image.id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json(); setMessage(data.message); if (data.success) load();
  };

  const isError = message.includes("กรุณา") || message.includes("ไม่สามารถ") || message.includes("ต้องเป็น");
  return <div className="mx-auto max-w-5xl"><Link to="/admin/recommend" className="text-sm font-bold text-[#7A0019]">กลับไปยังหัวข้อทั้งหมด</Link><form onSubmit={upload} className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8"><h1 className="text-2xl font-bold">อัปโหลดรูปโครงสร้างการบริหาร</h1><p className="mt-2 text-sm text-gray-500">เลือกรูปผังองค์กรได้หลายรูป ระบบจะแสดงทั้งหมดบนหน้าเว็บไซต์ตามลำดับที่อัปโหลด</p>{message && <p className={`mt-5 rounded-xl p-3 text-sm ${isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</p>}<label className="mt-6 block rounded-2xl border-2 border-dashed border-[#7A0019]/30 bg-[#fffafb] p-6 text-center"><span className="block font-bold text-[#7A0019]">เลือกรูปผังองค์กร</span><span className="mt-2 block text-sm text-gray-500">รองรับ JPG, PNG, WebP ขนาดไม่เกิน 8 MB ต่อรูป · เลือกได้ครั้งละ 10 รูป</span><ImageFileInput selectedFiles={files}  multiple accept="image/jpeg,image/png,image/webp" onChange={chooseImages} className="mx-auto mt-4 block w-full max-w-md cursor-pointer rounded-xl border bg-white p-3 text-sm" /></label>{files.length > 0 && <div className="mt-6"><p className="mb-3 text-sm font-bold text-gray-700">รูปที่รออัปโหลด ({files.length} รูป)</p><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{files.map((file) => <img key={`${file.name}-${file.lastModified}`} src={URL.createObjectURL(file)} alt={file.name} className="h-36 w-full rounded-xl border bg-gray-50 object-contain p-2" />)}</div></div>}<div className="mt-6 flex justify-end"><button disabled={saving} className="rounded-xl bg-[#7A0019] px-6 py-3 font-bold text-white disabled:bg-gray-400">{saving ? "กำลังอัปโหลด..." : "บันทึกรูปผังองค์กร"}</button></div></form><section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-bold">รูปผังองค์กรทั้งหมด</h2>{images.length === 0 ? <p className="py-10 text-center text-gray-400">ยังไม่มีรูปผังองค์กร</p> : <div className="mt-5 grid gap-5 sm:grid-cols-2">{images.map((image, index) => <article key={image.id} className="rounded-2xl border bg-gray-50 p-3"><img src={apiUrl(`/uploads/structure/${image.image_filename}`)} alt={`ผังองค์กร ${index + 1}`} className="h-64 w-full rounded-xl bg-white object-contain" /><div className="mt-3 flex items-center justify-between"><span className="text-sm font-bold text-gray-700">รูปที่ {index + 1}</span><button type="button" onClick={() => remove(image)} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">ลบรูป</button></div></article>)}</div>}</section></div>;
}
