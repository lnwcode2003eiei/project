import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { apiUrl } from "../config/api";
import { getVisitorName } from "../config/visitor";

  // 📌 แยกข้อมูลสาขาวิชาตามระดับการศึกษา
  const bachelorMajors = [
    {
      id: "elec-tech",
      name: "เทคโนโลยีไฟฟ้า",
      degree: "ทล.บ. (เทคโนโลยีบัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2565",
      icon: "mdi:lightning-bolt",
    },
    {
      id: "digital-design",
      name: "เทคโนโลยีดิจิทัลเพื่อการออกแบบ",
      degree: "ทล.บ. (เทคโนโลยีบัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2569",
      icon: "mdi:palette",
    },
    {
      id: "ind-tech",
      name: "เทคโนโลยีอุตสาหการ",
      degree: "ทล.บ. (เทคโนโลยีบัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2565",
      icon: "mdi:factory",
    },
    {
      id: "survey-tech",
      name: "เทคโนโลยีสำรวจและภูมิสารสนเทศ",
      degree: "ทล.บ. (เทคโนโลยีบัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2569",
      icon: "mdi:map-marker-radius",
    },
    {
      id: "comp-eng",
      name: "วิศวกรรมคอมพิวเตอร์",
      degree: "วศ.บ. (วิศวกรรมศาสตร์บัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2569",
      icon: "mdi:laptop",
    },
    {
      id: "logistics-eng",
      name: "วิศวกรรมโลจิสติกส์",
      degree: "วศ.บ. (วิศวกรรมศาสตร์บัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2569",
      icon: "mdi:truck-fast",
    },
    {
      id: "energy-mgt-eng",
      name: "วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม",
      degree: "วศ.บ. (วิศวกรรมศาสตร์บัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2567",
      icon: "mdi:leaf",
    },
    {
      id: "const-mgt-eng",
      name: "วิศวกรรมบริหารงานก่อสร้าง",
      degree: "วศ.บ. (วิศวกรรมศาสตร์บัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2570",
      icon: "mdi:crane",
    },
  ];

  const masterMajors = [
    {
      id: "eng-mgt-master",
      name: "การจัดการงานวิศวกรรม",
      degree: "วศ.ม. (วิศวกรรมศาสตร์มหาบัณฑิต)",
      desc: "หลักสูตรปรับปรุง พ.ศ. 2569",
      icon: "mdi:chart-box",
    },
    {
      id: "comp-ai-master",
      name: "วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์",
      degree: "วศ.ม. (วิศวกรรมศาสตร์มหาบัณฑิต)",
      desc: "หลักสูตรใหม่ พ.ศ. 2568",
      icon: "mdi:robot",
    },
  ];


