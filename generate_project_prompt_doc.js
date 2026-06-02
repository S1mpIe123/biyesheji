const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

// 生成给其他 AI 使用的项目梳理提示文档。
// 内容来自对 farm_system 项目的结构、源码、SQL 和论文模板需求的整理。

const outputPath = path.resolve(__dirname, "农产品产销对接平台项目梳理与AI提示.docx");

const run = (text, options = {}) =>
  new TextRun({
    text,
    font: "宋体",
    size: 24,
    ...options,
  });

const para = (text, options = {}) =>
  new Paragraph({
    spacing: { before: 80, after: 80, line: 312 },
    indent: options.noIndent ? undefined : { firstLine: 480 },
    alignment: options.alignment,
    children: [run(text, options.run || {})],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 260, after: 180, line: 420 },
    children: [run(text, { bold: true, size: 30 })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 120, line: 360 },
    children: [run(text, { bold: true, size: 26 })],
  });

const bullet = (text) =>
  new Paragraph({
    spacing: { before: 40, after: 40, line: 300 },
    numbering: { reference: "bullet-list", level: 0 },
    children: [run(text)],
  });

const codePara = (text) =>
  new Paragraph({
    spacing: { before: 60, after: 60, line: 280 },
    children: [new TextRun({ text, font: "Consolas", size: 21 })],
  });

