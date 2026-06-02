const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// 论文功能需求分析插图生成脚本。
// 采用 SVG 绘制 UML 用例图，再用 sharp 转成 PNG，保证中文标签清晰、结构稳定。

const outDir = path.resolve(__dirname, "论文插图");
fs.mkdirSync(outDir, { recursive: true });

const W = 1600;
const H = 1000;
const font = "'Microsoft YaHei','SimHei','Noto Sans CJK SC',Arial,sans-serif";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function line(x1, y1, x2, y2, options = {}) {
  const dash = options.dash ? ` stroke-dasharray="${options.dash}"` : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${options.color || "#94a3b8"}" stroke-width="${options.width || 1.7}" stroke-opacity="${options.opacity || 0.62}"${dash}/>`;
}

function actor(x, y, label) {
  return `
    <g class="actor">
      <circle cx="${x}" cy="${y}" r="30" fill="#ffffff" stroke="#1f2937" stroke-width="4"/>
      <line x1="${x}" y1="${y + 30}" x2="${x}" y2="${y + 120}" stroke="#1f2937" stroke-width="4"/>
      <line x1="${x - 56}" y1="${y + 68}" x2="${x + 56}" y2="${y + 68}" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
      <line x1="${x}" y1="${y + 120}" x2="${x - 48}" y2="${y + 185}" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
      <line x1="${x}" y1="${y + 120}" x2="${x + 48}" y2="${y + 185}" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
      <text x="${x}" y="${y + 230}" text-anchor="middle" font-family="${font}" font-size="34" font-weight="700" fill="#111827">${esc(label)}</text>
    </g>`;
}

function useCase(x, y, w, h, label, fill = "#f7fbff") {
  const parts = label.split("\n");
  const startY = y - (parts.length - 1) * 17 + 8;
  const text = parts
    .map((p, i) => `<tspan x="${x}" y="${startY + i * 38}">${esc(p)}</tspan>`)
    .join("");
  return `
    <g class="usecase">
      <ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${h / 2}" fill="${fill}" stroke="#2563eb" stroke-width="3"/>
      <text text-anchor="middle" font-family="${font}" font-size="28" font-weight="600" fill="#1f2937">${text}</text>
    </g>`;
}

function boundary(x, y, w, h, title) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#ffffff" stroke="#0f766e" stroke-width="4"/>
    <text x="${x + 28}" y="${y + 48}" font-family="${font}" font-size="30" font-weight="700" fill="#0f766e">${esc(title)}</text>`;
}

function title(text, subtitle) {
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#fbfcff"/>
    <text x="${W / 2}" y="62" text-anchor="middle" font-family="${font}" font-size="42" font-weight="800" fill="#111827">${esc(text)}</text>
    <text x="${W / 2}" y="106" text-anchor="middle" font-family="${font}" font-size="24" fill="#64748b">${esc(subtitle)}</text>`;
}

function note(x, y, text) {
  return `
    <text x="${x}" y="${y}" font-family="${font}" font-size="22" fill="#64748b">${esc(text)}</text>`;
}

