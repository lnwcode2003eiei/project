import { Link } from "react-router-dom";

// รายการ 10 สาขาวิชา
const allPrograms = [
  { id: "computer", name: "วิศวกรรมคอมพิวเตอร์", path: "/admin/courses/computer" },
  { id: "computer-ai", name: "คอมพิวเตอร์และปัญญาประดิษฐ์", path: "/admin/courses/computer-ai" },
  { id: "construction", name: "เทคโนโลยีก่อสร้าง", path: "/admin/courses/construction" },
  { id: "digital", name: "เทคโนโลยีดิจิทัล", path: "/admin/courses/digital" },
  { id: "electrical", name: "วิศวกรรมไฟฟ้า", path: "/admin/courses/electrical" },
  { id: "energy", name: "เทคโนโลยีพลังงาน", path: "/admin/courses/energy" },
  { id: "industrial", name: "วิศวกรรมอุตสาหการ", path: "/admin/courses/industrial" },
  { id: "logistics", name: "การจัดการโลจิสติกส์", path: "/admin/courses/logistics" },
  { id: "management", name: "การจัดการเทคโนโลยี", path: "/admin/courses/management" },
  { id: "survey", name: "วิศวกรรมสำรวจ", path: "/admin/courses/survey" },
];

export default function ProgramsOverview() {
  // ดึงสิทธิ์สาขาที่เก็บไว้ตอน Login
  const userRole = localStorage.getItem("userRole") || "all";

  // กรองแสดงผล: ถ้าเป็น 'all' แสดงทั้งหมด / ถ้าไม่ใช่ ให้แสดงเฉพาะ id ที่ตรงกัน
  const displayPrograms = userRole === "all"
    ? allPrograms
    : allPrograms.filter((program) => program.id === userRole);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">จัดการหลักสูตร / สาขาวิชา</h2>
        <p className="text-sm text-gray-500">เลือกสาขาวิชาที่ต้องการจัดการข้อมูล</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayPrograms.length > 0 ? (
          displayPrograms.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-red-500 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">{item.name}</span>
              </div>
              <Link
                to={item.path}
                className="rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-900"
              >
                จัดการข้อมูล
              </Link>
            </div>
          ))
        ) : (
          <p className="text-gray-500">ไม่พบสิทธิ์การจัดการสาขาวิชา</p>
        )}
      </div>
    </div>
  );
}
