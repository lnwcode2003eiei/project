import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import Header from "./component/Header";
import Hero from "./component/Hero";
import Slider from "./component/Slider";
import Recommend from "./component/Recommend";
import News from "./component/News";
import NewsPage from "./component/NewsPage";
import NewsDetail from "./component/NewsDetail";
import Footer from "./component/Footer";

import Register from "./component/Register";
import ApplyPage from "./component/ApplyPage";

import Recommendpage from "./component/Nextrecommend/Recommendpage";

import Computer from "./component/saka/computer";
import Electrical from "./component/saka/electrical";
import Digital from "./component/saka/digital";
import Industrial from "./component/saka/industrial";
import Survey from "./component/saka/survey";
import Logistics from "./component/saka/logistics";
import Energy from "./component/saka/energy";
import Construction from "./component/saka/construction";
import Management from "./component/saka/management";
import ComputerAI from "./component/saka/computerAI";

const Admin = lazy(() => import("./component/admin/Admin"));
const AdminLogin = lazy(() => import("./component/admin/AdminLogin"));

import ScrollToTop from "./component/ScrollToTop";

// ==========================================
// Home
// ==========================================

function Home() {
  return (
    <>
      <Hero />
      <Recommend />
      <Slider />
      <News />
    </>
  );
}

function ProtectedAdmin({ children }) {
  const token = localStorage.getItem("token");

  try {
    const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
    if (token && adminUser?.username) return children;
  } catch {
    // ส่งไปหน้าเข้าสู่ระบบด้านล่าง
  }

  return <Navigate to="/admin/login" replace />;
}

// ==========================================
// App Content
// ==========================================

function AppContent() {
  const location = useLocation();

  // ตรวจสอบว่าอยู่ใน Admin หรือไม่
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Header แสดงทุกหน้า ยกเว้น Admin */}
      {!isAdmin && <Header />}

      <Suspense fallback={<div className="p-6 text-center text-gray-500">กำลังโหลด...</div>}>
      <Routes>
        {/* ================================= */}
        {/* หน้าแรก + Popup */}
        {/* ================================= */}

        <Route
          path="/"
          element={
            <>
              <Home />
              <Register />
            </>
          }
        />

        {/* ================================= */}
        {/* Home */}
        {/* ================================= */}

        <Route path="/home" element={<Home />} />

        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/all" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />

        {/* ================================= */}
        {/* สมัครเรียน */}
        {/* ================================= */}

        <Route path="/apply" element={<ApplyPage />} />

        <Route path="/register" element={<ApplyPage />} />

        {/* ================================= */}
        {/* แนะนำคณะ */}
        {/* ================================= */}

        <Route path="/Recommendpage" element={<Recommendpage />} />

        <Route path="/History" element={<Navigate to="/Recommendpage" replace />} />

        <Route path="/Vision" element={<Navigate to="/Recommendpage" replace />} />

        <Route path="/Structure" element={<Navigate to="/Recommendpage" replace />} />

        <Route path="/Executive" element={<Navigate to="/Recommendpage" replace />} />

        <Route path="/Teacher" element={<Navigate to="/Recommendpage" replace />} />

        <Route path="/Department" element={<Navigate to="/Recommendpage" replace />} />

        {/* ================================= */}
        {/* สาขา */}
        {/* ================================= */}

        <Route path="/computer" element={<Computer />} />

        <Route path="/electrical" element={<Electrical />} />

        <Route path="/digital" element={<Digital />} />

        <Route path="/industrial" element={<Industrial />} />

        <Route path="/survey" element={<Survey />} />

        <Route path="/logistics" element={<Logistics />} />

        <Route path="/energy" element={<Energy />} />

        <Route path="/construction" element={<Construction />} />

        <Route path="/management" element={<Management />} />

        <Route path="/computerAI" element={<ComputerAI />} />

        {/* ================================= */}
        {/* Admin Login */}
        {/* ================================= */}

        <Route path="/AdminLogin" element={<AdminLogin />} />

        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ================================= */}
        {/* Admin */}
        {/* ================================= */}

        <Route path="/admin/*" element={<ProtectedAdmin><Admin /></ProtectedAdmin>} />
      </Routes>
      </Suspense>

      {/* Footer แสดงทุกหน้า ยกเว้น Admin */}
      {!isAdmin && <Footer />}
    </>
  );
}

// ==========================================
// App
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <AppContent />
    </BrowserRouter>
  );
}

export default App;
