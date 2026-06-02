from __future__ import annotations

import html
import re
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path


# 精简版代码说明：
# 只覆盖用户截图中指定的前端 Vue/CSS/JS 文件、后端 Service、Mapper XML，
# 另附 Controller 层简要说明。输出为树状结构 + 行号范围 + 简要作用。

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "farm_system"
OUT_DIR = ROOT / "output"
HTML_OUT = OUT_DIR / "答辩精简代码文件行号说明-张博源.html"
PDF_OUT = OUT_DIR / "答辩精简代码文件行号说明-张博源.pdf"


@dataclass
class Block:
    start: int
    end: int
    name: str
    role: str


SELECTED = [
    # views/manager
    "vue/src/views/manager/Admin.vue",
    "vue/src/views/manager/Analysis.vue",
    "vue/src/views/manager/Buy.vue",
    "vue/src/views/manager/Category.vue",
    "vue/src/views/manager/DemandHall.vue",
    "vue/src/views/manager/Goods.vue",
    "vue/src/views/manager/GoodsStock.vue",
    "vue/src/views/manager/Home.vue",
    "vue/src/views/manager/MatchAudit.vue",
    "vue/src/views/manager/MatchRecommend.vue",
    "vue/src/views/manager/MatchRecord.vue",
    "vue/src/views/manager/Messages.vue",
    "vue/src/views/manager/Notice.vue",
    "vue/src/views/manager/Orders.vue",
    "vue/src/views/manager/Password.vue",
    "vue/src/views/manager/Person.vue",
    "vue/src/views/manager/SupplyHall.vue",
    "vue/src/views/manager/User.vue",
    # views
    "vue/src/views/Login.vue",
    "vue/src/views/Manager.vue",
    "vue/src/views/Register.vue",
    # root front files
    "vue/src/App.vue",
    "vue/src/main.js",
    "vue/src/router/index.js",
    "vue/src/assets/css/global.css",
    "vue/src/assets/css/index.scss",
    # service
    "springboot/src/main/java/com/example/service/AdminService.java",
    "springboot/src/main/java/com/example/service/CategoryService.java",
    "springboot/src/main/java/com/example/service/GoodsService.java",
    "springboot/src/main/java/com/example/service/GoodsStockService.java",
    "springboot/src/main/java/com/example/service/MatchRecommendService.java",
    "springboot/src/main/java/com/example/service/MatchRecordService.java",
    "springboot/src/main/java/com/example/service/NoticeService.java",
    "springboot/src/main/java/com/example/service/OrdersService.java",
    "springboot/src/main/java/com/example/service/PurchaseDemandService.java",
    "springboot/src/main/java/com/example/service/SupplyService.java",
    "springboot/src/main/java/com/example/service/UserService.java",
    # mapper xml
    "springboot/src/main/resources/mapper/AdminMapper.xml",
    "springboot/src/main/resources/mapper/CategoryMapper.xml",
    "springboot/src/main/resources/mapper/GoodsMapper.xml",
    "springboot/src/main/resources/mapper/GoodsStockMapper.xml",
    "springboot/src/main/resources/mapper/MatchRecordMapper.xml",
    "springboot/src/main/resources/mapper/NoticeMapper.xml",
    "springboot/src/main/resources/mapper/OrdersMapper.xml",
    "springboot/src/main/resources/mapper/PurchaseDemandMapper.xml",
    "springboot/src/main/resources/mapper/SupplyMapper.xml",
    "springboot/src/main/resources/mapper/UserMapper.xml",
]


