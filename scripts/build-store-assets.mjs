import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "store", "assets");
const iconSource = await fs.readFile(
  path.join(root, "design", "icons", "retitle-plus", "master.svg"),
  "utf8",
);
const iconBody = iconSource
  .replace(/^.*?<svg[^>]*>/s, "")
  .replace(/<title>.*?<\/title>/s, "")
  .replace(/<\/svg>\s*$/s, "");

const ink = "#172033";
const muted = "#667085";
const border = "#D9DEE8";
const canvas = "#F7F8FA";
const surface = "#FFFFFF";
const indigo = "#635BFF";
const indigoSoft = "#EEEDFF";
const green = "#248457";
const greenSoft = "#ECFDF3";
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function icon(x, y, size) {
  return `<g transform="translate(${x} ${y}) scale(${size / 32})" fill="none">${iconBody}</g>`;
}

function text(x, y, value, size, weight = 500, fill = ink, extra = "") {
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${value}</text>`;
}

function multiline(x, y, lines, size, lineHeight, weight = 500, fill = ink) {
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${line}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${tspans}</text>`;
}

function check(x, y, label) {
  return `
    <circle cx="${x + 11}" cy="${y - 7}" r="11" fill="${indigoSoft}"/>
    <path d="M${x + 6} ${y - 7}l4 4 7-8" fill="none" stroke="${indigo}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    ${text(x + 32, y, label, 18, 600)}
  `;
}

function radio(x, y, selected = false) {
  return `
    <circle cx="${x}" cy="${y}" r="8" fill="${selected ? indigo : surface}" stroke="${selected ? indigo : muted}"/>
    ${selected ? `<circle cx="${x}" cy="${y}" r="3" fill="${surface}"/>` : ""}
  `;
}

function popupCard(x, y, selectedRule = "url") {
  const rows = [
    ["once", "One-time", "this session only"],
    ["tab", "Tab-specific", "persists for this tab"],
    ["url", "Exact URL", "matches full URL"],
    ["domain", "Domain-wide", "applies to entire domain"],
  ];
  const rowMarkup = rows
    .map((row, index) => {
      const rowY = y + 280 + index * 50;
      const selected = row[0] === selectedRule;
      return `
        <rect x="${x + 22}" y="${rowY}" width="356" height="50" fill="${selected ? indigoSoft : surface}"/>
        ${index ? `<path d="M${x + 22} ${rowY}h356" stroke="${border}"/>` : ""}
        ${radio(x + 43, rowY + 25, selected)}
        ${text(x + 62, rowY + 22, row[1], 14, 650)}
        ${text(x + 62, rowY + 39, row[2], 11, 500, muted)}
      `;
    })
    .join("");

  return `
    <rect x="${x}" y="${y}" width="400" height="620" rx="20" fill="${canvas}" stroke="${border}"/>
    <rect x="${x}" y="${y}" width="400" height="82" rx="20" fill="${surface}"/>
    <path d="M${x} ${y + 62}h400v20H${x}z" fill="${surface}"/>
    <path d="M${x} ${y + 82}h400" stroke="${border}"/>
    ${icon(x + 22, y + 19, 44)}
    ${text(x + 80, y + 43, "Tab ReTitle+", 20, 720)}
    ${text(x + 80, y + 63, "Rename this tab", 12, 500, muted)}
    <rect x="${x + 346}" y="${y + 25}" width="32" height="32" rx="8" fill="${surface}" stroke="${border}"/>
    ${text(x + 362, y + 48, "⚙", 16, 600, muted, 'text-anchor="middle"')}

    ${text(x + 22, y + 116, "CUSTOM TITLE", 11, 750, ink)}
    <rect x="${x + 22}" y="${y + 130}" width="356" height="46" rx="9" fill="${surface}" stroke="${border}"/>
    ${text(x + 38, y + 159, "Project Roadmap", 15, 550)}
    ${text(x + 22, y + 204, "PREVIEW", 11, 750, ink)}
    <rect x="${x + 22}" y="${y + 218}" width="356" height="42" rx="9" fill="${indigoSoft}" stroke="${border}"/>
    ${text(x + 38, y + 245, "Project Roadmap", 14, 600)}
    ${text(x + 22, y + 276, "HOW LONG SHOULD IT LAST?", 11, 750, ink)}
    <rect x="${x + 22}" y="${y + 280}" width="356" height="200" rx="12" fill="${surface}" stroke="${border}"/>
    ${rowMarkup}
    <rect x="${x + 22}" y="${y + 506}" width="356" height="46" rx="9" fill="${indigo}"/>
    ${text(x + 200, y + 535, "Save title", 14, 700, surface, 'text-anchor="middle"')}
    <rect x="${x}" y="${y + 574}" width="400" height="46" rx="20" fill="${surface}"/>
    <path d="M${x} ${y + 574}h400" stroke="${border}"/>
    ${text(x + 22, y + 602, "Shortcut:  ⌘ ⇧ E", 11, 600, muted)}
  `;
}

