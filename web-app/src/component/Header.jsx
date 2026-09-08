import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("/");

  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      if (location.pathname !== "/" && location.pathname !== "/home") return;

      const isAtFooter =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 8;

      if (isAtFooter) {
        setActiveSection("/#contact");
        return;
      }

      const sections = [
        { id: "contact", path: "/#contact" },
        { id: "news", path: "/news" },
        { id: "programs", path: "/#programs" },
        { id: "recommend", path: "/Recommendpage" },
      ];
      const currentSection = sections.find(
        ({ id }) => document.getElementById(id)?.getBoundingClientRect().top <= 150,
      );

      setActiveSection(currentSection?.path || "/");
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  const activePath = location.pathname === "/" || location.pathname === "/home"
    ? activeSection
    : location.pathname;

  const menus = [
    {
      name: "หน้าแรก",
      path: "/",
    },
    {
      name: "แนะนำคณะ",
      path: "/Recommendpage",
    },
    {
      name: "หลักสูตร",
      path: "/#programs",
    },
    {
      name: "ข่าวสาร",
      path: "/news",
    },
  ];
  const contactActive = activePath === "/#contact";

  return (
    <header
      className={`font-display fixed left-0 top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* ================================= */}
          {/* Logo */}
          {/* ================================= */}

          <Link to="/" className="shrink-0">
            <img
              src="/image/logo.png"
              alt="Faculty Logo"
              className={`h-auto w-44 transition-all duration-300 sm:w-52 ${
                scrolled ? "" : ""
              }`}
            />
          </Link>

          {/* ================================= */}
          {/* Desktop Menu */}
          {/* ================================= */}

          <nav
            className={`hidden items-center gap-1 rounded-full px-2 py-2 backdrop-blur-md transition-all duration-300 lg:flex ${
              scrolled
                ? "border border-gray-200 bg-gray-100/80"
                : "border border-white/20 bg-white/10"
            }`}
          >
            {menus.map((menu) => {
              const active = activePath === menu.path;

              return (
                <Link
                  key={menu.path}
                  to={menu.path}
                  className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    active
                      ? scrolled
                        ? "bg-[#7A0019] text-white"
                        : "bg-white text-[#7A0019]"
                      : scrolled
                        ? "text-gray-700 hover:bg-white hover:text-[#7A0019]"
                        : "text-white hover:bg-white hover:text-[#7A0019]"
                  }`}
                >
                  {menu.name}
                </Link>
              );
            })}

            <Link
              to="/#contact"
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                contactActive
                  ? scrolled
                    ? "bg-[#7A0019] text-white"
                    : "bg-white text-[#7A0019]"
                  : scrolled
                    ? "text-gray-700 hover:bg-white hover:text-[#7A0019]"
                    : "text-white hover:bg-white hover:text-[#7A0019]"
              }`}
            >
              ติดต่อ
            </Link>
          </nav>

          {/* ================================= */}
          {/* Desktop Right */}
          {/* ================================= */}

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/apply"
              className="rounded-full bg-[#7A0019] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#5C0013] hover:shadow-xl active:scale-95"
            >
              สาขาที่สนใจ
            </Link>
          </div>

          {/* ================================= */}
          {/* Mobile Button */}
          {/* ================================= */}

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition lg:hidden ${
              scrolled
                ? "bg-gray-100 text-gray-800"
                : "bg-white/10 text-white backdrop-blur-md"
            }`}
            aria-label="เปิดเมนู"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* ================================= */}
        {/* Mobile Menu */}
        {/* ================================= */}

        {menuOpen && (
          <div
            className={`mb-4 overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-xl lg:hidden ${
              scrolled
                ? "border-gray-200 bg-white/95"
                : "border-white/20 bg-black/70"
            }`}
          >
            <nav className="flex flex-col gap-2">
              {menus.map((menu) => {
              const active = activePath === menu.path;

                return (
                  <Link
                    key={menu.path}
                    to={menu.path}
                    onClick={() => setMenuOpen(false)}
                    className={`relative rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      active
                        ? "bg-[#7A0019] text-white"
                        : scrolled
                          ? "text-gray-700 hover:bg-gray-100 hover:text-[#7A0019]"
                          : "text-white hover:bg-white/10"
                    }`}
                  >
                    {menu.name}
                  </Link>
                );
              })}

              <Link
                to="/#contact"
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  contactActive
                    ? "bg-[#7A0019] text-white"
                    : scrolled
                      ? "text-gray-700 hover:bg-gray-100 hover:text-[#7A0019]"
                      : "text-white hover:bg-white/10"
                }`}
              >
                ติดต่อ
              </Link>

              <div className="my-2 border-t border-gray-200/20" />

              <Link
                to="/apply"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-[#7A0019] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#5C0013]"
              >
                สมัครเรียน
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
