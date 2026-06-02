const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} = require("docx");

// 本脚本将“系统功能模块图”整理为论文可用的三线表。
// 原图本质是角色与功能模块的对应矩阵，用表格表达更节省版面。
const outPath = path.join(__dirname, "..", "output", "系统功能模块三线表.docx");

const rows = [
  [
    "管理员",
    "用户管理、基础数据管理、供需信息管理、供需审核、供需撮合、智能匹配、商品交易、订单管理、数据分析",
    "负责平台用户、分类、商品、公告等基础数据维护，对供需信息进行审核，监管撮合与订单流程，并通过数据分析掌握平台运营情况。",
  ],
  [
    "供应商",
    "供需信息管理、供需撮合、智能匹配、订单管理",
    "负责发布和维护本人供应信息，查看系统推荐的采购需求，处理本人参与的撮合记录，并对直供订单进行发货处理。",
  ],
  [
    "采购商",
    "供需信息管理、供需撮合、智能匹配、订单管理",
    "负责发布和维护本人采购需求，浏览供应信息，查看推荐供应结果，发起采购意向并确认撮合履约状态。",
  ],
  [
    "普通购买用户",
    "商品交易、订单管理",
    "负责在商城模块中浏览商品、提交订单、支付订单、取消订单、确认收货和查看本人订单记录。",
  ],
];

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const strongBorder = { style: BorderStyle.SINGLE, size: 12, color: "000000" };
const midBorder = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const tableWidth = 9000;
const colWidths = [1450, 3900, 3650];

function run(text, options = {}) {
  return new TextRun({
    text,
    font: options.font || "宋体",
    size: options.size || 21,
    bold: options.bold || false,
  });
}

function cell(text, width, borders, options = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    borders: {
      top: borders.top || noBorder,
      bottom: borders.bottom || noBorder,
      left: noBorder,
      right: noBorder,
    },
    children: [
      new Paragraph({
        alignment: options.align || AlignmentType.LEFT,
        spacing: { line: 300 },
        children: [run(text, { bold: options.bold })],
      }),
    ],
  });
}

const tableRows = [
  new TableRow({
    children: [
      cell("角色", colWidths[0], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
      cell("关联功能模块", colWidths[1], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
      cell("功能说明", colWidths[2], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
    ],
  }),
  ...rows.map((row, index) => {
    const isLast = index === rows.length - 1;
    const borders = isLast ? { bottom: strongBorder } : {};
    return new TableRow({
      children: [
        cell(row[0], colWidths[0], borders, { align: AlignmentType.CENTER }),
        cell(row[1], colWidths[1], borders),
        cell(row[2], colWidths[2], borders),
      ],
    });
  }),
];

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 220 },
    children: [run("系统功能模块三线表", { font: "黑体", size: 28, bold: true })],
  }),
  new Paragraph({
    spacing: { after: 180, line: 360 },
    indent: { firstLine: 480 },
    children: [
      run("系统功能模块图以角色和功能模块之间的对应关系为核心内容。为减少论文图片数量，本文将该矩阵关系整理为三线表形式，如下所示。"),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [run("表 系统角色与功能模块对应表", { font: "黑体", bold: true })],
  }),
  new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: tableRows,
  }),
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "宋体", size: 21 },
        paragraph: { spacing: { line: 300 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    },
  ],
});

fs.mkdirSync(path.dirname(outPath), { recursive: true });
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(outPath);
});
