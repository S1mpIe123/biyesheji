const fs = require('fs');
const path = require('path');
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');

// 本脚本负责把答辩演示路线和代码定位整理为 Word 文档，便于答辩前打印或边演示边查看。
const projectRoot = 'C:/Users/张博源/Desktop/毕设/农产品';
const outputDir = path.join(projectRoot, 'output');
const outputPath = path.join(outputDir, '农产品产销对接平台-答辩演示路线与代码定位.docx');

const font = 'Microsoft YaHei';
const tableWidth = 9360;
const border = { style: BorderStyle.SINGLE, size: 1, color: 'D8E2D2' };
const borders = { top: border, bottom: border, left: border, right: border };

const p = (text, options = {}) =>
  new Paragraph({
    spacing: { before: options.before || 0, after: options.after || 120, line: 320 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        font,
        size: options.size || 22,
        bold: !!options.bold,
        color: options.color || '1F2D24',
      }),
    ],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, font, bold: true, size: 32, color: '176B24' })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [new TextRun({ text, font, bold: true, size: 26, color: '263238' })],
  });

const code = (text) =>
  new TextRun({
    text,
    font: 'Consolas',
    size: 18,
    color: '334155',
  });

const cell = (children, width, fill = 'FFFFFF') =>
  new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 110, bottom: 110, left: 130, right: 130 },
    children: Array.isArray(children) ? children : [p(String(children), { after: 0 })],
  });

// 生成表格时显式设置列宽和单元格宽度，保证 Word/WPS 打开后版式稳定。
const table = (headers, rows, widths) =>
  new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((item, index) =>
          cell([p(item, { bold: true, color: 'FFFFFF', after: 0 })], widths[index], '176B24')
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map((item, index) =>
              cell(
                typeof item === 'string'
                  ? item.split('\n').map((line) =>
                      new Paragraph({
                        spacing: { after: 80 },
                        children: [line.includes(':') || line.includes('\\') || line.includes('/') ? code(line) : new TextRun({ text: line, font, size: 20, color: '1F2D24' })],
                      })
                    )
                  : item,
                widths[index],
                index === 0 ? 'F6FBF3' : 'FFFFFF'
              )
            ),
          })
      ),
    ],
  });

const demoRows = [
  ['1', '登录 / 注册', '打开登录页；可点“注册”展示供应方、采购方、日常购买三种身份。', '说明系统按 role 和 userType 控制菜单权限。'],
  ['2', '系统首页', '管理员登录后进入“系统首页”。', '展示供应、采购、撮合、订单指标，说明系统不是单纯商城。'],
  ['3', '基础管理', '点击“农产品管理 → 分类/商品/进货管理”。', '说明基础数据支撑商城和供应审核后的上架。'],
  ['4', '供应发布', '供应商登录，点击“供应信息发布 → 发布供应信息”。', '展示产品、分类、图片、产地、单位、价格、数量、上市时间等字段。'],
  ['5', '采购需求', '采购商登录，点击“发布采购意向 → 发布采购需求”。', '展示期望数量、期望价格、收货地区、截止时间等字段。'],
  ['6', '供需审核', '管理员点击“供需审核管理”，分别通过供应和需求。', '强调审核通过后供应会进入供应大厅，并同步到商城商品。'],
  ['7', '供应大厅 / 需求大厅', '采购商从供应大厅发起采购意向；供应商从需求大厅点击“我要供货”。', '说明平台支持供需双方双向发起对接。'],
  ['8', '智能匹配推荐', '点击“智能匹配推荐”，展示匹配度、推荐理由、评分拆解。', '重点说明规则权重算法：名称、分类、时间、价格、地区、数量。'],
  ['9', '我的对接记录', '点击“我的对接记录”，演示确认、支付、填地址、发货、收货。', '说明撮合状态流转和库存锁定/释放。'],
  ['10', '日常购买订单', '日常购买用户点击“农产品购买”，选择数量购买，再到“订单管理”。', '展示商城小额购买闭环和订单溯源。'],
  ['11', '数据分析看板', '管理员点击“数据分析看板”，生成并查看分析报告。', '展示 KPI、供需结构、撮合漏斗、库存风险、价格机会。'],
];

