import { Swiper, SwiperSlide } from "swiper/react";
import { Link } from "react-router-dom";

import "swiper/css";

function Slider() {
  const useProgramPlaceholder = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.removeAttribute("src");
    event.currentTarget.classList.add("programs-showcase__image-empty");
  };

  return (
    <section id="programs" className="programs-showcase w-full bg-white px-6 py-20">

      {/* ========================================= */}
      {/* หัวข้อหลัก */}
      {/* ========================================= */}

      <div className="programs-showcase__intro mx-auto max-w-7xl text-center">

        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A0019]">
          Academic Programs
        </p>

        <h1 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
          สาขาที่เปิดสอน
        </h1>

      </div>


      {/* ========================================= */}
      {/* ทล.บ. */}
      {/* ========================================= */}

      <div className="mx-auto mt-16 max-w-7xl">

        <div className="text-center">

          <span className="inline-block rounded-full bg-[#7A0019] px-5 py-2 text-sm font-semibold text-white">
            ระดับปริญญาตรี
          </span>

          <h2 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">
            เทคโนโลยีบัณฑิต (ทล.บ.)
          </h2>

          <p className="mt-2 text-gray-500">
            Bachelor of Technology
          </p>

        </div>


        {/* ========================= */}
        {/* สไลด์ */}
        {/* ========================= */}

        <Swiper
          slidesPerView={1}
          spaceBetween={20}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="programs-showcase__grid py-10"
        >

          {/* ================================= */}
          {/* เทคโนโลยีไฟฟ้า */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B10.jpg"
                alt="เทคโนโลยีไฟฟ้า"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  เทคโนโลยีไฟฟ้า
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Electrical Technology
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  ศึกษาเกี่ยวกับระบบไฟฟ้า อิเล็กทรอนิกส์
                  ระบบควบคุม และเทคโนโลยีไฟฟ้าสมัยใหม่
                </p>

                <Link
                  to="/electrical"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>


          {/* ================================= */}
          {/* เทคโนโลยีดิจิทัลเพื่อการออกแบบ */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B1.jpg"
                alt="เทคโนโลยีดิจิทัลเพื่อการออกแบบ"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  เทคโนโลยีดิจิทัลเพื่อการออกแบบ
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Digital Technology for Design
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  ผสมผสานเทคโนโลยีดิจิทัลกับการออกแบบ
                  เพื่อสร้างสรรค์ผลงานและนวัตกรรมยุคใหม่
                </p>

                <Link
                  to="/digital"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>


          {/* ================================= */}
          {/* เทคโนโลยีอุตสาหการ */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B2.jpg"
                alt="เทคโนโลยีอุตสาหการ"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  เทคโนโลยีอุตสาหการ
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Industrial Technology
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  เรียนรู้กระบวนการผลิต การจัดการอุตสาหกรรม
                  และเทคโนโลยีที่ใช้ในภาคอุตสาหกรรม
                </p>

                <Link
                  to="/industrial"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>


          {/* ================================= */}
          {/* เทคโนโลยีสำรวจและภูมิสารสนเทศ */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B3.jpg"
                alt="เทคโนโลยีสำรวจและภูมิสารสนเทศ"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  เทคโนโลยีสำรวจและภูมิสารสนเทศ
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Surveying and Geoinformatics Technology
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  ศึกษาเทคโนโลยีการสำรวจ ระบบสารสนเทศภูมิศาสตร์
                  และการจัดการข้อมูลเชิงพื้นที่
                </p>

                <Link
                  to="/survey"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>

        </Swiper>

      </div>


      {/* ========================================= */}
      {/* วศ.บ. */}
      {/* ========================================= */}

      <div className="mx-auto mt-24 max-w-7xl">

        <div className="text-center">

          <span className="inline-block rounded-full bg-[#7A0019] px-5 py-2 text-sm font-semibold text-white">
            ระดับปริญญาตรี
          </span>

          <h2 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">
            วิศวกรรมศาสตรบัณฑิต (วศ.บ.)
          </h2>

          <p className="mt-2 text-gray-500">
            Bachelor of Engineering
          </p>

        </div>


        <Swiper
          slidesPerView={1}
          spaceBetween={20}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="programs-showcase__grid py-10"
        >

          {/* ================================= */}
          {/* วิศวกรรมคอมพิวเตอร์ */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B4.jpg"
                alt="วิศวกรรมคอมพิวเตอร์"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  วิศวกรรมคอมพิวเตอร์
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Computer Engineering
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  เรียนรู้การออกแบบระบบคอมพิวเตอร์
                  ซอฟต์แวร์ ฮาร์ดแวร์ AI และ IoT
                </p>

                <Link
                  to="/computer"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>


          {/* ================================= */}
          {/* วิศวกรรมโลจิสติกส์ */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B5.jpg"
                alt="วิศวกรรมโลจิสติกส์"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  วิศวกรรมโลจิสติกส์
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Logistics Engineering
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  ศึกษาการจัดการโลจิสติกส์ การขนส่ง
                  คลังสินค้า และห่วงโซ่อุปทาน
                </p>

                <Link
                  to="/logistics"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>


          {/* ================================= */}
          {/* วิศวกรรมการจัดการพลังงาน */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B6.jpg"
                alt="วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Energy Management Engineering
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  ศึกษาการจัดการพลังงาน
                  และเพิ่มประสิทธิภาพการใช้พลังงานในอุตสาหกรรม
                </p>

                <Link
                  to="/energy"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>


          {/* ================================= */}
          {/* วิศวกรรมบริหารงานก่อสร้าง */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B9.jpg"
                alt="วิศวกรรมบริหารงานก่อสร้าง"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  วิศวกรรมบริหารงานก่อสร้าง
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Construction Management Engineering
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  เรียนรู้การวางแผน ควบคุม
                  และบริหารโครงการก่อสร้าง
                </p>

                <Link
                  to="/construction"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>

        </Swiper>

      </div>


      {/* ========================================= */}
      {/* วศ.ม. */}
      {/* ========================================= */}

      <div className="mx-auto mt-24 max-w-7xl">

        <div className="text-center">

          <span className="inline-block rounded-full bg-[#7A0019] px-5 py-2 text-sm font-semibold text-white">
            ระดับปริญญาโท
          </span>

          <h2 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">
            วิศวกรรมศาสตรมหาบัณฑิต (วศ.ม.)
          </h2>

          <p className="mt-2 text-gray-500">
            Master of Engineering
          </p>

        </div>


        <Swiper
          slidesPerView={1}
          spaceBetween={20}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="programs-showcase__grid programs-showcase__grid--centered py-10"
        >

          {/* ================================= */}
          {/* การจัดการงานวิศวกรรม */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B7.jpg"
                alt="การจัดการงานวิศวกรรม"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  การจัดการงานวิศวกรรม
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Engineering Management
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  ศึกษาการบริหารจัดการงานวิศวกรรม
                  การวางแผน และการจัดการโครงการ
                </p>

                <Link
                  to="/management"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>


          {/* ================================= */}
          {/* วิศวกรรมคอมพิวเตอร์และ AI */}
          {/* ================================= */}

          <SwiperSlide>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg">

              <img
                src="/image/B8.jpg"
                alt="วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์"
                onError={useProgramPlaceholder}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">

                <h3 className="text-2xl font-bold text-gray-900">
                  วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์
                </h3>

                <p className="mt-2 text-sm text-[#7A0019]">
                  Computer Engineering and Artificial Intelligence
                </p>

                <p className="mt-5 text-sm leading-7 text-gray-600">
                  มุ่งเน้นการวิจัยและพัฒนาเทคโนโลยีคอมพิวเตอร์
                  ปัญญาประดิษฐ์ และระบบอัจฉริยะ
                </p>

                <Link
                  to="/computerAI"
                  className="mt-6 block rounded-xl bg-[#7A0019] px-5 py-3 text-center font-semibold text-white transition hover:bg-[#5C0013]"
                >
                  ดูรายละเอียดหลักสูตร →
                </Link>

              </div>

            </div>

          </SwiperSlide>

        </Swiper>

      </div>

    </section>
  );
}

export default Slider;
