import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../config/api";

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("/uploads/")) return apiUrl(image);
  return image;
};

const formatDate = (date) => new Date(date).toLocaleDateString("th-TH", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetch(apiUrl("/api/news"));
        const data = await response.json();
        if (data.success) setNews(data.news || []);
      } catch (error) {
        console.error("โหลดข่าวไม่สำเร็จ:", error);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, []);

  const categories = useMemo(
    () => ["ทั้งหมด", ...new Set(news.map((item) => item.category).filter(Boolean))],
    [news],
  );
  const filteredNews = selectedCategory === "ทั้งหมด"
    ? news
    : news.filter((item) => item.category === selectedCategory);

  return (
    <main className="min-h-screen bg-[#FFFFFF]">
      <section className="bg-[#10171b] bg-cover bg-left px-6 py-16 text-white md:bg-center md:py-24" style={{ backgroundImage: "url('/image/news-hero-v2.png')" }}>
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#E5E7EB]">News & Activities</p>
          <h1 className="mt-4 text-4xl font-bold drop-shadow-lg md:text-6xl">ข่าวสารและกิจกรรม</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#E5E7EB] md:text-lg">
            รวบรวมข่าว ประกาศ กิจกรรม และเรื่องราวจากคณะเทคโนโลยีอุตสาหกรรม
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="flex flex-col gap-5 border-b border-[#E5E7EB] pb-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-wide text-[#701D10]">LATEST UPDATES</p>
            <h2 className="mt-1 text-3xl font-bold text-black">ข่าวทั้งหมด</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? "bg-[#701D10] text-white"
                    : "bg-white text-gray-600 ring-1 ring-[#E5E7EB] hover:bg-[#FFFFFF]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-gray-500">กำลังโหลดข่าวสาร...</div>
        ) : filteredNews.length === 0 ? (
          <div className="rounded-3xl bg-white py-24 text-center text-gray-500 shadow-sm">
            ยังไม่มีข่าวสารในหมวดหมู่นี้
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((item) => {
              const imageUrl = getImageUrl(item.image);
              return (
                <article key={item.id} className="group flex overflow-hidden rounded-3xl bg-white shadow-[0_12px_30px_rgba(67,12,25,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(112, 29, 16,0.16)]">
                  <Link to={`/news/${item.id}`} className="flex w-full flex-col">
                    <div className="h-56 overflow-hidden bg-[#FFFFFF]">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">ไม่มีรูปภาพ</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="rounded-full bg-[#FFFFFF] px-3 py-1 font-semibold text-[#701D10]">{item.category || "ข่าวสาร"}</span>
                        <time className="text-gray-400">{formatDate(item.created_at)}</time>
                      </div>
                      <h3 className="mt-4 line-clamp-2 text-xl font-bold leading-relaxed text-black">{item.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">{item.description}</p>
                      <span className="mt-6 text-sm font-bold text-[#701D10]">อ่านรายละเอียด</span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default NewsPage;
