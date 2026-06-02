const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} = require("docx");

// 本脚本用于生成毕业论文“大纲版正文”。内容按模板目录展开，
// 只写每章、每小节的主要写作方向，便于后续继续补充细节。

const outputPath = path.resolve(__dirname, "农产品产销对接平台论文大纲.docx");

const normalRun = (text, options = {}) =>
  new TextRun({
    text,
    font: "宋体",
    size: 24,
    ...options,
  });

const enRun = (text, options = {}) =>
  new TextRun({
    text,
    font: "Times New Roman",
    size: 24,
    ...options,
  });

const para = (text, options = {}) =>
  new Paragraph({
    spacing: { line: 312, before: 80, after: 80 },
    indent: options.noIndent ? undefined : { firstLine: 480 },
    alignment: options.alignment,
    children: [normalRun(text)],
  });

const heading1 = (text, pageBreakBefore = false) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore,
    spacing: { before: 240, after: 240, line: 480 },
    children: [normalRun(text, { bold: true, size: 30 })],
  });

const heading2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 120, line: 360 },
    children: [normalRun(text, { bold: true, size: 28 })],
  });

const heading3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 120, after: 80, line: 312 },
    children: [normalRun(text, { bold: true, size: 24 })],
  });

const tableParagraph = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 240 },
    children: [normalRun(text, { size: 21 })],
  });

