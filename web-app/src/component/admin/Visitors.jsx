import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../config/api";

function Visitors() {
  const [activeTab, setActiveTab] = useState("visitors");
  const [visitors, setVisitors] = useState([]);
  const [interested, setInterested] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        activeTab === "visitors"
          ? apiUrl("/api/admin/visitors")
          : apiUrl("/api/admin/interested-students");

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลได้");
      }

      const data = await response.json();

      if (activeTab === "visitors") {
        setVisitors(data.visitors || []);
      } else {
        setInterested(data.interested || []);
      }
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถเชื่อมต่อ Express Server ได้");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const timer = window.setTimeout(fetchData, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const currentList = activeTab === "visitors" ? visitors : interested;

  const filteredData = useMemo(() => {
    return currentList.filter((item) => {
      const keyword = search.toLowerCase();

      // รองรับทั้งชื่อคอลัมน์ใหม่และเดิม
      const name = item.fullname || item.name || "";
      const school = item.old_school || item.school || "";
      const major = item.major_name || item.major || "";
      const secondMajor = item.second_major_name || item.second_major || "";
      const itemStatus = item.education || item.status || "";

      const matchesSearch =
        name.toLowerCase().includes(keyword) ||
        school.toLowerCase().includes(keyword) ||
        major.toLowerCase().includes(keyword) ||
        secondMajor.toLowerCase().includes(keyword);

      const matchesStatus = status === "" || itemStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [currentList, search, status]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusStyle = (value) => {
    switch (value) {
      case "นักเรียน":
        return "bg-blue-50 text-blue-600";
      case "นักศึกษา":
        return "bg-purple-50 text-purple-600";
      case "ครู":
      case "บุคลากร":
        return "bg-green-50 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header + Tabs */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-1.5 border border-gray-200">
            <button
              onClick={() => {
                setActiveTab("visitors");
                setSearch("");
                setStatus("");
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === "visitors"
                  ? "bg-white text-[#7A0019] shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              ผู้เข้าชมเว็บไซต์
            </button>
            <button
              onClick={() => {
                setActiveTab("interested");
                setSearch("");
                setStatus("");
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === "interested"
                  ? "bg-white text-[#7A0019] shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              ผู้ที่สนใจเรียน
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            {activeTab === "visitors" ? "ผู้เข้าชมเว็บไซต์" : "ผู้ที่สนใจเรียน"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {activeTab === "visitors"
              ? "รายชื่อผู้ที่กรอกข้อมูลก่อนเข้าสู่เว็บไซต์"
              : "รายชื่อผู้ที่กรอกข้อมูลแสดงความสนใจเข้าศึกษาต่อ"}
          </p>
        </div>

        <button
          onClick={fetchData}
          className="rounded-xl bg-[#7A0019] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5C0013] active:scale-95"
        >
          ↻ รีเฟรชข้อมูล
        </button>
      </div>

      {/* สรุปยอดรวม (เหลือการ์ดเดียว) */}
      <div className="mb-6 grid grid-cols-1">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            {activeTab === "visitors" ? "ผู้เข้าชมทั้งหมด" : "ผู้สนใจเรียนทั้งหมด"}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {currentList.length.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table Box */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === "visitors"
                    ? "ค้นหาชื่อ หรือโรงเรียน..."
                    : "ค้นหาชื่อ, โรงเรียน หรือสาขา..."
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#7A0019] focus:bg-white focus:ring-2 focus:ring-[#7A0019]/10"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#7A0019]"
            >
              <option value="">ทุกสถานะ</option>
              <option value="นักเรียน">นักเรียน</option>
              <option value="นักศึกษา">นักศึกษา</option>
              <option value="ครู">ครู</option>
              <option value="บุคลากร">บุคลากร</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-xl bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center text-gray-400">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">จำนวน</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ชื่อ</th>
                  {activeTab === "interested" && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">โรงเรียน</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">สาขาวิชาที่สนใจ</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">อันดับสอง</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">สถานะ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {activeTab === "visitors" ? "วันที่เข้าเว็บไซต์" : "วันที่สนใจ"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeTab === "interested" ? "7" : "4"}
                      className="px-6 py-16 text-center text-sm text-gray-400"
                    >
                      {activeTab === "visitors" ? "ไม่พบข้อมูลผู้เข้าชม" : "ไม่พบข้อมูลผู้สนใจเรียน"}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => {
                    const name = item.fullname || item.name || "-";
                    const school = item.old_school || item.school || "-";
                    const major = item.major_name || item.major || "-";
                    const secondMajor = item.second_major_name || item.second_major || "-";
                    const itemStatus = item.education || item.status || "-";

                    return (
                      <tr key={item.id || index} className="border-t border-gray-100 transition hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7A0019]/10 font-bold text-[#7A0019]">
                              {name.charAt(0)}
                            </div>
                            <p className="font-semibold text-gray-900">{name}</p>
                          </div>
                        </td>
                        {activeTab === "interested" && (
                          <>
                            <td className="px-6 py-4 text-sm text-gray-600">{school}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-[#7A0019]">{major}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{secondMajor}</td>
                          </>
                        )}
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(itemStatus)}`}>
                            {itemStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(item.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Visitors;
