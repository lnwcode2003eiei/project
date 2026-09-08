
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [branch, setBranch] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const navigate = useNavigate();

  const lookupApprovedBranch = async () => {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    if (!normalizedFirstName || !normalizedLastName) {
      setBranch("");
      return;
    }

    setErrorMsg("");
    setBranch("");

    try {
      const response = await fetch(apiUrl("/api/admin/approved-users/lookup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "ไม่พบสาขาที่ได้รับอนุญาต");
      }

      setBranch(data.saka_path);
    } catch (error) {
      setErrorMsg(error.message || "ไม่สามารถตรวจสอบสาขาได้");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setLoading(true);

    try {
      const response = await fetch(
        apiUrl("/api/admin/login"),
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username,
            password,
          }),
        },
      );

      const data = await response.json();

      // ==========================================
      // Login สำเร็จ
      // ==========================================

      if (response.ok && data.success) {
        // ตรวจสอบว่ามีข้อมูล user จาก server จริง
        if (!data.user) {
          throw new Error(
            "เซิร์ฟเวอร์ไม่ได้ส่งข้อมูลผู้ดูแลระบบกลับมา",
          );
        }

        // ==========================================
        // Token
        // ==========================================

        localStorage.setItem(
          "token",
          data.token || "",
        );

        // ==========================================
        // Username
        // ==========================================

        localStorage.setItem(
          "username",
          data.user.username || username,
        );

        // ==========================================
        // สิทธิ์สาขา
        // ==========================================

        localStorage.setItem(
          "userRole",
          data.user.saka_path || "all",
        );

        // ==========================================
        // สิทธิ์แก้ไข
        //
        // 1 = แก้ไขได้
        // 0 = ดูอย่างเดียว
        // ==========================================

        localStorage.setItem(
          "canEdit",
          String(
            Number(
              data.user.can_edit ?? 0,
            ),
          ),
        );

        // ==========================================
        // เก็บข้อมูล Admin ทั้งหมด
        // ==========================================

        const adminUser = {
          id: data.user.id,
          username: data.user.username || username,
          first_name: data.user.first_name || "",
          last_name: data.user.last_name || "",
          saka_path:
            data.user.saka_path || "all",
          can_edit:
            Number(
              data.user.can_edit ?? 0,
            ),
        };

        localStorage.setItem(
          "adminUser",
          JSON.stringify(adminUser),
        );

        // ==========================================
        // Remember Me
        // ==========================================

        if (remember) {
          localStorage.setItem(
            "rememberAdmin",
            "true",
          );
        } else {
          localStorage.removeItem(
            "rememberAdmin",
          );
        }

        // ==========================================
        // แสดงข้อมูลใน Console
        // ==========================================

        console.log(
          "✅ Login สำเร็จ",
        );

        console.log(
          "Username:",
          adminUser.username,
        );

        console.log(
          "Saka:",
          adminUser.saka_path,
        );

        console.log(
          "Can Edit:",
          adminUser.can_edit,
        );

        // ==========================================
        // ไปหน้า Admin
        // ==========================================

        navigate("/admin");
      } else {
        setErrorMsg(
          data.message ||
            "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        );
      }
    } catch (error) {
      console.error(
        "❌ Login error:",
        error,
      );

      setErrorMsg(
        error.message ||
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const response = await fetch(apiUrl("/api/admin/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          saka_path: branch,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "ไม่สามารถสร้างบัญชีได้");
      }

      setErrorMsg("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setBranch("");
      setIsRegistering(false);
      setRegistrationSuccess(true);
    } catch (error) {
      setErrorMsg(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setErrorMsg("");
    setPassword("");
    setIsRegistering((current) => !current);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 font-sans md:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:min-h-[620px] md:grid-cols-2">
        <section className="relative flex min-h-[320px] flex-col justify-end bg-[#7a0016] p-8 text-white md:min-h-full md:p-12">
          <img
            src="/image/BGadmin.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 flex -translate-y-12 items-center justify-center text-white/8" aria-hidden="true">
            <Icon icon="fa6-solid:gear" className="animate-[spin_18s_linear_infinite] text-[11rem] sm:text-[14rem]" />
          </div>

          <div className="relative z-10 max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Industrial Technology
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">
              คณะเทคโนโลยีอุตสาหกรรม
            </h2>
            <button
              type="button"
              onClick={switchMode}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#7a0016] shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              <Icon icon="lucide:user-round-plus" className="text-lg" aria-hidden="true" />
              {isRegistering ? "กลับไปเข้าสู่ระบบ" : "สร้างบัญชีผู้ดูแล"}
            </button>
          </div>
        </section>

        <section className="flex flex-col justify-center p-8 sm:p-10 md:p-12">

        {/* ================================= */}
        {/* Header */}
        {/* ================================= */}

        <div className="mx-auto flex h-16 w-16 items-center justify-center text-[#7a0016]">
          <Icon icon="lucide:shield-user" className="text-5xl" aria-hidden="true" />
        </div>

        <h1 className="mt-0 text-center text-2xl font-bold tracking-tight text-[#7a0016]">
          {isRegistering ? "สร้างบัญชีผู้ดูแล" : "เข้าสู่ระบบ Admin"}
        </h1>

        <p className="mt-2 text-center text-xs text-slate-500">
          {isRegistering
            ? "กรอกชื่อและนามสกุล ระบบจะแสดงสาขาที่ได้รับอนุญาตอัตโนมัติ"
            : "ระบบจัดการเว็บไซต์คณะเทคโนโลยีอุตสาหกรรม"}
        </p>

        {/* ================================= */}
        {/* Error */}
        {/* ================================= */}

        {errorMsg && (
          <div className="mt-5 w-full rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600">
            {errorMsg}
          </div>
        )}

        {/* ================================= */}
        {/* Form */}
        {/* ================================= */}

        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="mt-6 w-full space-y-4"
        >
          {isRegistering && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">ชื่อจริง</label>
                <input type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); setBranch(""); }} onBlur={lookupApprovedBranch} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-[#7a0016] focus:bg-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">นามสกุล</label>
                <input type="text" value={lastName} onChange={(e) => { setLastName(e.target.value); setBranch(""); }} onBlur={lookupApprovedBranch} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-[#7a0016] focus:bg-white" />
              </div>
            </div>
          )}

          {/* Username */}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value,
                )
              }
              placeholder="Username"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#7a0016] focus:bg-white"
            />
          </div>

          {/* Password */}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value,
                  )
                }
                placeholder="Password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={isRegistering ? 8 : undefined}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#7a0016] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-[#7a0016]"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} className="text-xl" />
              </button>
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">สาขา</label>
              <input
                type="text"
                value={branches.find(([value]) => value === branch)?.[1] || "กรอกชื่อและนามสกุลเพื่อค้นหาสาขา"}
                readOnly
                aria-label="สาขาที่ได้รับอนุญาต"
                className="w-full cursor-default rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-700 outline-none"
              />
            </div>
          )}

          {/* Remember */}

          {!isRegistering && <div className="flex items-center pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) =>
                setRemember(
                  e.target.checked,
                )
              }
              className="h-4 w-4 rounded border-slate-300 accent-[#7a0016]"
            />

            <label
              htmlFor="remember"
              className="ml-2 cursor-pointer text-xs font-medium text-slate-600"
            >
              จดจำการเข้าสู่ระบบ
            </label>
          </div>}

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#7a0016] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#600011] hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading
              ? isRegistering ? "กำลังสร้างบัญชี..." : "กำลังเข้าสู่ระบบ..."
              : isRegistering ? "สร้างบัญชี" : "เข้าสู่ระบบ"}
          </button>

        </form>
        </section>
      </div>

      {registrationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="register-success-title" className="w-full max-w-md overflow-hidden rounded-3xl bg-white text-center shadow-2xl">
            <div className="h-2 bg-gradient-to-r from-[#7a0016] via-[#b3123a] to-[#7a0016]" />
            <div className="p-8 sm:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
                <Icon icon="lucide:badge-check" className="text-5xl" aria-hidden="true" />
              </div>
              <h2 id="register-success-title" className="mt-6 text-2xl font-bold text-slate-900">สร้างบัญชีสำเร็จกรุณาเข้าสู่ระบบ</h2>
              <p className="mt-3 leading-7 text-slate-500">บัญชีผู้ดูแลของคุณพร้อมใช้งานแล้ว<br />กรุณาเข้าสู่ระบบเพื่อเริ่มจัดการเว็บไซต์</p>
              <button type="button" onClick={() => setRegistrationSuccess(false)} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7a0016] px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-[#600011] hover:shadow-xl">
                <Icon icon="lucide:log-in" className="text-xl" aria-hidden="true" />
                เข้าสู่ระบบ
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

