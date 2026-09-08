import { apiUrl } from "../../config/api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function LearningAtmosphere({ course }) {
  const items = Array.isArray(course.learning_environment)
    ? course.learning_environment
    : [];

  return (
    <section className="bg-[#171717]">
      <div>
        {items.length > 0 ? (
          <Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} className="learning-atmosphere-swiper">
            {items.map((item, index) => (
              <SwiperSlide key={index}>
              <article className="relative flex min-h-screen items-start overflow-hidden px-6 py-16 text-white md:px-16 md:py-20">
                {item.image ? (
                  <img src={apiUrl(item.image)} alt={item.title || "บรรยากาศการเรียนการสอน"} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[#7A0019]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/20 to-transparent" />
                <div className="relative z-10 max-w-2xl">
                  <span className="text-xs font-bold tracking-[0.2em] text-red-200">LEARNING EXPERIENCE {String(index + 1).padStart(2, "0")}</span>
                  <h2 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">{item.title || "บรรยากาศการเรียนการสอน"}</h2>
                  <p className="mt-5 max-w-xl text-base leading-7 text-white/90 md:text-lg">{item.description || "เรียนรู้จากการลงมือปฏิบัติจริง พัฒนาทักษะและประสบการณ์ร่วมกัน"}</p>
                </div>
              </article>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center px-6 text-center text-white/70">
            ยังไม่มีรูปบรรยากาศการเรียนการสอน
          </div>
        )}
      </div>
    </section>
  );
}
