import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { apiUrl } from "../../config/api";

const branches = [
  ["computer", "วิศวกรรมคอมพิวเตอร์"],
  ["computer-ai", "คอมพิวเตอร์และปัญญาประดิษฐ์"],
  ["construction", "วิศวกรรมบริหารงานก่อสร้าง"],
  ["digital", "เทคโนโลยีดิจิทัลเพื่อการออกแบบ"],
  ["electrical", "เทคโนโลยีไฟฟ้า"],
  ["energy", "วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม"],
  ["industrial", "เทคโนโลยีอุตสาหการ"],
  ["logistics", "วิศวกรรมโลจิสติกส์"],
  ["management", "การจัดการงานวิศวกรรม"],
  ["survey", "เทคโนโลยีสำรวจและภูมิสารสนเทศ"],
];

const branchName = Object.fromEntries(branches);
const emptyApprovedForm = { first_name: "", last_name: "", saka_path: "" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [approvedForm, setApprovedForm] = useState(emptyApprovedForm);
  const [editingApprovedId, setEditingApprovedId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingApproved, setSavingApproved] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingApproved, setDeletingApproved] = useState(false);
  const [adminDeleteTarget, setAdminDeleteTarget] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);
  const [approvedMessage, setApprovedMessage] = useState("");
  const [approvedError, setApprovedError] = useState("");

  const requestHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });
  const currentAdminId = Number(JSON.parse(localStorage.getItem("adminUser") || "{}").id);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const response = await fetch(apiUrl("/api/admin/users"), {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
        setUsers(data.users);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchApprovedUsers = async () => {
      try {
        const response = await fetch(apiUrl("/api/admin/approved-users"), {
          headers: requestHeaders(),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถโหลดรายชื่อที่อนุญาตได้");
        setApprovedUsers(data.users);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setApprovedError(loadError.message);
      }
    };

    fetchApprovedUsers();
    return () => controller.abort();
  }, []);

  const handleApprovedSubmit = async (event) => {
    event.preventDefault();
    setApprovedError("");
    setApprovedMessage("");
    setSavingApproved(true);
    try {
      const response = await fetch(apiUrl(editingApprovedId ? `/api/admin/approved-users/${editingApprovedId}` : "/api/admin/approved-users"), {
        method: editingApprovedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...requestHeaders() },
        body: JSON.stringify(approvedForm),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถบันทึกรายชื่อได้");
      setApprovedUsers((current) => editingApprovedId
        ? current.map((user) => user.id === editingApprovedId ? data.user : user)
        : [...current, data.user]);
      setApprovedForm(emptyApprovedForm);
      setEditingApprovedId(null);
      setApprovedMessage(editingApprovedId ? "แก้ไขรายชื่อแล้ว" : "บันทึกรายชื่อที่อนุญาตแล้ว");
    } catch (submitError) {
      setApprovedError(submitError.message);
    } finally {
      setSavingApproved(false);
    }
  };

  const startApprovedEdit = (user) => {
    setApprovedError("");
    setApprovedMessage("");
    setEditingApprovedId(user.id);
    setApprovedForm({ first_name: user.first_name, last_name: user.last_name, saka_path: user.saka_path });
  };

  const cancelApprovedEdit = () => {
    setEditingApprovedId(null);
    setApprovedForm(emptyApprovedForm);
    setApprovedError("");
  };

  const deleteApprovedUser = async () => {
    if (!deleteTarget) return;
    setApprovedError("");
    setApprovedMessage("");
    setDeletingApproved(true);
    try {
      const response = await fetch(apiUrl(`/api/admin/approved-users/${deleteTarget.id}`), {
        method: "DELETE",
        headers: requestHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถลบรายชื่อได้");
      setApprovedUsers((current) => current.filter((item) => item.id !== deleteTarget.id));
      if (editingApprovedId === deleteTarget.id) cancelApprovedEdit();
      setDeleteTarget(null);
      setApprovedMessage(data.message || "ลบรายชื่อและบัญชีผู้ดูแลแล้ว");
    } catch (deleteError) {
      setApprovedError(deleteError.message);
    } finally {
      setDeletingApproved(false);
    }
  };

  const deleteAdminUser = async () => {
    if (!adminDeleteTarget) return;
    setError("");
    setDeletingAdmin(true);
    try {
      const response = await fetch(apiUrl(`/api/admin/users/${adminDeleteTarget.id}`), {
        method: "DELETE",
        headers: requestHeaders(),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "ไม่สามารถลบบัญชีผู้ดูแลได้");
      setUsers((current) => current.filter((user) => user.id !== adminDeleteTarget.id));
      setAdminDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingAdmin(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <p className="mt-2 text-sm text-gray-500">ตรวจสอบบัญชีผู้ดูแล และกำหนดรายชื่อที่อนุญาตให้สมัครบัญชี</p>
      </div>

      <div>
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6"><h2 className="text-xl font-bold text-gray-900">รายชื่อผู้ดูแล</h2></div>
          {error && <p className="m-6 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          {loading ? <p className="p-6 text-sm text-gray-400">กำลังโหลดข้อมูล...</p> : (
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-6 py-3">ชื่อ–นามสกุล</th><th className="px-6 py-3">ชื่อผู้ใช้</th><th className="px-6 py-3">สาขา</th><th className="px-6 py-3 text-right">จัดการ</th></tr></thead><tbody className="divide-y divide-gray-100">{users.map((user) => <tr key={user.id}><td className="px-6 py-4 font-semibold text-gray-900">{user.first_name} {user.last_name}</td><td className="px-6 py-4 text-gray-600">{user.username}</td><td className="px-6 py-4 text-gray-600">{user.saka_path === "all" ? "ทุกสาขา (Super Admin)" : branchName[user.saka_path] || user.saka_path}</td><td className="px-6 py-4 text-right">{user.saka_path === "all" ? <span className="text-xs font-medium text-[#7A0019]">Super Admin</span> : user.id === currentAdminId ? <span className="text-xs font-medium text-gray-400">บัญชีที่กำลังใช้</span> : <button type="button" onClick={() => setAdminDeleteTarget(user)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"><Icon icon="lucide:trash-2" />ลบ</button>}</td></tr>)}</tbody></table></div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[#7A0019]/15 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">รายชื่อที่อนุญาตให้สร้างบัญชี</h2>
            <p className="mt-1 text-sm text-gray-500">ผู้สมัครต้องกรอกชื่อและนามสกุลตรงกับรายชื่อนี้ จึงจะสร้างบัญชีผู้ดูแลได้</p>
          </div>
          <span className="w-fit rounded-full bg-[#7A0019]/10 px-3 py-1 text-xs font-bold text-[#7A0019]">Super Admin เท่านั้น</span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
          <div className="rounded-xl border border-gray-100">
            {approvedUsers.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">ยังไม่มีรายชื่อที่อนุญาต</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {approvedUsers.map((user) => (
                  <li key={user.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A0019]/10 text-sm font-bold text-[#7A0019]">{user.first_name.charAt(0)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{branchName[user.saka_path] || user.saka_path}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => startApprovedEdit(user)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#7A0019]/20 px-3 py-1.5 text-xs font-bold text-[#7A0019] transition hover:bg-[#7A0019]/10"><Icon icon="lucide:pencil" />แก้ไข</button>
                      <button type="button" onClick={() => setDeleteTarget(user)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"><Icon icon="lucide:trash-2" />ลบ</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form className="space-y-4 rounded-xl bg-gray-50 p-5" onSubmit={handleApprovedSubmit}>
            <h3 className="font-bold text-gray-900">{editingApprovedId ? "แก้ไขรายชื่อ" : "เพิ่มรายชื่อ"}</h3>
            {approvedError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{approvedError}</p>}
            {approvedMessage && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{approvedMessage}</p>}
            <label className="block text-sm font-semibold text-gray-700">ชื่อจริง<input required value={approvedForm.first_name} onChange={(e) => setApprovedForm({ ...approvedForm, first_name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#7A0019]" /></label>
            <label className="block text-sm font-semibold text-gray-700">นามสกุล<input required value={approvedForm.last_name} onChange={(e) => setApprovedForm({ ...approvedForm, last_name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#7A0019]" /></label>
            <label className="block text-sm font-semibold text-gray-700">สาขา<select required value={approvedForm.saka_path} onChange={(e) => setApprovedForm({ ...approvedForm, saka_path: e.target.value })} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#7A0019]"><option value="">เลือกสาขา</option>{branches.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div className="flex gap-3">
              {editingApprovedId && <button type="button" onClick={cancelApprovedEdit} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-100">ยกเลิก</button>}
              <button disabled={savingApproved} className="flex-1 rounded-xl bg-[#7A0019] py-3 text-sm font-bold text-white transition hover:bg-[#5C0013] disabled:bg-gray-400">{savingApproved ? "กำลังบันทึก..." : editingApprovedId ? "บันทึกการแก้ไข" : "บันทึกรายชื่อ"}</button>
            </div>
          </form>
        </div>
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#7A0019] via-[#b20a36] to-[#e36a86]" />
            <div className="p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Icon icon="lucide:trash-2" className="text-3xl" /></div>
              <h3 id="delete-dialog-title" className="mt-5 text-xl font-bold text-slate-900">ยืนยันการลบรายชื่อ</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">คุณต้องการลบ <span className="font-bold text-slate-700">{deleteTarget.first_name} {deleteTarget.last_name}</span> ออกจากรายชื่อที่อนุญาตใช่หรือไม่?</p>
              <p className="mt-2 text-xs text-red-500">การลบนี้จะลบบัญชีผู้ใช้และรหัสผ่านออกจากระบบด้วย</p>
              <div className="mt-7 flex gap-3">
                <button type="button" disabled={deletingApproved} onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
                <button type="button" disabled={deletingApproved} onClick={deleteApprovedUser} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:bg-slate-400"><Icon icon="lucide:trash-2" />{deletingApproved ? "กำลังลบ..." : "ยืนยันการลบ"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-admin-dialog-title">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-[#7A0019] via-[#b20a36] to-[#e36a86]" />
            <div className="p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600"><Icon icon="lucide:user-x" className="text-3xl" /></div>
              <h3 id="delete-admin-dialog-title" className="mt-5 text-xl font-bold text-slate-900">ยืนยันลบบัญชีผู้ดูแล</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">ต้องการลบบัญชี <span className="font-bold text-slate-700">{adminDeleteTarget.username}</span> ของ {adminDeleteTarget.first_name} {adminDeleteTarget.last_name} ใช่หรือไม่?</p>
              <p className="mt-2 text-xs text-red-500">ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้อีก</p>
              <div className="mt-7 flex gap-3">
                <button type="button" disabled={deletingAdmin} onClick={() => setAdminDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
                <button type="button" disabled={deletingAdmin} onClick={deleteAdminUser} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:bg-slate-400"><Icon icon="lucide:user-x" />{deletingAdmin ? "กำลังลบ..." : "ยืนยันการลบ"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
