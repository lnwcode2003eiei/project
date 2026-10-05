import { useEffect, useRef, useState } from 'react';
import './comparison-people-dialog.css';

export default function ComparisonPeopleDialog({ title, people, onClose }) {
  const dialog = useRef(null); const [search, setSearch] = useState('');
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close(); }, []);
  const matches = people.filter(person => person.name.toLocaleLowerCase('th-TH').includes(search.trim().toLocaleLowerCase('th-TH')));
  return <dialog ref={dialog} className="comparison-people-dialog" aria-labelledby="comparison-people-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="comparison-people-content">
      <div className="comparison-people-heading"><div><p>รายละเอียดรายชื่อ</p><h2 id="comparison-people-title">{title}</h2><span>{people.length.toLocaleString()} ชื่อ</span></div><button type="button" aria-label="ปิด" onClick={onClose}>×</button></div>
      <input autoFocus type="search" className="comparison-people-search" placeholder="ค้นหาชื่อหรือนามสกุล…" value={search} onChange={event => setSearch(event.target.value)} />
      <ol className="comparison-people-list">{matches.map((person, index) => <li key={person.key || person.name + index}><span>{index + 1}</span><strong>{person.name}</strong>{person.page ? <small>หน้า {person.page}</small> : null}</li>)}</ol>
      {!matches.length && <p className="comparison-people-empty">ไม่พบรายชื่อ</p>}
      <button type="button" className="comparison-people-close" onClick={onClose}>ปิดหน้าต่าง</button>
    </div>
  </dialog>;
}
