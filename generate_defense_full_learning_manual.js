const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  LevelFormat,
  PageBreak,
} = require("docx");

// 本脚本用于生成答辩手册。内容分为答辩话术、代码地图、常见问答、
// 简单修改速查和完整项目学习路线，便于直接背诵和按文件定位代码。

const OUT_DIR = path.join(__dirname, "output");
const OUT_FILE = path.join(OUT_DIR, "答辩项目熟悉与全系统代码学习手册-张博源.docx");

const COLORS = {
  darkGreen: "176B24",
  green: "2E8B57",
  lightGreen: "EAF6E4",
  pale: "F7FBF4",
  gray: "666666",
  border: "C9D8C4",
  header: "DDEFD6",
  warning: "FFF2CC",
};

const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.border };
const borders = { top: border, bottom: border, left: border, right: border };

function run(text, options = {}) {
  return new TextRun({
    text,
    font: "SimSun",
    size: options.size || 22,
    bold: options.bold || false,
    color: options.color || "000000",
  });
}

function para(text, options = {}) {
  return new Paragraph({
    alignment: options.align || AlignmentType.LEFT,
    spacing: { before: options.before || 0, after: options.after || 120, line: 360 },
    indent: options.indent ? { left: options.indent } : undefined,
    children: [run(text, options)],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 260, after: 180 },
    children: [run(text, { bold: true, size: 32, color: COLORS.darkGreen })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 140 },
    children: [run(text, { bold: true, size: 27, color: COLORS.green })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 100 },
    children: [run(text, { bold: true, size: 24 })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullet-list", level },
    spacing: { after: 80, line: 330 },
    children: [run(text)],
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "number-list", level },
    spacing: { after: 80, line: 330 },
    children: [run(text)],
  });
}

function codePara(text) {
  return new Paragraph({
    spacing: { after: 80, line: 330 },
    shading: { type: ShadingType.CLEAR, fill: "F4F7F1" },
    children: [new TextRun({ text, font: "Consolas", size: 19, color: "1F4D2E" })],
  });
}

function cell(text, width, options = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: options.fill || "FFFFFF" },
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    verticalAlign: "center",
    children: [
      new Paragraph({
        spacing: { after: 0, line: 300 },
        children: [run(text, { bold: options.bold || false, size: options.size || 20 })],
      }),
    ],
  });
}

function table(headers, rows, widths) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((text, index) => cell(text, widths[index], { fill: COLORS.header, bold: true })),
      }),
      ...rows.map(row => new TableRow({
        children: row.map((text, index) => cell(String(text), widths[index], { fill: index === 0 ? COLORS.pale : "FFFFFF" })),
      })),
    ],
  });
}

function sectionBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const intro = [
  "各位老师好，我的毕业设计题目是《基于 Spring Boot 和 Vue 的农产品产销对接平台设计与实现》。这个系统的定位不是单纯的农产品商城，而是在商城购买功能的基础上，加入供应发布、采购需求发布、供需审核、智能匹配推荐、撮合记录跟踪、订单库存同步和数据分析等功能，目的是把供应商、采购商和普通购买用户放在同一个平台里完成信息对接和交易管理。",
  "系统采用前后端分离架构。后端使用 Spring Boot 3.3.1、MyBatis、MySQL、PageHelper 和 Hutool，主要按照 Controller、Service、Mapper 三层来组织代码；Controller 接收前端请求，Service 处理业务规则，Mapper 和 XML 负责数据库操作。前端使用 Vue 3、Vite、Element Plus、Axios 和 Vue Router，页面主要包括登录注册、主布局、供应大厅、采购需求大厅、智能匹配推荐、撮合记录、订单管理和数据分析看板。",
  "系统里有四类角色。管理员负责用户、分类、商品、公告、供需审核、订单和数据分析；供应商可以发布供应信息、查看采购需求、查看推荐结果并处理发货；采购商可以发布采购需求、浏览供应信息、发起撮合意向；普通购买用户主要浏览商城商品、下单和查看订单。整个业务闭环是：供应商发供应，采购商发需求，管理员审核通过后进入大厅展示，系统根据产品名称、分类、时间、价格、地区和数量计算匹配分数，用户可以根据推荐结果发起撮合记录；如果进入履约状态，系统会同步扣减供应和需求数量；如果是商城购买，则订单会扣减商品库存，并同步扣减来源供应库存。",
  "我答辩时最想突出的是，我对这个项目的整体结构和关键代码是清楚的。比如要改页面文字或颜色，我会先找对应的 Vue 页面；要改接口逻辑，我会看 Controller 的路径；要改业务规则，比如匹配分数、库存返还或订单限制，我会进入对应的 Service；要查 SQL，就看 resources/mapper 下的 XML 文件。也就是说，我不是只会演示页面，而是知道系统从页面操作到接口、业务处理再到数据库保存的完整链路。"
];

const roleRows = [
  ["管理员", "用户管理、分类管理、商品管理、公告管理、供需审核、撮合记录查看、订单管理、数据分析看板", "演示管理员时重点说：管理员负责平台维护和审核，审核通过的数据才进入大厅和推荐流程。"],
  ["供应商", "发布供应信息、查看采购需求大厅、查看匹配推荐、处理撮合记录、直供商品发货", "演示供应商时重点说：供应商发布货源，审核通过后可以被采购商看到，也可以同步为商城商品。"],
  ["采购商", "发布采购需求、浏览供应大厅、查看匹配推荐、发起采购意向、处理撮合记录", "演示采购商时重点说：采购商发布需求后，系统会根据需求推荐合适供应。"],
  ["普通购买用户", "浏览商城商品、提交订单、查看订单、支付或取消订单、确认收货", "演示普通购买用户时重点说：普通购买用户不参与供需撮合，主要走商城购买链路。"],
];