FRONT_PURPOSE = {
    "Admin.vue": "管理员账号管理页面，完成管理员列表分页、新增、编辑、删除和头像上传。",
    "Analysis.vue": "数据分析看板，汇总供需、撮合、订单、库存风险和本地规则分析报告。",
    "Buy.vue": "商城购买页面，展示商品列表、筛选商品、选择数量并提交订单。",
    "Category.vue": "农产品分类管理页面，完成分类分页、新增、编辑、删除。",
    "DemandHall.vue": "采购需求大厅与发布页面，采购商发布需求，供应商浏览并响应需求。",
    "Goods.vue": "商城商品管理页面，管理员维护商品信息、价格、图片和分类。",
    "GoodsStock.vue": "商品库存管理页面，维护商品库存记录。",
    "Home.vue": "系统首页，展示公告、统计信息、业务入口和推荐概览。",
    "MatchAudit.vue": "管理员供需审核页面，审核供应信息、采购需求和撮合相关状态。",
    "MatchRecommend.vue": "智能匹配推荐页面，按用户身份展示推荐供应或推荐需求，并可发起撮合。",
    "MatchRecord.vue": "撮合记录页面，展示供需对接记录并处理确认、支付、发货、收货等状态。",
    "Messages.vue": "消息中心，汇总订单和撮合记录产生的提醒。",
    "Notice.vue": "系统公告管理页面，完成公告分页、新增、编辑、删除。",
    "Orders.vue": "订单管理页面，按角色展示订单并处理支付、取消、发货、收货等操作。",
    "Password.vue": "修改密码页面。",
    "Person.vue": "个人资料页面，修改头像、基础信息和密码。",
    "SupplyHall.vue": "供应信息发布与供应大厅页面，供应商发布货源，采购商浏览供应。",
    "User.vue": "普通用户管理页面，管理员维护供应商、采购商、普通购买用户信息。",
    "Login.vue": "登录页面，选择管理员或普通用户角色并调用 /login。",
    "Manager.vue": "系统主布局，负责顶部栏、侧边栏菜单、角色菜单显示、消息入口和账号切换。",
    "Register.vue": "注册页面，普通用户注册时选择供应商、采购商或普通购买用户身份。",
    "App.vue": "Vue 根组件，承载路由页面。",
    "main.js": "前端入口文件，创建 Vue 应用并挂载路由、Element Plus 等。",
    "index.js": "前端路由配置文件，定义页面 path 和组件对应关系。",
    "global.css": "全局 CSS 样式，影响整个前端项目的基础外观。",
    "index.scss": "全局 SCSS 样式，补充项目通用样式。",
}


SERVICE_PURPOSE = {
    "AdminService.java": "管理员账号业务层，处理管理员新增、登录、分页查询和密码修改。",
    "CategoryService.java": "分类业务层，处理农产品分类的增删改查和分页。",
    "GoodsService.java": "商城商品业务层，处理商品增删改查、分页以及按供应来源查商品。",
    "GoodsStockService.java": "商品库存业务层，处理库存记录的增删改查和分页。",
    "MatchRecommendService.java": "智能匹配推荐核心业务层，按名称、分类、时间、价格、地区、数量计算推荐分。",
    "MatchRecordService.java": "撮合记录核心业务层，处理撮合创建、状态流转、库存锁定和释放。",
    "NoticeService.java": "公告业务层，处理公告增删改查和分页。",
    "OrdersService.java": "订单核心业务层，处理下单、订单状态、发货权限、库存扣减和取消返还。",
    "PurchaseDemandService.java": "采购需求业务层，处理需求发布、默认值、数量扣减和返还。",
    "SupplyService.java": "供应信息核心业务层，处理供应发布、单位换算、审核同步商品、库存扣减和返还。",
    "UserService.java": "普通用户业务层，处理用户注册、登录、增删改查、分页和密码修改。",
}


METHOD_ROLE = {
    "add": "新增数据或创建记录。",
    "deleteById": "按 id 删除或隐藏记录。",
    "updateById": "更新记录；核心业务里还会处理状态变化、库存变化。",
    "selectById": "按 id 查询单条记录。",
    "selectAll": "按条件查询全部记录。",
    "selectPage": "分页查询，内部通常调用 PageHelper.startPage。",
    "login": "登录校验。",
    "register": "普通用户注册。",
    "updatePassword": "修改密码。",
    "recommendSupplyForBuyer": "为采购商推荐供应信息。",
    "recommendDemandForSupplier": "为供应商推荐采购需求。",
    "buildRecommend": "构造推荐结果，汇总分数和推荐理由。",
    "calcNameScore": "计算名称/品种匹配分。",
    "calcTimeScore": "计算时间匹配分。",
    "calcPriceScore": "计算价格匹配分。",
    "calcAreaScore": "计算地区匹配分。",
    "calcQuantityScore": "计算数量匹配分。",
    "shouldLockStock": "判断撮合状态是否要锁定库存。",
    "shouldRestoreStock": "判断撮合状态是否要释放库存。",
    "reduceQuantity": "扣减供应或需求剩余量。",
    "restoreQuantity": "返还供应或需求剩余量。",
    "syncGoodsWhenApproved": "供应审核通过后同步成商城商品。",
    "fillDefaultValue": "填充默认状态、单位、时间和总数量。",
    "checkStatusOperator": "校验订单状态操作权限。",
    "checkShipOperator": "校验订单发货权限。",
}


