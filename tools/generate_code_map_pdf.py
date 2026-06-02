from __future__ import annotations

import html
import os
import re
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path


# 这个脚本用于在答辩前快速生成“全代码文件作用与位置速查”PDF。
# 它不会修改业务代码，只读取源码并按文件、行号、代码块生成说明。

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "farm_system"
OUT_DIR = ROOT / "output"
HTML_OUT = OUT_DIR / "项目全代码文件作用与位置速查-张博源.html"
PDF_OUT = OUT_DIR / "项目全代码文件作用与位置速查-张博源.pdf"


SKIP_PARTS = {"node_modules", "dist", "target", ".idea", ".git", "__pycache__"}
SOURCE_EXTS = {".java", ".vue", ".js", ".xml", ".yml", ".sql"}


@dataclass
class Block:
    start: int
    end: int
    name: str
    role: str
    detail: str


FILE_PURPOSE = {
    "SpringbootApplication.java": "后端启动入口，运行 Spring Boot 应用。",
    "application.yml": "后端配置文件，配置端口、数据库、上传大小、MyBatis XML 扫描和文件访问前缀。",
    "pom.xml": "Maven 依赖配置，声明 Spring Boot、MyBatis、MySQL、PageHelper、Hutool 等后端依赖。",
    "Result.java": "统一返回结构，后端接口统一返回 code、msg、data。",
    "CorsConfig.java": "跨域配置，允许前端开发端口访问后端接口。",
    "CustomException.java": "自定义业务异常，用于库存不足、权限不符等业务错误。",
    "GlobalExceptionHandler.java": "全局异常处理，把后端异常转换为前端可读的 Result 错误响应。",
    "UnitConverter.java": "计量单位换算工具，主要负责把吨换算为斤，并处理金额精度。",
    "request.js": "前端 Axios 请求封装，统一 baseURL、请求头和响应处理。",
    "router/index.js": "前端路由表，定义每个页面路径对应的 Vue 组件。",
    "main.js": "前端应用入口，创建 Vue 应用并注册路由、Element Plus 等插件。",
    "App.vue": "前端根组件，承载路由页面。",
    "Manager.vue": "系统主布局，包含顶部栏、侧边栏菜单、角色菜单控制、消息入口和账号切换。",
    "Login.vue": "登录页面，收集账号、密码和角色，调用 /login。",
    "Register.vue": "注册页面，普通用户选择供应商、采购商或普通购买用户身份。",
    "Home.vue": "系统首页，展示首页信息、公告、业务入口和部分统计信息。",
    "SupplyHall.vue": "供应信息发布和供应大厅页面。",
    "DemandHall.vue": "采购需求发布和采购需求大厅页面。",
    "MatchRecommend.vue": "智能匹配推荐页面，展示推荐结果和分项得分。",
    "MatchRecord.vue": "撮合记录页面，处理确认、支付、发货、收货、取消等状态动作。",
    "MatchAudit.vue": "管理员供需审核页面，审核供应信息、采购需求和撮合确认。",
    "Orders.vue": "订单管理页面，处理支付、取消、发货、收货和订单隐藏。",
    "Buy.vue": "商城购买页面，展示商品、选择数量并下单。",
    "Analysis.vue": "数据分析看板，前端聚合供需、订单、撮合和库存数据。",
    "Messages.vue": "消息中心，展示订单和撮合状态提醒。",
    "Person.vue": "个人资料页面，修改用户基础信息和头像。",
    "Password.vue": "修改密码页面。",
    "Goods.vue": "商城商品管理页面。",
    "GoodsStock.vue": "商品库存管理页面。",
    "Category.vue": "农产品分类管理页面。",
    "Notice.vue": "系统公告管理页面。",
    "User.vue": "普通用户管理页面。",
    "Admin.vue": "管理员账号管理页面。",
    "NatureDynamicBackground.vue": "前端动态背景组件，只负责视觉效果。",
}