const table = (headers, rows) => {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const widths = headers.map(() => Math.floor(9000 / headers.length));
  const cell = (text, width, bold = false) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [
        new Paragraph({
          spacing: { line: 260 },
          children: [run(text, { bold, size: 22 })],
        }),
      ],
    });
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((x, i) => cell(x, widths[i], true)) }),
      ...rows.map((row) => new TableRow({ children: row.map((x, i) => cell(x, widths[i])) })),
    ],
  });
};

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [run("农产品产销对接平台项目梳理与 AI 提示", { bold: true, size: 34 })],
  }),
  para("用途：本文档用于交给另一个 AI，帮助其快速理解项目背景、技术栈、业务模块、论文写作方向和后续补充重点。", { noIndent: true }),

  h1("1. 项目基本定位"),
  para("本项目可定位为“基于 Spring Boot 和 Vue 的农产品产销对接平台设计与实现”。项目不是单纯的农产品商城，而是在商城功能基础上扩展了供应发布、采购需求、智能匹配、供需撮合、订单闭环、后台审核和数据分析等业务。"),
  para("论文写作时应突出“产销对接”主线，即供应商发布农产品供应信息，采购商发布采购需求，系统根据规则进行推荐匹配，双方形成撮合记录，管理员负责审核和运营分析，普通购买用户仍可通过商城购买农产品。"),

  h1("2. 技术栈与项目结构"),
  table(
    ["部分", "技术或目录", "说明"],
    [
      ["前端", "farm_system/vue", "Vue 3、Vite、Element Plus、Axios、Vue Router"],
      ["后端", "farm_system/springboot", "Spring Boot 3.3.1、MyBatis、PageHelper、MySQL"],
      ["数据库", "farm_system", "MySQL 数据库，主要表包含 user、goods、orders、supply、purchase_demand、match_record 等"],
      ["后端端口", "9090", "application.yml 中配置 server.port 为 9090"],
      ["文件资源", "farm_system/files 和 springboot/files", "用于商品图片、头像和供应图片访问"],
    ],
  ),
  h2("关键配置文件"),
  bullet("后端依赖文件：farm_system/springboot/pom.xml"),
  bullet("后端配置文件：farm_system/springboot/src/main/resources/application.yml"),
  bullet("前端依赖文件：farm_system/vue/package.json"),
  bullet("前端接口封装：farm_system/vue/src/utils/request.js"),
  bullet("前端路由配置：farm_system/vue/src/router/index.js"),

  h1("3. 用户角色与权限视角"),
  para("系统目前主要有四类用户视角：管理员、供应商、采购商和普通购买用户。管理员使用 role=ADMIN，普通用户使用 role=USER，并通过 user.user_type 区分 SUPPLIER、BUYER、SHOPPER。"),
  table(
    ["角色", "标识", "主要功能"],
    [
      ["管理员", "ADMIN", "用户管理、分类管理、商品管理、公告管理、供需审核、撮合记录管理、数据分析"],
      ["供应商", "SUPPLIER", "发布供应信息、查看推荐采购需求、响应采购需求、处理直供商品发货"],
      ["采购商", "BUYER", "发布采购需求、查看推荐供应信息、发起采购意向、处理撮合记录"],
      ["普通购买用户", "SHOPPER", "浏览商品、下单购买、查看订单"],
    ],
  ),
  para("需要提醒其他 AI：系统有菜单级角色控制和部分后端业务校验，但不是完整的 Spring Security 或 JWT 鉴权体系。论文中可写“基于角色的权限控制”，但不要夸大为完整安全认证系统。"),

  h1("4. 主要业务模块"),
  h2("基础商城模块"),
  bullet("admin：管理员管理"),
  bullet("user：普通用户管理和用户身份切换"),
  bullet("category：农产品分类管理"),
  bullet("goods：商城商品管理"),
  bullet("goodsStock：库存管理"),
  bullet("notice：公告管理"),
  bullet("orders：农产品购买订单管理"),
  bullet("files：图片上传和下载"),
  h2("产销对接新增模块"),
  bullet("supply：供应商发布农产品供应信息"),
  bullet("purchase_demand：采购商发布采购需求"),
  bullet("match_recommend：基于规则权重的智能匹配推荐"),
  bullet("match_record：供需双方形成撮合记录并跟踪履约状态"),
  bullet("match_audit：管理员审核供应、采购和撮合信息"),
  bullet("analysis：管理员数据分析看板"),
  bullet("messages：消息中心和待办提醒"),

  h1("5. 核心业务流程"),
  para("系统的核心流程可以概括为：注册登录、身份区分、供应或采购发布、管理员审核、系统推荐、双方撮合、库存扣减、订单闭环和数据分析。"),
  bullet("供应商填写产品名称、分类、图片、产地、单位、价格、数量、上市时间和联系方式，提交后状态默认为待审核。"),
  bullet("采购商填写产品名称、分类、需求数量、期望价格、收货地区、截止时间和联系方式，提交后状态默认为待审核。"),
  bullet("管理员审核通过后，供应信息和采购需求进入大厅展示和推荐匹配流程。"),
  bullet("智能匹配算法以农产品名称为主要前提，再综合分类、时间、价格、地区和数量计算匹配得分。"),
  bullet("采购商或供应商发起意向后生成撮合记录，撮合记录可流转为待确认、已确认、已支付、待发货、待收货、已完成、售后中等状态。"),
  bullet("审核通过的供应信息可同步成商城商品，普通购买订单会扣减商品库存，并同步扣减来源供应信息的剩余数量。"),

  h1("6. 后端源码重点"),
  table(
    ["文件", "作用"],
    [
      ["SupplyService.java", "供应信息新增、修改、吨转斤、供应与商城商品同步、供应库存扣减和返还"],
      ["PurchaseDemandService.java", "采购需求新增、修改、吨转斤、采购剩余量扣减和返还"],
      ["MatchRecommendService.java", "基于规则权重的供需推荐算法"],
      ["MatchRecordService.java", "撮合记录新增、状态变更、库存锁定和释放"],
      ["OrdersService.java", "订单创建、库存扣减、订单状态权限、取消订单库存返还"],
      ["WebController.java", "登录、注册、修改密码等公共接口"],
      ["CorsConfig.java", "跨域访问配置"],
      ["Result.java", "统一接口返回结构"],
    ],
  ),
  para("其他 AI 补充论文实现章节时，可优先围绕这些 Service 文件写核心代码逻辑。Controller 层主要负责接收请求和返回 Result，Mapper XML 负责 SQL 查询和关联字段映射。"),

  h1("7. 前端页面重点"),
  table(
    ["页面", "作用"],
    [
      ["Login.vue", "登录页面"],
      ["Register.vue", "注册页面"],
      ["Manager.vue", "后台布局、顶部导航、侧边菜单和角色菜单控制"],
      ["Home.vue", "首页业务概览和快捷入口"],
      ["SupplyHall.vue", "供应大厅和供应发布"],
      ["DemandHall.vue", "采购需求大厅和采购发布"],
      ["MatchRecommend.vue", "智能推荐结果展示和意向发起"],
      ["MatchRecord.vue", "我的对接记录和履约状态处理"],
      ["MatchAudit.vue", "管理员供需审核管理"],
      ["Buy.vue", "农产品购买页面"],
      ["Orders.vue", "订单管理页面"],
      ["Analysis.vue", "数据分析看板和规则模拟 AI 分析报告"],
      ["Messages.vue", "消息中心和待办提醒"],
    ],
  ),

  h1("8. 数据库与 SQL 文件"),
  para("项目根目录下存在多份 SQL 脚本，用于新增产销对接表、补充字段、修复订单快照、隐藏记录、补全商品图片和准备演示数据。"),
  bullet("产销对接数据库更新SQL.sql：新增 user_type、supply、purchase_demand、match_record、goods.source_supply_id 等结构。"),
  bullet("产销对接二次优化SQL.sql：补充单位、总量、产地等字段，并处理吨转斤和库存同步。"),
  bullet("本轮必须执行SQL.sql：补充 total_quantity 字段和初始化数据。"),
  bullet("撮合记录履约状态SQL.sql：扩展撮合记录状态和收货地址字段。"),
  bullet("撮合记录隐藏SQL.sql：为撮合记录增加软删除标记。"),
  bullet("订单隐藏与商品快照SQL.sql：订单增加商品名称、图片快照和软删除字段。"),
  bullet("第5阶段调试数据SQL.sql、第5阶段增强演示数据SQL.sql：用于答辩演示和功能测试。"),

  h1("9. 论文可重点展开的内容"),
  bullet("课题背景：农产品供需信息不对称、线下交易效率低、采购和供应数据分散。"),
  bullet("研究意义：提升供需对接效率，帮助供应商和采购商减少沟通成本，推动农产品交易数字化。"),
  bullet("技术路线：Spring Boot + MyBatis + MySQL 后端，Vue 3 + Element Plus 前端，前后端分离。"),
  bullet("需求分析：从管理员、供应商、采购商、普通购买用户四类角色分析功能需求。"),
  bullet("系统设计：模块设计、数据库设计、业务流程设计、前后端接口设计。"),
  bullet("系统实现：注册登录、供需发布、审核、推荐匹配、撮合记录、订单库存同步、数据分析。"),
  bullet("创新点：从普通商城扩展到产销对接，规则匹配推荐，供应库存与商城订单同步，数据分析看板。"),
  bullet("测试部分：可测试登录注册、供应发布、采购发布、审核、推荐、撮合确认、购买下单、订单取消等流程。"),

  h1("10. 已知风险与写作注意点"),
  bullet("登录认证较简单，不建议写成完整 JWT 或 Spring Security 安全体系。"),
  bullet("权限控制主要由前端菜单和后端部分业务规则共同完成，论文表述应适度。"),
  bullet("智能匹配是基于规则权重的推荐算法，不是机器学习或深度学习模型。"),
  bullet("Analysis.vue 中的 AI 分析是本地规则模拟，不依赖真实外部大模型接口。"),
  bullet("application.yml 中数据库账号密码为本地配置，论文中可作为开发环境配置说明，不建议公开强调密码。"),
  bullet("单位转换目前以吨转斤为主，写论文时可说明统一折算到斤便于库存扣减。"),
  bullet("如果其他 AI 继续补论文，应避免第一人称、口语化表达和明显 AI 生成痕迹。"),

  h1("11. 可直接发给其他 AI 的提示词"),
  para("下面这段可以直接复制给另一个 AI，用于继续补充论文内容。", { noIndent: true }),
  codePara("你现在要帮助完善一个毕业设计论文，题目为《基于 Spring Boot 和 Vue 的农产品产销对接平台设计与实现》。项目路径为 C:\\\\Users\\\\张博源\\\\Desktop\\\\毕设\\\\农产品\\\\farm_system。项目不是单纯商城，而是农产品产销对接平台：供应商发布供应信息，采购商发布采购需求，系统基于产品名称、分类、价格、地区、数量和时间进行规则匹配，双方形成撮合记录，管理员负责审核和数据分析，普通购买用户可进行商城购买。"),
  codePara("技术栈：后端 Spring Boot 3.3.1 + MyBatis + PageHelper + MySQL，前端 Vue 3 + Vite + Element Plus + Axios + Vue Router。后端核心文件包括 SupplyService、PurchaseDemandService、MatchRecommendService、MatchRecordService、OrdersService。前端核心页面包括 SupplyHall、DemandHall、MatchRecommend、MatchRecord、MatchAudit、Orders、Analysis。"),
  codePara("请按论文模板目录补充内容：摘要、ABSTRACT、1 前言、2 系统开发环境、3 系统需求分析、4 系统设计、5 系统实现、6 总结与展望、致谢、参考文献。写作要求：不要使用第一人称；避免口语化；不要把规则匹配写成机器学习；不要夸大认证安全体系；实现部分可结合代码逻辑描述，但正文不要堆太多代码。"),
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: "bullet",
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: {
        run: { font: "宋体", size: 24 },
        paragraph: { spacing: { line: 312 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 30, bold: true, font: "黑体" },
        paragraph: { spacing: { before: 260, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "宋体" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [run("第 ", { size: 20 }), new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 20 }), run(" 页", { size: 20 })],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(outputPath);
});
