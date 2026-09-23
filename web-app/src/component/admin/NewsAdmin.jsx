import ImageFileInput from "./ImageFileInput";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { apiUrl } from "../../config/api";

function NewsAdmin() {
  const [news, setNews] = useState([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  // เปลี่ยนจาก string เป็น File
  const [image, setImage] = useState(null);

  // สำหรับ preview
  const [imagePreview, setImagePreview] = useState("");
  const [editingNews, setEditingNews] = useState(null);

  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successDialog, setSuccessDialog] = useState("");
  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
  const currentAdminId = Number(adminUser.id);
  const isSuperAdmin = adminUser.saka_path === "all";

  const loadNews = useCallback(async () => {
    try {
      const response = await fetch(apiUrl("/api/news"));

      const data = await response.json();

      if (data.success) {
        setNews(data.news);
      }
    } catch (error) {
      console.error("โหลดข่าวไม่สำเร็จ:", error);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadNews, 0);
    return () => window.clearTimeout(timer);
  }, [loadNews]);

  // ==========================================
  // เลือกรูปภาพ
  // ==========================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setImage(null);
      setImagePreview("");
      return;
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      alert("รองรับเฉพาะ JPG, PNG และ WebP");
      e.target.value = "";
      return;
    }

    // จำกัด 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดรูปภาพต้องไม่เกิน 5MB");
      e.target.value = "";
      return;
    }

    setImage(file);

    // สร้าง preview
    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  // ==========================================
  // Submit
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !category || !description) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setLoading(true);

    try {
      // ใช้ FormData สำหรับส่งไฟล์
      const formData = new FormData();

      formData.append("title", title);
      formData.append("category", category);
      formData.append("description", description);

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(apiUrl(editingNews ? `/api/news/${editingNews.id}` : "/api/news"), {
        method: editingNews ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccessDialog(editingNews ? "แก้ไขข่าวสำเร็จ" : "เพิ่มข่าวสำเร็จ");

        // ล้างข้อมูล
        setTitle("");
        setCategory("");
        setDescription("");
        setImage(null);
        setImagePreview("");
        setEditingNews(null);

        // ล้าง input file
        const fileInput = document.getElementById("news-image");

        if (fileInput) {
          fileInput.value = "";
        }

        // โหลดข่าวใหม่
        loadNews();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);

      alert("ไม่สามารถเชื่อมต่อ Express Server ได้");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setMessage("");
    setErrorMessage("");
    setEditingNews(item);
    setTitle(item.title || "");
    setCategory(item.category || "");
    setDescription(item.description || "");
    setImage(null);
    setImagePreview(item.image ? apiUrl(item.image) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingNews(null);
    setTitle("");
    setCategory("");
    setDescription("");
    setImage(null);
    setImagePreview("");
    const fileInput = document.getElementById("news-image");
    if (fileInput) fileInput.value = "";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setErrorMessage("");
    try {
      const response = await fetch(apiUrl(`/api/news/${deleteTarget.id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถลบข่าวได้");
      setNews((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMessage("ลบข่าวแล้ว");
    } catch (deleteError) {
      setErrorMessage(deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* ================================= */}
      {/* Header */}
      {/* ================================= */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">จัดการข่าวสาร</h1>

        <p className="mt-2 text-sm text-gray-500">
          เพิ่มข่าวสารที่จะแสดงบนหน้าเว็บไซต์
        </p>
      </div>

      {/* ================================= */}
      {/* Add News */}
      {/* ================================= */}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{editingNews ? "แก้ไขข่าว" : "เพิ่มข่าวใหม่"}</h2>

          <p className="mt-1 text-sm text-gray-500">
            {editingNews ? "แก้ไขรายละเอียดหรือเปลี่ยนรูปภาพของข่าว" : "ข้อมูลที่เพิ่มจะไปแสดงบนหน้า News"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              หัวข้อข่าว
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="กรอกหัวข้อข่าว"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-[#701D10] focus:bg-white focus:ring-2 focus:ring-[#701D10]/10"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              หมวดหมู่
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-[#701D10] focus:bg-white"
            >
              <option value="">เลือกหมวดหมู่</option>

              <option value="ประกาศรับสมัคร">ประกาศรับสมัคร</option>

              <option value="กิจกรรม">กิจกรรม</option>

              <option value="ผลงานนักศึกษา">ผลงานนักศึกษา</option>

              <option value="อบรม">อบรม</option>

              <option value="ความร่วมมือ">ความร่วมมือ</option>

              <option value="ประกาศ">ประกาศ</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              รายละเอียดข่าว
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="กรอกรายละเอียดข่าว"
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-[#701D10] focus:bg-white focus:ring-2 focus:ring-[#701D10]/10"
            />
          </div>

          {/* ================================= */}
          {/* Upload Image */}
          {/* ================================= */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              รูปภาพข่าว
            </label>

            <ImageFileInput selectedFiles={image}
              id="news-image"

              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[#701D10] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#093341]"
            />

            <p className="mt-2 text-xs text-gray-400">
              รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5MB
            </p>
          </div>

          {/* ================================= */}
          {/* Preview */}
          {/* ================================= */}

          {imagePreview && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                ตัวอย่างรูปภาพ
              </p>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-64 w-full object-cover"
                />
              </div>

              {image?.name && <p className="mt-2 text-xs text-gray-400">{image.name}</p>}
            </div>
          )}

          {/* Submit */}

          <div className="flex justify-end gap-3">
            {editingNews && <button type="button" onClick={cancelEdit} disabled={loading} className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-600 transition hover:bg-gray-50">ยกเลิก</button>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#701D10] px-6 py-3 font-semibold text-white transition hover:bg-[#093341] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก..." : editingNews ? "บันทึกการแก้ไข" : "เพิ่มข่าว"}
            </button>
          </div>
        </form>
      </div>

      {/* ================================= */}
      {/* News List */}
      {/* ================================= */}

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">ข่าวทั้งหมด</h2>

            <p className="mt-1 text-sm text-gray-500">
              ข่าวที่บันทึกอยู่ในระบบ
            </p>
          </div>

          <button
            onClick={loadNews}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            ↻ รีเฟรช
          </button>
        </div>

        {message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p>}
        {errorMessage && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{errorMessage}</p>}

        <div className="mt-6 space-y-4">
          {news.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-10 text-center text-sm text-gray-400">
              ยังไม่มีข่าวสาร
            </div>
          ) : (
            news.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50 md:flex-row"
              >
                {/* Image */}
                <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-gray-100 md:w-48">
                  {item.image ? (
                    <img
                      src={apiUrl(item.image)}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      ไม่มีรูปภาพ
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#701D10]/10 px-3 py-1 text-xs font-semibold text-[#701D10]">
                      {item.category}
                    </span>

                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString("th-TH")}
                    </span>
                    </div>
                    {(isSuperAdmin || Number(item.created_by_admin_id) === currentAdminId) && (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => startEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#701D10]/20 px-3 py-1.5 text-xs font-bold text-[#701D10] transition hover:bg-[#701D10]/10"><Icon icon="lucide:pencil" />แก้ไข</button>
                        <button type="button" onClick={() => { setMessage(""); setErrorMessage(""); setDeleteTarget(item); }} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"><Icon icon="lucide:trash-2" />ลบข่าว</button>
                      </div>
                    )}
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-gray-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {successDialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-success-dialog-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#701D10] via-[#701D10] to-[#F7941D]" />
            <div className="px-7 py-8 text-center sm:px-9">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
                <Icon icon="lucide:circle-check-big" className="text-5xl" />
              </div>
              <h3
                id="news-success-dialog-title"
                className="mt-6 text-2xl font-bold text-slate-900"
              >
                {successDialog}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                ระบบบันทึกข้อมูลเรียบร้อยแล้ว และข่าวพร้อมแสดงบนหน้าเว็บไซต์
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => setSuccessDialog("")}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#701D10] px-5 py-3.5 font-bold text-white shadow-lg shadow-[#701D10]/20 transition hover:bg-[#093341]"
              >
                <Icon icon="lucide:check" className="text-xl" />
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-news-dialog-title">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#701D10] via-[#701D10] to-[#F7941D]" />
            <div className="p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Icon icon="lucide:trash-2" className="text-3xl" /></div>
              <h3 id="delete-news-dialog-title" className="mt-5 text-xl font-bold text-slate-900">ยืนยันการลบข่าว</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">ต้องการลบข่าว <span className="font-bold text-slate-700">{deleteTarget.title}</span> ใช่หรือไม่?</p>
              <p className="mt-2 text-xs text-red-500">ข่าวและรูปภาพที่แนบจะถูกลบออกจากระบบ</p>
              <div className="mt-7 flex gap-3">
                <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
                <button type="button" disabled={deleting} onClick={handleDelete} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:bg-slate-400"><Icon icon="lucide:trash-2" />{deleting ? "กำลังลบ..." : "ยืนยันการลบ"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsAdmin;