def read_text(path: Path) -> str:
    for enc in ("utf-8", "utf-8-sig", "gbk"):
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="ignore")


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT)).replace("\\", "/")


def should_include(path: Path) -> bool:
    if path.suffix.lower() not in SOURCE_EXTS:
        return False
    return not any(part in SKIP_PARTS for part in path.parts)


def list_source_files() -> list[Path]:
    files = [p for p in PROJECT.rglob("*") if p.is_file() and should_include(p)]
    return sorted(files, key=lambda p: rel(p).lower())


def file_purpose(path: Path) -> str:
    name = path.name
    if name in FILE_PURPOSE:
        return FILE_PURPOSE[name]
    if path.suffix == ".sql":
        return "数据库更新或演示数据脚本，用于修改表结构、补充字段或插入测试数据。"
    if "mapper" in path.parts and path.suffix == ".xml":
        table = name.replace("Mapper.xml", "")
        return f"MyBatis SQL 映射文件，负责 {table} 模块的数据查询、插入、更新和删除。"
    if "entity" in path.parts:
        return "实体类，对应数据库表字段或前后端传输对象。"
    if "mapper" in path.parts and path.suffix == ".java":
        return "MyBatis Mapper 接口，方法名与 XML 中 SQL 的 id 对应。"
    if "controller" in path.parts:
        return "后端 Controller 接口层，接收前端 HTTP 请求并调用 Service。"
    if "service" in path.parts:
        return "后端 Service 业务层，处理核心业务规则。"
    return "项目源码文件。"


def summarize_java_method(name: str) -> str:
    mapping = {
        "add": "新增数据或创建业务记录。",
        "deleteById": "按 id 删除或隐藏数据。",
        "updateById": "按 id 更新数据，部分核心模块会在这里处理状态流转或库存变化。",
        "selectById": "按 id 查询单条记录。",
        "selectAll": "按条件查询全部符合条件的记录。",
        "selectPage": "分页查询，Service 中通常使用 PageHelper.startPage。",
        "login": "登录校验，按账号密码查询用户。",
        "register": "普通用户注册并设置默认角色和用户类型。",
        "updatePassword": "修改密码。",
        "recommendSupplyForBuyer": "给采购商推荐合适的供应信息。",
        "recommendDemandForSupplier": "给供应商推荐合适的采购需求。",
        "buildRecommend": "组装推荐结果并计算综合分和推荐理由。",
        "calcNameScore": "计算农产品名称或品种匹配分，是推荐算法第一步。",
        "calcTimeScore": "计算供应上市时间和采购截止时间的匹配分。",
        "calcPriceScore": "计算供应价格与期望价格的匹配分。",
        "calcAreaScore": "计算产地和收货地区的匹配分。",
        "calcQuantityScore": "计算供应数量和采购数量的匹配分。",
        "shouldLockStock": "判断撮合状态变化是否需要锁定库存。",
        "shouldRestoreStock": "判断撮合状态变化是否需要释放库存。",
        "reduceQuantity": "扣减供应或采购需求的剩余数量。",
        "restoreQuantity": "返还供应或采购需求的剩余数量。",
        "syncGoodsWhenApproved": "供应审核通过后同步生成或更新商城商品。",
        "fillDefaultValue": "填充默认状态、创建时间、单位和总数量等字段。",
        "checkStatusOperator": "校验订单状态操作人是否有权限。",
        "checkShipOperator": "校验订单发货人是否是管理员或对应供应商。",
        "toStockQuantity": "把用户输入单位换算为库存扣减统一使用的数量。",
        "money": "金额保留两位小数，避免浮点精度问题。",
        "upload": "接收上传文件并保存到本地目录。",
        "download": "根据文件名读取本地文件并返回给浏览器。",
    }
    return mapping.get(name, f"{name} 方法，承担当前类中的一个局部业务步骤。")