const codeMapRows = [
  ["登录注册", "Login.vue、Register.vue", "WebController", "UserService、AdminService", "UserMapper.xml、AdminMapper.xml", "user、admin"],
  ["主布局和菜单", "Manager.vue", "无直接业务 Controller", "无", "无", "前端 localStorage 用户信息"],
  ["供应信息", "SupplyHall.vue", "SupplyController", "SupplyService", "SupplyMapper.xml", "supply"],
  ["采购需求", "DemandHall.vue", "PurchaseDemandController", "PurchaseDemandService", "PurchaseDemandMapper.xml", "purchase_demand"],
  ["供需审核", "MatchAudit.vue", "SupplyController、PurchaseDemandController", "SupplyService、PurchaseDemandService", "SupplyMapper.xml、PurchaseDemandMapper.xml", "supply、purchase_demand"],
  ["智能匹配", "MatchRecommend.vue", "MatchRecommendController", "MatchRecommendService", "通过 SupplyService 和 PurchaseDemandService 查询", "supply、purchase_demand"],
  ["撮合记录", "MatchRecord.vue", "MatchRecordController", "MatchRecordService", "MatchRecordMapper.xml", "match_record"],
  ["商城购买", "Buy.vue", "GoodsController、OrdersController", "GoodsService、OrdersService", "GoodsMapper.xml、OrdersMapper.xml", "goods、orders"],
  ["库存同步", "GoodsStock.vue、Orders.vue", "GoodsStockController、OrdersController", "GoodsStockService、OrdersService、SupplyService", "GoodsStockMapper.xml、OrdersMapper.xml、SupplyMapper.xml", "goods_stock、goods、supply"],
  ["数据分析", "Analysis.vue", "复用 selectAll 接口", "前端本地计算为主", "复用各模块 Mapper", "supply、purchase_demand、match_record、orders、goods"],
  ["公告管理", "Notice.vue、Home.vue", "NoticeController", "NoticeService", "NoticeMapper.xml", "notice"],
  ["文件上传", "多个图片上传页面", "FileController", "本地文件保存逻辑", "无", "files 目录"],
];

const focusAnswers = [
  {
    title: "供需审核怎么实现",
    answer: "供应商发布供应信息、采购商发布采购需求后，默认状态都是“待审核”。管理员在 MatchAudit.vue 页面里查看待审核数据，点击通过或拒绝时，前端调用对应模块的 update 接口，把 status 改成“已通过”或“已拒绝”。后端主要通过 SupplyService 和 PurchaseDemandService 保存状态变化。供应信息如果审核通过，SupplyService 还会调用 syncGoodsWhenApproved，把供应信息同步成商城商品。",
    files: "MatchAudit.vue、SupplyController、PurchaseDemandController、SupplyService.syncGoodsWhenApproved、PurchaseDemandService.updateById",
    modify: "如果老师问“审核通过后想不要自动生成商品怎么办”，就改 SupplyService 里的 syncGoodsWhenApproved 调用，或者增加一个开关字段。"
  },
  {
    title: "智能匹配推荐怎么实现",
    answer: "智能匹配不是机器学习算法，而是规则权重评分。入口是 MatchRecommendController，核心逻辑在 MatchRecommendService。采购商看推荐时调用 recommendSupplyForBuyer，供应商看推荐时调用 recommendDemandForSupplier。算法先用 calcNameScore 判断农产品名称，如果名称不匹配直接返回 0 分并过滤；名称通过后，再计算分类、时间、价格、地区、数量分数，最后总分达到 60 分以上才返回前端，并按分数降序排序。",
    files: "MatchRecommend.vue、MatchRecommendController、MatchRecommendService.recommendSupplyForBuyer、recommendDemandForSupplier、buildRecommend、calcNameScore",
    modify: "如果要改推荐标准，改 MatchRecommendService。改阈值看 score >= 60，改权重看 calcNameScore、calcTimeScore、calcPriceScore、calcAreaScore、calcQuantityScore。"
  },
  {
    title: "撮合记录状态流转怎么实现",
    answer: "撮合记录表示供需双方的一次合作意向。创建时在 MatchRecordService.add 里默认状态为“待确认”。后续状态变化通过 MatchRecordService.updateById 实现。核心是状态变化不仅改文字，还会影响库存。shouldLockStock 判断是否从未锁定状态进入已确认、已支付、待发货、待收货、已完成等履约状态；如果进入履约状态，就扣减 supply.quantity 和 purchase_demand.quantity。shouldRestoreStock 判断未完成前取消或退回时是否释放库存。",
    files: "MatchRecord.vue、MatchRecordController、MatchRecordService.add、updateById、shouldLockStock、shouldRestoreStock",
    modify: "如果要新增“已评价”状态，就要同时改前端 MatchRecord.vue 的按钮和状态展示，还要看 MatchRecordService 的库存锁定状态集合是否要加入该状态。"
  },
  {
    title: "订单和库存同步怎么实现",
    answer: "商城下单主要在 OrdersService.add 中实现。用户下单时系统生成订单编号，设置订单状态为“待支付”，然后查询商品库存，库存足够才扣减 goods.store。若商品来自某条供应信息，也会调用 SupplyService.reduceQuantity 同步扣减供应剩余量。订单取消时在 OrdersService.updateById 中判断 shouldRestoreStockOnCancel，如果是未完成订单第一次取消，就返还商品库存和来源供应库存。这个设计避免只改订单不改库存。",
    files: "Buy.vue、Orders.vue、OrdersController、OrdersService.add、OrdersService.updateById、SupplyService.reduceQuantity、SupplyService.restoreQuantity",
    modify: "如果要改“单次最多购买 100 斤”，直接改 OrdersService.add 里的 orders.getNum() > 100。"
  },
  {
    title: "数据分析看板怎么实现",
    answer: "数据分析看板主要在前端 Analysis.vue 中实现。它通过 request.get 分别请求 supply、purchaseDemand、matchRecord、orders、goods 的 selectAll 数据，然后在前端用 computed 计算供应数量、采购需求、撮合成功率、订单闭环率、库存风险、价格机会等。页面里的“AI运营分析师”不是外部大模型，而是根据当前数据用本地规则生成分析文字。",
    files: "Analysis.vue、request.js、SupplyController、PurchaseDemandController、MatchRecordController、OrdersController、GoodsController",
    modify: "如果要接入真正的大模型，就把 Analysis.vue 的 generateAiReport 改成调用后端 AI 接口，后端再接 OpenAI 或其他模型服务。"
  },
];

