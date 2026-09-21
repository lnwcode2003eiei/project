
import React, { useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../config/api";
import LearningAtmosphere from "./LearningAtmosphere";
import CurriculumSwitcher from "./CurriculumSwitcher";
import CourseDetails, { CourseSectionNav } from "./CourseDetails";

function Construction() {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // โหลดข้อมูลสาขาจาก Database
  // ==========================================

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          apiUrl("/api/courses/construction")
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "ไม่สามารถโหลดข้อมูลสาขาได้"
          );
        }

        setCourse(data.data);
      } catch (err) {
        console.error(
          "โหลดข้อมูล Construction ไม่สำเร็จ:",
          err
        );

        setError(
          err.message || "ไม่สามารถโหลดข้อมูลสาขาได้"
        );
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, []);

  // ==========================================
  // คำนวณหน่วยกิตรวม
  // ==========================================

  const totalCredits = useMemo(() => {
    if (
      !course ||
      !Array.isArray(course.curriculum)
    ) {
      return 0;
    }

    return course.curriculum.reduce(
      (total, item) =>
        total + Number(item.credits || 0),
      0
    );
  }, [course]);

  // ==========================================
  // Loading
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A0019]" />

          <p className="mt-4 text-sm text-gray-500">
            กำลังโหลดข้อมูลสาขา...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Error
  // ==========================================

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-lg">
          <div className="text-4xl">⚠️</div>

          <h1 className="mt-4 text-xl font-bold text-gray-900">
            ไม่สามารถโหลดข้อมูลสาขาได้
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            {error || "ไม่พบข้อมูลสาขา"}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-[#7A0019] px-6 py-3 font-semibold text-white transition hover:bg-[#5C0013]"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page min-h-screen bg-slate-50 text-gray-800 antialiased">

      {/* Hero */}
      <HeaderSection course={course} />
      <CourseSectionNav />

      {/* About */}
      <AboutSection course={course} />

      {/* Highlights */}
      <HighlightsSection course={course} />

      {/* Curriculum */}
      <div id="course-curriculum" className="scroll-mt-44"><StudyPlanSection course={course} totalCredits={totalCredits} /></div>

      {/* Skills */}
      <SkillsSection course={course} />

      {/* Careers */}
      <LearningAtmosphere course={course} />
      <CareersSection course={course} />

      {/* Footer */}
      <CourseDetails slug="construction" />
      <FooterCTA course={course} />

    </div>
  );
}

// ==========================================
// Helper รูปภาพ
// ==========================================

function getImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  return apiUrl(imagePath);
}

// ==========================================
// Hero
// ==========================================

function HeaderSection({ course }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#7A0019] via-[#8B001E] to-[#580012] px-6 py-20 text-white shadow-lg">
      <div className="mx-auto max-w-7xl">

        <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-200 backdrop-blur-md">
          {course.english_title ||
            "Construction Management Engineering"}
        </span>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
          {course.title ||
            "วิศวกรรมบริหารงานก่อสร้าง"}
        </h1>

        <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-red-50/90 md:text-xl">
          {course.hero_description ||
            "เรียนรู้การวางแผน ควบคุม และบริหารโครงการก่อสร้าง ตั้งแต่เริ่มต้นจนถึงการส่งมอบงาน"}
        </p>

      </div>
    </section>
  );
}

// ==========================================
// About
// ==========================================

function AboutSection({ course }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">

      <div className="grid items-center gap-12 lg:grid-cols-12">

        {/* Image */}
        <div className="group relative lg:col-span-6">

          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#7A0019] to-red-400 opacity-30 blur transition duration-500 group-hover:opacity-60" />

          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">

            {course.image ? (
              <img
                src={getImageUrl(course.image)}
                alt={course.title}
                className="h-[480px] w-full object-cover transition duration-700 ease-out group-hover:scale-105 md:h-[540px]"
              />
            ) : (
              <div className="flex h-[480px] items-center justify-center bg-gray-100 text-gray-400 md:h-[540px]">
                ยังไม่มีรูปภาพ
              </div>
            )}

          </div>
        </div>

        {/* Text */}
        <div className="space-y-6 lg:col-span-6">

          <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#7A0019]">

            <span className="h-2 w-2 rounded-full bg-[#7A0019]" />

            ABOUT THE PROGRAM

          </div>

          <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            {course.about_title ||
              "เรียนอะไรในวิศวกรรมบริหารงานก่อสร้าง?"}
          </h2>

          <p className="text-lg leading-relaxed text-gray-600">
            {course.about_description_1}
          </p>

          <p className="text-lg leading-relaxed text-gray-600">
            {course.about_description_2}
          </p>

        </div>

      </div>
    </section>
  );
}

