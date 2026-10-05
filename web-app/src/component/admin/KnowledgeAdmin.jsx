import KnowledgeDocuments from './KnowledgeDocuments';
import KnowledgeLineDashboard from './KnowledgeLineDashboard';

export default function KnowledgeAdmin() {
  return <div className="mx-auto max-w-6xl space-y-5 text-slate-900">
    <header className="rounded-2xl border border-slate-200 bg-white p-6"><h1 className="text-2xl font-bold">ข้อมูลให้ AI</h1><p className="mt-2 text-sm text-slate-500">จัดการเอกสาร PDF สำหรับ N8N และติดตามข้อความที่ผู้ใช้ส่งจาก LINE แยกตามประเภทคำถาม</p></header>
    <KnowledgeDocuments />
    <KnowledgeLineDashboard />
  </div>;
}