const faqRows = [
  ["系统主要解决什么问题？", "解决农产品供应信息和采购需求分散、匹配效率低、交易过程不易追踪的问题。我的系统把供应、需求、推荐、撮合、订单、库存和分析放在同一平台中处理。"],
  ["为什么说不是普通商城？", "普通商城主要是商品展示和购买。我这个系统除了购买，还能让供应商发供应、采购商发需求，系统做匹配推荐，并用撮合记录追踪双方合作过程。"],
  ["项目技术栈是什么？", "后端 Spring Boot 3.3.1、MyBatis、MySQL、PageHelper、Hutool；前端 Vue 3、Vite、Element Plus、Axios、Vue Router。"],
  ["接口返回格式怎么统一？", "后端用 Result 类统一返回 code、msg、data，前端 request.js 拿到响应后统一处理。"],
  ["为什么不用机器学习？", "因为毕业设计阶段没有大量真实历史成交数据，机器学习模型缺少训练基础。规则权重算法更稳定、可解释，也便于答辩时说明每个推荐结果为什么出现。"],
  ["权限怎么做？", "当前主要通过前端 Manager.vue 按 role 和 userType 显示不同菜单，后端在部分 Service 中做关键业务校验，比如供应商不能普通购买、发货人必须是对应供应商。后续真实部署可以引入 JWT 和 Spring Security。"],
  ["库存一致性怎么保证？", "下单、取消、撮合确认这些关键写操作放在 Service 中，并使用事务。订单会扣 goods.store，如果商品来源于供应，还会同步扣 supply.quantity；撮合确认会扣 supply.quantity 和 purchase_demand.quantity。"],
  ["系统不足是什么？", "认证权限还比较基础，推荐算法是规则算法，AI 分析是本地规则生成，并发库存控制没有引入 Redis 锁。这些都可以作为后续优化方向。"],
  ["如果让你改功能，你怎么定位？", "先看页面属于哪个 .vue 文件，再看页面调用的接口路径；根据接口路径找到 Controller；真正的业务规则一般在 Service；SQL 查询在 mapper XML。"],
];