async function save(name, svg) {
  const full = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    text { dominant-baseline: middle; }
    .usecase { filter: drop-shadow(0 3px 4px rgba(15, 23, 42, 0.10)); }
  </style>
  ${svg}
</svg>`;
  const svgPath = path.join(outDir, `${name}.svg`);
  const pngPath = path.join(outDir, `${name}.png`);
  fs.writeFileSync(svgPath, full, "utf8");
  await sharp(Buffer.from(full)).png().toFile(pngPath);
  console.log(svgPath);
  console.log(pngPath);
}

function generalDiagram() {
  const b = { x: 315, y: 145, w: 970, h: 760 };
  const cases = [
    { x: 560, y: 260, t: "用户注册\n登录认证" },
    { x: 820, y: 260, t: "基础信息\n管理" },
    { x: 1080, y: 260, t: "供需审核\n管理" },
    { x: 560, y: 430, t: "供应信息\n发布" },
    { x: 820, y: 430, t: "采购需求\n发布" },
    { x: 1080, y: 430, t: "智能匹配\n推荐" },
    { x: 560, y: 600, t: "供需撮合\n记录" },
    { x: 820, y: 600, t: "商品浏览\n订单购买" },
    { x: 1080, y: 600, t: "订单库存\n同步" },
    { x: 710, y: 770, t: "消息提醒\n待办处理" },
    { x: 970, y: 770, t: "数据统计\n分析" },
  ];
  return [
    title("系统总体用例图", "农产品产销对接平台功能需求总览"),
    boundary(b.x, b.y, b.w, b.h, "农产品产销对接平台"),
    actor(150, 190, "管理员"),
    actor(150, 645, "供应商"),
    actor(1450, 190, "采购商"),
    actor(1450, 645, "普通购买用户"),
    line(210, 300, 720, 260),
    line(210, 300, 980, 260),
    line(210, 300, 1080, 600),
    line(210, 755, 560, 430),
    line(210, 755, 1080, 430),
    line(210, 755, 560, 600),
    line(1390, 300, 820, 430),
    line(1390, 300, 1080, 430),
    line(1390, 300, 560, 600),
    line(1390, 755, 820, 600),
    line(1390, 755, 1080, 600),
    line(1390, 755, 710, 770),
    ...cases.map((c) => useCase(c.x, c.y, 205, 92, c.t)),
    note(500, 940, "说明：系统以四类角色为中心，形成供需发布、审核、匹配、撮合、订单与分析闭环。"),
  ].join("");
}

function roleDiagram({ titleText, actorLabel, systemTitle, cases, links, noteText }) {
  const b = { x: 430, y: 155, w: 920, h: 725 };
  return [
    title(titleText, "角色功能范围与数据权限边界"),
    boundary(b.x, b.y, b.w, b.h, systemTitle),
    actor(190, 405, actorLabel),
    ...links.map((idx) => line(260, 505, cases[idx].x - 118, cases[idx].y)),
    ...cases.map((c) => useCase(c.x, c.y, c.w || 235, c.h || 88, c.t, c.fill)),
    note(450, 925, noteText),
  ].join("");
}

async function main() {
  await save("1-系统总体用例图", generalDiagram());

  await save(
    "2-管理员用例图",
    roleDiagram({
      titleText: "管理员用例图",
      actorLabel: "管理员",
      systemTitle: "管理员后台管理子系统",
      cases: [
        { x: 610, y: 260, t: "登录后台" },
        { x: 900, y: 260, t: "用户管理" },
        { x: 1190, y: 260, t: "分类管理" },
        { x: 610, y: 430, t: "商品管理" },
        { x: 900, y: 430, t: "公告管理" },
        { x: 1190, y: 430, t: "供需审核" },
        { x: 610, y: 600, t: "撮合记录\n管理" },
        { x: 900, y: 600, t: "订单查看\n与处理" },
        { x: 1190, y: 600, t: "数据分析\n看板" },
        { x: 900, y: 760, t: "文件图片\n管理" },
      ],
      links: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      noteText: "权限边界：管理员可查看和维护全平台基础数据、审核数据和统计数据。",
    }),
  );

  await save(
    "3-供应商用例图",
    roleDiagram({
      titleText: "供应商用例图",
      actorLabel: "供应商",
      systemTitle: "供应商产销对接子系统",
      cases: [
        { x: 620, y: 260, t: "注册登录" },
        { x: 930, y: 260, t: "维护个人\n资料" },
        { x: 1180, y: 260, t: "发布供应\n信息" },
        { x: 620, y: 430, t: "修改或删除\n本人供应" },
        { x: 930, y: 430, t: "查看供应\n大厅" },
        { x: 1180, y: 430, t: "查看推荐\n采购需求" },
        { x: 620, y: 610, t: "响应采购\n需求" },
        { x: 930, y: 610, t: "处理对接\n记录" },
        { x: 1180, y: 610, t: "直供订单\n发货" },
        { x: 930, y: 770, t: "查看消息\n提醒" },
      ],
      links: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      noteText: "权限边界：供应商主要维护本人供应、本人参与的撮合记录和相关直供订单。",
    }),
  );

  await save(
    "4-采购商用例图",
    roleDiagram({
      titleText: "采购商用例图",
      actorLabel: "采购商",
      systemTitle: "采购商产销对接子系统",
      cases: [
        { x: 620, y: 260, t: "注册登录" },
        { x: 930, y: 260, t: "维护个人\n资料" },
        { x: 1180, y: 260, t: "发布采购\n需求" },
        { x: 620, y: 430, t: "修改或删除\n本人需求" },
        { x: 930, y: 430, t: "浏览供应\n大厅" },
        { x: 1180, y: 430, t: "查看推荐\n供应信息" },
        { x: 620, y: 610, t: "发起采购\n意向" },
        { x: 930, y: 610, t: "处理对接\n记录" },
        { x: 1180, y: 610, t: "确认履约\n完成" },
        { x: 930, y: 770, t: "查看消息\n提醒" },
      ],
      links: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      noteText: "权限边界：采购商主要维护本人采购需求、本人参与的撮合记录和履约信息。",
    }),
  );

  await save(
    "5-普通购买用户用例图",
    roleDiagram({
      titleText: "普通购买用户用例图",
      actorLabel: "普通购买用户",
      systemTitle: "农产品商城购买子系统",
      cases: [
        { x: 620, y: 260, t: "注册登录" },
        { x: 930, y: 260, t: "维护个人\n资料" },
        { x: 1180, y: 260, t: "浏览商品" },
        { x: 620, y: 430, t: "分类筛选\n商品搜索" },
        { x: 930, y: 430, t: "提交订单" },
        { x: 1180, y: 430, t: "支付订单" },
        { x: 620, y: 610, t: "取消订单" },
        { x: 930, y: 610, t: "确认收货" },
        { x: 1180, y: 610, t: "查看订单\n记录" },
        { x: 930, y: 770, t: "查看消息\n提醒" },
      ],
      links: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      noteText: "权限边界：普通购买用户仅处理本人账号信息和本人订单，不参与供需发布与撮合审核。",
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