def esc(text: str) -> str:
    return html.escape(str(text), quote=True)


def read_text(path: Path) -> str:
    for enc in ("utf-8", "utf-8-sig", "gbk"):
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="ignore")


def line_count(path: Path) -> int:
    return len(read_text(path).splitlines())


def strip_strings(line: str) -> str:
    line = re.sub(r'"(?:\\.|[^"\\])*"', '""', line)
    line = re.sub(r"'(?:\\.|[^'\\])*'", "''", line)
    return line


def find_brace_end(lines: list[str], start: int) -> int:
    count = 0
    seen = False
    for idx in range(start - 1, len(lines)):
        for ch in strip_strings(lines[idx]):
            if ch == "{":
                count += 1
                seen = True
            elif ch == "}":
                count -= 1
                if seen and count <= 0:
                    return idx + 1
    return start


def find_tag(lines: list[str], open_pat: str, close_pat: str) -> tuple[int, int] | None:
    start = None
    for i, line in enumerate(lines, 1):
        if start is None and open_pat in line:
            start = i
        if start is not None and close_pat in line:
            return start, i
    return None


def vue_blocks(path: Path) -> list[Block]:
    lines = read_text(path).splitlines()
    blocks: list[Block] = []
    for title, open_pat, close_pat, role in [
        ("template 页面结构区", "<template", "</template>", "页面展示内容：表单、表格、按钮、弹窗、分页等。"),
        ("script setup 页面逻辑区", "<script setup", "</script>", "页面数据、函数、接口调用、计算属性和生命周期。"),
        ("style scoped 页面样式区", "<style scoped", "</style>", "当前页面样式，例如背景、颜色、布局、卡片。"),
    ]:
        rng = find_tag(lines, open_pat, close_pat)
        if rng:
            blocks.append(Block(rng[0], rng[1], title, role))

    # 只抽取最关键的前端代码块，避免页面过多。
    for i, line in enumerate(lines, 1):
        if "reactive({" in line:
            blocks.append(Block(i, find_brace_end(lines, i), "reactive 页面数据区", "保存列表、表单、分页、筛选条件、弹窗状态等。"))
        m = re.search(r"const\s+(\w+)\s*=\s*(async\s*)?\([^)]*\)\s*=>", line)
        if m:
            name = m.group(1)
            if name in {"load", "handleAdd", "handleEdit", "add", "update", "save", "handleDelete", "reset", "handleRecordAction", "handlePrimaryAction", "handleMoreCommand", "generateAiReport", "exportAiReport"} or "Search" in name or "Upload" in name or "Img" in name:
                blocks.append(Block(i, find_brace_end(lines, i), f"函数 {name}()", front_func_role(name)))
        if "request." in line:
            blocks.append(Block(i, i, "后端接口调用", line.strip()))
    return compact(blocks, max_blocks=14)


def front_func_role(name: str) -> str:
    if name == "load":
        return "加载页面数据，通常调用 selectPage 或 selectAll 接口。"
    if name in {"handleAdd", "handleEdit"}:
        return "打开新增/编辑弹窗并准备表单数据。"
    if name in {"add", "update", "save"}:
        return "提交新增或修改表单到后端。"
    if "Delete" in name:
        return "删除或隐藏记录。"
    if name == "reset":
        return "清空筛选条件并重新查询。"
    if "Search" in name:
        return "根据关键词或条件查询。"
    if "Upload" in name or "Img" in name:
        return "处理图片/文件上传结果。"
    if name in {"handleRecordAction", "handlePrimaryAction", "handleMoreCommand"}:
        return "处理业务按钮动作，例如状态流转、支付、发货、收货。"
    if "Report" in name:
        return "生成、查看或导出数据分析报告。"
    return "处理页面交互动作。"