def java_blocks(path: Path, text: str) -> list[Block]:
    lines = text.splitlines()
    blocks: list[Block] = []
    if lines:
        blocks.append(Block(1, min(len(lines), 5), "package / import 区域", "声明包名和依赖类。", "答辩时只需知道它说明当前文件属于哪个包、用到了哪些框架类。"))
    for i, line in enumerate(lines, 1):
        class_match = re.search(r"\b(class|interface)\s+(\w+)", line)
        if class_match:
            kind, name = class_match.groups()
            role = "定义 Java 类。" if kind == "class" else "定义 Java 接口。"
            blocks.append(Block(i, i, f"{name} {kind}", role, file_purpose(path)))
        if "@Resource" in line or "@Autowired" in line:
            field_line = lines[i] if i < len(lines) else ""
            blocks.append(Block(i, min(i + 1, len(lines)), "依赖注入字段", "注入 Mapper、Service 或工具对象。", f"下一行通常是具体依赖：{field_line.strip()}"))
        method_match = re.search(r"(public|private|protected)\s+[\w<>, ?\[\].]+\s+(\w+)\s*\([^;]*\)\s*(\{|throws)", line)
        if method_match and " class " not in line:
            name = method_match.group(2)
            annotations = []
            j = i - 1
            while j >= 1 and lines[j - 1].strip().startswith("@"):
                annotations.insert(0, lines[j - 1].strip())
                j -= 1
            detail = summarize_java_method(name)
            if annotations:
                detail += " 注解：" + "、".join(annotations)
            blocks.append(Block(i, i, f"方法 {name}()", detail, "如果老师问这个功能怎么实现，优先看这个方法内部的判断、赋值和 Mapper 调用。"))
    return blocks


def vue_blocks(path: Path, text: str) -> list[Block]:
    lines = text.splitlines()
    blocks: list[Block] = []
    for tag, role in [
        ("template", "页面结构区域，决定浏览器里看到的表单、表格、按钮、弹窗。"),
        ("script setup", "页面逻辑区域，保存数据、定义函数、调用后端接口。"),
        ("style scoped", "页面样式区域，只影响当前组件的颜色、布局、背景等。"),
    ]:
        start = None
        end = None
        open_pat = "<script setup" if tag == "script setup" else f"<{tag}"
        close_pat = "</script>" if tag == "script setup" else f"</{tag.split()[0]}>"
        for i, line in enumerate(lines, 1):
            if start is None and open_pat in line:
                start = i
            if start is not None and close_pat in line:
                end = i
                break
        if start:
            blocks.append(Block(start, end or start, tag, role, "前端代码通常按这三个区域理解。"))
    for i, line in enumerate(lines, 1):
        if "<el-pagination" in line:
            blocks.append(Block(i, i, "分页组件 el-pagination", "显示上一页、下一页、页码，并绑定 pageNum/pageSize。", "它只负责页面交互，真正分页数据由后端 /selectPage 返回。"))
        if "<el-table" in line:
            blocks.append(Block(i, i, "表格组件 el-table", "展示列表数据。", "表格列一般在后面的 el-table-column 中定义。"))
        if "<el-dialog" in line:
            blocks.append(Block(i, i, "弹窗组件 el-dialog", "用于新增、编辑、发起意向或查看详情。", "弹窗是否显示通常由 data.xxxVisible 控制。"))
        if "<el-upload" in line:
            blocks.append(Block(i, i, "上传组件 el-upload", "上传图片或头像。", "后端对应 FileController.upload。"))
        if "request." in line:
            blocks.append(Block(i, i, "后端接口调用", "通过 Axios 调用后端接口。", line.strip()))
        func_match = re.search(r"const\s+(\w+)\s*=\s*(async\s*)?\([^)]*\)\s*=>", line)
        if func_match:
            name = func_match.group(1)
            blocks.append(Block(i, i, f"前端函数 {name}()", summarize_front_function(name), "按钮点击、页面加载、筛选、提交表单等操作通常进入这些函数。"))
        comp_match = re.search(r"const\s+(\w+)\s*=\s*computed\(", line)
        if comp_match:
            name = comp_match.group(1)
            blocks.append(Block(i, i, f"计算属性 {name}", "根据已有数据自动计算展示值。", "数据分析、过滤列表、统计指标经常用 computed。"))
        if "reactive({" in line:
            blocks.append(Block(i, i, "reactive 数据对象", "保存当前页面状态、表单、列表、分页、筛选条件。", "答辩时可以说前端页面状态集中存在 data 中。"))
    return blocks


