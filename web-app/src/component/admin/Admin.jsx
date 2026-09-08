
import {
  Link,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import AdminMenu from "./AdminMenu";
import Dashboard from "./Dashboard";
import Visitors from "./Visitors";
import NewsAdmin from "./NewsAdmin";
import ProgramEditor from "./ProgramEditor";
import ProgramsOverview from "./ProgramsOverview";
import AdminUsers from "./AdminUsers";
import RecommendAdmin from "./RecommendAdmin";
import HistoryEditor from "./HistoryEditor";
import TeacherAdmin from "./TeacherAdmin";
import StructureAdmin from "./StructureAdmin";
import VisionEditor from "./VisionEditor";
import ProfileAdmin from "./ProfileAdmin";


// ==========================================
// 404
// ==========================================

function NotFound() {
  return (
    <div className="flex min-h-[400px] items-center justify-center text-gray-500">
      <p className="text-lg font-medium">
        ไม่พบหน้าที่คุณต้องการ
        (404 Page Not Found)
      </p>
    </div>
  );
}


// ==========================================
// ชื่อสาขา
// ==========================================

const branchNames = {
  computer:
    "วิศวกรรมคอมพิวเตอร์",

  "computer-ai":
    "คอมพิวเตอร์และปัญญาประดิษฐ์",

  construction:
    "วิศวกรรมบริหารงานก่อสร้าง",

  digital:
    "เทคโนโลยีดิจิทัลเพื่อการออกแบบ",

  electrical:
    "เทคโนโลยีไฟฟ้า",

  energy:
    "วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม",

  industrial:
    "เทคโนโลยีอุตสาหการ",

  logistics:
    "วิศวกรรมโลจิสติกส์",

  management:
    "การจัดการงานวิศวกรรม",

  survey:
    "เทคโนโลยีสำรวจและภูมิสารสนเทศ",

  all:
    "ทุกสาขา",
};


// ==========================================
// Admin
// ==========================================

function Admin() {
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // อ่านข้อมูล Admin
  // ==========================================

  const getAdminUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("adminUser") ||
          "{}",
      );
    } catch (error) {
      console.error(
        "อ่านข้อมูล Admin ไม่สำเร็จ:",
        error,
      );

      return {};
    }
  };

  const adminUser = getAdminUser();

  const username =
    adminUser.username ||
    localStorage.getItem("username") ||
    "Admin";

  const fullName = [adminUser.first_name, adminUser.last_name]
    .filter(Boolean)
    .join(" ") || username;

  const sakaPath =
    adminUser.saka_path ||
    localStorage.getItem("userRole") ||
    "all";

  const canEdit =
    Number(
      adminUser.can_edit ??
        localStorage.getItem("canEdit") ??
        0,
    ) === 1;

  const branchName =
    branchNames[sakaPath] ||
    sakaPath ||
    "ไม่ระบุสาขา";

  const isSuperAdmin =
    sakaPath === "all";

  const pageTitle = (() => {
    if (location.pathname === "/admin") return "Dashboard";
    if (location.pathname === "/admin/visitors") return "ผู้เข้าชมเว็บไซต์";
    if (location.pathname === "/admin/news") return "ข่าวสาร";
    if (location.pathname === "/admin/programs") return "หลักสูตร";
    if (location.pathname === "/admin/recommend") return "แนะนำคณะ";
    if (location.pathname === "/admin/users") return "จัดการผู้ใช้";
    if (location.pathname.startsWith("/admin/courses/")) return "แก้ไขหลักสูตร";
    return "Admin";
  })();

  // ==========================================
  // Logout
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("saka_path");
    localStorage.removeItem("canEdit");
    localStorage.removeItem("rememberAdmin");

    navigate("/admin/login");
  };

  return (
    <div className="admin-shell flex h-screen overflow-hidden bg-gray-50">

      {/* =================================
          Admin Menu
      ================================= */}

      <AdminMenu />

      {/* =================================
          Main
      ================================= */}

      <main className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">

        {/* =================================
            Header
        ================================= */}

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:h-20 md:px-6">

          {/* Left */}

          <div>

            <h1 className="text-xl font-bold text-gray-900">
              {pageTitle}
            </h1>

            <p className="mt-1 hidden text-xs text-gray-500 sm:block">
              ระบบจัดการเว็บไซต์
              คณะเทคโนโลยีอุตสาหกรรม
            </p>

          </div>


          {/* Right */}

          <div className="flex items-center gap-4">

            {isSuperAdmin && (
              <Link
                to="/admin/users"
                className="hidden rounded-lg bg-[#7A0019] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5C0013] sm:block"
              >
                จัดการผู้ใช้
              </Link>
            )}

            {/* Admin Info */}

            <div className="hidden text-right sm:block">

              <p className="text-sm font-bold text-gray-900">
                {fullName}
              </p>

              {/* Super Admin */}

              {isSuperAdmin ? (
                <p className="text-xs font-semibold text-blue-600">
                  Super Admin
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Admin ประจำสาขา
                </p>
              )}

            </div>

            {/* Logout */}

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              ออกจากระบบ
            </button>

          </div>

        </header>


        {/* =================================
            Permission Info Bar
        ================================= */}

        <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6">

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

            <div className="flex flex-wrap items-center gap-2 text-xs">

              <span className="font-semibold text-gray-400">
                บัญชี:
              </span>

              <span className="font-bold text-gray-800">
                {fullName}
              </span>

              <span className="text-gray-300">
                |
              </span>

              <span className="font-semibold text-gray-400">
                สิทธิ์:
              </span>

              {isSuperAdmin ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-600">
                  ดูทุกสาขา
                </span>
              ) : canEdit ? (
                <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-600">
                  แก้ไขได้
                </span>
              ) : (
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-600">
                  ดูอย่างเดียว
                </span>
              )}

            </div>


            <div className="text-xs text-gray-500">

              สาขา:

              <span className="ml-1 font-semibold text-[#7A0019]">
                {branchName}
              </span>

            </div>

          </div>

        </div>


        {/* =================================
            Content
        ================================= */}

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">

          <Routes>

            {/* =================================
                Dashboard
            ================================= */}

            <Route
              index
              element={
                <Dashboard />
              }
            />


            {/* =================================
                Visitors
            ================================= */}

            <Route
              path="visitors"
              element={
                <Visitors />
              }
            />


            {/* =================================
                News
            ================================= */}

            <Route
              path="news"
              element={
                <NewsAdmin />
              }
            />


            {/* =================================
                Program Editor
            ================================= */}

            <Route
              path="programs"
              element={
                <ProgramsOverview />
              }
            />

            <Route
              path="courses/:sakaPath"
              element={<ProgramEditor />}
            />

            <Route
              path="recommend"
              element={isSuperAdmin ? <RecommendAdmin /> : <NotFound />}
            />

            <Route
              path="recommend/structure"
              element={isSuperAdmin ? <StructureAdmin /> : <NotFound />}
            />

            <Route
              path="recommend/vision"
              element={isSuperAdmin ? <VisionEditor /> : <NotFound />}
            />
            <Route path="recommend/executive" element={isSuperAdmin ? <ProfileAdmin type="executive" title="ผู้บริหาร" /> : <NotFound />} />
            <Route path="recommend/department" element={isSuperAdmin ? <ProfileAdmin type="department" title="หน่วยงาน" /> : <NotFound />} />

            <Route
              path="recommend/:slug"
              element={isSuperAdmin ? <RecommendAdmin /> : <NotFound />}
            />

            <Route
              path="recommend/history"
              element={isSuperAdmin ? <HistoryEditor /> : <NotFound />}
            />

            <Route
              path="recommend/teacher"
              element={isSuperAdmin ? <TeacherAdmin /> : <NotFound />}
            />

            <Route
              path="users"
              element={isSuperAdmin ? <AdminUsers /> : <NotFound />}
            />


            {/* =================================
                404
            ================================= */}

            <Route
              path="*"
              element={
                <NotFound />
              }
            />

          </Routes>

        </div>

      </main>

    </div>
  );
}

export default Admin;