const simpleModifyRows = [
  ["改系统标题", "Manager.vue", "搜索“农产品产销对接平台”", "直接修改中文文案；如果页面标题和浏览器标题都要改，还要看 index.html。"],
  ["改菜单名称", "Manager.vue", "搜索 el-menu-item 或菜单中文", "把 span 里的中文改掉，例如“数据分析看板”改成“运营统计”。"],
  ["改菜单显示权限", "Manager.vue", "看 v-if=\"data.user.role...\"", "调整 v-if 条件。比如某菜单只给管理员看，就加 data.user.role === 'ADMIN'。"],
  ["改按钮文字", "对应页面 .vue", "搜索按钮上的中文", "改 el-button 标签里的文字，不影响后端逻辑。"],
  ["改按钮颜色", "对应页面 .vue", "搜索 el-button", "先改 type，例如 primary、success、warning、danger；不够再改 CSS 类。"],
  ["改公告栏底色", "Notice.vue 或 Home.vue", "搜索 notice、公告、background", "在 style scoped 中改 background 或 background-color。"],
  ["改页面背景", "对应页面 .vue 或 global.css", "搜索 background", "单页面改该页面 style，全局背景改 global.css 或 Manager.vue。"],
  ["改搜索框提示", "对应页面 .vue", "搜索 placeholder", "修改 placeholder 文本，例如“请输入商品名称”。"],
  ["改表格列名", "对应页面 .vue", "搜索 el-table-column", "修改 label 属性。"],
  ["新增表格列", "对应页面 .vue", "找到 el-table-column 区域", "新增一行 el-table-column，prop 要对应后端返回字段。"],
  ["删除表格列", "对应页面 .vue", "找到对应 label", "删除或注释对应 el-table-column。"],
  ["改分页大小", "对应页面 .vue", "搜索 pageSize", "修改默认 pageSize，例如 10 改为 20。"],
  ["改后端端口", "application.yml", "server.port", "把 9090 改为新端口，同时前端接口地址也要对应修改。"],
  ["改数据库连接", "application.yml", "spring.datasource", "修改 url、username、password。"],
  ["改上传大小", "application.yml", "max-file-size、max-request-size", "例如 100MB 改成 20MB。"],
  ["改前端接口地址", "vue/.env 或 request.js", "VITE_BASE_URL、baseURL", "把地址改成新的后端地址，例如 http://localhost:9090。"],
  ["改成功或失败提示", "对应页面 .vue", "搜索 ElMessage", "修改 success、error、warning 里的中文。"],
  ["改默认头像", "Manager.vue", "DEFAULT_AVATAR", "替换成新的图片 URL。"],
  ["改推荐阈值", "MatchRecommendService.java", "score >= 60", "60 改成想要的分数，越高推荐越严格。"],
  ["改名称匹配分数", "MatchRecommendService.java", "calcNameScore", "修改 return 50、45、35 等分值。"],
  ["改时间评分", "MatchRecommendService.java", "calcTimeScore", "修改 7 天、30 天和对应分值。"],
  ["改价格评分", "MatchRecommendService.java", "calcPriceScore", "修改低于期望价、超出 20% 以内的判断。"],
  ["改库存风险阈值", "Analysis.vue", "store <= 100", "把 100 改成新的低库存阈值。"],
  ["改单次购买上限", "OrdersService.java", "orders.getNum() > 100", "把 100 改成新的限制。"],
  ["改吨到斤换算", "UnitConverter.java、SupplyService.java、PurchaseDemandService.java", "2000 或 JIN_PER_TON", "一般不建议随便改，因为业务默认 1 吨等于 2000 斤。"],
  ["新增一个菜单", "router/index.js、Manager.vue", "routes、el-menu-item", "先在 router/index.js 加路由，再在 Manager.vue 加菜单入口。"],
  ["新增操作按钮", "对应页面 .vue", "操作列、el-button", "加按钮后写点击方法，方法里用 request 调后端接口。"],
  ["改文件上传访问前缀", "application.yml", "fileBaseUrl", "后端返回图片地址时会用这个前缀。"],
  ["改页面跳转", "对应页面 .vue 或 router/index.js", "router.push", "修改目标 path。"],
  ["改登录后缓存字段", "Login.vue、Manager.vue", "system-user", "localStorage 里保存当前用户信息，改动要保证读取处也同步。"],
];

const learningSteps = [
  "先看项目总目录。farm_system 是真实系统，里面 springboot 是后端，vue 是前端；根目录还有论文材料、SQL 文件、图片、生成文档脚本。",
  "看后端入口。SpringbootApplication.java 是启动类，application.yml 是配置文件，要知道端口、数据库连接、上传限制、Mapper 扫描都在这里。",
  "看后端通用结构。Result 统一返回 code、msg、data；CustomException 和 GlobalExceptionHandler 处理业务异常；CorsConfig 处理跨域；FileController 处理上传下载。",
  "看实体类。entity 目录里的 Admin、User、Goods、Supply、PurchaseDemand、MatchRecord、Orders 等基本对应数据库表字段。看实体类是为了知道前后端字段叫什么。",
  "看 Controller。Controller 只要先记住路径和请求方式，比如 /supply/add、/purchaseDemand/selectPage、/matchRecommend/supplyForBuyer、/orders/update。",
  "看 Service。Service 是最重要的，因为业务规则都在这里。优先看 SupplyService、PurchaseDemandService、MatchRecommendService、MatchRecordService、OrdersService。",
  "看 Mapper 和 XML。Mapper 接口和 resources/mapper 下的 XML 对应，XML 里写 SQL。答辩时只要能说出“SQL 在 Mapper XML 里维护”就可以。",
  "看前端入口。main.js 挂载 Vue 应用，router/index.js 配置页面路由，utils/request.js 封装 Axios 请求。",
  "看主布局 Manager.vue。这里控制顶部栏、侧边栏菜单、角色对应菜单显示、退出登录、消息数量、账号切换等。",
  "看核心业务页面。SupplyHall.vue 看供应发布，DemandHall.vue 看采购需求，MatchRecommend.vue 看推荐，MatchRecord.vue 看撮合状态，Orders.vue 看订单，Analysis.vue 看数据分析。",
  "最后按真实流程串起来。登录、发供应、发需求、管理员审核、查看推荐、发起撮合、状态流转、商城下单、库存变化、看数据分析。能把这条链路说顺，就说明你已经熟悉系统主体。"
];

