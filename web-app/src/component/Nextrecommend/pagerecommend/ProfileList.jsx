import { useEffect, useState } from "react";
import { apiUrl } from "../../../config/api";
import PersonnelCard from "./PersonnelCard";

export default function ProfileList({ type, title }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(type === "teacher" ? "/api/faculty-teachers" : `/api/faculty-profiles/${type}`), { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
        setItems((type === "teacher" ? data.teachers : data.profiles) || []);
      }).catch(error => { if (error.name !== "AbortError") setError(error.message); });
    return () => controller.abort();
  }, [type]);
  const groups = items.reduce((result, item) => {
    const group = item.group_name?.trim() || title;
    if (!result.has(group)) result.set(group, []);
    result.get(group).push(item);
    return result;
  }, new Map());
  return <section className="min-h-screen bg-[#faf8ef] px-5 pb-20 pt-32 sm:px-8"><div className="mx-auto max-w-7xl">
    <h1 className="text-center text-3xl font-bold text-[#682122] sm:text-4xl">{title}</h1>
    <p className="mt-4 text-center leading-7 text-slate-500">{type === "teacher" ? "บุคลากรสายวิชาการ " : ""}คณะเทคโนโลยีอุตสาหกรรม</p>
    {error ? <p role="alert" className="mt-16 text-center text-red-700">{error}</p> : !items.length ? <p className="mt-16 text-center text-slate-500">กำลังเตรียมข้อมูล{title}</p> : [...groups].map(([group, members]) => <section key={group} className="mt-12">
      <h2 className="border-l-4 border-[#7A0019] bg-[#f2f0e7] px-5 py-4 text-lg font-bold leading-relaxed text-[#542022] sm:text-xl">{type === "teacher" ? "หลักสูตร" : ""}{group}</h2>
      <div className="mt-6 grid grid-cols-1 items-stretch gap-6 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{members.map(person => <PersonnelCard key={person.id} person={person} />)}</div>
    </section>)}
  </div></section>;
}