def service_blocks(path: Path) -> list[Block]:
    lines = read_text(path).splitlines()
    blocks: list[Block] = []
    imports = [i for i, line in enumerate(lines, 1) if line.startswith("import ")]
    if imports:
        blocks.append(Block(1, max(imports), "包名与依赖引入区", "声明 Service 所属包，引入 Mapper、实体类、PageHelper、事务等依赖。"))
    for i, line in enumerate(lines, 1):
        if "@Service" in line:
            end = find_brace_end(lines, i + 1)
            blocks.append(Block(i, end, "Service 类主体", SERVICE_PURPOSE.get(path.name, "业务层类主体。")))
        if "@Resource" in line:
            next_line = lines[i] if i < len(lines) else ""
            blocks.append(Block(i, min(i + 1, len(lines)), "依赖注入区", f"注入当前 Service 需要调用的 Mapper 或其他 Service。{next_line.strip()}"))
        m = re.search(r"(public|private|protected)\s+[\w<>, ?\[\].]+\s+(\w+)\s*\([^;]*\)\s*(\{|throws)", line)
        if m and " class " not in line:
            name = m.group(2)
            role = METHOD_ROLE.get(name, f"{name} 方法，处理当前业务类中的一个步骤。")
            blocks.append(Block(i, find_brace_end(lines, i), f"方法 {name}()", role))
    return compact(blocks, max_blocks=16)


def mapper_blocks(path: Path) -> list[Block]:
    lines = read_text(path).splitlines()
    blocks: list[Block] = []
    for i, line in enumerate(lines, 1):
        m = re.search(r"<(select|insert|update|delete)\s+id=\"([^\"]+)\"", line)
        if m:
            op, sql_id = m.groups()
            end = find_xml_end(lines, i, op)
            role = {"select": "查询 SQL", "insert": "新增 SQL", "update": "更新 SQL", "delete": "删除 SQL"}[op]
            blocks.append(Block(i, end, f"{op} id={sql_id}", f"{role}，Java Mapper 接口中的同名方法会调用这段 SQL。"))
    return compact(blocks, max_blocks=14)


def find_xml_end(lines: list[str], start: int, tag: str) -> int:
    close = f"</{tag}>"
    for i in range(start - 1, len(lines)):
        if close in lines[i] or "/>" in lines[i]:
            return i + 1
    return start


def js_blocks(path: Path) -> list[Block]:
    lines = read_text(path).splitlines()
    blocks: list[Block] = []
    imports = [i for i, line in enumerate(lines, 1) if line.strip().startswith("import ")]
    if imports:
        blocks.append(Block(min(imports), max(imports), "依赖引入区", "引入 Vue、路由、Element Plus、样式文件等。"))
    for i, line in enumerate(lines, 1):
        if "createApp" in line:
            blocks.append(Block(i, i, "创建 Vue 应用", "前端启动入口，创建并挂载应用。"))
        if "createRouter" in line:
            blocks.append(Block(i, find_brace_end(lines, i), "路由配置对象", "定义页面 path 和 Vue 组件之间的对应关系。"))
    return compact(blocks, max_blocks=8)


def css_blocks(path: Path) -> list[Block]:
    lines = read_text(path).splitlines()
    blocks: list[Block] = []
    start = None
    selector = None
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("/*") or stripped.startswith("*"):
            continue
        if "{" in stripped and not stripped.startswith("@"):
            start = i
            selector = stripped.split("{", 1)[0].strip()
        if start and "}" in stripped:
            blocks.append(Block(start, i, f"样式 {selector}", "定义全局或公共页面样式。"))
            start = None
            selector = None
    if not blocks:
        blocks.append(Block(1, max(1, len(lines)), "整体样式文件", "全局样式或 SCSS 公共样式。"))
    return compact(blocks, max_blocks=10)


def vue_root_blocks(path: Path) -> list[Block]:
    if path.suffix == ".vue":
        return vue_blocks(path)
    if path.suffix == ".js":
        return js_blocks(path)
    return css_blocks(path)


def compact(blocks: list[Block], max_blocks: int) -> list[Block]:
    blocks = sorted(blocks, key=lambda b: (b.start, b.end, b.name))
    if len(blocks) <= max_blocks:
        return blocks
    head = blocks[: max_blocks - 1]
    rest = blocks[max_blocks - 1 :]
    head.append(Block(rest[0].start, rest[-1].end, "其余辅助代码", "包含页面辅助函数、样式细节或常规查询代码，答辩时通常不需要逐行背。"))
    return head