const fileChecklistRows = [
  ["SpringbootApplication.java", "后端启动类", "知道运行后端就是启动这个类。"],
  ["application.yml", "后端配置", "端口 9090、MySQL 连接、上传大小、Mapper XML 扫描、fileBaseUrl。"],
  ["Result.java", "统一返回格式", "返回 code、msg、data，前端按这个结构处理。"],
  ["CorsConfig.java", "跨域配置", "解决前端 5173 调后端 9090 的跨域问题。"],
  ["CustomException.java / GlobalExceptionHandler.java", "异常处理", "业务异常会被统一返回给前端提示。"],
  ["UnitConverter.java", "单位换算工具", "库存统一按斤处理，吨会换算成 2000 斤。"],
  ["WebController.java", "登录、注册、改密码入口", "看 /login、/register、/updatePassword。"],
  ["SupplyController.java / SupplyService.java", "供应信息接口和业务", "重点看 add、updateById、syncGoodsWhenApproved、reduceQuantity、restoreQuantity。"],
  ["PurchaseDemandController.java / PurchaseDemandService.java", "采购需求接口和业务", "重点看 add、reduceQuantity、restoreQuantity。"],
  ["MatchRecommendController.java / MatchRecommendService.java", "智能匹配推荐", "重点看 recommendSupplyForBuyer、recommendDemandForSupplier、buildRecommend、各评分函数。"],
  ["MatchRecordController.java / MatchRecordService.java", "撮合记录", "重点看 add、updateById、shouldLockStock、shouldRestoreStock。"],
  ["OrdersController.java / OrdersService.java", "订单管理", "重点看 add、updateById、checkStatusOperator、checkShipOperator。"],
  ["各 Mapper.xml", "SQL 查询和更新", "看 selectAll、insert、updateById、分页筛选字段。"],
  ["main.js", "前端启动入口", "创建 Vue 应用并挂载插件。"],
  ["router/index.js", "前端路由", "每个 path 对应哪个页面。"],
  ["utils/request.js", "Axios 请求封装", "baseURL、请求头、响应拦截、401 跳登录。"],
  ["Manager.vue", "系统主布局", "顶部标题、菜单、角色权限、消息入口、账号切换。"],
  ["Login.vue / Register.vue", "登录注册页面", "表单校验、提交登录注册请求。"],
  ["SupplyHall.vue", "供应发布和供应大厅", "发布弹窗、查询列表、审核状态展示。"],
  ["DemandHall.vue", "采购需求发布和大厅", "采购需求表单、需求列表、响应按钮。"],
  ["MatchRecommend.vue", "智能推荐页面", "根据用户类型调用不同推荐接口，展示分数和推荐理由。"],
  ["MatchRecord.vue", "撮合记录页面", "状态按钮、确认、支付、发货、收货等动作。"],
  ["Orders.vue", "订单管理页面", "按角色查询订单、支付、取消、发货、收货。"],
  ["Analysis.vue", "数据分析看板", "前端聚合统计、库存风险、价格机会、本地规则报告。"],
  ["Notice.vue", "公告管理", "公告新增、编辑、删除和展示。"],
  ["Goods.vue / GoodsStock.vue / Category.vue", "商品、库存、分类管理", "基础 CRUD，答辩一般简单带过。"],
];

const backendControllerRows = [
  ["WebController.java", "系统公共入口", "/login、/register、/updatePassword", "登录注册不是分散写的，公共入口在 WebController。"],
  ["AdminController.java", "管理员账号 CRUD", "/admin/add、/admin/selectPage", "管理员表的增删改查接口。"],
  ["UserController.java", "普通用户管理", "/user/add、/user/selectPage", "管理员查看和维护普通用户信息。"],
  ["CategoryController.java", "农产品分类管理", "/category/add、/category/selectAll", "商品、供应和需求都会用分类数据。"],
  ["GoodsController.java", "商城商品管理", "/goods/add、/goods/selectPage", "商城商品展示和维护入口。"],
  ["GoodsStockController.java", "商品库存管理", "/goodsStock/add、/goodsStock/selectPage", "库存管理页面对应接口。"],
  ["SupplyController.java", "供应信息管理", "/supply/add、/supply/update、/supply/selectPage", "供应商发布货源，管理员审核后参与推荐。"],
  ["PurchaseDemandController.java", "采购需求管理", "/purchaseDemand/add、/purchaseDemand/update", "采购商发布需求，审核后参与推荐。"],
  ["MatchRecommendController.java", "智能匹配推荐", "/matchRecommend/supplyForBuyer、/demandForSupplier", "这里只提供推荐入口，具体打分在 Service。"],
  ["MatchRecordController.java", "撮合记录管理", "/matchRecord/add、/matchRecord/update", "供需双方的意向和履约状态。"],
  ["OrdersController.java", "订单管理", "/orders/add、/orders/update、/orders/selectPage", "商城下单、支付、取消、发货、收货。"],
  ["NoticeController.java", "公告管理", "/notice/add、/notice/selectPage", "系统公告的增删改查。"],
  ["FileController.java", "文件上传下载", "/files/upload、/files/download/{fileName}", "商品图片、头像等文件上传入口。"],
];