export default function ApplyPage() {
  const [params] = useSearchParams();
  const initialMajor = [...bachelorMajors, ...masterMajors].find(major => major.id === params.get("major")) || null;
  const [selectedMajor, setSelectedMajor] = useState(initialMajor);
  const [isModalOpen, setIsModalOpen] = useState(Boolean(initialMajor));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLineQr, setShowLineQr] = useState(false);
  const [formError, setFormError] = useState("");
  const [activeTab, setActiveTab] = useState(masterMajors.some(major => major.id === initialMajor?.id) ? "master" : "bachelor"); // 'bachelor' หรือ 'master'

  const [formData, setFormData] = useState({
    fullname: getVisitorName(),
    oldSchool: "",
    education: "มัธยมศึกษาปีที่ 6 (ม.6)",
    secondMajor: "",
  });

  const handleOpenModal = (major) => {
    setFormData((current) => ({ ...current, fullname: current.fullname || getVisitorName() }));
    setSelectedMajor(major);
    if (masterMajors.some((item) => item.id === major.id)) {
      setFormData((current) => ({ ...current, secondMajor: "" }));
    }
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(apiUrl("/api/applications"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          major_name: selectedMajor.name,
          fullname: formData.fullname.trim(),
          old_school: formData.oldSchool.trim(),
          education: formData.education,
          second_major_name: masterMajors.some((major) => major.id === selectedMajor.id)
            ? ""
            : formData.secondMajor,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          fullname: getVisitorName(),
          oldSchool: "",
          education: "มัธยมศึกษาปีที่ 6 (ม.6)",
          secondMajor: "",
        });
        setIsModalOpen(false);
        setShowLineQr(true);
      } else {
        setFormError(data.message || "ไม่สามารถบันทึกความสนใจได้");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      setFormError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMajors = activeTab === "bachelor" ? bachelorMajors : masterMajors;

  return (
    <div className="min-h-screen bg-white pt-20 text-[#171717]">
      <div className="bg-[#7A0019] px-6 py-16 md:py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
        {/* หัวข้อหน้า */}
        <div className="text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/70">
            Program Interests
          </p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            เลือกสาขาที่สนใจ
          </h1>
          <p className="mx-auto max-w-2xl text-base font-normal text-white/85">
            คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏอุตรดิตถ์
          </p>
        </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-10 lg:px-12">

        {/* 📌 แถบสลับระดับการศึกษา (Tabs) */}
        <div className="flex justify-center mb-10">
          <div className="flex w-full max-w-md gap-2 rounded-xl bg-[#7A0019]/10 p-1.5 shadow-inner">
            <button
              onClick={() => setActiveTab("bachelor")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "bachelor"
                  ? "bg-white text-[#7A0019] shadow-md"
                  : "text-[#171717]/65 hover:text-[#7A0019]"
              }`}
            >
              <Icon icon="mdi:school-outline" className="text-lg" />
              ปริญญาตรี
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "bachelor"
                    ? "bg-red-50 text-[#7A0019]"
                    : "bg-white/80 text-[#171717]/70"
                }`}
              >
                {bachelorMajors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("master")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "master"
                  ? "bg-white text-[#7A0019] shadow-md"
                  : "text-[#171717]/65 hover:text-[#7A0019]"
              }`}
            >
              <Icon icon="mdi:school" className="text-lg" />
              ปริญญาโท
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === "master"
                    ? "bg-red-50 text-[#7A0019]"
                    : "bg-white/80 text-[#171717]/70"
                }`}
              >
                {masterMajors.length}
              </span>
            </button>
          </div>
        </div>

        {/* หัวข้อระดับการศึกษาปัจจุบัน */}
        <div className="mb-6 flex items-center justify-between border-b border-[#7A0019]/20 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[#7A0019] rounded-full inline-block"></span>
            <h2 className="text-xl font-bold text-[#171717]">
              {activeTab === "bachelor"
                ? "หลักสูตรระดับปริญญาตรี (ทล.บ. / วศ.บ.)"
                : "หลักสูตรระดับปริญญาโท (วศ.ม.)"}
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#171717]/60">
            ทั้งหมด {currentMajors.length} สาขาวิชา
          </span>
        </div>

        {/* รายชื่อสาขาวิชา */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentMajors.map((major) => (
            <div
              key={major.id}
              onClick={() => handleOpenModal(major)}
              className="group flex cursor-pointer flex-col justify-between rounded-xl border border-[#7A0019]/15 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#7A0019] hover:shadow-lg"
            >
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#7A0019]/10 text-[#7A0019] transition group-hover:bg-[#7A0019] group-hover:text-white">
                  <Icon icon={major.icon} className="text-2xl" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-[#171717] transition group-hover:text-[#7A0019]">
                  {major.name}
                </h3>
                <span className="text-xs font-semibold text-[#7A0019] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full inline-block mb-3">
                  {major.degree}
                </span>
                <p className="mb-4 text-xs leading-relaxed text-[#171717]/60">
                  {major.desc}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 border-t border-[#7A0019]/10 pt-2 text-xs font-semibold text-[#7A0019] transition-transform group-hover:translate-x-1">
                สนใจสาขานี้ <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal หน้าต่างเด้งกรอกข้อมูล */}
      {isModalOpen && selectedMajor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#7A0019]/20 bg-white p-6 text-[#171717] shadow-2xl md:p-8">
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-xl font-bold text-[#171717]/40 transition hover:bg-[#7A0019]/10 hover:text-[#7A0019] disabled:opacity-50"
            >
              ✕
            </button>

            <div className="mb-6 border-b border-[#7A0019]/10 pb-4">
              <h2 className="text-xl font-bold text-[#7A0019]">
                แบบฟอร์มแสดงความสนใจในสาขาวิชา
              </h2>
              <p className="mt-1 text-xs text-[#171717]/60">
                ข้อมูลนี้ใช้เพื่อสำรวจและวิเคราะห์ความสนใจในสาขาวิชาของคณะเทคโนโลยีอุตสาหกรรม ไม่ใช่การสมัครเข้าศึกษา
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#171717]/75">
                  สาขาวิชาที่สนใจ
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedMajor.name}
                  className="w-full cursor-not-allowed rounded-lg border border-[#7A0019]/10 bg-[#7A0019]/5 px-4 py-2.5 text-sm font-semibold text-[#171717]"
                />
              </div>

              {!masterMajors.some((major) => major.id === selectedMajor.id) && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#171717]/75">
                    สาขาที่สนใจเป็นอันดับสอง
                  </label>
                  <select
                    value={formData.secondMajor}
                    onChange={(e) => setFormData({ ...formData, secondMajor: e.target.value })}
                    className="w-full rounded-lg border border-[#171717]/20 bg-white px-4 py-2.5 text-sm text-[#171717] transition focus:border-[#7A0019] focus:outline-none focus:ring-1 focus:ring-[#7A0019]"
                  >
                    <option value="">ไม่ระบุ</option>
                    {bachelorMajors.map((major) => (
                      <option key={major.id} value={major.name} disabled={major.name === selectedMajor.name}>
                        {major.name}{major.name === selectedMajor.name ? " (เลือกเป็นอันดับหนึ่ง)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#171717]/75">
                  ชื่อ - นามสกุล <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#171717]/20 bg-white px-4 py-2.5 text-sm text-[#171717] transition focus:border-[#7A0019] focus:outline-none focus:ring-1 focus:ring-[#7A0019]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#171717]/75">
                  สถานศึกษาเดิม / โรงเรียนที่สำเร็จการศึกษา{" "}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โรงเรียนอุตรดิตถ์"
                  value={formData.oldSchool}
                  onChange={(e) =>
                    setFormData({ ...formData, oldSchool: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#171717]/20 bg-white px-4 py-2.5 text-sm text-[#171717] transition focus:border-[#7A0019] focus:outline-none focus:ring-1 focus:ring-[#7A0019]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#171717]/75">
                  วุฒิการศึกษาเดิม / กำลังศึกษา
                </label>
                <select
                  value={formData.education}
                  onChange={(e) =>
                    setFormData({ ...formData, education: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#171717]/20 bg-white px-4 py-2.5 text-sm text-[#171717] transition focus:border-[#7A0019] focus:outline-none focus:ring-1 focus:ring-[#7A0019]"
                >
                  <option value="มัธยมศึกษาปีที่ 6 (ม.6)">มัธยมศึกษาปีที่ 6 (ม.6)</option>
                  <option value="ประกาศนียบัตรวิชาชีพ (ปวช.)">ประกาศนียบัตรวิชาชีพ (ปวช.)</option>
                  <option value="ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)">ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)</option>
                  <option value="ปริญญาตรี (ป.ตรี)">ปริญญาตรี (ป.ตรี)</option>
                </select>
              </div>

              <div className="flex gap-3 border-t border-[#7A0019]/10 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="w-1/3 rounded-lg bg-[#171717]/10 py-2.5 text-sm font-semibold text-[#171717] transition hover:bg-[#171717]/20 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-lg bg-[#7A0019] hover:bg-[#5C0013] text-white font-semibold text-sm transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกความสนใจ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLineQr && selectedMajor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <h2 role="status" className="mb-4 text-xl font-bold text-[#7A0019]">บันทึกความสนใจเรียบร้อยแล้ว</h2>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#06c755]/10 text-[#06c755]">
              <Icon icon="mdi:message-text" className="text-3xl" />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">สแกน QR Code เพื่อพูดคุยกับ LINE Chatbot<br />เกี่ยวกับสาขา <span className="font-bold text-[#7A0019]">{selectedMajor.name}</span></p>
            <div className="mx-auto mt-5 w-full max-w-[250px] rounded-2xl border border-[#06c755]/20 bg-[#06c755]/5 p-3">
              <img src="/image/line-chatbot-qr.png" alt="QR Code สำหรับ LINE Chatbot" className="h-auto w-full rounded-xl bg-white" />
            </div>
            <button type="button" onClick={() => setShowLineQr(false)} className="mt-6 w-full rounded-xl bg-[#7A0019] py-3 font-bold text-white transition hover:bg-[#5C0013]">เสร็จสิ้น</button>
          </div>
        </div>
      )}
    </div>
  );
}
