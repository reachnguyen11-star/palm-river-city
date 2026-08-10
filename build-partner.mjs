/**
 * Dựng bản trắng (white-label) cho đối tác từ chính trang chính,
 * để bản clone không bao giờ lạc hậu so với bản gốc.
 *
 * Chạy:  node build-partner.mjs
 * Ra:    ../PALM-RIVER-PARTNER/  (folder riêng, là một Vercel project độc lập)
 *
 * Cách hoạt động: bóc theo marker HTML đặt sẵn trong index.html / cam-on.html
 *   <!-- partner:cut -->  ... <!-- /partner:cut -->   → xoá khỏi bản đối tác
 *   <!-- partner:only     ... /partner:only -->       → chỉ hiện ở bản đối tác
 *
 * Thêm/bớt nội dung cho bản đối tác thì sửa marker trong file gốc, không sửa file này.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

// Folder riêng, nằm ngoài project chính để deploy Vercel độc lập.
// Đặt cạnh project chính chứ không lồng bên trong, tránh bị deploy kèm.
const OUT = path.resolve('..', 'PALM-RIVER-PARTNER');
const PAGES = ['index.html', 'cam-on.html'];
const ASSET_DIRS = ['css', 'js', 'images'];

// Nội dung không được phép còn sót trong bản đối tác. Nếu còn, build dừng lại
// thay vì âm thầm giao ra bản vẫn lộ thông tin Aureal.
const FORBIDDEN = ['0903998939', '090 399 89 39', 'AUREAL', 'Aureal'];

function stripPartnerMarkers(html) {
  // Xoá các khối partner:cut
  let out = html.replace(/[ \t]*<!--\s*partner:cut\s*-->[\s\S]*?<!--\s*\/partner:cut\s*-->[ \t]*\r?\n?/g, '');
  // Mở khoá các khối partner:only (đang bị comment trong bản gốc)
  out = out.replace(/[ \t]*<!--\s*partner:only\s*([\s\S]*?)\/partner:only\s*-->/g, (_, inner) => inner.replace(/\s+$/, ''));
  return out;
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function main() {
  // Giữ lại .vercel để không mất liên kết project mỗi lần build lại.
  const vercelLink = path.join(OUT, '.vercel');
  let keptLink = null;
  try { keptLink = await fs.readFile(path.join(vercelLink, 'project.json'), 'utf8'); } catch {}

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  if (keptLink) {
    await fs.mkdir(vercelLink, { recursive: true });
    await fs.writeFile(path.join(vercelLink, 'project.json'), keptLink, 'utf8');
    console.log('  giữ lại liên kết Vercel project');
  }

  for (const dir of ASSET_DIRS) await copyDir(dir, path.join(OUT, dir));

  const problems = [];
  for (const page of PAGES) {
    const src = await fs.readFile(page, 'utf8');
    const out = stripPartnerMarkers(src);

    if (out === src) problems.push(`${page}: không tìm thấy marker partner:cut nào, kiểm tra lại file gốc`);
    for (const word of FORBIDDEN) {
      if (out.includes(word)) problems.push(`${page}: còn sót "${word}"`);
    }

    await fs.writeFile(path.join(OUT, page), out, 'utf8');
    const saved = ((src.length - out.length) / 1024).toFixed(1);
    console.log(`  ${page}  đã bỏ ${saved} KB`);
  }

  if (problems.length) {
    console.error('\nBUILD THAT BAI:');
    problems.forEach((p) => console.error('  - ' + p));
    process.exit(1);
  }
  console.log(`\nXong. Bản đối tác nằm ở ${OUT}`);
  console.log('Deploy:  cd "' + OUT + '" && npx vercel deploy --prod');
}

main().catch((e) => { console.error(e); process.exit(1); });