const backendServiceRows = [
  ["AdminService.java", "管理员账号业务", "add、login、updatePassword", "处理管理员登录、密码修改和基础维护。"],
  ["UserService.java", "普通用户业务", "register、login、add、updatePassword", "普通用户注册时设置 role=USER 和 userType。"],
  ["CategoryService.java", "分类业务", "add、selectAll、selectPage", "基础 CRUD，给商品和供需信息提供分类。"],
  ["GoodsService.java", "商城商品业务", "selectBySourceSupplyId、add、updateById", "审核通过的供应可以同步成商品。"],
  ["GoodsStockService.java", "库存记录业务", "add、updateById、selectPage", "管理商品库存列表。"],
  ["SupplyService.java", "供应信息核心业务", "add、fillDefaultValue、syncGoodsWhenApproved、reduceQuantity、restoreQuantity", "供应审核同步商品、库存扣减和返还是重点。"],
  ["PurchaseDemandService.java", "采购需求核心业务", "add、fillDefaultValue、reduceQuantity、restoreQuantity", "采购需求数量会在撮合确认后扣减。"],
  ["MatchRecommendService.java", "智能推荐核心算法", "recommendSupplyForBuyer、recommendDemandForSupplier、buildRecommend、calcNameScore", "答辩重点：名称优先、多维评分、60分阈值。"],
  ["MatchRecordService.java", "撮合履约核心业务", "add、updateById、shouldLockStock、shouldRestoreStock", "答辩重点：状态流转触发库存锁定和释放。"],
  ["OrdersService.java", "订单与库存核心业务", "add、updateById、checkStatusOperator、checkShipOperator", "答辩重点：下单扣库存、取消返还、发货权限。"],
  ["NoticeService.java", "公告业务", "add、updateById、selectPage", "基础 CRUD，老师问到公告改法时可定位到这里。"],
];

const entityRows = [
  ["Account.java", "登录账号基类", "username、password、role", "登录时管理员和普通用户共用的账号结构。"],
  ["Admin.java", "管理员实体", "id、username、password、name、role 等", "对应 admin 表。"],
  ["User.java", "普通用户实体", "role、userType、phone、email、avatar", "userType 区分 SUPPLIER、BUYER、SHOPPER。"],
  ["Category.java", "分类实体", "name、parentId", "parentId 可以支持分类层级。"],
  ["Goods.java", "商城商品实体", "name、price、store、sourceSupplyId", "sourceSupplyId 用来关联来源供应。"],
  ["GoodsStock.java", "商品库存实体", "goodsId、num、type", "用于库存管理记录。"],
  ["Supply.java", "供应信息实体", "supplierId、productName、price、quantity、status", "供应数量是供需撮合和商城购买的源头库存。"],
  ["PurchaseDemand.java", "采购需求实体", "buyerId、productName、expectedPrice、quantity、status", "quantity 表示剩余待采购量。"],
  ["MatchRecommend.java", "推荐结果实体", "score、nameScore、reason、supplyId、demandId", "不是单独业务表，主要用于返回推荐结果。"],
  ["MatchRecord.java", "撮合记录实体", "supplyId、demandId、quantity、status", "记录一次供需对接及履约状态。"],
  ["Orders.java", "订单实体", "orderNo、goodsId、userId、num、status", "保存商品快照、订单状态和购买数量。"],
  ["Notice.java", "公告实体", "title、content、time", "对应 notice 表。"],
];

const mapperRows = [
  ["AdminMapper.java / AdminMapper.xml", "admin 表 SQL", "按用户名查管理员、分页查询、增删改。"],
  ["UserMapper.java / UserMapper.xml", "user 表 SQL", "普通用户登录、注册查重、分页查询。"],
  ["CategoryMapper.java / CategoryMapper.xml", "category 表 SQL", "分类列表和分类维护。"],
  ["GoodsMapper.java / GoodsMapper.xml", "goods 表 SQL", "商品列表、按 sourceSupplyId 查询来源商品。"],
  ["GoodsStockMapper.java / GoodsStockMapper.xml", "goods_stock 表 SQL", "库存管理列表。"],
  ["SupplyMapper.java / SupplyMapper.xml", "supply 表 SQL", "供应大厅筛选、按状态查询、更新剩余数量。"],
  ["PurchaseDemandMapper.java / PurchaseDemandMapper.xml", "purchase_demand 表 SQL", "需求大厅筛选、更新剩余需求量。"],
  ["MatchRecordMapper.java / MatchRecordMapper.xml", "match_record 表 SQL", "撮合记录查询、状态更新、软删除。"],
  ["OrdersMapper.java / OrdersMapper.xml", "orders 表 SQL", "订单查询、按角色筛选、订单状态更新。"],
  ["NoticeMapper.java / NoticeMapper.xml", "notice 表 SQL", "公告查询和维护。"],
];

