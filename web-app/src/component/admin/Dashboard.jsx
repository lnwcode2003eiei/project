
import { useEffect, useState } from "react";
import { apiUrl } from "../../config/api";

function Dashboard() {
  // ==========================================
  // Admin Permission
  // ==========================================

  const [adminUser] = useState(() => {
    try {
      const savedAdmin = JSON.parse(
        localStorage.getItem("adminUser") || "{}",
      );

      return {
        username: savedAdmin.username || "",
        saka_path: savedAdmin.saka_path || "all",
        can_edit: Number(savedAdmin.can_edit ?? 0),
      };
    } catch (error) {
      console.error("ไม่สามารถอ่านข้อมูล Admin:", error);
      return { username: "", saka_path: "all", can_edit: 0 };
    }
  });

  // ==========================================
  // State
  // ==========================================

  const [dashboard, setDashboard] = useState({
    totalVisitors: 0,
    students: 0,
    universityStudents: 0,
    teachers: 0,
    staff: 0,
    parents: 0,
    todayVisitors: 0,
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [majorInterests, setMajorInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // ชื่อสาขา
  // ==========================================

  const branchNames = {
    computer: "วิศวกรรมคอมพิวเตอร์",
    "computer-ai": "คอมพิวเตอร์และปัญญาประดิษฐ์",
    construction: "วิศวกรรมบริหารงานก่อสร้าง",
    digital: "เทคโนโลยีดิจิทัลเพื่อการออกแบบ",
    electrical: "เทคโนโลยีไฟฟ้า",
    energy:
      "วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม",
    industrial: "เทคโนโลยีอุตสาหการ",
    logistics: "วิศวกรรมโลจิสติกส์",
    management: "การจัดการงานวิศวกรรม",
    survey: "เทคโนโลยีสำรวจและภูมิสารสนเทศ",
    all: "ทุกสาขา",
  };

  const currentBranch =
    branchNames[adminUser.saka_path] ||
    adminUser.saka_path ||
    "ไม่ระบุสาขา";

  const isViewOnly =
    Number(adminUser.can_edit) !== 1;

  // ==========================================
  // โหลดข้อมูลทั้งหมดแบบ Parallel
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const token = localStorage.getItem("token");
    const requestOptions = {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    };

    const fetchAllData = async () => {
      setLoading(true);

      try {
        const [
          dashRes,
          monthlyRes,
          majorsRes,
        ] = await Promise.all([
          fetch(
            apiUrl("/api/admin/dashboard"),
            requestOptions,
          ),

          fetch(
            apiUrl("/api/admin/dashboard/monthly"),
            requestOptions,
          ),

          fetch(
            apiUrl("/api/admin/dashboard/majors"),
            requestOptions,
          ),
        ]);

        const [
          dashResult,
          monthlyResult,
          majorsResult,
        ] = await Promise.all([
          dashRes.json(),
          monthlyRes.json(),
          majorsRes.json(),
        ]);

        if (dashResult.success) {
          setDashboard(
            dashResult.data,
          );
        }

        if (monthlyResult.success) {
          setMonthlyData(
            monthlyResult.data,
          );
        }

        if (majorsResult.success) {
          setMajorInterests(
            majorsResult.data,
          );
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            "เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard:",
            error,
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    return () => controller.abort();
  }, []);

  // ==========================================
  // คำนวณความสนใจแต่ละสาขา
  // ==========================================

  const totalMajorInterests =
    majorInterests.reduce(
      (sum, item) =>
        sum + Number(item.count || 0),
      0,
    );

  let majorDegree = 0;

  const majorStops =
    majorInterests.map((item) => {
      const percent =
        totalMajorInterests > 0
          ? (Number(item.count || 0) /
              totalMajorInterests) *
            100
          : 0;

      const start = majorDegree;

      majorDegree += percent;

      return `${
        item.color || "#701D10"
      } ${start}% ${majorDegree}%`;
    });

  const majorDonutBg =
    totalMajorInterests > 0
      ? `conic-gradient(${majorStops.join(
          ", ",
        )})`
      : "#E5E7EB";

  // ==========================================
  // Stats Data
  // ==========================================

  const stats = [
    {
      title: "ผู้เข้าชมทั้งหมด",
      value: dashboard.totalVisitors,
    },

    {
      title: "นักเรียน",
      value: dashboard.students,
    },

    {
      title: "นักศึกษา",
      value: dashboard.universityStudents,
    },

    {
      title: "ครู",
      value: dashboard.teachers,
    },

    {
      title: "จำนวนผู้สนใจทั้งหมด",
      value: totalMajorInterests,
    },
  ];

  // ==========================================
  // คำนวณประเภทผู้เข้าชม
  // ==========================================

  stats.splice(4, 0, { title: "ผู้ปกครอง", value: Number(dashboard.parents || 0) });
  const visitorTypes = [
    { name: "ผู้ปกครอง", count: Number(dashboard.parents || 0), color: "#F7941D" },
    {
      name: "นักเรียน",
      count: dashboard.students,
      color: "#701D10",
    },

    {
      name: "นักศึกษา",
      count: dashboard.universityStudents,
      color: "#5B00FF",
    },

    {
      name: "ครู",
      count: dashboard.teachers,
      color: "#29C8BC",
    },
  ];

  const totalVisitorCategoryCount =
    visitorTypes.reduce(
      (sum, item) =>
        sum + Number(item.count || 0),
      0,
    );

  let visitorDegree = 0;

  const visitorStops =
    visitorTypes.map((item) => {
      const percent =
        totalVisitorCategoryCount > 0
          ? (Number(item.count || 0) /
              totalVisitorCategoryCount) *
            100
          : 0;

      const start = visitorDegree;

      visitorDegree += percent;

      return `${item.color} ${start}% ${visitorDegree}%`;
    });

  const visitorDonutBg =
    totalVisitorCategoryCount > 0
      ? `conic-gradient(${visitorStops.join(
          ", ",
        )})`
      : "#E5E7EB";

  // ==========================================
  // เตรียมข้อมูลกราฟรายเดือน
  // ==========================================

  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  const chartData = months.map(
    (monthName, index) => {
      const monthNumber = index + 1;

      const found = monthlyData.find(
        (item) =>
          Number(item.month) ===
          monthNumber,
      );

      return {
        month: monthName,
        value: found
          ? Number(found.total || 0)
          : 0,
      };
    },
  );

  const maxValue = Math.max(
    ...chartData.map(
      (item) => item.value,
    ),
    1,
  );

  const totalMonthlyVisitors = chartData.reduce(
    (total, item) => total + item.value,
    0,
  );
  const peakMonth = chartData.reduce(
    (currentPeak, item) =>
      item.value > currentPeak.value ? item : currentPeak,
    chartData[0],
  );

  return (
    <div className="mx-auto max-w-[1400px]">

      {/* ==========================================
          Header
      ========================================== */}

      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              ภาพรวมการใช้งานเว็บไซต์
              คณะเทคโนโลยีอุตสาหกรรม
            </p>
          </div>

          {/* ==========================================
              Admin Status
          ========================================== */}

          <div
            className={`rounded-2xl border px-5 py-4 ${
              isViewOnly
                ? "border-blue-100 bg-blue-50"
                : "border-green-100 bg-green-50"
            }`}
          >
            <div className="flex items-center gap-3">

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isViewOnly
                    ? "bg-blue-100"
                    : "bg-green-100"
                }`}
              >
                {isViewOnly
                  ? "ดู"
                  : "แก้ไข"}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Admin
                </p>

                <p className="font-bold text-gray-900">
                  {adminUser.username ||
                    "Admin"}
                </p>

                <p
                  className={`mt-0.5 text-xs font-semibold ${
                    isViewOnly
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                >
                  {isViewOnly
                    ? `ดูข้อมูลอย่างเดียว • ${currentBranch}`
                    : `สามารถแก้ไขข้อมูล • ${currentBranch}`}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ==========================================
          Loading
      ========================================== */}

      {loading ? (
        <div className="mb-6 rounded-xl bg-white p-12 text-center text-gray-400 shadow-sm">

          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#701D10] border-r-transparent align-[-0.125em]" />

          <p className="mt-3 text-sm font-medium">
            กำลังโหลดข้อมูล...
          </p>

        </div>
      ) : (
        <>
          {/* ==========================================
              Stats Grid
          ========================================== */}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">

            {stats.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >

                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {item.title}
                  </p>
                </div>

                <div className="mt-5">

                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    {Number(
                      item.value || 0,
                    ).toLocaleString()}
                  </p>

                  <p className="mt-2 text-xs font-medium text-gray-400">
                    จากข้อมูลในระบบ
                  </p>

                </div>

              </div>
            ))}

          </div>

          {/* ==========================================
              Charts Grid
          ========================================== */}

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">

            {/* =====================================
                Bar Chart
            ===================================== */}

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-5 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    สถิติผู้เข้าชมเว็บไซต์
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    จำนวนผู้เข้าชมรายเดือน
                  </p>
                </div>

                <div className="flex gap-3">
                  <div className="rounded-xl bg-red-50 px-4 py-2">
                    <p className="text-xs font-medium text-gray-500">รวมปีนี้</p>
                    <p className="mt-1 text-lg font-bold text-red-600">
                      {totalMonthlyVisitors.toLocaleString()} <span className="text-xs font-medium">ครั้ง</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-2">
                    <p className="text-xs font-medium text-gray-500">สูงสุด</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {peakMonth.value.toLocaleString()} <span className="text-xs font-medium text-gray-500">{peakMonth.month}</span>
                    </p>
                  </div>
                </div>

              </div>

              <div className="mt-6">

                <div className="relative h-[280px] w-full sm:h-[320px]">

                  <div className="absolute inset-x-0 bottom-7 top-0 flex flex-col justify-between">

                    {[100, 75, 50, 25, 0].map(
                      (value) => (
                        <div
                          key={value}
                          className="flex items-center"
                        >

                          <span className="w-10 text-[11px] text-gray-400">
                            {Math.round((maxValue * value) / 100)}
                          </span>

                          <div className="h-px flex-1 border-t border-dashed border-gray-100" />

                        </div>
                      ),
                    )}

                  </div>

                  <div className="absolute bottom-0 left-10 right-0 top-0 flex items-end justify-between gap-1 px-1 sm:gap-3 sm:px-2">

                    {chartData.map(
                      (item) => {
                        const height =
                          (item.value /
                            maxValue) *
                          250;

                        return (
                          <div
                            key={item.month}
                            className="flex h-full flex-1 flex-col items-center justify-end"
                          >

                            <span className="mb-2 text-[11px] font-semibold text-gray-500 sm:text-xs">
                              {item.value.toLocaleString()}
                            </span>

                            <div
                              className="w-full max-w-[48px] rounded-t-lg bg-[#701D10] transition-all duration-300 hover:bg-[#093341]"
                              style={{
                                height: `${height}px`,
                              }}
                            />

                            <span className="mt-3 text-[10px] text-gray-400 sm:text-xs">
                              {item.month}
                            </span>

                          </div>
                        );
                      },
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* =====================================
                Donut ประเภทผู้เข้าชม
            ===================================== */}

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  ประเภทผู้เข้าชม
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  สัดส่วนตามกลุ่มผู้ใช้งาน
                </p>

              </div>

              <div className="mt-8 flex justify-center">

                <div className="relative h-44 w-44">

                  <div
                    className="h-full w-full rounded-full transition-all duration-300"
                    style={{
                      background:
                        visitorDonutBg,
                    }}
                  />

                  <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white">

                    <span className="text-3xl font-bold text-gray-900">
                      {totalVisitorCategoryCount.toLocaleString()}
                    </span>

                    <span className="text-xs text-gray-400">
                      ผู้ใช้งาน
                    </span>

                  </div>

                </div>

              </div>

              <div className="mt-8 space-y-4">

                {visitorTypes.map(
                  (item) => {
                    const percent =
                      totalVisitorCategoryCount >
                      0
                        ? (
                            (item.count /
                              totalVisitorCategoryCount) *
                            100
                          ).toFixed(1)
                        : "0.0";

                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >

                        <div className="flex items-center gap-3">

                          <span
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor:
                                item.color,
                            }}
                          />

                          <span className="text-sm text-gray-500">
                            {item.name}
                          </span>

                        </div>

                        <div className="text-right">

                          <span className="text-sm font-bold text-gray-900">
                            {(
                              item.count ||
                              0
                            ).toLocaleString()}{" "}
                            คน
                          </span>

                          <span className="ml-2 text-xs font-semibold text-gray-500">
                            ({percent}%)
                          </span>

                        </div>

                      </div>
                    );
                  },
                )}

              </div>

            </div>

          </div>

          {/* ==========================================
              Donut ความสนใจแต่ละสาขา
          ========================================== */}

          <div className="mt-6">

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  ความสนใจแต่ละสาขา
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  สัดส่วนความสนใจเข้าศึกษาต่อรายสาขาวิชา
                </p>

              </div>

              <div className="mt-8 flex flex-col items-center justify-around gap-8 md:flex-row">

                <div className="relative h-48 w-48 shrink-0">

                  <div
                    className="h-full w-full rounded-full transition-all duration-300"
                    style={{
                      background:
                        majorDonutBg,
                    }}
                  />

                  <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white">

                    <span className="text-3xl font-bold text-gray-900">
                      {totalMajorInterests.toLocaleString()}
                    </span>

                    <span className="text-xs text-gray-400">
                      ผู้สนใจทั้งหมด
                    </span>

                  </div>

                </div>

                <div className="max-h-[260px] w-full max-w-xl space-y-3 overflow-y-auto pr-2">

                  {majorInterests.length >
                  0 ? (
                    majorInterests.map(
                      (item) => {
                        const percent =
                          totalMajorInterests >
                          0
                            ? (
                                (item.count /
                                  totalMajorInterests) *
                                100
                              ).toFixed(1)
                            : "0.0";

                        return (
                          <div
                            key={item.name}
                            className="flex items-center justify-between rounded-xl p-2 hover:bg-gray-50"
                          >

                            <div className="flex min-w-0 items-center gap-3 pr-2">

                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    item.color ||
                                    "#701D10",
                                }}
                              />

                              <span className="truncate text-sm font-medium text-gray-700">
                                {item.name}
                              </span>

                            </div>

                            <div className="shrink-0 text-right">

                              <span className="text-sm font-bold text-gray-900">
                                {(
                                  item.count ||
                                  0
                                ).toLocaleString()}{" "}
                                คน
                              </span>

                              <span className="ml-1.5 text-xs font-semibold text-gray-500">
                                ({percent}%)
                              </span>

                            </div>

                          </div>
                        );
                      },
                    )
                  ) : (
                    <p className="py-4 text-center text-xs text-gray-400">
                      ยังไม่มีข้อมูลความสนใจ
                    </p>
                  )}

                </div>

              </div>

            </div>

          </div>

        </>
      )}
    </div>
  );
}

export default Dashboard;
