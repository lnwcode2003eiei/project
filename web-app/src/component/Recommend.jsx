import { Link } from "react-router-dom";

function Recommend() {
  return (
    <section id="recommend" className="relative overflow-hidden py-24 text-white lg:py-32">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/image/A1.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">

          {/* ฝั่งซ้าย */}
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-white/70">
              Why Industrial Technology
            </p>

            <h2 className="mb-10 text-4xl font-extrabold md:text-6xl">
              จุดเด่นของคณะ
            </h2>

            <p className="max-w-xl text-lg leading-9 text-white/85 md:text-xl md:leading-10">
              คณะสหเวชศาสตร์มุ่งเน้นการเรียนรู้ทั้งภาคทฤษฎีและภาคปฏิบัติ
              พร้อมห้องปฏิบัติการที่ทันสมัย และมีความร่วมมือกับโรงพยาบาล
              และหน่วยงานด้านสุขภาพ เพื่อให้นักศึกษาได้รับประสบการณ์จริง
              สามารถพัฒนาความรู้และทักษะวิชาชีพได้อย่างมีประสิทธิภาพ
            </p>

            {/* อ่านเพิ่มเติม */}
            <Link
              to="/Recommendpage"
              className="group mt-12 flex w-fit items-center gap-5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white transition duration-300 group-hover:bg-white">
                <span className="text-2xl group-hover:text-[#7A0019]">
                  →
                </span>
              </div>

              <span className="text-xl font-bold text-white">
                อ่านเพิ่มเติม
              </span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Recommend;
