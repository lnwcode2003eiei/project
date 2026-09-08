import { useState } from "react";

const labels = {
  fourYear: "หลักสูตร 4 ปี",
  transfer: "หลักสูตรเทียบโอน",
};

export default function CurriculumSwitcher({ course }) {
  const [plan, setPlan] = useState("fourYear");
  const rows = plan === "fourYear" ? course.curriculum || [] : course.curriculum_transfer || [];
  const totalCredits = rows.reduce((total, item) => total + Number(item.credits || 0), 0);

  return (
    <section className="bg-slate-100/70 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7A0019]">Curriculum Structure</span>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">โครงสร้างหลักสูตร</h2>
          <p className="mt-3 text-gray-600">สรุปจำนวนหน่วยกิตตลอดหลักสูตร {course.title} (รวม {totalCredits} หน่วยกิต)</p>
        </div>

        <div className="mb-7 flex justify-center gap-3">
          {Object.entries(labels).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setPlan(key)} className={`rounded-xl px-6 py-3 font-bold transition ${plan === key ? "bg-[#7A0019] text-white shadow-lg" : "bg-white text-slate-600 shadow-sm hover:bg-red-50"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <table className="w-full border-collapse text-left">
            <thead><tr className="bg-black text-white"><th className="border-r border-gray-800 px-6 py-4 text-center text-base font-bold">รายละเอียดหมวดวิชา</th><th className="w-32 px-6 py-4 text-center text-base font-bold md:w-48">หน่วยกิต</th></tr></thead>
            <tbody>
              {rows.length > 0 ? rows.map((group, groupIndex) => <FragmentRows key={groupIndex} group={group} />) : <tr><td colSpan="2" className="px-6 py-12 text-center text-sm text-gray-400">ยังไม่มีข้อมูล{labels[plan]}</td></tr>}
              <tr className="bg-gray-900 font-bold text-white"><td className="px-6 py-4 pr-8 text-right text-base md:text-lg">รวมจำนวนหน่วยกิตตลอดหลักสูตร</td><td className="border-l border-gray-800 px-6 py-4 text-center text-base text-red-300 md:text-lg">{totalCredits}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function FragmentRows({ group }) {
  return <>
    <tr className="border-b border-red-900 bg-[#7A0019] font-bold text-white"><td className="px-6 py-3.5 text-base md:text-lg">{group.category}</td><td className="border-l border-red-800 px-6 py-3.5 text-center text-base md:text-lg">{group.credits}</td></tr>
    {(group.subCategories || []).map((sub, index) => <tr key={index} className="border-b border-gray-100 bg-slate-50/50"><td className="py-3 pl-12 pr-6 text-sm font-medium text-gray-700 md:text-base">{sub.name}</td><td className="border-l border-gray-100 px-6 py-3 text-center text-sm text-gray-600 md:text-base">{sub.credits}</td></tr>)}
  </>;
}