const simpleTable = (headers, rows) => {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const widths = headers.map(() => Math.floor(9000 / headers.length));
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: headers.map((h, i) =>
          new TableCell({
            width: { size: widths[i], type: WidthType.DXA },
            borders,
            children: [tableParagraph(h)],
          }),
        ),
      }),
      ...rows.map((row) =>
        new TableRow({
          children: row.map((cell, i) =>
            new TableCell({
              width: { size: widths[i], type: WidthType.DXA },
              borders,
              children: [tableParagraph(cell)],
            }),
          ),
        }),
      ),
    ],
  });
};

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 260 },
    children: [normalRun("本科毕业设计（论文）大纲", { bold: true, size: 36 })],
  }),
  para("题目：基于 Spring Boot 和 Vue 的农产品产销对接平台设计与实现", { noIndent: true }),
  para("说明：本文档依据论文模板目录生成，仅提供每章、每小节的大致内容，后续可在此基础上继续扩写正文、补充图表和实验数据。", { noIndent: true }),

  heading1("摘要", true),
  para("本部分可概括农产品流通中供需信息分散、传统交易效率较低、库存与采购需求难以及时匹配等问题，说明系统建设的现实背景。随后介绍平台采用 Spring Boot、MyBatis、MySQL、Vue 3、Element Plus 等技术，实现用户管理、供应发布、采购需求发布、智能匹配推荐、撮合记录、订单管理、消息中心和数据分析等功能。最后概述系统能够提升供需双方信息对接效率，为农产品线上化交易提供一定参考。"),
  para("关键词：农产品产销对接；Spring Boot；Vue；MySQL；智能匹配；订单管理"),

  heading1("ABSTRACT", true),
  new Paragraph({
    spacing: { line: 312, before: 80, after: 80 },
    indent: { firstLine: 480 },
    children: [
      enRun("This section can briefly introduce the problem of scattered agricultural product supply and demand information, low matching efficiency, and weak transaction tracking. The platform is designed and implemented with Spring Boot, MyBatis, MySQL, Vue 3, Element Plus, and Axios. It supports user management, supply publishing, purchase demand publishing, rule-based matching recommendation, matching records, order management, message reminders, and data analysis. The system provides a web-based solution for improving the connection between suppliers and buyers of agricultural products."),
    ],
  }),
  new Paragraph({
    spacing: { line: 312, before: 80, after: 80 },
    children: [enRun("Key words: agricultural product matching; Spring Boot; Vue; MySQL; rule-based recommendation; order management")],
  }),

  heading1("目录", true),
  new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),

  heading1("1.前言", true),
  heading2("1.1 课题背景"),
  para("本节可从农业数字化、农产品流通环节多、供需信息不对称等方面展开。传统农产品交易通常依赖线下批发市场、熟人渠道或零散信息发布，供应方难以及时找到稳定采购方，采购方也难以及时掌握产地、价格和库存情况。随着 Web 技术、数据库技术和前后端分离开发模式成熟，建设面向农产品供应商、采购商和普通消费者的线上产销对接平台具有可行性。"),
  heading2("1.2 研究意义及目的"),
  heading3("1.2.1 研究的意义"),
  para("本节可说明平台对农产品流通效率、供需信息整合、交易过程追踪和农业经营数字化的意义。系统将供应信息、采购需求、匹配推荐、撮合记录和订单管理统一在同一平台中，有利于减少人工沟通成本，并为管理员进行供需审核和运营分析提供数据基础。"),
  heading3("1.2.2 研究的目的"),
  para("本课题的主要目的可写为：设计并实现一个农产品产销对接平台，使供应商能够发布农产品供应信息，采购商能够发布采购需求，系统能够根据产品名称、分类、价格、地区、数量和时间等因素进行规则匹配，管理员能够完成审核和数据分析，普通用户能够进行日常农产品购买。"),
  heading2("1.3主要研究内容"),
  heading3("1.3.1 系统模块"),
  para("本节可概括系统模块组成，包括登录注册模块、用户与角色管理模块、农产品分类模块、商品管理模块、供应信息模块、采购需求模块、智能匹配推荐模块、撮合记录模块、订单管理模块、消息中心模块和数据分析模块。其中供应、采购、匹配、撮合和库存同步是论文重点。"),
  heading3("1.3.2 研究方法"),
  para("本节可从文献分析法、需求分析法、功能分析法、系统设计法和测试验证法展开。先分析农产品产销对接类系统的常见功能，再结合毕业设计系统规模确定功能边界；随后完成数据库表结构设计、前后端接口设计、业务流程设计，最后通过功能测试验证注册登录、供需发布、审核、匹配、撮合和订单流程。"),

  heading1("2.系统开发环境", true),
  heading2("2.1 计算机软件系统"),
  heading3("2.1.1 计算机系统硬件配置"),
  para("本节可填写实际开发设备配置，例如处理器、内存、硬盘、操作系统位数等。内容不需要过细，重点说明当前硬件能够满足 Java 后端服务、Vue 前端开发环境和 MySQL 数据库的本地运行需求。"),
  simpleTable(
    ["配置项", "参考内容"],
    [
      ["处理器", "Intel 或 AMD 多核处理器"],
      ["内存", "8GB 及以上"],
      ["硬盘", "预留足够空间安装 MySQL、JDK、Node.js 和项目依赖"],
      ["系统类型", "Windows 64 位操作系统"],
    ],
  ),
  heading3("2.1.2 计算机系统软件配置"),
  para("本节可列出开发所需软件环境，包括 JDK 21、Maven、MySQL、Node.js、IntelliJ IDEA 或同类 Java 开发工具、前端编辑器、浏览器等。后端运行端口为 9090，前端通过 Vite 启动并调用后端接口。"),
  simpleTable(
    ["软件", "用途"],
    [
      ["JDK 21", "运行 Spring Boot 后端项目"],
      ["MySQL", "存储用户、商品、供应、采购、订单等业务数据"],
      ["Node.js", "运行 Vue 前端开发和构建命令"],
      ["Maven", "管理 Java 项目依赖和打包"],
      ["浏览器", "访问和测试前端页面"],
    ],
  ),
  heading2("2.2 Java概述"),
  para("本节可介绍 Java 的跨平台、面向对象、生态成熟等特点，并说明系统后端主要使用 Java 编写业务逻辑。后端通过 Controller 接收请求，通过 Service 处理业务规则，通过 Mapper 与 MySQL 数据库交互。"),
  heading2("2.3 Spring Boot概述"),
  para("本节可替换模板中的 Kotlin 内容，介绍 Spring Boot 在 Web 后端开发中的作用。系统利用 Spring Boot 快速搭建 REST 接口，配合 MyBatis 完成数据库访问，并通过统一返回结果和全局异常处理提升接口调用的一致性。"),
  heading2("2.4 Vue概述"),
  para("本节可替换模板中的 Android 内容，介绍 Vue 3 在前端页面开发中的作用。系统前端采用组件化开发方式，结合 Vue Router 完成页面路由跳转，结合 Axios 完成接口请求，结合 Element Plus 组件库实现表格、表单、弹窗、菜单等界面。"),
  heading2("2.5 B/S架构与前后端分离概述"),
  para("本节可替换模板中的 MVP 框架内容，说明系统采用浏览器/服务器架构和前后端分离思想。前端负责页面展示、用户交互和请求发起，后端负责业务校验、数据处理和接口响应，数据库负责持久化存储。该结构便于模块维护和后续扩展。"),

  heading1("3. 系统需求分析", true),
  heading2("3.1 可行性分析"),
  heading3("3.1.1 技术可行性"),
  para("本节可说明系统使用的 Spring Boot、Vue、MySQL、MyBatis、Element Plus 等技术均较成熟，资料丰富，适合毕业设计规模的 Web 系统开发。项目结构清晰，前端和后端可以分别开发、调试和部署，因此技术实现具有可行性。"),
  heading3("3.1.2 经济可行性"),
  para("本节可说明系统开发主要依赖开源框架和本地开发环境，不需要额外购买商业软件或硬件设备。系统运行环境要求较低，能够在普通计算机上完成开发、测试和演示，因此经济成本较低。"),
  heading3("3.1.3 社会可行性"),
  para("本节可从农产品交易数字化、供应链效率提升、农户和采购商信息沟通便利化等角度展开。平台功能符合农业信息化发展方向，能够为农产品供应信息公开、采购需求聚合和交易过程管理提供参考。"),
  heading2("3.2 系统需求分析"),
  heading3("3.2.1 性能需求分析"),
  para("本节可写系统应满足页面响应及时、接口调用稳定、常用列表支持分页查询、图片上传与访问正常、订单和库存操作保持一致等需求。由于系统主要面向毕业设计演示和中小规模数据场景，性能目标以稳定性和可维护性为主。"),
  heading3("3.2.2 功能需求分析"),
  para("本节可按角色分析功能需求。管理员需要管理用户、分类、商品、公告、供需审核、撮合记录和数据分析；供应商需要发布供应信息、查看推荐采购需求、处理对接记录和直供商品发货；采购商需要发布采购需求、查看推荐供应信息、发起采购意向；普通购买用户需要浏览商品、下单、支付和查看订单。"),
  heading3("3.2.3 外部接口需求分析"),
  para("本节可说明前端通过 Axios 请求后端 REST 接口，接口返回统一 Result 结构。系统涉及用户登录注册、文件上传下载、商品查询、供应查询、采购查询、撮合记录查询、订单状态修改等接口。外部资源主要包括本地图片资源和 MySQL 数据库连接。"),

  heading1("4. 系统设计", true),
  heading2("4.1 系统设计思想"),
  para("本节可说明系统以角色权限和业务流程为主线进行设计。平台围绕农产品供应和采购信息，将供需发布、审核、匹配、撮合、订单和库存同步串联起来。设计时强调模块清晰、数据流完整、页面操作直观、演示过程稳定。"),
  heading2("4.2 系统模块划分"),
  para("本节可按模块描述系统结构。基础模块包括登录注册、用户管理、公告管理、分类管理、商品管理和文件管理；核心业务模块包括供应信息管理、采购需求管理、智能匹配推荐、撮合记录管理、订单管理、消息中心和数据分析看板。"),
  heading2("4.3 概要设计"),
  heading3("4.3.1 系统功能模块图"),
  para("本节后续可插入系统功能模块图。图中建议以管理员、供应商、采购商、普通用户四类角色为主线，展示各角色可访问的功能模块。正文可说明平台核心流程为供应发布、需求发布、管理员审核、系统推荐、双方撮合、库存扣减和订单闭环。"),
  para("图4-1 系统功能模块图（后续插入）", { noIndent: true, alignment: AlignmentType.CENTER }),
  heading3("4.3.2 数据库设计"),
  para("本节可先介绍数据库设计原则，包括减少数据冗余、保证业务字段完整、通过主键和关联字段维护实体关系。系统主要数据表包括 admin、user、category、goods、goods_stock、notice、orders、supply、purchase_demand、match_record。"),
  simpleTable(
    ["表名", "主要作用"],
    [
      ["user", "保存普通用户信息和用户身份类型"],
      ["supply", "保存供应商发布的农产品供应信息"],
      ["purchase_demand", "保存采购商发布的采购需求"],
      ["match_record", "保存供需双方的撮合记录和履约状态"],
      ["goods", "保存商城商品及来源供应信息"],
      ["orders", "保存普通购买订单和商品快照"],
    ],
  ),
  heading2("4.4详细设计"),
  heading3("4.4.1 注册模块"),
  para("本节可按照模板保留注册模块说明，写用户在注册页面填写用户名、密码、姓名、联系方式和用户身份，前端进行基础校验后调用后端注册接口。后端判断用户名是否重复，设置默认角色和用户身份，并将用户信息写入 user 表。"),
  heading3("4.4.2 登录模块"),
  para("本节可补充登录模块设计。用户输入账号、密码和角色类型，后端根据管理员或普通用户身份分别查询 admin 表或 user 表。登录成功后，前端将用户信息保存到本地缓存，并根据角色和用户类型显示不同菜单。"),
  heading3("4.4.3 供需信息模块"),
  para("本节可说明供应商发布供应信息时需要填写产品名称、分类、产地、单位、价格、数量、上市时间和联系方式；采购商发布采购需求时需要填写产品名称、分类、需求数量、期望价格、收货地区、截止时间和联系方式。管理员审核通过后信息进入匹配和展示流程。"),
  heading3("4.4.4 智能匹配模块"),
  para("本节可说明系统采用基于规则权重的匹配算法。算法以农产品名称匹配为前提，再综合分类、时间、价格、地区和数量计算匹配得分。匹配结果达到阈值后展示给采购商或供应商，供用户发起采购意向或供货响应。"),
  heading3("4.4.5 订单与库存模块"),
  para("本节可说明商城订单与供应库存之间的同步关系。普通用户下单后扣减商品库存，若商品来源于供应信息，则同步扣减供应剩余数量；订单取消时返还未完成订单的库存。撮合记录确认后也会锁定对应供应量和采购需求量。"),

  heading1("5.系统实现", true),
  para("本章后续可结合截图和关键代码说明主要功能实现。由于论文初稿阶段不需要展开全部代码，可优先写系统核心页面、后端接口和关键业务规则。代码部分可选择贴图或插入少量核心代码，避免正文过长。"),
  heading2("5.1 注册功能的实现"),
  para("本节可描述 Register.vue 页面和 /register 接口的实现思路。前端收集用户输入的信息并调用后端接口，后端 UserService 判断用户是否存在，设置默认密码、姓名、角色和用户类型，然后调用 UserMapper 写入数据库。后续可插入注册页面截图和用户表变化截图。"),
  heading2("5.2 登陆功能实现"),
  para("本节可描述 Login.vue 页面和 /login 接口的实现思路。用户选择管理员或普通用户身份登录，后端根据角色进入 AdminService 或 UserService 校验账号密码。登录成功后返回用户信息，前端根据 role 和 userType 控制菜单显示。"),
  heading2("5.3 供应信息功能实现"),
  para("本节可补充供应大厅页面和 SupplyService 的实现。供应商提交供应信息后，系统默认状态为待审核；管理员审核通过后，供应信息可同步为商城商品。若供应单位为吨，系统会折算为斤存储，便于后续库存扣减。"),
  heading2("5.4 采购需求功能实现"),
  para("本节可补充采购需求大厅和 PurchaseDemandService 的实现。采购商发布需求后等待管理员审核，审核通过的需求参与智能匹配。采购需求包含总需求量和剩余需求量，可用于展示采购完成进度。"),
  heading2("5.5 智能匹配推荐功能实现"),
  para("本节可说明 MatchRecommendService 的实现。系统先筛选已通过的供应和采购需求，排除无剩余数量的数据，再计算名称、分类、时间、价格、地区、数量等得分。名称不匹配时直接过滤，避免只因同分类而产生不合理推荐。"),
  heading2("5.6 撮合记录功能实现"),
  para("本节可说明 MatchRecordService 的实现。采购商或供应商发起意向后生成撮合记录，状态初始为待确认。记录进入已确认、已支付、待发货、待收货、已完成等状态时，系统根据状态变化决定是否锁定或返还库存。"),
  heading2("5.7 订单管理功能实现"),
  para("本节可说明 OrdersService 的实现。普通购买用户下单后生成订单编号，保存商品名称和图片快照，扣减商品库存并同步供应库存。供应商不能进行日常购买，直供商品只能由对应供应商发货，平台商品由管理员发货。"),
  heading2("5.8 数据分析功能实现"),
  para("本节可说明 Analysis.vue 数据分析看板。页面通过接口获取供应、采购、撮合、订单和商品数据，统计供应数量、采购需求数量、撮合成功率、订单闭环率、库存风险和价格机会等指标。AI 分析报告可描述为基于本地规则的数据分析提示。"),

  heading1("6.总结与展望", true),
  para("本章可总结系统完成的主要工作，包括平台整体架构搭建、用户角色划分、供需信息发布、管理员审核、规则匹配推荐、撮合记录管理、订单库存同步和数据分析看板。系统基本实现了农产品供应方、采购方和普通购买用户之间的信息对接流程。"),
  para("展望部分可说明系统仍有进一步完善空间，例如引入更严格的登录鉴权机制、完善后端角色权限控制、增强推荐算法、增加消息通知机制、优化移动端适配、接入真实地图或物流接口、将本地规则分析扩展为真实智能分析服务等。"),

  heading1("致谢", true),
  para("本节可感谢指导教师在选题、系统设计、论文写作和修改过程中的指导，感谢学院提供的学习环境，感谢同学和家人在系统测试、资料整理和论文撰写过程中提供的帮助。表达应保持正式、简洁，避免过度口语化。"),

  heading1("参考文献", true),
  para("[1] 刘云生. 数据库系统概论[M]. 北京: 清华大学出版社, 2020.", { noIndent: true }),
  para("[2] 王珊, 萨师煊. 数据库系统概论[M]. 北京: 高等教育出版社, 2014.", { noIndent: true }),
  para("[3] Craig Walls. Spring实战[M]. 北京: 人民邮电出版社, 2022.", { noIndent: true }),
  para("[4] 汪云飞. Spring Boot企业级开发教程[M]. 北京: 电子工业出版社, 2021.", { noIndent: true }),
  para("[5] 尤雨溪. Vue.js设计与实现[M]. 北京: 人民邮电出版社, 2022.", { noIndent: true }),
  para("[6] 李刚. 轻量级Java EE企业应用实战[M]. 北京: 电子工业出版社, 2021.", { noIndent: true }),
  para("[7] MyBatis Team. MyBatis 3 User Guide[EB/OL]. 2024.", { noIndent: true }),
  para("[8] Oracle Corporation. MySQL 8.0 Reference Manual[EB/OL]. 2024.", { noIndent: true }),
  para("[9] Element Plus Team. Element Plus Documentation[EB/OL]. 2024.", { noIndent: true }),
  para("[10] Vite Team. Vite Documentation[EB/OL]. 2024.", { noIndent: true }),
  para("[11] 张海藩. 软件工程导论[M]. 北京: 清华大学出版社, 2019.", { noIndent: true }),
  para("[12] Sommerville I. Software Engineering[M]. Boston: Pearson, 2016.", { noIndent: true }),
];

const doc = new Document({
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
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "宋体" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "宋体" },
        paragraph: { spacing: { before: 120, after: 80 }, outlineLevel: 2 },
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
              children: [normalRun("第 "), new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 20 }), normalRun(" 页")],
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
