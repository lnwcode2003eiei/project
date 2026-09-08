import { useEffect, useState } from "react";
import { apiUrl } from "../../../config/api";

export default function Structure() {
  const [images, setImages] = useState([]);
  useEffect(() => { fetch(apiUrl("/api/faculty-structure-images")).then((response) => response.json()).then((data) => data.success && setImages(data.images || [])).catch(() => {}); }, []);
  return <section className="min-h-screen bg-[#faf8ef] px-4 pb-14 pt-32"><div className="mx-auto max-w-6xl"><h1 className="text-center text-3xl font-bold text-[#682122]">โครงสร้างการบริหาร</h1><p className="mt-2 text-center text-gray-500">คณะเทคโนโลยีอุตสาหกรรม</p>{images.length === 0 ? <div className="mt-8 rounded-2xl border border-[#ede8da] bg-white p-6 shadow-sm"><p className="py-20 text-center text-gray-400">กำลังเตรียมรูปผังองค์กร</p></div> : <div className="mt-8 space-y-6">{images.map((image, index) => <figure key={image.id} className="rounded-2xl border border-[#ede8da] bg-white p-3 shadow-sm sm:p-6"><img src={apiUrl(`/uploads/structure/${image.image_filename}`)} alt={`โครงสร้างการบริหารคณะเทคโนโลยีอุตสาหกรรม รูปที่ ${index + 1}`} className="mx-auto h-auto w-full object-contain" /></figure>)}</div>}</div></section>;
}