function screenshotOne() {
  return `
    <rect width="1280" height="800" fill="${canvas}"/>
    <rect x="36" y="36" width="1208" height="728" rx="28" fill="${surface}" stroke="${border}"/>
    ${popupCard(78, 90, "url")}
    ${text(566, 106, "TAB RETITLE+", 16, 760, indigo, 'letter-spacing="2"')}
    ${multiline(566, 184, ["Give every tab a", "name that works."], 50, 58, 720)}
    ${multiline(566, 324, ["Replace noisy page titles with clear labels", "you can recognize at a glance."], 21, 31, 500, muted)}
    ${check(566, 438, "Preview before you save")}
    ${check(566, 490, "Apply once or automatically")}
    ${check(566, 542, "Keep titles on dynamic sites")}
    <rect x="566" y="620" width="590" height="80" rx="16" fill="${canvas}" stroke="${border}"/>
    <rect x="590" y="642" width="166" height="36" rx="8" fill="${indigoSoft}" stroke="#C7D7FE"/>
    ${text(673, 665, "Aa│ Project Roadmap", 13, 650, "#5925DC", 'text-anchor="middle"')}
    <rect x="766" y="642" width="148" height="36" rx="8" fill="${surface}" stroke="${border}"/>
    ${text(840, 665, "Design System", 13, 650, muted, 'text-anchor="middle"')}
    <rect x="924" y="642" width="108" height="36" rx="8" fill="${surface}" stroke="${border}"/>
    ${text(978, 665, "Docs", 13, 650, muted, 'text-anchor="middle"')}
  `;
}

function ruleCard(x, y, number, titleValue, description, accent = false) {
  return `
    <rect x="${x}" y="${y}" width="500" height="112" rx="18" fill="${accent ? indigoSoft : canvas}" stroke="${accent ? '#C7D7FE' : border}"/>
    <circle cx="${x + 38}" cy="${y + 38}" r="16" fill="${accent ? indigo : surface}" stroke="${accent ? indigo : border}"/>
    ${text(x + 38, y + 44, number, 14, 750, accent ? surface : muted, 'text-anchor="middle"')}
    ${text(x + 72, y + 40, titleValue, 18, 700)}
    ${text(x + 72, y + 72, description, 15, 500, muted)}
  `;
}

function screenshotTwo() {
  return `
    <rect width="1280" height="800" fill="${canvas}"/>
    <rect x="36" y="36" width="1208" height="728" rx="28" fill="${surface}" stroke="${border}"/>
    ${text(78, 100, "FOUR WAYS TO SAVE", 16, 760, indigo, 'letter-spacing="2"')}
    ${multiline(78, 174, ["Make a title last", "exactly as long", "as it should."], 46, 54, 720)}
    ${multiline(78, 350, ["Start temporary. Add an automatic rule", "only when it earns its keep."], 20, 30, 500, muted)}
    ${ruleCard(78, 452, "1", "One-time", "Change the current tab without saving.", true)}
    ${ruleCard(78, 582, "2", "Tab-specific", "Keep the label with this Chrome tab.")}
    ${ruleCard(656, 116, "3", "Exact URL", "Reapply on one precise page.")}
    ${ruleCard(656, 246, "4", "Domain-wide", "Use one rule across a whole site.", true)}
    <rect x="656" y="410" width="500" height="258" rx="22" fill="${canvas}" stroke="${border}"/>
    ${text(690, 454, "TEMPLATE PREVIEW", 12, 760, indigo, 'letter-spacing="1.5"')}
    <rect x="690" y="478" width="432" height="48" rx="9" fill="${surface}" stroke="${border}"/>
    ${text(710, 509, "[WORK] {original}", 16, 600)}
    ${text(690, 562, "{original}  preserves the page title", 14, 600, muted)}
    ${text(690, 594, "{domain}   inserts the site domain", 14, 600, muted)}
    ${text(690, 626, "{url}      inserts the full URL", 14, 600, muted)}
  `;
}

