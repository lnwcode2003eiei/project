import { useEffect, useState } from "react";
import { apiUrl } from "../../../config/api";

export default function FacultyInfoPage({ slug, fallbackTitle, fallbackContent }) {
  const [page, setPage] = useState({ title: fallbackTitle, content: fallbackContent });

  useEffect(() => {
    const controller = new AbortController();

    fetch(apiUrl(`/api/faculty-pages/${slug}`), { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.page) setPage(data.page);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("โหลดข้อมูลแนะนำคณะไม่สำเร็จ", error);
      });

    return () => controller.abort();
  }, [slug]);

  return (
    <section className="min-h-screen bg-white py-28">
      <div className="mx-auto max-w-5xl border-l-8 border-[#7A0019] px-6 lg:px-10">
        <h1 className="mb-8 text-4xl font-bold text-[#7A0019] md:text-5xl">{page.title}</h1>
        <p className="whitespace-pre-line text-lg leading-9 text-[#171717] md:text-xl">{page.content}</p>
      </div>
    </section>
  );
}
