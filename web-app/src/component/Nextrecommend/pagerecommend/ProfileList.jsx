import { useEffect, useState } from "react";
import { apiUrl } from "../../../config/api";

export default function ProfileList({ type, title }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(apiUrl(`/api/faculty-profiles/${type}`))
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setItems(data.profiles || []);
      });
  }, [type]);

  const groups = items.reduce((result, item) => {
    const groupName = item.group_name?.trim() || "หน่วยงาน";
    if (!result[groupName]) result[groupName] = [];
    result[groupName].push(item);
    return result;
  }, {});

  return (
    <section className="min-h-screen bg-[#faf8ef] px-5 pb-16 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-center text-4xl font-bold text-[#682122]">{title}</h1>

        {Object.keys(groups).length === 0 ? (
          <p className="mt-14 text-center text-lg text-slate-400">กำลังเตรียมข้อมูล{title}</p>
        ) : (
          Object.entries(groups).map(([groupName, members]) => (
            <section key={groupName} className="mt-10">
              <h2 className="border-l-4 border-[#7a0019] bg-[#f2f0e7] px-4 py-3 text-xl font-bold text-[#542022]">
                {groupName}
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                {members.map((item) => (
                  <article key={item.id} className="rounded-3xl bg-white p-5 text-center shadow-sm">
                    {item.image_filename ? (
                      <img
                        src={apiUrl(`/uploads/teachers/${item.image_filename}`)}
                        alt={item.full_name}
                        className="mx-auto h-52 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        รอรูปภาพ
                      </div>
                    )}
                    <h3 className="mt-4 font-bold text-slate-800">{item.full_name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.position}</p>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}