const frontendRows = [
  ["main.js", "前端入口", "createApp、router、ElementPlus", "看懂前端项目从这里启动。"],
  ["App.vue", "根组件", "router-view 或基础布局", "一般改动少，知道它是最外层即可。"],
  ["router/index.js", "路由配置", "path 和 component", "新增页面先在这里加路由。"],
  ["utils/request.js", "Axios 封装", "baseURL、请求拦截、响应拦截", "所有前端接口请求基本都走这里。"],
  ["Login.vue", "登录页面", "表单、role 选择、/login 请求", "登录成功后把用户存入 localStorage。"],
  ["Register.vue", "注册页面", "普通用户 userType、/register 请求", "供应商、采购商、普通购买用户在这里选择。"],
  ["Manager.vue", "主布局", "顶部栏、侧边栏、菜单 v-if、账号切换", "改标题、菜单、角色入口主要看这里。"],
  ["Home.vue", "首页", "概览、公告或入口展示", "答辩开场可从首页进入各模块。"],
  ["SupplyHall.vue", "供应发布/供应大厅", "发布表单、列表查询、图片上传", "供应商发布和采购商浏览供应都看这里。"],
  ["DemandHall.vue", "采购需求发布/需求大厅", "需求表单、列表查询、响应操作", "采购商发布需求，供应商浏览需求。"],
  ["MatchRecommend.vue", "智能推荐", "调用推荐接口、展示分数、发起撮合", "答辩重点页面。"],
  ["MatchRecord.vue", "撮合记录", "状态按钮、履约动作", "答辩重点页面。"],
  ["MatchAudit.vue", "供需审核", "供应审核、需求审核、通过/拒绝按钮", "管理员审核页面。"],
  ["Buy.vue", "商城购买", "商品列表、下单", "普通购买用户使用。"],
  ["Orders.vue", "订单管理", "支付、取消、发货、收货、软删除", "订单库存同步答辩重点。"],
  ["Analysis.vue", "数据分析看板", "computed 统计、本地规则报告、库存风险", "说明它不是外部 AI，而是本地规则分析。"],
  ["Goods.vue", "商品管理", "商品 CRUD", "管理员维护商城商品。"],
  ["GoodsStock.vue", "库存管理", "库存列表和维护", "管理员维护库存记录。"],
  ["Category.vue", "分类管理", "分类 CRUD", "基础模块。"],
  ["Notice.vue", "公告管理", "公告 CRUD", "改公告底色、公告文字一般找这里或首页展示处。"],
  ["User.vue", "普通用户管理", "用户列表、状态维护", "管理员管理普通用户。"],
  ["Admin.vue", "管理员管理", "管理员列表", "管理员账号维护。"],
  ["Messages.vue", "消息中心", "订单和撮合提醒", "消息数量来自订单和撮合状态。"],
  ["Person.vue", "个人资料", "用户资料修改", "个人中心。"],
  ["Password.vue", "修改密码", "/updatePassword 请求", "密码修改功能。"],
  ["NatureDynamicBackground.vue", "动态背景组件", "视觉背景效果", "只影响界面展示，不影响业务逻辑。"],
];

const independentTemplates = [
  {
    q: "老师问：这个项目是你自己做的吗？",
    a: "可以回答：是我自己按前后端分离结构完成的。我不是只改页面，而是从数据库表、后端 Controller 和 Service、前端 Vue 页面都串过。比如供需匹配这块，我知道前端在 MatchRecommend.vue，接口在 MatchRecommendController，核心算法在 MatchRecommendService，数据来自 supply 和 purchase_demand 表。"
  },
  {
    q: "老师问：如果让你改一个页面样式，你怎么找？",
    a: "可以回答：我会先确认这个页面是哪一个 .vue 文件，例如公告页是 Notice.vue、主菜单是 Manager.vue。简单样式一般在这个文件底部的 style scoped 里，搜索 background、color 或按钮文字就能定位。"
  },
  {
    q: "老师问：如果让你改业务规则，你怎么找？",
    a: "可以回答：业务规则一般不在页面里，而是在后端 Service。比如改推荐分数看 MatchRecommendService，改库存返还看 OrdersService 和 MatchRecordService，改供应审核同步商品看 SupplyService。"
  },
  {
    q: "老师问：你怎么从页面找到后端接口？",
    a: "可以回答：我会在对应 Vue 页面里搜索 request.get、request.post、request.put，看请求路径；比如 /orders/update 对应 OrdersController 的 update 接口，再进入 OrdersService 看具体业务逻辑。"
  },
  {
    q: "老师问：你最熟悉哪个模块？",
    a: "可以回答：我最熟悉智能匹配和库存同步。智能匹配是 MatchRecommendService 里按名称、分类、时间、价格、地区、数量打分；库存同步是 OrdersService 下单扣商品库存，同时调用 SupplyService 同步扣供应库存，撮合记录确认时也会扣供应和采购需求数量。"
  },
];

