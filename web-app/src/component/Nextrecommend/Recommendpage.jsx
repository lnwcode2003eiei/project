import { Link } from "react-router-dom";

function Recommendpage() {
  const cards = [
    {
      title: "ประวัติคณะฯ",
      description:
        "ศึกษาความเป็นมาและพัฒนาการของคณะ ตั้งแต่อดีตจนถึงปัจจุบัน",
      image: "/image/A1.jpg",
      link: "/History",
    },
    {
      title: "วิสัยทัศน์ พันธกิจ กลยุทธ์",
      description:
        "แนวทางการดำเนินงานและเป้าหมายในการพัฒนาคณะให้มีคุณภาพ",
      image: "/image/A2.jpg",
      link: "/Vision",
    },
    {
      title: "โครงสร้างการบริหาร",
      description:
        "ข้อมูลโครงสร้างการบริหารและหน่วยงานต่าง ๆ ภายในคณะ",
      image: "/image/A3.jpg",
      link: "/Structure",
    },
    {
      title: "ผู้บริหาร",
      description:
        "ข้อมูลผู้บริหารและบุคลากรที่มีส่วนสำคัญในการบริหารงานของคณะ",
      image: "/image/A4.jpg",
      link: "/Executive",
    },
    {
      title: "คณาจารย์ / นักวิจัย",
      description:
        "พบกับคณาจารย์และนักวิจัยผู้เชี่ยวชาญในด้านต่าง ๆ",
      image: "/image/A5.jpg",
      link: "/Teacher",
    },
    {
      title: "หน่วยงาน",
      description:
        "ข้อมูลหน่วยงานและส่วนงานต่าง ๆ ภายในคณะ",
      image: "/image/A6.jpg",
      link: "/Department",
    },
  ];

  return (
    <section className="min-h-screen bg-white pb-24">

      {/* หัวข้อ */}
      <div className="relative mb-20 overflow-hidden px-6 py-20 text-center md:py-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/image/A1.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative">

          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-white/70">
            Faculty Profile
          </p>

          <h1 className="mb-4 text-5xl font-bold text-white md:text-6xl">
            เกี่ยวกับเรา
          </h1>

          <p className="text-lg text-white/85">
            คณะเทคโนโลยีอุตสาหกรรม มหาวิทยาลัยราชภัฏอุตรดิตถ์
          </p>

        </div>

      </div>

      {/* การ์ด */}
      <div className="max-w-6xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {cards.map((card, index) => (

            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >

              {/* รูป */}
              <div className="w-full h-52 overflow-hidden">

                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />

              </div>

              {/* เนื้อหา */}
              <div className="p-6">

                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {card.title}
                </h2>

                <p className="text-sm leading-6 text-gray-600 mb-6">
                  {card.description}
                </p>

                {/* ดูรายละเอียด */}
                <Link
                  to={card.link}
                  className="group flex w-fit items-center gap-3 text-sm font-bold text-[#7A0019]"
                >
                  <span>
                    ดูรายละเอียด
                  </span>

                  <span className="text-lg group-hover:translate-x-2 transition">
                    →
                  </span>
                </Link>

              </div>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}

export default Recommendpage;
