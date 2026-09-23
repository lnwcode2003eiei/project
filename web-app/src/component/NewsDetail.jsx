import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiUrl } from "../config/api";

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("/uploads/")) return apiUrl(image);
  return image;
};

function NewsDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetch(apiUrl("/api/news"));
        const data = await response.json();
        if (data.success) {
          setItem((data.news || []).find((newsItem) => String(newsItem.id) === id) || null);
        }
      } catch (error) {
        console.error("โหลดข่าวไม่สำเร็จ:", error);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, [id]);

  const formatDate = (date) => new Date(date).toLocaleDateString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return <main className="min-h-screen bg-[#FFFFFF] px-6 py-28 text-center text-gray-500">กำลังโหลดข่าวสาร...</main>;
  if (!item) return <main className="min-h-screen bg-[#FFFFFF] px-6 py-28 text-center"><p className="text-xl font-bold text-gray-900">ไม่พบข่าวที่ต้องการ</p><Link to="/news" className="mt-5 inline-block font-semibold text-[#701D10]">กลับไปหน้าข่าวสาร</Link></main>;

  const imageUrl = getImageUrl(item.image);
  return (
    <main className="min-h-screen bg-[#FFFFFF] py-12 md:py-20">
      <article className="mx-auto max-w-4xl px-6">
        <Link to="/news" className="text-sm font-semibold text-[#701D10]">← ข่าวสารทั้งหมด</Link>
        <p className="mt-10 w-fit rounded-full bg-[#FFFFFF] px-4 py-2 text-sm font-semibold text-[#701D10]">{item.category || "ข่าวสาร"}</p>
        <h1 className="mt-5 text-3xl font-bold leading-relaxed text-black md:text-5xl">{item.title}</h1>
        <p className="mt-4 text-sm text-gray-500">เผยแพร่เมื่อ {formatDate(item.created_at)}</p>
        {imageUrl && <img src={imageUrl} alt={item.title} className="mt-10 max-h-[34rem] w-full rounded-3xl object-cover shadow-lg" />}
        <div className="mt-10 whitespace-pre-line text-base leading-9 text-gray-700 md:text-lg">{item.description}</div>
      </article>
    </main>
  );
}

export default NewsDetail;
