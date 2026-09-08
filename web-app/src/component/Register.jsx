import { useState } from "react";
import { apiUrl } from "../config/api";
import { useNavigate } from "react-router-dom";

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
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !status) {
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
          name,
          status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // เก็บเพียงสถานะว่าเคยกรอกข้อมูลแล้ว ไม่เก็บข้อมูลส่วนบุคคลไว้ใน Cookie
        saveVisitorCookie();
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
    <div className="fixed inset-0 z-[999] flex min-h-screen items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#202020]/95 px-8 py-10 text-white shadow-2xl">
        {/* Logo */}
        <div className="mb-7">
          <img
            src="/image/logo.png"
            alt="Logo"
            className="mb-6 h-12 w-auto object-contain"
          />

          <h1 className="text-3xl font-bold">เข้าสู่เว็บไซต์</h1>

          <p className="mt-3 text-sm leading-6 text-gray-300">
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
            placeholder="ชื่อ"
            required
            className="w-full rounded-md bg-[#303030] px-4 py-4 text-sm text-white placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-[#7A0019]"
          />

          {/* สถานะ */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full rounded-md bg-[#303030] px-4 py-4 text-sm text-gray-300 outline-none transition focus:ring-2 focus:ring-[#7A0019]"
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
            className="mt-3 w-full rounded-full bg-[#7A0019] px-6 py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-[#950020] hover:shadow-lg hover:shadow-[#7A0019]/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : "เข้าสู่เว็บไซต์"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-7 border-t border-white/10 pt-5">
          <p className="text-xs leading-5 text-gray-400">
            ข้อมูลของคุณจะถูกบันทึกลงในระบบ
            เพื่อใช้สำหรับการเข้าเยี่ยมชมเว็บไซต์
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