const codeRows = [
  [
    '入口、路由、菜单',
    '前端路由：farm_system/vue/src/router/index.js:7\n角色菜单：farm_system/vue/src/views/Manager.vue:136\n消息数量：farm_system/vue/src/views/Manager.vue:425',
    '这里定义各页面地址，并根据管理员、供应商、采购商、日常购买用户动态显示菜单。',
  ],
  [
    '登录 / 注册',
    '登录前端：farm_system/vue/src/views/Login.vue:94\n注册前端：farm_system/vue/src/views/Register.vue:152\n登录接口：farm_system/springboot/src/main/java/com/example/controller/WebController.java:31\n注册接口：farm_system/springboot/src/main/java/com/example/controller/WebController.java:45\n用户登录：farm_system/springboot/src/main/java/com/example/service/UserService.java:85\n管理员登录：farm_system/springboot/src/main/java/com/example/service/AdminService.java:82',
    '前端提交账号、密码、角色；后端按角色分别查 admin 或 user 表，成功后返回账号信息。',
  ],
  [
    '系统首页',
    '首页页面：farm_system/vue/src/views/manager/Home.vue:1\n身份切换：farm_system/vue/src/views/manager/Home.vue:508',
    '首页请求供应、需求、撮合、订单、商品数据，生成态势图、指标卡和身份专属建议。',
  ],
  [
    '供应信息发布',
    '发布按钮：farm_system/vue/src/views/manager/SupplyHall.vue:25\n表单字段：farm_system/vue/src/views/manager/SupplyHall.vue:73\n保存逻辑：farm_system/vue/src/views/manager/SupplyHall.vue:233\n供应接口：farm_system/springboot/src/main/java/com/example/controller/SupplyController.java:16\n新增供应：farm_system/springboot/src/main/java/com/example/service/SupplyService.java:34\n默认值/吨转斤：farm_system/springboot/src/main/java/com/example/service/SupplyService.java:107\n审核后同步商品：farm_system/springboot/src/main/java/com/example/service/SupplyService.java:153\nSQL 映射：farm_system/springboot/src/main/resources/mapper/SupplyMapper.xml:21',
    '供应商发布后默认待审核；后端统一数量单位，审核通过后自动创建或更新商城商品。',
  ],
  [
    '采购需求发布',
    '发布按钮：farm_system/vue/src/views/manager/DemandHall.vue:22\n表单字段：farm_system/vue/src/views/manager/DemandHall.vue:72\n保存逻辑：farm_system/vue/src/views/manager/DemandHall.vue:200\n需求接口：farm_system/springboot/src/main/java/com/example/controller/PurchaseDemandController.java:16\n新增需求：farm_system/springboot/src/main/java/com/example/service/PurchaseDemandService.java:31\n需求扣减：farm_system/springboot/src/main/java/com/example/service/PurchaseDemandService.java:54\nSQL 映射：farm_system/springboot/src/main/resources/mapper/PurchaseDemandMapper.xml:20',
    '采购商发布需求后等待审核；撮合确认后扣减剩余采购量，用进度条展示完成情况。',
  ],
  [
    '管理员审核',
    '审核页面：farm_system/vue/src/views/manager/MatchAudit.vue:35\n供应审核按钮：farm_system/vue/src/views/manager/MatchAudit.vue:58\n需求审核按钮：farm_system/vue/src/views/manager/MatchAudit.vue:87\n状态更新：farm_system/vue/src/views/manager/MatchAudit.vue:175\n供应更新接口：farm_system/springboot/src/main/java/com/example/controller/SupplyController.java:34\n需求更新接口：farm_system/springboot/src/main/java/com/example/controller/PurchaseDemandController.java:34',
    '管理员将待审核记录改为已通过或已拒绝。供应通过会触发商品同步，是供需信息进入交易流程的关键节点。',
  ],
  [
    '智能匹配推荐',
    '推荐页面：farm_system/vue/src/views/manager/MatchRecommend.vue:1\n加载推荐：farm_system/vue/src/views/manager/MatchRecommend.vue:176\n发起意向：farm_system/vue/src/views/manager/MatchRecommend.vue:189\n提交撮合：farm_system/vue/src/views/manager/MatchRecommend.vue:203\n推荐接口：farm_system/springboot/src/main/java/com/example/controller/MatchRecommendController.java:21\n采购商推荐供应：farm_system/springboot/src/main/java/com/example/service/MatchRecommendService.java:42\n供应商推荐需求：farm_system/springboot/src/main/java/com/example/service/MatchRecommendService.java:68\n名称评分：farm_system/springboot/src/main/java/com/example/service/MatchRecommendService.java:195\n价格/地区/数量评分：farm_system/springboot/src/main/java/com/example/service/MatchRecommendService.java:280',
    '这是项目核心亮点之一。算法按名称、分类、时间、价格、地区、数量打分，前端展示总分、分项评分和推荐理由。',
  ],
  [
    '撮合记录和履约',
    '撮合页面：farm_system/vue/src/views/manager/MatchRecord.vue:1\n操作按钮生成：farm_system/vue/src/views/manager/MatchRecord.vue:472\n采购侧动作：farm_system/vue/src/views/manager/MatchRecord.vue:487\n供应侧动作：farm_system/vue/src/views/manager/MatchRecord.vue:501\n状态更新：farm_system/vue/src/views/manager/MatchRecord.vue:532\n撮合接口：farm_system/springboot/src/main/java/com/example/controller/MatchRecordController.java:16\n新增撮合：farm_system/springboot/src/main/java/com/example/service/MatchRecordService.java:42\n库存锁定/返还：farm_system/springboot/src/main/java/com/example/service/MatchRecordService.java:129\n锁定判断：farm_system/springboot/src/main/java/com/example/service/MatchRecordService.java:145\nSQL 映射：farm_system/springboot/src/main/resources/mapper/MatchRecordMapper.xml:34',
    '状态从待确认进入已确认后锁定供应和需求数量；支付、发货、收货都围绕同一条撮合记录推进。',
  ],
  [
    '日常购买和订单',
    '购买页面：farm_system/vue/src/views/manager/Buy.vue:1\n点击购买：farm_system/vue/src/views/manager/Buy.vue:112\n商品加载：farm_system/vue/src/views/manager/Buy.vue:134\n订单加载：farm_system/vue/src/views/manager/Orders.vue:166\n订单状态更新：farm_system/vue/src/views/manager/Orders.vue:282\n订单接口：farm_system/springboot/src/main/java/com/example/controller/OrdersController.java:16\n新增订单/扣库存：farm_system/springboot/src/main/java/com/example/service/OrdersService.java:39\n订单更新/取消返还：farm_system/springboot/src/main/java/com/example/service/OrdersService.java:84\n权限校验：farm_system/springboot/src/main/java/com/example/service/OrdersService.java:108\nSQL 映射：farm_system/springboot/src/main/resources/mapper/OrdersMapper.xml:28',
    '普通用户购买商品后生成订单并扣库存；平台商品由管理员发货，直供商品由对应供应商发货。',
  ],
  [
    '数据分析看板',
    '看板页面：farm_system/vue/src/views/manager/Analysis.vue:1\n生成报告：farm_system/vue/src/views/manager/Analysis.vue:312\n导出报告：farm_system/vue/src/views/manager/Analysis.vue:329\n加载数据：farm_system/vue/src/views/manager/Analysis.vue:565',
    '前端聚合供应、需求、撮合、订单和商品数据，生成 KPI、供需结构、撮合漏斗、库存风险和运营建议。',
  ],
  [
    '基础数据管理',
    '分类页面：farm_system/vue/src/views/manager/Category.vue:65\n商品页面：farm_system/vue/src/views/manager/Goods.vue:128\n库存页面：farm_system/vue/src/views/manager/GoodsStock.vue:101\n分类接口：farm_system/springboot/src/main/java/com/example/controller/CategoryController.java:16\n商品接口：farm_system/springboot/src/main/java/com/example/controller/GoodsController.java:16\n库存接口：farm_system/springboot/src/main/java/com/example/controller/GoodsStockController.java:16',
    '这些模块提供基础 CRUD 能力，支撑商城商品展示、分类筛选和库存管理。',
  ],
];

