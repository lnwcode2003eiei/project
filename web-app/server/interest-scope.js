const branches = new Map(Object.entries({
  computer: 'วิศวกรรมคอมพิวเตอร์',
  'computer-ai': 'วิศวกรรมคอมพิวเตอร์และปัญญาประดิษฐ์',
  construction: 'วิศวกรรมบริหารงานก่อสร้าง',
  digital: 'เทคโนโลยีดิจิทัลเพื่อการออกแบบ',
  electrical: 'เทคโนโลยีไฟฟ้า',
  energy: 'วิศวกรรมการจัดการพลังงานในงานอุตสาหกรรม',
  industrial: 'เทคโนโลยีอุตสาหการ',
  logistics: 'วิศวกรรมโลจิสติกส์',
  management: 'การจัดการงานวิศวกรรม',
  survey: 'เทคโนโลยีสำรวจและภูมิสารสนเทศ',
}));

// Only the authenticated server-side claim decides scope. Unknown claims fail closed.
export function interestScope(admin) {
  if (admin?.saka_path === 'all') return { where: '', values: [] };
  const name = branches.get(admin?.saka_path);
  return name ? { where: 'WHERE major_name = ?', values: [name] } : null;
}