def analyze(path: Path) -> list[Block]:
    if path.suffix == ".vue":
        return vue_blocks(path)
    if path.suffix == ".js":
        return js_blocks(path)
    if path.suffix in {".css", ".scss"}:
        return css_blocks(path)
    if "service" in path.parts:
        return service_blocks(path)
    if path.suffix == ".xml":
        return mapper_blocks(path)
    return vue_root_blocks(path)


def purpose(path: Path) -> str:
    if path.name in FRONT_PURPOSE:
        return FRONT_PURPOSE[path.name]
    if path.name in SERVICE_PURPOSE:
        return SERVICE_PURPOSE[path.name]
    if path.suffix == ".xml":
        return "MyBatis SQL 映射文件，负责对应模块的数据查询、插入、更新和删除。"
    return "项目代码文件。"


def row(block: Block) -> str:
    return f"<tr><td>{block.start}-{block.end}</td><td>{esc(block.name)}</td><td>{esc(block.role)}</td></tr>"


def file_section(path: Path, number: int) -> str:
    blocks = analyze(path)
    rows = "".join(row(b) for b in blocks)
    return f"""
    <section class="file-section">
      <h3>{number}. <span class="mark">{icon(path)}</span> {esc(path.name)}</h3>
      <p><strong>文件作用：</strong>{esc(purpose(path))}</p>
      <table>
        <thead><tr><th class="line">行号</th><th>代码模块</th><th>作用</th></tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </section>
    """


def icon(path: Path) -> str:
    if path.suffix == ".vue":
        return "V"
    if path.suffix == ".java":
        return "C"
    if path.suffix == ".xml":
        return "X"
    if path.suffix in {".css", ".scss"}:
        return "CSS"
    if path.suffix == ".js":
        return "JS"
    return "F"


def section(title: str, files: list[Path], start_no: int) -> tuple[str, int]:
    body = [f"<h2>{esc(title)}</h2>"]
    no = start_no
    for file in files:
        body.append(file_section(file, no))
        no += 1
    return "\n".join(body), no


def controller_summary() -> str:
    rows = [
        ("WebController", "/login、/register、/updatePassword", "公共入口，处理登录、注册和修改密码。"),
        ("AdminController / UserController", "/admin、/user", "管理员和普通用户信息维护。"),
        ("CategoryController / GoodsController / GoodsStockController", "/category、/goods、/goodsStock", "分类、商品、库存管理接口。"),
        ("SupplyController / PurchaseDemandController", "/supply、/purchaseDemand", "供应信息和采购需求的发布、审核状态更新、查询。"),
        ("MatchRecommendController", "/matchRecommend", "提供推荐入口，具体算法在 MatchRecommendService。"),
        ("MatchRecordController", "/matchRecord", "撮合记录新增、状态更新、查询和隐藏。"),
        ("OrdersController", "/orders", "订单新增、状态更新、分页查询和隐藏。"),
        ("NoticeController / FileController", "/notice、/files", "公告管理和文件上传下载。"),
    ]
    html_rows = "".join(f"<tr><td>{esc(a)}</td><td>{esc(b)}</td><td>{esc(c)}</td></tr>" for a, b, c in rows)
    return f"""
    <h2>Controller 层简要说明</h2>
    <p>Controller 层是前端请求进入后端的入口。Vue 页面通过 request.js 调用接口，Controller 接收请求后通常不写复杂业务，而是转给 Service。答辩时可以说：页面操作先到 Controller，真正业务规则在 Service，SQL 在 Mapper XML。</p>
    <table>
      <thead><tr><th>Controller</th><th>主要接口前缀</th><th>作用</th></tr></thead>
      <tbody>{html_rows}</tbody>
    </table>
    """


