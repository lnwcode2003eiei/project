import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../config/api";

function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetch(apiUrl("/api/news"));
        const data = await response.json();

        if (data.success) {
          setNews(data.news);
        }
      } catch (error) {
        console.error("โหลดข่าวไม่สำเร็จ:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getImageUrl = (image) => {
    if (!image) return null;

    // ถ้าเป็น path จาก Express เช่น /uploads/news/xxx.jpg
    if (image.startsWith("/uploads/")) {
      return apiUrl(image);
    }

    // เผื่อมี URL เต็ม
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // สำหรับรูปเดิมใน public เช่น /image/news1.jpg
    return image;
  };

  return (
    <section id="news" className="min-h-screen bg-[#093341] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-base font-bold uppercase tracking-[0.15em] text-[#F7941D]">
            News & Activities
          </p>

          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">
            ข่าวสารและกิจกรรม
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white">
            ติดตามข่าวสาร ประกาศ กิจกรรม และเรื่องราวที่น่าสนใจ
            จากคณะเทคโนโลยีอุตสาหกรรม
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-lg text-white">
            กำลังโหลดข่าวสาร...
          </div>
        )}

        {/* ไม่มีข่าว */}
        {!loading && news.length === 0 && (
            <div className="rounded-3xl bg-white p-16 text-center shadow-sm">
            <p className="text-gray-600">ยังไม่มีข่าวสารในขณะนี้</p>
          </div>
        )}

        {/* มีข่าว */}
        {!loading && news.length > 0 && (
          <>
            {/* Featured News */}
            <div className="mb-16 grid overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
              {/* รูปข่าวเด่น */}
              <div className="h-[320px] overflow-hidden md:h-full">
                {getImageUrl(news[0].image) ? (
                  <img
                    src={getImageUrl(news[0].image)}
                    alt={news[0].title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-100 text-gray-600">
                    ไม่มีรูปภาพ
                  </div>
                )}
              </div>

              {/* เนื้อหาข่าวเด่น */}
              <div className="flex flex-col justify-center p-8 md:p-12">
                <span className="w-fit rounded-full bg-[#701D10]/10 px-4 py-2 text-sm font-semibold text-[#701D10]">
                  {news[0].category}
                </span>

                <p className="mt-5 text-base text-gray-700">
                  {formatDate(news[0].created_at)}
                </p>

                <h2 className="mt-3 text-2xl font-bold leading-relaxed text-gray-900 md:text-4xl">
                  {news[0].title}
                </h2>

                <p className="mt-5 text-lg leading-8 text-black">
                  {news[0].description}
                </p>

                <Link
                  to={`/news/${news[0].id}`}
                  className="mt-8 inline-flex w-fit rounded-full bg-[#701D10] px-6 py-3 font-semibold text-white transition hover:bg-[#093341] active:scale-95"
                >
                  อ่านข่าวเพิ่มเติม →
                </Link>
              </div>
            </div>

            {/* Latest News */}
            <div className="mb-8">
              <p className="text-base font-bold uppercase tracking-[0.15em] text-[#F7941D]">
                Latest News
              </p>

              <h2 className="mt-2 text-3xl font-bold text-white">
                ข่าวล่าสุด
              </h2>

              <div className="mt-3 h-1 w-16 rounded-full bg-[#F7941D]" />
            </div>

            {/* News Cards */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {news.slice(0, 6).map((item) => {
                const imageUrl = getImageUrl(item.image);

                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-2xl bg-white shadow-md transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                  >
                    {/* Image */}
                    <div className="h-52 overflow-hidden bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-600">
                          ไม่มีรูปภาพ
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-[#701D10]/10 px-3 py-1 text-sm font-semibold text-[#701D10]">
                          {item.category}
                        </span>

                        <span className="text-sm text-gray-700">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      <h3 className="mt-4 line-clamp-2 text-2xl font-bold leading-relaxed text-black">
                        {item.title}
                      </h3>

                      <p className="mt-3 line-clamp-3 text-base leading-8 text-black">
                        {item.description}
                      </p>

                      <Link
                        to={`/news/${item.id}`}
                        className="mt-5 inline-block py-2 text-base font-bold text-[#701D10] transition hover:text-black"
                      >
                        อ่านเพิ่มเติม →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* ข่าวสารทั้งหมด */}
            <div className="mt-14 flex justify-center">
              <Link
                to="/news/all"
                className="group inline-flex items-center gap-3 rounded-full border-2 border-[#F7941D] bg-[#F7941D] px-8 py-3 text-lg font-bold text-black transition-all duration-300 hover:border-white hover:bg-white active:scale-95"
              >
                <span>ข่าวสารทั้งหมด</span>

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default News;
