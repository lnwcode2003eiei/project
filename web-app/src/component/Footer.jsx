import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[#171717] text-white">
      {/* Main Footer */}
      <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.15fr_0.8fr_1.15fr_1.35fr] lg:gap-14">
          {/* Logo / About */}
          <div className="lg:col-span-1">
            <img
              src="/image/logo.png"
              alt="Faculty Logo"
              className="mb-6 h-16 w-auto object-contain"
            />

            <h2 className="max-w-xs text-2xl font-bold leading-snug">คณะเทคโนโลยีอุตสาหกรรม</h2>

          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 border-l-2 border-[#A50026] pl-3 text-lg font-bold">เมนู</h3>

            <div className="space-y-3.5">
              <Link
                to="/"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                หน้าแรก
              </Link>

              <Link
                to="/Recommendpage"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                แนะนำคณะ
              </Link>

              <Link
                to="/#programs"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                หลักสูตร
              </Link>

              <Link
                to="/news"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                ข่าวสาร
              </Link>

              <Link
                to="/#contact"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                ติดต่อ
              </Link>
            </div>
          </div>

          {/* Information */}
          <div>
            <h3 className="mb-6 border-l-2 border-[#A50026] pl-3 text-lg font-bold">ข้อมูลคณะ</h3>

            <div className="space-y-3.5">
              <Link
                to="/History"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                ประวัติคณะฯ
              </Link>

              <Link
                to="/Vision"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                วิสัยทัศน์ พันธกิจ กลยุทธ์
              </Link>

              <Link
                to="/Structure"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                โครงสร้างการบริหาร
              </Link>

              <Link
                to="/Executive"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                ผู้บริหาร
              </Link>

              <Link
                to="/Teacher"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                คณาจารย์ / นักวิจัย
              </Link>

              <Link
                to="/Department"
                className="block text-sm text-gray-400 transition hover:text-white"
              >
                หน่วยงาน
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 border-l-2 border-[#A50026] pl-3 text-lg font-bold">ติดต่อเรา</h3>

            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <iframe
                title="แผนที่คณะเทคโนโลยีอุตสาหกรรม"
                src="https://www.google.com/maps?q=Uttaradit%20Rajabhat%20University&output=embed"
                className="h-56 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <a href="tel:055416629" className="flex items-center gap-3 transition hover:text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A0019] text-white">
                  <Icon icon="lucide:phone" className="text-base" />
                </span>
                <span>055-416629</span>
              </a>

              <a href="mailto:technologyindustrial.uru@gmail.com" className="flex items-center gap-3 break-all transition hover:text-white">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A0019] text-white">
                  <Icon icon="lucide:mail" className="text-base" />
                </span>
                <span>technologyindustrial.uru@gmail.com</span>
              </a>

              <a
                href="https://www.facebook.com/industrial.uru.ac.th"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 transition hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A0019] text-white">
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
