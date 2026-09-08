import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";

function AdminMenu() {
  const location = useLocation();
  const isSuperAdmin = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminUser") || "{}").saka_path === "all";
    } catch {
      return false;
    }
  })();
  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminUser") || "{}");
    } catch {
      return {};
    }
  })();
  const displayName =
    [adminUser.first_name, adminUser.last_name].filter(Boolean).join(" ") ||
    adminUser.username ||
    "Admin";

  const menus = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: "lucide:layout-dashboard",
    },
    {
      name: "ผู้เข้าชมเว็บไซต์",
      path: "/admin/visitors",
      icon: "lucide:users",
    },

    {
      name: "ข่าวสาร",
      path: "/admin/news",
      icon: "lucide:newspaper",
    },
    {
      name: "หลักสูตร",
      path: "/admin/programs",
      icon: "lucide:graduation-cap",
    },
    ...(isSuperAdmin ? [{
      name: "แนะนำคณะ",
      path: "/admin/recommend",
      icon: "lucide:building-2",
    }] : []),
    ...(isSuperAdmin ? [{
      name: "User",
      path: "/admin/users",
      icon: "lucide:user-cog",
    }] : []),
  ];

  return (
    <>
    <aside className="admin-sidebar group hidden h-screen w-20 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-300 hover:w-64 md:flex">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center gap-3 border-b border-gray-200 px-5 group-hover:justify-start">
        <Icon
          icon="fluent:settings-24-filled"
          className="animate-[spin_8s_linear_infinite] text-4xl text-[#7A0019]"
          aria-label="ระบบจัดการ"
        />
        <span className="hidden whitespace-nowrap text-xl font-bold text-[#7A0019] group-hover:block">
          Admin
        </span>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 hidden whitespace-nowrap px-3 text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:block">
          เมนูหลัก
        </p>

        <nav className="space-y-1">
          {menus.map((menu) => {
            const active = menu.path === "/admin"
              ? location.pathname === menu.path
              : location.pathname === menu.path || location.pathname.startsWith(`${menu.path}/`);

            return (
              <Link
                key={menu.path}
                to={menu.path}
                className={`flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition group-hover:justify-start ${
                  active
                    ? "bg-[#7A0019] text-white shadow-md"
                    : "text-gray-600 hover:bg-[#7A0019]/10 hover:text-[#7A0019]"
                }`}
              >
                <Icon icon={menu.icon} className="text-lg" />
                <span className="hidden whitespace-nowrap group-hover:block">{menu.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-center gap-3 rounded-xl bg-gray-50 p-3 group-hover:justify-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7A0019]/10 text-[#7A0019]">
            <Icon icon="lucide:shield-user" className="text-xl" aria-label="ผู้ดูแลระบบ" />
          </div>

          <div className="hidden min-w-0 group-hover:block">
            <p className="truncate text-sm font-bold text-gray-900">{displayName}</p>

            <p className="truncate text-xs text-gray-500">
              {isSuperAdmin ? "Super Admin" : "Admin ประจำสาขา"}
            </p>
          </div>
        </div>
      </div>
    </aside>

    <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[#f1dce1] bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(122,0,25,0.08)] md:hidden">
      {menus.map((menu) => {
        const active = menu.path === "/admin"
          ? location.pathname === menu.path
          : location.pathname === menu.path || location.pathname.startsWith(`${menu.path}/`);
        return (
          <Link
            key={menu.path}
            to={menu.path}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold ${
              active ? "bg-[#7A0019] text-white" : "text-gray-600"
            }`}
          >
            <Icon icon={menu.icon} className="text-xl" />
            <span className="max-w-full truncate">{menu.name}</span>
          </Link>
        );
      })}
    </nav>
    </>
  );
}

export default AdminMenu;