// ==========================================
// Highlights
// ==========================================

function HighlightsSection({ course }) {
  return (
    <section className="border-y border-gray-100 bg-white px-6 py-20">

      <div className="mx-auto max-w-7xl">

        <div className="mb-14 text-center">

          <span className="text-xs font-bold uppercase tracking-widest text-[#7A0019]">
            PROGRAM HIGHLIGHTS
          </span>

          <h2 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
            จุดเด่นของสาขา
          </h2>

        </div>

        <div className="grid gap-8 md:grid-cols-3">

          {Array.isArray(course.highlights) &&
          course.highlights.length > 0 ? (

            course.highlights.map(
              (item, index) => (

                <div
                  key={index}
                  className="group rounded-3xl border border-gray-100 bg-slate-50 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-red-100 hover:bg-white hover:shadow-xl"
                >

                  {/* รูปภาพอย่างเดียว */}
                  <div className="mx-auto mb-8 flex h-64 w-full items-center justify-center">

                    {item.image ? (
                      <img
                        src={getImageUrl(item.image)}
                        alt={
                          item.title ||
                          "Highlight"
                        }
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        ไม่มีรูป
                      </div>
                    )}

                  </div>

                  {/* หัวข้อ */}
                  <h3 className="text-center text-xl font-bold text-gray-900 transition-colors group-hover:text-[#7A0019] md:text-2xl">
                    {item.title ||
                      "จุดเด่น"}
                  </h3>

                  {/* รายละเอียด */}
                  <p className="mt-4 text-center text-base leading-relaxed text-gray-600 md:text-lg">
                    {item.desc || ""}
                  </p>

                </div>

              )
            )

          ) : (

            <div className="rounded-2xl bg-slate-50 p-10 text-center text-gray-400 md:col-span-3">
              ยังไม่มีข้อมูลจุดเด่น
            </div>

          )}

        </div>

      </div>
    </section>
  );
}

// ==========================================
// Curriculum
// ==========================================

