import { apiUrl } from "../../../config/api";

export default function PersonnelCard({ person }) {
  const link = /^https?:\/\//i.test(person.profile_link || "") ? person.profile_link : "";
  const photo = person.image_filename ? <img loading="lazy" src={apiUrl(`/uploads/teachers/${person.image_filename}`)} alt={person.full_name} className="h-full w-full object-contain" /> : <span className="text-slate-400">รอรูปภาพ</span>;
  return <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-center shadow-sm transition hover:shadow-md">
    <div className="flex h-64 items-center justify-center bg-gray-50 p-4 sm:h-72">
      {link ? <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`ดูรายละเอียด ${person.full_name}`} className="block h-full w-full rounded-lg focus-visible:outline-2 focus-visible:outline-[#7A0019]">{photo}</a> : photo}
    </div>
    <div className="flex flex-1 flex-col items-center p-5">
      <h3 className="text-lg font-semibold leading-relaxed text-slate-800">{person.full_name}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">{person.position}</p>
      {link && <div className="mt-auto pt-5"><a href={link} target="_blank" rel="noopener noreferrer" aria-label={`ดูรายละเอียด ${person.full_name} (เปิดหน้าต่างใหม่)`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7A0019] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#500011] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7A0019]">ดูรายละเอียด ↗</a></div>}
    </div>
  </article>;
}