def summarize_front_function(name: str) -> str:
    if name == "load":
        return "加载页面数据，通常调用后端 selectPage 或 selectAll 接口。"
    if name in {"handleAdd", "handleEdit"}:
        return "打开新增或编辑弹窗，并准备表单数据。"
    if name in {"add", "update", "save"}:
        return "提交新增或修改表单，调用后端 add/update 接口。"
    if "Delete" in name or name == "del":
        return "删除或隐藏当前记录，调用后端 delete 接口。"
    if name == "reset":
        return "清空筛选条件并重新加载列表。"
    if "Search" in name or "search" in name:
        return "按关键词或条件查询数据。"
    if "Img" in name or "File" in name or "Upload" in name:
        return "处理图片或文件上传结果。"
    if "Action" in name or "Command" in name:
        return "处理按钮动作或下拉菜单命令。"
    if "Report" in name:
        return "生成、展示或导出数据分析报告。"
    return f"{name} 前端函数，处理当前页面的一个交互动作。"


def js_blocks(path: Path, text: str) -> list[Block]:
    lines = text.splitlines()
    blocks: list[Block] = []
    for i, line in enumerate(lines, 1):
        if line.strip().startswith("import "):
            blocks.append(Block(i, i, "import 依赖", "引入 Vue、路由、组件库或工具函数。", line.strip()))
        if "createRouter" in line:
            blocks.append(Block(i, i, "创建路由对象", "定义前端页面路径和组件映射。", "新增页面时通常要改 router/index.js。"))
        if "axios.create" in line:
            blocks.append(Block(i, i, "创建 Axios 实例", "统一配置后端地址和超时时间。", "所有 request.get/post/put/delete 基本都通过它。"))
        if "interceptors.request" in line:
            blocks.append(Block(i, i, "请求拦截器", "请求发出前统一设置请求头。", "比如 Content-Type。"))
        if "interceptors.response" in line:
            blocks.append(Block(i, i, "响应拦截器", "后端返回后统一处理 code、blob、401 等情况。", "可以在这里统一处理登录失效。"))
        if "createApp" in line:
            blocks.append(Block(i, i, "创建 Vue 应用", "前端启动入口。", line.strip()))
    return blocks


def xml_blocks(path: Path, text: str) -> list[Block]:
    lines = text.splitlines()
    blocks: list[Block] = []
    if path.name.endswith("Mapper.xml"):
        for i, line in enumerate(lines, 1):
            match = re.search(r"<(select|insert|update|delete)\s+id=\"([^\"]+)\"", line)
            if match:
                op, sql_id = match.groups()
                role = {
                    "select": "查询 SQL。",
                    "insert": "新增 SQL。",
                    "update": "更新 SQL。",
                    "delete": "删除 SQL。",
                }[op]
                blocks.append(Block(i, i, f"{op} id={sql_id}", role, "Java Mapper 接口中的同名方法会调用这段 SQL。"))
    else:
        for i, line in enumerate(lines, 1):
            if "<artifactId>" in line or "<dependency>" in line or "<plugin>" in line:
                blocks.append(Block(i, i, "Maven 配置项", "声明项目依赖或构建插件。", line.strip()))
    return blocks


