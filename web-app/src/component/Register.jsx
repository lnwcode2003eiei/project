import { useState } from "react";
import { apiUrl } from "../config/api";
import { useNavigate } from "react-router-dom";
import { saveVisitorName } from "../config/visitor";

const VISITOR_COOKIE = "industrial_technology_visitor";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 3;

const hasVisitorCookie = () =>
  document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${VISITOR_COOKIE}=`));

const saveVisitorCookie = () => {
  document.cookie = [
    `${VISITOR_COOKIE}=1`,
    `Max-Age=${VISITOR_COOKIE_MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
  ].join("; ");
};

function Register() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(() => !hasVisitorCookie());
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ((!anonymous && !name.trim()) || !status) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl("/api/visitors"), {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: anonymous ? "ไม่ระบุชื่อ" : name.trim(),
          anonymous,
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // เก็บเพียงสถานะว่าเคยกรอกข้อมูลแล้ว ไม่เก็บข้อมูลส่วนบุคคลไว้ใน Cookie
        saveVisitorCookie();
        saveVisitorName(anonymous ? "" : name.trim());
        setIsOpen(false);

        navigate("/home");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถเชื่อมต่อ Server ได้");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-4 py-5"
    >
      <div className="max-h-[calc(100dvh-2.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-yellow-200 border-t-8 border-t-yellow-400 bg-white px-6 py-8 text-stone-800 shadow-2xl sm:px-8">
        {/* Logo */}
        <div className="mb-7">
          <img
            src="/image/logo.png"
            alt="Logo"
            className="mb-6 h-auto w-full rounded-xl bg-[#991B1B] px-4 py-4 object-contain"
          />

          <h1 className="text-3xl font-bold text-black">เข้าสู่เว็บไซต์</h1>

          <p className="mt-3 text-sm leading-6 text-stone-600">
            กรุณากรอกข้อมูลเพื่อเข้าสู่เว็บไซต์ คณะเทคโนโลยีอุตสาหกรรม
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อ */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อ-นามสกุล"
            autoComplete="name"
            required={!anonymous}
            disabled={anonymous}
            aria-label="ชื่อ-นามสกุล"
            className="w-full rounded-xl border border-yellow-300 bg-white px-4 py-4 text-sm text-black placeholder-black outline-none transition focus:border-red-700 focus:ring-2 focus:ring-yellow-400 disabled:cursor-not-allowed disabled:border-stone-200"
          />

          <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-700">
            <input type="checkbox" checked={anonymous}
              onChange={(event) => {
                setAnonymous(event.target.checked);
                if (event.target.checked) setName("");
              }}
              className="h-5 w-5 accent-[#B91C1C]" />
            ไม่ระบุชื่อ
          </label>

          {/* สถานะ */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            aria-label="สถานะผู้เข้าชม"
            className="w-full rounded-xl border border-yellow-300 bg-white px-4 py-4 text-sm text-black outline-none transition focus:border-red-700 focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">เลือกสถานะ</option>

            <option value="นักเรียน">นักเรียน</option>

            <option value="นักศึกษา">นักศึกษา</option>

            <option value="ครู">ครู</option>

            <option value="ผู้ปกครอง">ผู้ปกครอง</option>
          </select>

          {/* ปุ่ม */}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-full bg-[#B91C1C] px-6 py-4 text-sm font-bold text-white shadow-md shadow-red-900/15 transition-all duration-300 hover:bg-[#991B1B] hover:shadow-lg focus-visible:outline-yellow-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : "เข้าสู่เว็บไซต์"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-7 border-t border-yellow-200 pt-5">
          <p className="text-xs leading-5 text-stone-500">
            ข้อมูลของคุณจะถูกบันทึกลงในระบบ
            เพื่อใช้สำหรับการเข้าเยี่ยมชมเว็บไซต์
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
