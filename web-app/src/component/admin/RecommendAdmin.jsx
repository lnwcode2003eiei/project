import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiUrl } from "../../config/api";

const pages = [
  ["history", "ประวัติคณะฯ", "lucide:landmark"],
  ["vision", "วิสัยทัศน์ พันธกิจ กลยุทธ์", "lucide:target"],
  ["structure", "โครงสร้างการบริหาร", "lucide:network"],
  ["executive", "ผู้บริหาร", "lucide:briefcase-business"],
  ["teacher", "คณาจารย์ / นักวิจัย", "lucide:graduation-cap"],
  ["department", "หน่วยงาน", "lucide:building-2"],
];

export default function RecommendAdmin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const selectedPage = pages.find(([pageSlug]) => pageSlug === slug);
  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(Boolean(slug));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug || !selectedPage) return;
    const controller = new AbortController();
    fetch(apiUrl(`/api/faculty-pages/${slug}`), { signal: controller.signal })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถโหลดข้อมูลได้");
        setForm({ title: data.page.title || "", content: data.page.content || "" });
      })
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug, selectedPage]);

  const savePage = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/faculty-pages/${slug}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถบันทึกข้อมูลได้");
      setMessage("บันทึกข้อมูลแล้ว หน้าเว็บไซต์อัปเดตทันที");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  if (!slug) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900">จัดการแนะนำคณะ</h1><p className="mt-2 text-sm text-gray-500">เลือกหัวข้อที่ต้องการแก้ไข</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map(([pageSlug, title, icon]) => <button key={pageSlug} type="button" onClick={() => navigate(`/admin/recommend/${pageSlug}`)} className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#7A0019]/30 hover:shadow-lg"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7A0019]/10 text-[#7A0019] transition group-hover:bg-[#7A0019] group-hover:text-white"><Icon icon={icon} className="text-2xl" /></span><h2 className="mt-5 text-lg font-bold text-gray-900">{title}</h2><p className="mt-2 text-sm text-gray-500">คลิกเพื่อแก้ไขข้อมูล</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7A0019]">จัดการหัวข้อ <Icon icon="lucide:arrow-right" /></span></button>)}
        </div>
      </div>
    );
  }

  if (!selectedPage) return <div className="py-20 text-center text-gray-500">ไม่พบหัวข้อที่ต้องการ</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/recommend" className="inline-flex items-center gap-2 text-sm font-bold text-[#7A0019] transition hover:text-[#5C0013]"><Icon icon="lucide:arrow-left" />กลับไปยังหัวข้อทั้งหมด</Link>
      <form onSubmit={savePage} className="mt-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7A0019]/10 text-[#7A0019]"><Icon icon={selectedPage[2]} className="text-2xl" /></span><div><h1 className="text-xl font-bold text-gray-900">แก้ไข {selectedPage[1]}</h1><p className="text-xs text-gray-500">เฉพาะ Super Admin</p></div></div>
        {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        {loading ? <p className="py-16 text-center text-sm text-gray-400">กำลังโหลดข้อมูล...</p> : <div className="mt-6 space-y-5"><label className="block text-sm font-bold text-gray-700">หัวข้อ<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#7A0019] focus:bg-white" /></label><label className="block text-sm font-bold text-gray-700">เนื้อหา<textarea required rows={14} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="mt-2 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 leading-7 outline-none focus:border-[#7A0019] focus:bg-white" /></label><div className="flex justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#7A0019] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5C0013] disabled:bg-gray-400"><Icon icon="lucide:save" />{saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button></div></div>}
      </form>
    </div>
  );
}