function StudyPlanSection({
  course,
  totalCredits,
}) {
  if (course) return <CurriculumSwitcher course={course} />;
  return (
    <section className="bg-slate-100/70 px-6 py-20">

      <div className="mx-auto max-w-5xl">

        <div className="mb-12 text-center">

          <span className="text-xs font-bold uppercase tracking-widest text-[#7A0019]">
            Curriculum Structure
          </span>

          <h2 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
            โครงสร้างหลักสูตร
          </h2>

          <p className="mt-3 text-gray-600">
            สรุปจำนวนหน่วยกิตรวมตลอดหลักสูตร{" "}
            {course.title}{" "}
            (รวม {totalCredits} หน่วยกิต)
          </p>

        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">

          <table className="w-full border-collapse text-left">

            <thead>

              <tr className="bg-black text-white">

                <th className="border-r border-gray-800 px-6 py-4 text-center text-base font-bold">
                  รายละเอียดหมวดวิชา
                </th>

                <th className="w-36 px-6 py-4 text-center text-base font-bold md:w-48">
                  หน่วยกิต
                </th>

              </tr>

            </thead>

            <tbody>

              {Array.isArray(course.curriculum) &&
              course.curriculum.length > 0 ? (

                course.curriculum.map(
                  (group, groupIndex) => (

                    <React.Fragment
                      key={groupIndex}
                    >

                      <tr className="border-b border-red-900 bg-[#7A0019] font-bold text-white">

                        <td className="px-6 py-3.5 text-base md:text-lg">
                          {group.category}
                        </td>

                        <td className="border-l border-red-800 px-6 py-3.5 text-center text-base md:text-lg">
                          {group.credits}
                        </td>

                      </tr>

                      {Array.isArray(
                        group.subCategories
                      ) &&
                        group.subCategories.map(
                          (sub, subIndex) => (

                            <tr
                              key={`${groupIndex}-${subIndex}`}
                              className="border-b border-gray-100 bg-slate-50/50 transition-colors hover:bg-red-50/40"
                            >

                              <td className="py-3 pl-12 pr-6 text-sm font-medium text-gray-700 md:text-base">
                                {sub.name}
                              </td>

                              <td className="border-l border-gray-100 px-6 py-3 text-center text-sm text-gray-600 md:text-base">
                                {sub.credits}
                              </td>

                            </tr>

                          )
                        )}

                    </React.Fragment>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="2"
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    ยังไม่มีข้อมูลโครงสร้างหลักสูตร
                  </td>

                </tr>

              )}

              <tr className="bg-gray-900 font-bold text-white">

                <td className="px-6 py-4 pr-8 text-right text-base md:text-lg">
                  รวมจำนวนหน่วยกิตตลอดหลักสูตร
                </td>

                <td className="border-l border-gray-800 px-6 py-4 text-center text-base text-red-300 md:text-lg">
                  {totalCredits}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>
    </section>
  );
}

// ==========================================
// Skills
// ==========================================

function SkillsSection({ course }) {
  return (
    <section className="bg-slate-50 px-6 py-20">

      <div className="mx-auto max-w-7xl">

        <div className="grid items-center gap-12 lg:grid-cols-12">

          <div className="space-y-4 lg:col-span-5">

            <span className="text-xs font-bold uppercase tracking-widest text-[#7A0019]">
              WHAT YOU WILL LEARN
            </span>

            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              ทักษะที่คุณจะได้รับ
            </h2>

            <p className="text-lg leading-relaxed text-gray-600">
              พัฒนาทักษะด้านวิศวกรรมและการบริหาร
              เพื่อพร้อมทำงานในโครงการก่อสร้างอย่างมืออาชีพ
            </p>

          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">

            {Array.isArray(course.skills) &&
            course.skills.length > 0 ? (

              course.skills.map(
                (skill, index) => (

                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-red-200"
                  >

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#7A0019]">

                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />

                      </svg>

                    </div>

                    <span className="font-medium text-gray-700">
                      {skill}
                    </span>

                  </div>

                )
              )

            ) : (

              <div className="rounded-xl bg-white p-8 text-center text-gray-400 sm:col-span-2">
                ยังไม่มีข้อมูลทักษะ
              </div>

            )}

          </div>

        </div>

      </div>
    </section>
  );
}

// ==========================================
// Careers
// ==========================================

function CareersSection({ course }) {
  return (
    <section className="career-showcase bg-white px-6 py-20">

      <div className="mx-auto max-w-7xl">

        <div className="mx-auto max-w-2xl text-center">

          <span className="text-xs font-semibold uppercase tracking-widest text-red-200">
            CAREER OPPORTUNITIES
          </span>

          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            จบแล้วทำงานอะไรได้บ้าง?
          </h2>

          <p className="mt-3 text-red-100/80">
            แนวทางสายงานและโอกาสการทำงานด้านวิศวกรรมบริหารงานก่อสร้าง
          </p>

        </div>

        <div className="career-showcase__list mt-12">

          {Array.isArray(course.careers) &&
          course.careers.length > 0 ? (

            course.careers.map(
              (career, index) => (

                <div
                  key={index}
                  data-description={career.description || ""}
                  className="career-showcase__card"
                >

                {career.image && <img src={getImageUrl(career.image)} alt={career.title || "อาชีพ"} className="h-12 w-12 rounded-lg object-cover" />}

                  <span className="font-semibold text-white">
                    {career.title}
                  </span>

                </div>

              )
            )

          ) : (

            <div className="rounded-xl bg-white/10 p-8 text-center text-white/70 sm:col-span-2 lg:col-span-4">
              ยังไม่มีข้อมูลอาชีพ
            </div>

          )}

        </div>

      </div>
    </section>
  );
}

// ==========================================
// Footer
// ==========================================

function FooterCTA({ course }) {
  return (
    <section className="bg-white px-6 py-20 text-center">

      <div className="mx-auto max-w-3xl space-y-6">

        <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
          สร้างอนาคตด้วยการบริหารงานก่อสร้าง
        </h2>

        <p className="text-lg leading-relaxed text-gray-600">
          พัฒนาความรู้และทักษะเพื่อก้าวสู่สายงาน{" "}
          {course?.title ||
            "วิศวกรรมบริหารงานก่อสร้าง"}{" "}
          และการบริหารโครงการ
        </p>

        <div>

          <a href="/apply?major=const-mgt-eng" className="inline-block rounded-xl bg-[#7A0019] px-8 py-4 font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:bg-[#580012] hover:shadow-xl">
            สนใจเข้าศึกษา
          </a>

        </div>

      </div>
    </section>
  );
}

export default Construction;
