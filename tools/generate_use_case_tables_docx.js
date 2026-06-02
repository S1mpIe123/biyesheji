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

// 本脚本用于生成论文中可直接复制的角色用例三线表 Word 文档。
// 表格仅保留顶线、表头底线和底线，避免论文中图片过多。
const outPath = path.join(__dirname, "..", "output", "用例图三线表.docx");

const tables = [
  {
    title: "表 管理员功能用例表",
    rows: [
      ["管理员", "登录后台", "管理员通过账号密码登录系统后台，进入平台管理界面。"],
      ["管理员", "用户管理", "对平台注册用户进行查询、维护和角色信息管理。"],
      ["管理员", "分类管理", "维护农产品分类信息，为商品、供应信息和采购需求提供分类基础。"],
      ["管理员", "商品管理", "对平台商品进行新增、编辑、上架、下架等管理操作。"],
      ["管理员", "公告管理", "发布和维护系统公告，用于向用户展示平台通知信息。"],
      ["管理员", "供需审核", "审核供应商发布的供应信息和采购商发布的采购需求。"],
      ["管理员", "撮合记录管理", "查看和维护供需撮合记录，跟踪撮合状态变化。"],
      ["管理员", "订单查看与处理", "查看平台订单信息，并根据业务需要处理订单状态。"],
      ["管理员", "数据分析看板", "查看供应、需求、撮合、订单和库存等运营统计数据。"],
      ["管理员", "文件图片管理", "管理商品图片、用户头像等上传文件资源。"],
    ],
  },
  {
    title: "表 供应商功能用例表",
    rows: [
      ["供应商", "注册登录", "供应商注册账号并登录系统，进入对应功能页面。"],
      ["供应商", "维护个人资料", "修改个人基础信息和联系方式。"],
      ["供应商", "发布供应信息", "填写农产品名称、分类、产地、价格、数量等信息并提交审核。"],
      ["供应商", "修改或删除本人供应", "对本人发布的供应信息进行修改或删除。"],
      ["供应商", "查看供应大厅", "浏览平台中已审核通过的供应信息。"],
      ["供应商", "查看推荐采购需求", "根据系统匹配结果查看与自身供应信息相关的采购需求。"],
      ["供应商", "响应采购需求", "对采购商发布的需求发起对接意向。"],
      ["供应商", "处理对接记录", "查看并处理本人参与的撮合记录。"],
      ["供应商", "直供订单发货", "对来源于本人供应信息的直供订单进行发货处理。"],
      ["供应商", "查看消息提醒", "查看审核结果、撮合状态和订单进度等提醒信息。"],
    ],
  },
  {
    title: "表 采购商功能用例表",
    rows: [
      ["采购商", "注册登录", "采购商注册账号并登录系统，进入采购相关功能页面。"],
      ["采购商", "维护个人资料", "修改个人基础信息和联系方式。"],
      ["采购商", "发布采购需求", "填写采购产品、需求数量、期望价格、收货地区等信息并提交审核。"],
      ["采购商", "修改或删除本人需求", "对本人发布的采购需求进行修改或删除。"],
      ["采购商", "浏览供应大厅", "查看平台中已审核通过的供应信息。"],
      ["采购商", "查看推荐供应信息", "根据系统匹配结果查看与本人采购需求相关的供应信息。"],
      ["采购商", "发起采购意向", "对合适的供应信息发起采购对接。"],
      ["采购商", "处理对接记录", "查看并处理本人参与的撮合记录。"],
      ["采购商", "确认履约完成", "在交易完成后确认撮合履约状态。"],
      ["采购商", "查看消息提醒", "查看审核结果、撮合状态变化等系统提醒。"],
    ],
  },
  {
    title: "表 普通购买用户功能用例表",
    rows: [
      ["普通购买用户", "注册登录", "普通购买用户注册账号并登录系统。"],
      ["普通购买用户", "维护个人资料", "修改个人基础信息和联系方式。"],
      ["普通购买用户", "浏览商品", "浏览商城中已上架的农产品商品信息。"],
      ["普通购买用户", "分类筛选与商品搜索", "按商品分类、名称等条件筛选和搜索商品。"],
      ["普通购买用户", "提交订单", "选择商品后填写订单信息并提交购买订单。"],
      ["普通购买用户", "支付订单", "对待支付订单进行支付状态确认。"],
      ["普通购买用户", "取消订单", "在订单未完成前取消本人订单。"],
      ["普通购买用户", "确认收货", "收到商品后确认订单完成。"],
      ["普通购买用户", "查看订单记录", "查看本人历史订单及当前订单状态。"],
      ["普通购买用户", "查看消息提醒", "查看订单状态变化等系统提醒。"],
    ],
  },
];

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const strongBorder = { style: BorderStyle.SINGLE, size: 12, color: "000000" };
const midBorder = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
const tableWidth = 9000;
const colWidths = [1700, 2300, 5000];

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
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
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

function buildThreeLineTable(data) {
  const header = new TableRow({
    children: [
      cell("参与者", colWidths[0], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
      cell("用例名称", colWidths[1], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
      cell("功能说明", colWidths[2], { top: strongBorder, bottom: midBorder }, { bold: true, align: AlignmentType.CENTER }),
    ],
  });

  const bodyRows = data.rows.map((row, index) => {
    const isLast = index === data.rows.length - 1;
    const borders = isLast ? { bottom: strongBorder } : {};
    return new TableRow({
      children: [
        cell(row[0], colWidths[0], borders, { align: AlignmentType.CENTER }),
        cell(row[1], colWidths[1], borders, { align: AlignmentType.CENTER }),
        cell(row[2], colWidths[2], borders),
      ],
    });
  });

  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [header, ...bodyRows],
  });
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [run("用例图三线表整理", { font: "黑体", size: 32, bold: true })],
  }),
  new Paragraph({
    spacing: { after: 220, line: 360 },
    indent: { firstLine: 480 },
    children: [
      run("为减少论文中的图片数量，建议保留系统总体用例图作为功能需求总览，将管理员、供应商、采购商和普通购买用户的详细用例以三线表形式进行说明。"),
    ],
  }),
];

tables.forEach((tableData) => {
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 220, after: 120 },
      children: [run(tableData.title, { font: "黑体", bold: true })],
    }),
    buildThreeLineTable(tableData)
  );
});

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