const precheck = [
  "准备四类账号：管理员、供应商、采购商、普通购买用户。",
  "供应商账号里至少有一条供应信息，采购商账号里至少有一条采购需求。",
  "管理员能进入供需审核管理页面，并能看到待审核或已审核数据。",
  "智能匹配页面能显示推荐结果，最好准备同名农产品，例如红富士苹果。",
  "撮合记录页面至少有一条待确认或已确认记录，方便演示状态流转。",
  "商城商品能正常下单，订单页面能看到待支付、待发货、待收货或已完成状态。",
  "库存变化能说清楚：商城下单扣 goods.store，来源供应同步扣 supply.quantity。",
  "数据分析看板有数据，不要空白。",
  "准备好一句不足说明：认证权限、推荐算法、真实 AI、并发库存控制都可后续优化。"
];

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 320, after: 160 },
    children: [run("答辩项目熟悉与全系统代码学习手册", { bold: true, size: 38, color: COLORS.darkGreen })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [run("基于 Spring Boot 和 Vue 的农产品产销对接平台设计与实现", { size: 24, color: COLORS.gray })],
  }),
  para("使用方式：答辩前先背第一章开场稿，再按第二至第六章准备常见问答；答辩后想彻底熟悉项目，就按第七、八章逐个文件学习。", { align: AlignmentType.CENTER, color: COLORS.gray }),
  sectionBreak(),

  h1("一、2分钟开场介绍稿"),
  ...intro.map(text => para(text)),

  h1("二、系统功能熟悉稿"),
  para("答辩时不要只说“我做了增删改查”，要按角色讲业务。下面这张表可以直接作为演示时的说法。"),
  table(["角色", "主要功能", "演示时怎么说"], roleRows, [1400, 3600, 4400]),

  h1("三、核心代码地图"),
  para("记住这张表的思路：前端页面负责展示和按钮事件，Controller 负责接接口，Service 负责业务规则，Mapper XML 负责 SQL，数据库表保存数据。"),
  table(["功能", "前端页面", "Controller", "Service", "Mapper / SQL", "数据库表"], codeMapRows, [1300, 1750, 1700, 2050, 1850, 1300]),

  h1("四、重点功能回答"),
  ...focusAnswers.flatMap(item => [
    h2(item.title),
    para("重点回答：" + item.answer),
    codePara("代码位置：" + item.files),
    para("如果要调整：" + item.modify, { color: COLORS.gray }),
  ]),

  h1("五、老师常问问题与回答"),
  para("简单问题要回答得短而准，深入问题不用害怕，重点说明你知道代码位置和设计原因。"),
  table(["老师可能问", "建议回答"], faqRows, [2900, 6500]),

  h1("六、简单修改题速查"),
  para("老师现场更可能问一些简单修改，例如改颜色、改文字、改按钮、改阈值。回答时不要说“我不会”，可以说“我会先定位到对应文件，然后改某个字段或样式”。"),
  table(["要改什么", "主要改哪里", "搜索关键词", "怎么改 / 注意点"], simpleModifyRows, [1600, 2200, 2100, 3500]),

  h1("七、如何完整熟悉这个系统"),
  para("不要从所有代码一起看。正确方法是先看目录和运行入口，再看核心业务链路，最后逐个页面和文件补齐细节。"),
  ...learningSteps.map((text) => numbered(text)),
  h2("看懂一个功能的固定方法"),
  bullet("第一步：在浏览器页面确认功能名称，例如“智能匹配推荐”。"),
  bullet("第二步：在 vue/src/views/manager 中找对应页面，例如 MatchRecommend.vue。"),
  bullet("第三步：在页面里搜索 request.get、request.post、request.put，找到接口路径。"),
  bullet("第四步：按接口路径去后端 controller 找方法，例如 /matchRecommend/supplyForBuyer。"),
  bullet("第五步：Controller 一般只转发，真正业务看 Service，例如 MatchRecommendService。"),
  bullet("第六步：如果涉及数据库字段或查询条件，再去 resources/mapper 下看 XML。"),
  h2("熟悉到什么程度算够"),
  bullet("能说出这个功能对应哪个页面、哪个 Controller、哪个 Service。"),
  bullet("能说出核心业务规则，例如推荐按什么打分，订单什么时候扣库存。"),
  bullet("能说出如果老师让改一个简单需求，应该先找哪个文件。"),
  bullet("不要求记住每一行代码，但要知道每个模块的职责和定位方法。"),

  h1("八、每个文件/模块学习清单"),
  para("这一章用于后续系统学习。你可以按表格从上到下看，每看完一个文件，就确认自己能说出“大致作用”和“关键代码”。"),
  table(["文件 / 模块", "大致作用", "重点关注"], fileChecklistRows, [2800, 2600, 4000]),
  h2("后端 Controller 逐个认识"),
  table(["文件", "负责模块", "重点接口", "答辩说法"], backendControllerRows, [2300, 2000, 2600, 2500]),
  h2("后端 Service 逐个认识"),
  table(["文件", "负责业务", "重点方法", "答辩说法"], backendServiceRows, [2300, 2000, 3000, 2100]),
  h2("后端 Entity 逐个认识"),
  table(["文件", "对应对象", "重点字段", "答辩说法"], entityRows, [2200, 2200, 2700, 2300]),
  h2("Mapper 和 XML 逐个认识"),
  table(["文件", "对应 SQL", "重点看什么"], mapperRows, [3100, 2800, 3500]),
  h2("前端文件逐个认识"),
  table(["文件", "页面 / 模块", "重点看什么", "答辩说法"], frontendRows, [2500, 2200, 2600, 2100]),

  h1("九、体现独立完成的回答模板"),
  ...independentTemplates.flatMap(item => [
    h2(item.q),
    para(item.a),
  ]),
  h2("万能定位话术"),
  para("如果老师问到没有背过的小修改，可以这样答：我会先从页面入手，找到对应的 Vue 文件；再看页面里 request 调用的接口路径，根据路径找到 Controller；如果只是改样式或文字，就在 Vue 文件里改；如果是改业务规则，就进入 Service；如果是改查询条件或字段，就看 Mapper XML 和数据库表。这个定位方法适用于我项目里的大部分功能。"),

  h1("十、演示前检查清单"),
  ...precheck.map(text => bullet(text)),
  h2("最后背诵关键词"),
  para("前后端分离、四类角色、供需发布、管理员审核、名称优先、规则权重、多维评分、60分阈值、撮合记录、状态流转、库存锁定、订单库存同步、数据分析、本地规则 AI、Service 处理业务规则、Mapper XML 写 SQL。"),
];

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "SimSun", size: 22 },
        paragraph: { spacing: { line: 360 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "SimHei", size: 32, bold: true, color: COLORS.darkGreen },
        paragraph: { spacing: { before: 260, after: 180 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "SimHei", size: 27, bold: true, color: COLORS.green },
        paragraph: { spacing: { before: 220, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { font: "SimHei", size: 24, bold: true },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 520, hanging: 260 } } },
          },
        ],
      },
      {
        reference: "number-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 560, hanging: 320 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        },
      },
      children,
    },
  ],
});

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUT_FILE, buffer);
  console.log(OUT_FILE);
});
