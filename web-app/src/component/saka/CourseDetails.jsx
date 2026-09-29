import { useEffect, useState } from "react";
import { apiUrl } from "../../config/api";
import { Icon } from "@iconify/react";
import { detailIcons } from "../../config/courseDetails";
const sections = [["course-curriculum", "โครงสร้างหลักสูตรและรายวิชา"], ["course-standards", "มาตรฐาน & PLO"], ["course-philosophy", "ปรัชญาและวัตถุประสงค์"], ["course-supports", "สิ่งสนับสนุนการเรียนการสอน"], ["course-contact", "การติดต่อ"]];
export function CourseSectionNav() {
  const [active, setActive] = useState(sections[0][0]);
  useEffect(() => {
    const update = () => {
      let current = sections[0][0];
      for (const [id] of sections) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 190) current = id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <nav aria-label="ข้อมูลหลักสูตร" className="sticky top-20 z-30 border-b border-white/20 bg-[#093341] px-4 py-3 shadow-md">
    <div className="mx-auto flex w-fit max-w-full gap-3 overflow-x-auto">
      {sections.map(([id, title]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}
        onClick={() => setActive(id)} className={`shrink-0 rounded-lg border px-5 py-3 text-center text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active === id ? "border-[#F7941D] bg-[#F7941D] text-black" : "border-white/30 text-white hover:bg-white/10"}`}>{title}</a>)}
    </div>
  </nav>;
}
const safeUrl = value => { try { return ["http:", "https:"].includes(new URL(value).protocol) ? value : ""; } catch { return ""; } };
function Cards({ rows = [], twoColumns = false }) {
  if (!rows.length) return <p className="text-gray-500">อยู่ระหว่างจัดเตรียมข้อมูล</p>;
  return <div className={`grid gap-5 sm:grid-cols-2 ${twoColumns ? "" : "lg:grid-cols-3"}`}>{rows.map((row, index) => <article key={index} className="flex flex-col rounded-2xl border border-rose-100 bg-white p-7 shadow-sm">
    <Icon icon={(detailIcons[row.icon] || detailIcons.book)[1]} aria-hidden="true" className="mb-5 h-10 w-10 text-[#701D10]" />
    <h3 className="text-xl font-bold text-[#701D10]">{row.title}</h3>
    {row.description && <p className="mt-3 whitespace-pre-line break-words leading-8 text-gray-600">{row.description}</p>}
    {safeUrl(row.url) && <a className="mt-auto pt-5 font-semibold text-[#701D10] underline underline-offset-4" href={safeUrl(row.url)} target="_blank" rel="noopener noreferrer">ดูรายละเอียด<span className="sr-only"> {row.title} (เปิดหน้าต่างใหม่)</span> →</a>}
  </article>)}</div>;
}
function Section({ id, title, children }) {
  return <section id={id} className="course-detail-section scroll-mt-44 border-t border-rose-100 px-5 py-16 text-center sm:px-8"><div className="mx-auto max-w-7xl">
    <h2 className="mb-8 text-3xl font-bold text-[#701D10] md:text-4xl">{title}</h2>{children}
  </div></section>;
}
export default function CourseDetails({ slug }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(`/api/course-details/${slug}`), { signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || "โหลดข้อมูลเพิ่มเติมไม่สำเร็จ");
      setData(body.data); setError("");
    }).catch(error => { if (error.name !== "AbortError") setError(error.message); });
    return () => controller.abort();
  }, [slug, retry]);
  if (error) return <div role="alert" className="p-8 text-center text-red-700">{error} <button type="button" className="underline" onClick={() => setRetry(value => value + 1)}>ลองใหม่</button></div>;
  if (!data) return <p role="status" className="p-8 text-center">กำลังโหลดข้อมูลเพิ่มเติม...</p>;
  const contact = data.contact || {};
  return <div className="bg-white">
    <Section id="course-standards" title="มาตรฐานการเรียนรู้ / TQF และ PLO">
      {data.standardsIntro && <p className="mb-8 whitespace-pre-line leading-8 text-gray-600">{data.standardsIntro}</p>}
      <h3 className="mb-5 text-xl font-bold">มาตรฐานการเรียนรู้</h3><Cards rows={data.standards} />
      <h3 className="mb-5 mt-10 text-xl font-bold">ผลลัพธ์การเรียนรู้ระดับหลักสูตร (PLO)</h3><Cards rows={data.plos} />
      {!!data.documents?.length && <><h3 className="mb-5 mt-10 text-xl font-bold">เอกสารที่เกี่ยวข้อง</h3><Cards rows={data.documents} /></>}
    </Section>
    <Section id="course-philosophy" title="ปรัชญาและวัตถุประสงค์">
      <div className="grid gap-10 lg:grid-cols-2"><div><h3 className="mb-4 text-xl font-bold">ปรัชญาของหลักสูตร</h3><p className="whitespace-pre-line leading-8 text-gray-600">{data.philosophy || "อยู่ระหว่างจัดเตรียมข้อมูล"}</p></div>
        <div><h3 className="mb-4 text-xl font-bold">วัตถุประสงค์ของหลักสูตร</h3><Cards rows={data.objectives} twoColumns /></div></div>
    </Section>
    <Section id="course-supports" title="สิ่งสนับสนุนการเรียนการสอน"><Cards rows={data.supports} /></Section>
    <Section id="course-contact" title="การติดต่อ">
      {(safeUrl(contact.url) || contact.email || contact.phone) ? <address className="space-y-4 rounded-2xl border border-rose-100 bg-white p-6 text-left not-italic shadow-sm sm:p-8">
        {safeUrl(contact.url) && <a className="flex items-start gap-4 rounded-xl p-3 text-[#701D10] transition hover:bg-rose-50" href={safeUrl(contact.url)} target="_blank" rel="noopener noreferrer">
          <Icon icon="mdi:facebook" aria-hidden="true" className="h-7 w-7 shrink-0" /><span className="min-w-0"><span className="block font-semibold">Facebook</span><span className="block break-all text-sm leading-6 underline underline-offset-4">{contact.url}</span><span className="sr-only"> (เปิดหน้าต่างใหม่)</span></span>
        </a>}
        {contact.email && <a className="flex items-start gap-4 rounded-xl p-3 text-[#701D10] transition hover:bg-rose-50" href={`mailto:${contact.email}`}>
          <Icon icon="mdi:email-outline" aria-hidden="true" className="h-7 w-7 shrink-0" /><span className="min-w-0"><span className="block font-semibold">อีเมล</span><span className="block break-all text-sm leading-6 underline underline-offset-4">{contact.email}</span></span>
        </a>}
        {contact.phone && <a className="flex items-start gap-4 rounded-xl p-3 text-[#701D10] transition hover:bg-rose-50" href={`tel:${contact.phone.replace(/[^+0-9,;#*]/g, '')}`}>
          <Icon icon="mdi:phone-outline" aria-hidden="true" className="h-7 w-7 shrink-0" /><span className="min-w-0"><span className="block font-semibold">เบอร์ติดต่อ</span><span className="block break-words text-sm leading-6 underline underline-offset-4">{contact.phone}</span></span>
        </a>}
      </address> : <p className="text-gray-500">อยู่ระหว่างจัดเตรียมข้อมูลติดต่อ</p>}
    </Section>
  </div>;
}