def yml_blocks(path: Path, text: str) -> list[Block]:
    blocks: list[Block] = []
    lines = text.splitlines()
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if re.match(r"^[A-Za-z0-9_-]+:", stripped):
            key = stripped.split(":", 1)[0]
            role = {
                "server": "后端服务配置，主要是端口。",
                "spring": "Spring 配置，包含数据库和上传大小。",
                "mybatis": "MyBatis 配置，包含 Mapper XML 扫描和下划线转驼峰。",
                "fileBaseUrl": "文件访问基础地址。",
            }.get(key, "配置项。")
            blocks.append(Block(i, i, f"配置 {key}", role, stripped))
    return blocks


def sql_blocks(path: Path, text: str) -> list[Block]:
    lines = text.splitlines()
    blocks: list[Block] = []
    start = None
    current = []
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        if start is None:
            start = i
        current.append(stripped)
        if stripped.endswith(";"):
            sql = " ".join(current)
            verb = sql.split()[0].upper() if sql.split() else "SQL"
            role = {
                "ALTER": "修改表结构，例如增加字段或调整字段。",
                "UPDATE": "更新已有数据。",
                "INSERT": "插入演示数据或初始化数据。",
                "CREATE": "创建数据库对象。",
                "DELETE": "删除数据。",
                "SELECT": "查询数据。",
            }.get(verb, "SQL 脚本语句。")
            blocks.append(Block(start, i, f"{verb} 语句", role, sql[:180]))
            start = None
            current = []
    if current and start is not None:
        sql = " ".join(current)
        blocks.append(Block(start, len(lines), "SQL 语句", "未以分号结束的 SQL 片段。", sql[:180]))
    return blocks


def analyze_file(path: Path) -> list[Block]:
    text = read_text(path)
    suffix = path.suffix.lower()
    if suffix == ".java":
        return java_blocks(path, text)
    if suffix == ".vue":
        return vue_blocks(path, text)
    if suffix == ".js":
        return js_blocks(path, text)
    if suffix == ".xml":
        return xml_blocks(path, text)
    if suffix == ".yml":
        return yml_blocks(path, text)
    if suffix == ".sql":
        return sql_blocks(path, text)
    return []


