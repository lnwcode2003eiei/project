import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[#701D10] text-white">
      {/* Main Footer */}
      <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.15fr_0.8fr_1.15fr_1.35fr] xl:gap-10">
          {/* Logo / About */}
          <div className="lg:col-span-1">
            <img
              src="/image/logo.png"
              alt="Faculty Logo"
              className="mb-6 h-auto max-h-20 w-full max-w-sm object-contain object-left"
            />

            <h2 className="max-w-xs text-2xl font-bold leading-snug">คณะเทคโนโลยีอุตสาหกรรม</h2>

          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 border-l-4 border-[#F7941D] pl-3 text-2xl font-bold leading-relaxed">เมนู</h3>

            <div className="space-y-2">
              <Link
                to="/"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                หน้าแรก
              </Link>

              <Link
                to="/Recommendpage"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                แนะนำคณะ
              </Link>

              <Link
                to="/#programs"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                หลักสูตร
              </Link>

              <Link
                to="/news"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                ข่าวสาร
              </Link>

              <Link
                to="/#contact"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                ติดต่อ
              </Link>
            </div>
          </div>

          {/* Information */}
          <div>
            <h3 className="mb-5 border-l-4 border-[#F7941D] pl-3 text-2xl font-bold leading-relaxed">ข้อมูลคณะ</h3>

            <div className="space-y-2">
              <a href="http://industrial.uru.ac.th/history.html" target="_blank" rel="noopener noreferrer"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                ประวัติคณะฯ
              </a>

              <a href="http://industrial.uru.ac.th/philosophy.html" target="_blank" rel="noopener noreferrer"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                วิสัยทัศน์ พันธกิจ กลยุทธ์
              </a>

              <a href="http://industrial.uru.ac.th/board6.html" target="_blank" rel="noopener noreferrer"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                โครงสร้างการบริหาร
              </a>

              <a href="http://industrial.uru.ac.th/board2.html" target="_blank" rel="noopener noreferrer"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                ผู้บริหาร
              </a>

              <a href="http://industrial.uru.ac.th/board5.html" target="_blank" rel="noopener noreferrer"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                คณาจารย์ / นักวิจัย
              </a>

              <a href="http://industrial.uru.ac.th/board4.html" target="_blank" rel="noopener noreferrer"
                className="block w-fit py-2 text-lg font-medium leading-7 text-white transition hover:text-[#F7941D] hover:underline underline-offset-4"
              >
                หน่วยงาน
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 border-l-4 border-[#F7941D] pl-3 text-2xl font-bold leading-relaxed">ติดต่อเรา</h3>

            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <iframe
                title="แผนที่คณะเทคโนโลยีอุตสาหกรรม"
                src="https://www.google.com/maps?q=Uttaradit%20Rajabhat%20University&output=embed"
                className="h-56 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mt-6 space-y-3 text-base font-medium leading-7 text-white">
              <a href="tel:055416629" className="flex min-h-11 items-center gap-3 transition hover:text-[#F7941D]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon icon="lucide:phone" className="text-base" />
                </span>
                <span>055-416629</span>
              </a>

              <a href="mailto:technologyindustrial.uru@gmail.com" className="flex min-h-11 items-center gap-3 [overflow-wrap:anywhere] transition hover:text-[#F7941D]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon icon="lucide:mail" className="text-base" />
                </span>
                <span>technologyindustrial.uru@gmail.com</span>
              </a>

              <a
                href="https://www.facebook.com/industrial.uru.ac.th"
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center gap-3 transition hover:text-[#F7941D]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon icon="lucide:facebook" className="text-base" />
                </span>
                <span>Facebook คณะเทคโนโลยีอุตสาหกรรม</span>
              </a>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}

export default Footer;