def render_html() -> str:
    paths = [PROJECT / item for item in SELECTED]
    groups = [
        ("views / manager", [p for p in paths if "views" in p.parts and "manager" in p.parts]),
        ("views", [p for p in paths if p.parent.name == "views"]),
        ("前端入口文件", [p for p in paths if p.name in {"App.vue", "main.js"}]),
        ("router", [p for p in paths if "router" in p.parts]),
        ("css", [p for p in paths if p.suffix in {".css", ".scss"}]),
        ("service", [p for p in paths if "service" in p.parts]),
        ("mapper XML", [p for p in paths if p.suffix == ".xml"]),
    ]
    no = 1
    parts = []
    tree_lines = []
    for title, files in groups:
        tree_lines.append(f'<div class="folder">▾ {esc(title)}</div>')
        for file in files:
            tree_lines.append(f'<div class="file"><span>{icon(file)}</span> {esc(file.name)}</div>')
        html_section, no = section(title, files, no)
        parts.append(html_section)
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>答辩精简代码文件行号说明</title>
<style>
@page {{ size: A4; margin: 13mm 11mm; }}
body {{ font-family: "Microsoft YaHei", "SimSun", sans-serif; color: #111; font-size: 10.5pt; line-height: 1.55; }}
h1 {{ color: #176b24; font-size: 23pt; margin: 0 0 8pt; }}
h2 {{ color: #176b24; font-size: 16pt; margin: 16pt 0 8pt; page-break-after: avoid; border-bottom: 1px solid #c9d8c4; padding-bottom: 3pt; }}
h3 {{ color: #222; font-size: 12.5pt; margin: 10pt 0 4pt; page-break-after: avoid; }}
p {{ margin: 0 0 5pt; }}
table {{ width: 100%; border-collapse: collapse; margin: 5pt 0 9pt; font-size: 9pt; page-break-inside: auto; }}
tr {{ page-break-inside: avoid; page-break-after: auto; }}
th, td {{ border: 1px solid #b9cbb2; padding: 3.5pt 5pt; vertical-align: top; word-break: break-word; }}
th {{ background: #ddefd6; font-weight: 700; }}
td:first-child {{ background: #f7fbf4; font-weight: 600; }}
.cover {{ page-break-after: always; }}
.hint {{ background: #fff7df; border-left: 4px solid #d99a00; padding: 7pt 9pt; margin: 7pt 0 10pt; }}
.tree {{ border: 1px solid #c9d8c4; background: #fbfdf9; padding: 7pt 9pt; font-size: 10pt; columns: 2; }}
.folder {{ font-weight: 700; color: #333; margin: 3pt 0 2pt; break-inside: avoid; }}
.file {{ margin-left: 16pt; margin-bottom: 2pt; break-inside: avoid; }}
.file span, .mark {{ color: #1f8f5f; font-weight: 900; }}
.line {{ width: 54pt; }}
.file-section {{ page-break-inside: avoid; }}
</style>
</head>
<body>
<div class="cover">
  <h1>答辩精简代码文件行号说明</h1>
  <p>范围：只包含你截图中列出的 Vue 文件、前端入口、router、CSS、Service、Mapper XML，并补充 Controller 层简要说明。</p>
  <div class="hint">阅读方法：先看目录树，再看每个文件下的“行号范围”。这版不追求逐行解释所有细节，而是帮助你答辩时知道每个文件的主要模块在哪里、负责什么。</div>
  <h2>目录树</h2>
  <div class="tree">{''.join(tree_lines)}</div>
</div>
{''.join(parts)}
{controller_summary()}
</body>
</html>"""


def write_html() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    HTML_OUT.write_text(render_html(), encoding="utf-8")


def edge_path() -> Path | None:
    for p in [
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ]:
        if p.exists():
            return p
    return None


def export_pdf() -> bool:
    edge = edge_path()
    if not edge:
        return False
    tmp = OUT_DIR / "brief_pdf_tmp"
    tmp.mkdir(exist_ok=True)
    tmp_html = tmp / "brief.html"
    tmp_pdf = tmp / "brief.pdf"
    tmp_html.write_text(HTML_OUT.read_text(encoding="utf-8"), encoding="utf-8")
    if tmp_pdf.exists():
        tmp_pdf.unlink()
    user_data = tmp / f"edge_{int(time.time())}"
    cmd = [
        str(edge),
        "--headless=new",
        "--disable-gpu",
        "--disable-crash-reporter",
        "--disable-breakpad",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        f"--user-data-dir={user_data}",
        f"--print-to-pdf={tmp_pdf}",
        tmp_html.resolve().as_uri(),
    ]
    subprocess.run(cmd, cwd=str(ROOT), check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    for _ in range(60):
        if tmp_pdf.exists() and tmp_pdf.stat().st_size:
            PDF_OUT.write_bytes(tmp_pdf.read_bytes())
            return True
        time.sleep(0.5)
    return False


def main() -> None:
    write_html()
    ok = export_pdf()
    print(HTML_OUT)
    print(PDF_OUT if ok else "PDF_EXPORT_FAILED")


if __name__ == "__main__":
    main()
