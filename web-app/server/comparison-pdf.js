import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const exec = promisify(execFile);

export async function readComparisonPdf(buffer, signal) {
  const dir = await mkdtemp(path.join(tmpdir(), 'faculty-comparison-'));
  const file = path.join(dir, 'source.pdf');
  const run = (command, args) => exec(command, args, { signal, timeout: 25000, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, LC_ALL: 'C', OMP_THREAD_LIMIT: '1' } });
  try {
    await writeFile(file, buffer, { mode: 0o600 });
    const { stdout: info } = await run('pdfinfo', [file]);
    const count = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]);
    if (!count || count > 30) throw new Error('รองรับ PDF ไม่เกิน 30 หน้า');
    if (/^Encrypted:\s+yes/m.test(info)) throw new Error('กรุณาใช้ PDF ที่ไม่มีรหัสผ่าน');
    const pages = []; let scans = 0;
    for (let number = 1; number <= count; number++) {
      const { stdout } = await run('pdftotext', ['-f', String(number), '-l', String(number), '-layout', '-enc', 'UTF-8', file, '-']);
      let text = stdout, ocr = false;
      if ((text.match(/[\p{L}]/gu) || []).length < 30) {
        if (++scans > 10) throw new Error('รองรับหน้าสแกนไม่เกิน 10 หน้า กรุณาแบ่งไฟล์');
        const prefix = path.join(dir, `page-${number}`);
        await run('pdftoppm', ['-f', String(number), '-l', String(number), '-singlefile', '-scale-to', '2200', '-png', file, prefix]);
        await run('tesseract', [`${prefix}.png`, prefix, '-l', 'tha+eng', '--psm', '6']);
        text = await readFile(`${prefix}.txt`, 'utf8'); ocr = true;
      }
      pages.push({ number, text, ocr });
    }
    return pages;
  } finally {
    // Exact private directory returned by mkdtemp, never a user-provided path.
    await rm(dir, { recursive: true, force: true });
  }
}