def module_group(path: Path) -> str:
    parts = path.parts
    if "controller" in parts:
        return "后端 Controller 接口层"
    if "service" in parts:
        return "后端 Service 业务层"
    if "entity" in parts:
        return "后端 Entity 实体层"
    if "mapper" in parts and path.suffix == ".java":
        return "后端 Mapper 接口"
    if "mapper" in parts and path.suffix == ".xml":
        return "MyBatis Mapper XML"
    if path.suffix == ".vue":
        return "前端 Vue 页面/组件"
    if path.suffix == ".js":
        return "前端 JavaScript 配置/工具"
    if path.suffix == ".yml":
        return "配置文件"
    if path.suffix == ".sql":
        return "SQL 脚本"
    return "其他源码"


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def render_html() -> str:
    files = list_source_files()
    file_rows = []
    sections = []
    for index, path in enumerate(files, 1):
        blocks = analyze_file(path)
        file_rows.append(
            f"<tr><td>{index}</td><td>{esc(rel(path))}</td><td>{esc(module_group(path))}</td><td>{esc(file_purpose(path))}</td><td>{len(blocks)}</td></tr>"
        )
        block_rows = []
        if blocks:
            for block in blocks:
                block_rows.append(
                    "<tr>"
                    f"<td>{block.start}-{block.end}</td>"
                    f"<td>{esc(block.name)}</td>"
                    f"<td>{esc(block.role)}</td>"
                    f"<td>{esc(block.detail)}</td>"
                    "</tr>"
                )
        else:
            block_rows.append("<tr><td>全文</td><td>整体文件</td><td>配置或简单文件</td><td>当前文件结构较简单，按文件作用整体理解即可。</td></tr>")
        sections.append(
            f"""
            <section class="file-section">
              <h2>{index}. {esc(rel(path))}</h2>
              <p><strong>文件类型：</strong>{esc(module_group(path))}</p>
              <p><strong>文件作用：</strong>{esc(file_purpose(path))}</p>
              <table>
                <thead><tr><th class="line">位置</th><th>代码块</th><th>作用</th><th>答辩理解点</th></tr></thead>
                <tbody>{''.join(block_rows)}</tbody>
              </table>
            </section>
            """
        )
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>项目全代码文件作用与位置速查</title>
<style>
@page {{ size: A4; margin: 13mm 11mm; }}
body {{ font-family: "Microsoft YaHei", "SimSun", sans-serif; color: #111; font-size: 10.5pt; line-height: 1.55; }}
h1 {{ color: #176b24; font-size: 24pt; margin: 0 0 10pt; }}
h2 {{ color: #176b24; font-size: 15pt; margin: 18pt 0 6pt; page-break-after: avoid; }}
h3 {{ color: #2e8b57; font-size: 13pt; margin: 12pt 0 6pt; }}
p {{ margin: 0 0 6pt; }}
table {{ width: 100%; border-collapse: collapse; margin: 6pt 0 12pt; font-size: 8.7pt; page-break-inside: auto; }}
tr {{ page-break-inside: avoid; page-break-after: auto; }}
th, td {{ border: 1px solid #b9cbb2; padding: 4pt 5pt; vertical-align: top; word-break: break-word; }}
th {{ background: #ddefd6; font-weight: 700; }}
td:first-child {{ background: #f7fbf4; font-weight: 600; }}
.cover {{ page-break-after: always; }}
.hint {{ background: #fff7df; border-left: 4px solid #d99a00; padding: 8pt 10pt; margin: 8pt 0 12pt; }}
.file-section {{ page-break-inside: avoid; }}
.line {{ width: 54pt; }}
.toc th:nth-child(1), .toc td:nth-child(1) {{ width: 28pt; text-align: center; }}
.toc th:nth-child(5), .toc td:nth-child(5) {{ width: 42pt; text-align: center; }}
</style>
</head>
<body>
<div class="cover">
  <h1>项目全代码文件作用与位置速查</h1>
  <p>项目：基于 Spring Boot 和 Vue 的农产品产销对接平台</p>
  <p>用途：答辩前快速熟悉每个代码文件、每个主要代码块的位置和作用。</p>
  <div class="hint">
    阅读方法：先看“总览表”掌握文件归类，再重点背 Service、Vue 页面和 Mapper XML。答辩时被问到某个功能，可以按“页面 .vue → Controller → Service → Mapper XML → 数据库表”的顺序回答。
  </div>
  <h3>文件总览</h3>
  <table class="toc">
    <thead><tr><th>序号</th><th>文件</th><th>类型</th><th>整体作用</th><th>代码块数</th></tr></thead>
    <tbody>{''.join(file_rows)}</tbody>
  </table>
</div>
{''.join(sections)}
</body>
</html>"""


def write_html() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    HTML_OUT.write_text(render_html(), encoding="utf-8")


def find_edge() -> Path | None:
    candidates = [
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def export_pdf() -> bool:
    edge = find_edge()
    if edge is None:
        return False
    tmp_dir = OUT_DIR / "pdf_tmp"
    tmp_dir.mkdir(exist_ok=True)
    tmp_html = tmp_dir / "code_map.html"
    tmp_pdf = tmp_dir / "code_map.pdf"
    tmp_html.write_text(HTML_OUT.read_text(encoding="utf-8"), encoding="utf-8")
    if tmp_pdf.exists():
        tmp_pdf.unlink()
    user_data = tmp_dir / f"edge_profile_{int(time.time())}"
    url = tmp_html.resolve().as_uri()
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
        url,
    ]
    subprocess.run(cmd, cwd=str(ROOT), check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    for _ in range(30):
        if tmp_pdf.exists() and tmp_pdf.stat().st_size > 0:
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