function savedRule(x, y, titleValue, key, badge) {
  return `
    <rect x="${x}" y="${y}" width="620" height="78" rx="12" fill="${surface}" stroke="${border}"/>
    ${text(x + 20, y + 29, titleValue, 16, 650)}
    ${text(x + 20, y + 55, key, 13, 500, muted)}
    <rect x="${x + 452}" y="${y + 20}" width="82" height="30" rx="15" fill="${greenSoft}"/>
    ${text(x + 493, y + 40, badge, 11, 700, green, 'text-anchor="middle"')}
    <rect x="${x + 546}" y="${y + 18}" width="54" height="34" rx="8" fill="${surface}" stroke="${border}"/>
    ${text(x + 573, y + 40, "Delete", 11, 650, "#B42318", 'text-anchor="middle"')}
  `;
}

function screenshotThree() {
  return `
    <rect width="1280" height="800" fill="${canvas}"/>
    <rect x="36" y="36" width="1208" height="728" rx="28" fill="${surface}" stroke="${border}"/>
    <rect x="78" y="84" width="1124" height="632" rx="22" fill="${canvas}" stroke="${border}"/>
    ${icon(112, 112, 52)}
    ${text(180, 139, "Tab ReTitle+", 24, 720)}
    ${text(180, 165, "Manage saved title rules, shortcuts, and extension behavior.", 14, 500, muted)}
    <rect x="112" y="202" width="688" height="472" rx="18" fill="${surface}" stroke="${border}"/>
    ${text(140, 244, "Saved titles", 21, 700)}
    ${text(140, 272, "You have 3 saved title rules", 14, 500, muted)}
    ${savedRule(140, 302, "Project Roadmap", "https://example.com/roadmap", "EXACT URL")}
    ${savedRule(140, 396, "[WORK] {original}", "example.com", "DOMAIN")}
    ${savedRule(140, 490, "Quick reference", "Current Chrome tab", "THIS TAB")}
    <rect x="828" y="202" width="340" height="214" rx="18" fill="${surface}" stroke="${border}"/>
    ${text(856, 244, "Keyboard shortcut", 18, 700)}
    <rect x="856" y="272" width="122" height="42" rx="9" fill="${indigoSoft}" stroke="#C7D7FE"/>
    ${text(917, 299, "⌘ ⇧ E", 16, 700, indigo, 'text-anchor="middle"')}
    ${text(856, 346, "Open the editor from any tab.", 14, 500, muted)}
    <rect x="828" y="438" width="340" height="236" rx="18" fill="${surface}" stroke="${border}"/>
    ${text(856, 480, "General settings", 18, 700)}
    <rect x="856" y="510" width="18" height="18" rx="5" fill="${indigo}"/>
    <path d="M860 519l4 4 7-8" fill="none" stroke="${surface}" stroke-width="2"/>
    ${text(888, 524, "Bookmark title fallback", 14, 600)}
    <rect x="856" y="554" width="18" height="18" rx="5" fill="${indigo}"/>
    <path d="M860 563l4 4 7-8" fill="none" stroke="${surface}" stroke-width="2"/>
    ${text(888, 568, "Right-click shortcut", 14, 600)}
    <rect x="856" y="598" width="18" height="18" rx="5" fill="${surface}" stroke="${border}"/>
    ${text(888, 612, "Debug mode", 14, 600)}
  `;
}

function smallPromo() {
  return `
    <rect width="440" height="280" fill="${canvas}"/>
    <rect x="18" y="18" width="404" height="244" rx="22" fill="${surface}" stroke="${border}"/>
    ${icon(44, 46, 64)}
    ${text(126, 76, "Tab ReTitle+", 28, 740)}
    ${text(126, 104, "Give every tab a useful name", 15, 550, muted)}
    <rect x="44" y="150" width="352" height="70" rx="14" fill="${canvas}" stroke="${border}"/>
    <rect x="66" y="169" width="172" height="32" rx="8" fill="${indigoSoft}" stroke="#C7D7FE"/>
    ${text(152, 190, "Aa│ Project Roadmap", 12, 650, "#5925DC", 'text-anchor="middle"')}
    <rect x="248" y="169" width="122" height="32" rx="8" fill="${surface}" stroke="${border}"/>
    ${text(309, 190, "Design Docs", 12, 650, muted, 'text-anchor="middle"')}
  `;
}

function document(width, height, content) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`,
  );
}

await fs.mkdir(outputDir, { recursive: true });
const assets = [
  ["screenshot-1-rename.png", 1280, 800, screenshotOne()],
  ["screenshot-2-rules.png", 1280, 800, screenshotTwo()],
  ["screenshot-3-manage.png", 1280, 800, screenshotThree()],
  ["small-promo-440x280.png", 440, 280, smallPromo()],
];

for (const [filename, width, height, content] of assets) {
  await sharp(document(width, height, content)).png().toFile(path.join(outputDir, filename));
  console.log(`Generated store/assets/${filename}`);
}
