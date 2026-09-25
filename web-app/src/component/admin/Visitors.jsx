import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../config/api";
import ComparisonDashboard from "./ComparisonDashboard";
import { useSearchParams } from "react-router-dom";

function Visitors({ canCompare = false }) {
  const [params, setParams] = useSearchParams();
  const start = params.get('start');
  const end = params.get('end');
  const dateQuery = start !== null || end !== null ? `?${new URLSearchParams({ start: start || '', end: end || '' })}` : '';
  const [activeTab, setActiveTab] = useState("visitors");
  const [visitors, setVisitors] = useState([]);
  const [interested, setInterested] = useState([]);
  const [interestScope, setInterestScope] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [branch, setBranch] = useState("");
  const [comparisonRequested, setShowComparison] = useState(false);
  const showComparison = canCompare && comparisonRequested;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        activeTab === "visitors"
          ? apiUrl(`/api/admin/visitors${dateQuery}`)
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
        setInterestScope(data.scope || null);
      }
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถเชื่อมต่อ Express Server ได้");
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateQuery]);

  useEffect(() => {
    const timer = window.setTimeout(fetchData, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const currentList = activeTab === "visitors" ? visitors : interested;
  const educationOptions = useMemo(() => [...new Set([
    'มัธยมศึกษาปีที่ 6 (ม.6)', 'ประกาศนียบัตรวิชาชีพ (ปวช.)',
    'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', 'ปริญญาตรี (ป.ตรี)',
    ...interested.map(item => item.education || item.status).filter(Boolean),
  ])], [interested]);
  const branches = useMemo(() => [...new Set(interested.flatMap(item => [
    item.major_name || item.major,
    item.second_major_name || item.second_major,
  ]).filter(value => value && value !== "-" && value !== "ไม่ระบุ"))].sort((a, b) => a.localeCompare(b, "th")), [interested]);

  const filteredData = useMemo(() => {
    return currentList.filter((item) => {
      const keyword = search.toLowerCase();

      // รองรับทั้งชื่อคอลัมน์ใหม่และเดิม
      const name = item.fullname || item.name || "";
      const school = item.old_school || item.school || "";
      const major = item.major_name || item.major || "";
      const secondMajor = item.second_major_name || item.second_major || "";
      const itemStatus = (activeTab === "interested" ? item.education || item.status : item.status) || "";

      const matchesSearch =
        name.toLowerCase().includes(keyword) ||
        school.toLowerCase().includes(keyword) ||
        major.toLowerCase().includes(keyword) ||
        secondMajor.toLowerCase().includes(keyword);

      const matchesStatus = status === "" || itemStatus === status;

      const matchesBranch = activeTab !== "interested" || !branch || major === branch || secondMajor === branch;
      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [currentList, search, status, branch, activeTab]);

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
          <div role="group" aria-label="เลือกหน้าข้อมูลผู้เข้าชม" className={`visitor-view-switch mb-6 grid w-full grid-cols-1 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 sm:inline-grid sm:w-auto ${canCompare ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <button
              type="button"
              aria-pressed={!showComparison && activeTab === "visitors"}
              onClick={() => {
                setActiveTab("visitors");
                setShowComparison(false);
                setBranch("");
                setSearch("");
                setStatus("");
              }}
              className={`min-h-12 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                !showComparison && activeTab === "visitors"
                  ? "bg-[#701D10] text-white shadow-sm"
                  : "text-gray-700 hover:bg-white hover:text-[#701D10]"
              }`}
            >
              ผู้เข้าชมเว็บไซต์
            </button>
            <button
              type="button"
              aria-pressed={!showComparison && activeTab === "interested"}
              onClick={() => {
                setActiveTab("interested");
                setShowComparison(false);
                setBranch("");
                setSearch("");
                setStatus("");
              }}
              className={`min-h-12 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                !showComparison && activeTab === "interested"
                  ? "bg-[#701D10] text-white shadow-sm"
                  : "text-gray-700 hover:bg-white hover:text-[#701D10]"
              }`}
            >
              ผู้ที่สนใจเรียน
            </button>
            {canCompare && <button type="button" aria-pressed={showComparison}
              onClick={() => setShowComparison(true)}
              className={`min-h-12 rounded-xl px-5 py-3 text-sm font-semibold transition ${showComparison ? "bg-[#701D10] text-white shadow-sm" : "text-gray-700 hover:bg-white hover:text-[#701D10]"}`}>
              เปรียบเทียบข้อมูล
            </button>}
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            {showComparison ? "เปรียบเทียบข้อมูล" : activeTab === "visitors" ? "ผู้เข้าชมเว็บไซต์" : "ผู้ที่สนใจเรียน"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {showComparison ? "เปรียบเทียบผู้เข้าชม ผู้สนใจ และรายชื่อผู้สอบผ่านจาก PDF" : activeTab === "visitors"
              ? "รายชื่อผู้ที่กรอกข้อมูลก่อนเข้าสู่เว็บไซต์"
              : "รายชื่อผู้ที่กรอกข้อมูลแสดงความสนใจเข้าศึกษาต่อ"}
          </p>
        </div>

        {!showComparison && <button
          onClick={fetchData}
          className="rounded-xl bg-[#701D10] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#093341] active:scale-95"
        >
          ↻ รีเฟรชข้อมูล
        </button>}
      </div>

      {showComparison ? (
        <ComparisonDashboard />
      ) : <>
      {activeTab === 'visitors' && dateQuery && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#701D10]/20 bg-[#701D10]/5 p-4">
        <p>รายชื่อจากแท่งกราฟ: {start} ถึงก่อนวันที่ {end} <span className="block text-sm text-gray-600">ใช้ช่วงวันที่บันทึกเดียวกับกราฟสถิติ</span></p>
        <button type="button" className="rounded-lg bg-[#701D10] px-4 py-2 text-white" onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.delete('start'); next.delete('end'); return next; })}>ดูผู้เข้าชมทั้งหมด</button>
      </div>}
      {/* สรุปยอดรวม (เหลือการ์ดเดียว) */}
      <div className="mb-6 grid grid-cols-1">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            {activeTab === "visitors" ? dateQuery ? "ผู้เข้าชมในช่วงที่เลือก" : "ผู้เข้าชมทั้งหมด" : "ผู้สนใจเรียนทั้งหมด"}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {currentList.length.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table Box */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className={`grid items-end gap-4 ${activeTab === 'interested' ? 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]' : 'md:grid-cols-[minmax(0,1fr)_minmax(180px,260px)]'}`}>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-700">
              ค้นหารายชื่อ
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === "visitors"
                    ? "ค้นหาชื่อ หรือโรงเรียน..."
                    : "ค้นหาชื่อ, โรงเรียน หรือสาขา..."
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-normal outline-none transition focus:border-[#701D10] focus:ring-2 focus:ring-[#701D10]/10"
              />
            </label>

            {activeTab === "interested" && (
              <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-700">
                {interestScope?.all ? 'สาขาที่สนใจ (อันดับหนึ่งหรืออันดับสอง)' : 'สาขาที่คุณดูแล (อันดับหนึ่ง)'}
                <select disabled={!interestScope?.all} value={interestScope?.all ? branch : interestScope?.branchName || ''} onChange={e => setBranch(e.target.value)} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-normal text-black outline-none focus:border-[#701D10] focus:ring-2 focus:ring-[#701D10]/10 disabled:bg-gray-50 disabled:text-gray-800 disabled:opacity-100">
                  {interestScope?.all ? <><option value="">ทุกสาขา</option>
                  {branches.map(name => <option key={name} value={name}>{name}</option>)}</> : <option value={interestScope?.branchName || ''}>{interestScope?.branchName || (loading ? 'กำลังโหลดสาขา…' : 'ไม่สามารถโหลดสาขาได้')}</option>}
                </select>
              </label>
            )}
            <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-700">
              {activeTab === 'interested' ? 'ระดับวุฒิ' : 'สถานะ'}
            <select
              aria-label={activeTab === 'interested' ? 'กรองตามระดับวุฒิ' : 'กรองตามสถานะ'}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-normal text-black outline-none focus:border-[#701D10] focus:ring-2 focus:ring-[#701D10]/10"
            >
              <option value="">{activeTab === 'interested' ? 'ทุกระดับวุฒิ' : 'ทุกสถานะ'}</option>
              {activeTab === 'interested' ? educationOptions.map(value => <option key={value} value={value}>{value}</option>) : <>
              <option value="นักเรียน">นักเรียน</option>
              <option value="นักศึกษา">นักศึกษา</option>
              <option value="ครู">ครู</option>
              <option value="ผู้ปกครอง">ผู้ปกครอง</option>
              </>}
            </select>
            </label>
          </div>
          <p className="mt-3 text-sm text-gray-600" aria-live="polite">แสดง {filteredData.length.toLocaleString()} จาก {currentList.length.toLocaleString()} รายการ</p>
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
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{activeTab === 'interested' ? 'ระดับวุฒิ' : 'สถานะ'}</th>
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
                    const itemStatus = (activeTab === 'interested' ? item.education || item.status : item.status) || "-";

                    return (
                      <tr key={item.id || index} className="border-t border-gray-100 transition hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#701D10]/10 font-bold text-[#701D10]">
                              {name.charAt(0)}
                            </div>
                            <p className="font-semibold text-gray-900">{name}</p>
                          </div>
                        </td>
                        {activeTab === "interested" && (
                          <>
                            <td className="px-6 py-4 text-sm text-gray-600">{school}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-[#701D10]">{major}</td>
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
      </>}
    </div>
  );
}

export default Visitors;
