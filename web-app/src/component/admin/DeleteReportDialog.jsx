import { useEffect, useRef } from 'react';
import './delete-report-dialog.css';

export default function DeleteReportDialog({ report, busy, error, onCancel, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="delete-report-dialog" aria-labelledby="delete-report-title" aria-describedby="delete-report-description" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <div className="delete-report-content">
      <div className="delete-report-icon" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" /></svg></div>
      <h2 id="delete-report-title">ลบชุดอัปโหลดนี้?</h2>
      <p className="delete-report-subtitle">โปรดตรวจสอบข้อมูลก่อนยืนยันการลบ</p>
      <div className="delete-report-file"><span>ชุดอัปโหลดที่เลือก</span><strong>{report.filename}</strong><span>ปีการศึกษา {report.academic_year}</span></div>
      <p id="delete-report-description" className="delete-report-warning">ผลเปรียบเทียบชุดนี้จะถูกลบถาวร และไม่สามารถย้อนกลับได้</p>
      <p className="delete-report-note">ข้อมูลผู้เข้าชมและผู้สนใจต้นทางจะยังอยู่ครบ</p>
      {error && <p role="alert" className="delete-report-warning">{error}</p>}
      <div className="delete-report-actions">
        <button type="button" className="delete-report-cancel" autoFocus disabled={busy} onClick={onCancel}>ยกเลิก</button>
        <button type="button" className="delete-report-confirm" disabled={busy} onClick={onConfirm}>{busy ? 'กำลังลบ…' : 'ยืนยันลบชุดอัปโหลด'}</button>
      </div>
    </div>
  </dialog>;
}
