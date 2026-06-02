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

// 本脚本生成“融合版”角色用例三线表。
// 设计目的：用一张紧凑表格替代四张角色用例图，降低论文图片和表格篇幅。
const outPath = path.join(__dirname, "..", "output", "用例图三线表_精简融合版.docx");

const rows = [
  [
    "管理员",
    "后台登录、用户管理、分类管理、商品管理、公告管理、供需审核、撮合记录管理、订单处理、数据分析",
    "负责平台基础数据维护、供需内容审核、交易过程监管和运营数据分析，保证平台业务正常运行。",
  ],
  [
    "供应商",
    "注册登录、个人资料维护、供应信息发布、供应信息维护、推荐需求查看、撮合记录处理、直供订单发货、消息查看",
    "负责发布和维护农产品供应信息，响应采购需求，并处理本人参与的撮合记录和直供订单。",
  ],
  [
    "采购商",
    "注册登录、个人资料维护、采购需求发布、需求信息维护、供应大厅浏览、推荐供应查看、采购意向发起、履约确认、消息查看",
    "负责发布和维护采购需求，浏览供应信息，发起供需对接，并确认本人参与的撮合履约状态。",
  ],
  [
    "普通购买用户",
    "注册登录、个人资料维护、商品浏览、分类筛选、商品搜索、订单提交、订单支付、订单取消、确认收货、订单记录查看",
    "负责在商城模块中浏览和购买农产品，处理本人订单，不参与供需发布、撮合审核等产销对接管理流程。",
  ],
];

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const strongBorder = { style: BorderStyle.SINGLE, size: 12, color: "000000" };
const midBorder = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const tableWidth = 9000;
const colWidths = [1500, 3800, 3700];

function textRun(text, options = {}) {
  return new TextRun({
    text,
    font: options.font || "宋体",
    size: options.size || 21,
    bold: options.bold || false,
  });
}

function makeCell(text, width, borders, options = {}) {
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
        children: [textRun(text, { bold: options.bold })],
      }),
    ],
  });
}

const tableRows = [
  new TableRow({
    children: [
      makeCell("参与者", colWidths[0], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
      makeCell("核心用例", colWidths[1], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
      makeCell("功能边界说明", colWidths[2], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
    ],
  }),
  ...rows.map((row, index) => {
    const isLast = index === rows.length - 1;
    const borders = isLast ? { bottom: strongBorder } : {};
    return new TableRow({
      children: [
        makeCell(row[0], colWidths[0], borders, { align: AlignmentType.CENTER }),
        makeCell(row[1], colWidths[1], borders),
        makeCell(row[2], colWidths[2], borders),
      ],
    });
  }),
];

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 220 },
    children: [textRun("各角色核心用例表", { font: "黑体", size: 28, bold: true })],
  }),
  new Paragraph({
    spacing: { after: 180, line: 360 },
    indent: { firstLine: 480 },
    children: [
      textRun("为减少用例图数量，本文保留系统总体用例图作为功能需求总览，将各角色的详细用例融合为表格形式进行说明。"),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [textRun("表 各角色核心用例表", { font: "黑体", bold: true })],
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