const talkRows = [
  ['登录时', '“系统登录后根据角色和用户类型动态渲染菜单，管理员、供应商、采购商和日常购买用户看到的功能入口不同。”'],
  ['发布供应时', '“供应商提交货源后默认进入待审核状态，管理员审核通过后才会进入供应大厅，并同步为商城可购买商品。”'],
  ['发布采购需求时', '“采购商发布的是需求侧信息，包含期望价格、数量、收货地区和截止时间，用于后续智能匹配。”'],
  ['智能匹配时', '“匹配算法综合农产品名称、分类、供需时间、价格、地区和数量进行打分，推荐度越高越优先展示。”'],
  ['撮合记录时', '“撮合记录负责把供需关系转成实际履约流程，确认后会锁定供应库存和采购需求量，避免重复成交。”'],
  ['订单管理时', '“小额购买走商城订单流程，大额产销对接走撮合记录流程，两条业务线都能形成闭环。”'],
  ['数据看板时', '“数据分析看板帮助管理员观察供需是否平衡、库存是否偏低、撮合转化是否顺畅。”'],
];

const children = [
  new Paragraph({
    spacing: { after: 120 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '农产品产销对接平台', font, bold: true, size: 40, color: '176B24' })],
  }),
  new Paragraph({
    spacing: { after: 360 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '答辩演示路线与功能代码定位', font, bold: true, size: 30, color: '263238' })],
  }),
  p('适用场景：明天答辩时按步骤演示系统，并在老师追问“这块代码在哪”时快速定位。', { alignment: AlignmentType.CENTER, color: '5F6D5E' }),
  p('项目主线：供应商发布货源，采购商发布需求，管理员审核，系统智能匹配，双方确认撮合，再进入订单和数据分析闭环。', {
    alignment: AlignmentType.CENTER,
    bold: true,
    color: '176B24',
  }),
  h1('目录'),
  new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-2' }),
  h1('一、答辩推荐演示路线'),
  table(['步骤', '展示功能', '你应该点什么', '讲解重点'], demoRows, [760, 1700, 3820, 3080]),
  h1('二、功能与代码定位对照表'),
  table(['功能模块', '对应代码位置', '实现说明'], codeRows, [1700, 4860, 2800]),
  h1('三、现场讲解话术速记'),
  table(['场景', '可以这样说'], talkRows, [1600, 7760]),
  h1('四、演示账号建议'),
  p('如果已执行演示数据 SQL，可优先使用以下普通用户账号，密码均为 123。管理员账号请使用你本地 admin 表中已确认可登录的账号。'),
  table(
    ['角色', '账号', '密码', '用途'],
    [
      ['供应商', 'enhanced_debug_supplier_01', '123', '发布供应、查看需求大厅、智能匹配、发货履约'],
      ['采购商', 'enhanced_debug_buyer_01', '123', '发布采购需求、查看供应大厅、智能匹配、支付/收货'],
      ['日常购买用户', 'enhanced_debug_shopper_01', '123', '农产品购买、订单管理、订单溯源'],
    ],
    [1700, 3300, 1100, 3260]
  ),
  h1('五、答辩压缩版路线'),
  p('如果时间只有 5 分钟，建议按这个顺序演示：登录 -> 首页 -> 供应商发布供应 -> 采购商发布需求 -> 管理员审核 -> 智能匹配推荐 -> 我的对接记录 -> 订单管理 -> 数据分析看板。', {
    bold: true,
    color: '176B24',
  }),
  p('最重要的是供需审核、智能匹配、撮合履约、库存/订单联动，这几块最能体现系统题目中的“产销对接”。'),
];

const doc = new Document({
  styles: {
    default: {
      document: { run: { font, size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, font, color: '176B24' },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 26, bold: true, font, color: '263238' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: '第 ', font, size: 18, color: '64748B' }),
                new TextRun({ children: [PageNumber.CURRENT], font, size: 18, color: '64748B' }),
                new TextRun({ text: ' 页', font, size: 18, color: '64748B' }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(outputPath);
});
