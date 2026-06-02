const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} = require("docx");

// 将清晰 E-R 图与关系说明表整理到一个 Word 文件中。
// 图片本身只保留实体与连线，避免五号字在图中堆叠。
const baseDir = path.join(__dirname, "..");
const outDir = path.join(baseDir, "output");
const imagePath = path.join(outDir, "系统E-R图_实体关系清晰版.png");
const outPath = path.join(outDir, "系统E-R图_论文插入版.docx");

const relations = [
  ["管理员", "公告", "发布公告", "1:N"],
  ["用户", "供应信息", "发布供应", "1:N"],
  ["用户", "采购需求", "发布需求", "1:N"],
  ["分类", "供应信息", "供应分类", "1:N"],
  ["分类", "采购需求", "需求分类", "1:N"],
  ["分类", "商品", "商品分类", "1:N"],
  ["供应信息", "商品", "同步上架", "1:0..1"],
  ["商品", "订单", "生成订单", "1:N"],
  ["用户", "订单", "提交订单", "1:N"],
  ["供应信息", "撮合记录", "参与撮合", "1:N"],
  ["采购需求", "撮合记录", "参与撮合", "1:N"],
  ["用户", "撮合记录", "发起撮合", "1:N"],
];

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const strongBorder = { style: BorderStyle.SINGLE, size: 12, color: "000000" };
const midBorder = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const colWidths = [1900, 1900, 2600, 1600];

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
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    borders: {
      top: borders.top || noBorder,
      bottom: borders.bottom || noBorder,
      left: noBorder,
      right: noBorder,
    },
    children: [
      new Paragraph({
        alignment: options.align || AlignmentType.CENTER,
        spacing: { line: 300 },
        children: [run(text, { bold: options.bold })],
      }),
    ],
  });
}

const tableRows = [
  new TableRow({
    children: [
      cell("实体一", colWidths[0], { top: strongBorder, bottom: midBorder }, { bold: true }),
      cell("实体二", colWidths[1], { top: strongBorder, bottom: midBorder }, { bold: true }),
      cell("关系说明", colWidths[2], { top: strongBorder, bottom: midBorder }, { bold: true }),
      cell("基数", colWidths[3], { top: strongBorder, bottom: midBorder }, { bold: true }),
    ],
  }),
  ...relations.map((row, index) => {
    const borders = index === relations.length - 1 ? { bottom: strongBorder } : {};
    return new TableRow({
      children: [
        cell(row[0], colWidths[0], borders),
        cell(row[1], colWidths[1], borders),
        cell(row[2], colWidths[2], borders),
        cell(row[3], colWidths[3], borders),
      ],
    });
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
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [run("系统 E-R 图（论文插入版）", { font: "黑体", size: 28, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new ImageRun({
              type: "png",
              data: fs.readFileSync(imagePath),
              transformation: { width: 600, height: 364 },
              altText: { title: "系统E-R图", description: "系统实体关系清晰版", name: "系统E-R图" },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [run("图 系统E-R图", { font: "黑体", bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [run("表 系统实体关系说明表", { font: "黑体", bold: true })],
        }),
        new Table({
          width: { size: 8200, type: WidthType.DXA },
          columnWidths: colWidths,
          rows: tableRows,
        }),
      ],
    },
  ],
});

fs.mkdirSync(outDir, { recursive: true });
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(outPath);
});
