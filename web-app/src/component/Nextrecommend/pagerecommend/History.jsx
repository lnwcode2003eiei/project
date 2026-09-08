import { useEffect, useState } from "react";
import { apiUrl } from "../../../config/api";

function History() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/faculty-history"), { signal: controller.signal })
      .then((response) => response.json())
      .then((result) => { if (result.success) setData(result); })
      .catch((error) => { if (error.name !== "AbortError") console.error("โหลดประวัติคณะไม่สำเร็จ", error); });
    return () => controller.abort();
  }, []);

  if (!data) return <div className="min-h-screen bg-[#faf8ef]" />;

  return (
    <section className="min-h-screen bg-[#faf8ef]">
      <header className="relative overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.12)_1px,transparent_0)] bg-[size:24px_24px] px-6 py-20 text-center text-white md:py-24" style={{ backgroundColor: "#641f21" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#7b3031]/80 via-[#4e1619]/80 to-[#2f0b0e]/90" />
        <div className="relative mx-auto max-w-6xl"><h1 className="text-4xl font-bold tracking-tight md:text-6xl">{data.history.hero_title}</h1><p className="mx-auto mt-5 max-w-4xl text-lg leading-8 text-white/65 md:text-2xl">{data.history.hero_subtitle}</p></div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="relative space-y-10 before:absolute before:bottom-0 before:left-1/2 before:top-0 before:w-0.5 before:-translate-x-1/2 before:bg-[#b5d1e0]">
          {data.events.map((event) => <div key={event.id} className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-12"><article className={`${event.side === "left" ? "col-start-1" : "col-start-3"} row-start-1 rounded-2xl bg-white p-6 shadow-[0_14px_30px_rgba(68,54,32,.10)] md:p-7`}><span className="inline-block rounded-full bg-[#c7d8e2] px-3 py-1 text-xs font-bold text-[#425466]">{event.date_label}</span><h2 className="mt-3 text-xl font-bold text-[#682122] md:text-2xl">{event.title}</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 md:text-base">{event.description}</p></article><div className="relative z-10 col-start-2 row-start-1 h-5 w-5 rounded-full border-4 border-white bg-[#6b2022] shadow-md" /><div className={`${event.side === "left" ? "col-start-3" : "col-start-1"} row-start-1`} /></div>)}
        </div>
      </div>
    </section>
  );
}

export default History;
