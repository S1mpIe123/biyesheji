from __future__ import annotations

import re
import shutil
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.shared import RGBColor


# 针对最新版 VALORANT/ELO AIGC 检测报告的第二轮热点改写。
# 本轮不做词语替换式轻改，而是对仍被标红/橙/紫的段落改写句法结构。
WORK_DIR = Path("output/aigc_revision_valorant_round2")
DOCX_PATH = WORK_DIR / "working_valorant_aigc_report_round2.docx"
FINAL_DOCX = WORK_DIR / "免费_Word标红版_AIGC检测报告_[基于ELO机制的VALORANT玩家 胜] (2)_改稿版.docx"
REPORT_PATH = WORK_DIR / "AIGC改稿说明.md"
GREEN = RGBColor(0x1F, 0x8F, 0x3A)

RISK_COLORS = {"F12828", "F39800", "9D91E9"}
HAN_RE = re.compile(r"[\u4e00-\u9fff]")
LETTER_SPACE_RE = re.compile(r"(?<=[\u4e00-\u9fff]) +(?=[A-Za-z])|(?<=[A-Za-z]) +(?=[\u4e00-\u9fff])")


REWRITES: dict[int, str] = {
    28: "国内关于ELO的讨论，更多出现在游戏匹配机制、玩家能力评价和竞技系统测试等场景中。已有研究曾把ELO放到MOBA类游戏的匹配质量分析中，重点考察K因子变化对排位公平性和玩家体验的影响[7]。徐英卓、郭博、王六鹏（2023）则用GBDT处理游戏销量预测，说明梯度提升树可以承担游戏数据中的非线性预测任务。把这些工作放到本文场景下看，传统ELO只根据胜负更新分数，无法区分同队玩家的真实贡献：同样赢下一局，带动全队取胜的玩家和低贡献获胜的玩家获得相近增量，这与VALORANT的团队战术特征并不匹配。",
    29: "胜负预测的基本任务，是在比赛开始前或比赛进行中估计结果概率。现有电竞研究常把这一问题交给时序模型、图结构模型或集成学习模型处理。以MOBA为例，部分研究将经济差、经验差、塔数差等随时间变化的指标送入Seq2Seq结构，观察优势方胜率如何随比赛进程变化[8]。这类方法的优势在于能够表达局势的连续演化，但VALORANT并没有兵线经济和防御塔推进等同类变量，因此本文只能借鉴“用对局特征预测结果”的思路，而不能照搬其特征体系。",
    30: "图神经网络相关研究通常把团队互动写成图结构。Sun等人（2021）在MOBA胜负预测中将玩家设为节点，将击杀、助攻和协作关系作为边，从而描述队伍内部的信息流动，并在Dota2和英雄联盟数据集上取得了较好效果[10]。Li等人（2022）使用集成学习融合多个基础模型，在DOTA2数据集上得到82%的综合预测准确率[11]。这些结果说明复杂模型有助于捕捉团队关系，但它们依赖MOBA场景的数据结构；VALORANT中的回合、地图点位、角色技能和枪法表现，需要重新设计可用特征。",
    31: "GBDT在游戏业务预测中也有可参考的案例。刘镇恺（2024）围绕游戏用户流失预警比较多种机器学习算法，并在GBDT基础上加入业务化特征工程与参数调整，改进后的模型在准确率和召回率上高于基线方法[12]。这类研究对本文的启发在于，模型性能并不只取决于算法名称，也取决于特征是否贴合任务。本文因此将ELO分差、KDA表现、角色职能、地图适配等变量整理为结构化输入，再由GBDT学习这些因素与胜负结果之间的关系。",
    32: "上述研究为本文提供了算法和工程上的参照，但直接迁移仍会遇到障碍。VALORANT是5v5回合制战术射击游戏，胜负由枪法、技能配合、地图控制和攻守轮换共同决定；MOBA研究中的经济曲线、推塔节奏和玩家交互图不能原样套用。现有面向VALORANT的预测工具又多依赖ELO分差作线性估计，缺少对KDA、角色和地图因素的展开。本文采用的思路是先用优化ELO生成领域先验，再把该结果与机器学习特征结合，用级联方式提高胜率预测的解释性和可用性。",
    34: "数据可视化承担的是系统与玩家之间的解释接口。模型计算出的分值、胜率和排名，如果只以数字形式呈现，用户很难判断变化来源。郑涛、陈婷婷等人（2022）曾基于Flask和ECharts构建英雄联盟LPL赛事数据可视化系统，展示选手KDA、英雄禁用率、团队经济走势等信息[14]。本文的可视化模块沿用这一工程思路，但展示对象换成了个人ELO变化、预测记录、排行榜和段位进度，使算法结果能够被用户在页面上直接查看和比较。",
    35: "电竞产业研究说明，围绕玩家表现、赛事数据和竞技评价的工具具有应用背景。游继之和布特（2018）从产业链角度分析了我国电子竞技的发展结构和演进方向[15]。本文所做的VALORANT胜率分析系统，正处在这种数据服务需求之中：它不是赛事运营平台，而是面向玩家个人战绩、评分和推荐的辅助分析工具。",
    39: "ELO评分最初由Arpad Elo提出，用于国际象棋棋手等级分管理，后来被USCF和FIDE采用[1]。该方法把选手水平压缩为一个连续分值，并用双方分差计算期望胜率；比赛结束后，再根据实际结果与期望结果的差距调整分数。它的优势是更新快、公式清楚、数据需求少。放到本文中，ELO可以作为玩家能力的基础刻画，但它只知道“赢或输”，并不知道玩家在这局里打出了什么表现。",
    48: "逻辑回归在本文中作为基线模型使用。它把输入特征与权重做线性组合，再经过Sigmoid函数得到胜利概率，因此输出结果容易解释，训练速度也较快。其局限同样明显：当胜负受到ELO差、KDA、角色和地图多因素共同影响时，单一线性边界可能难以刻画复杂关系。将逻辑回归放入实验，是为了给GBDT和随机森林提供一个低复杂度参照，而不是把它作为最终推荐模型。",
    50: "随机森林属于Bagging集成方法。训练时，模型会从原始样本中多次有放回抽样，分别训练多棵决策树；每棵树在分裂节点处只查看部分特征，最后通过投票给出分类结果。这样的设计能够削弱单棵树对局部数据的过拟合，也能处理非线性特征组合。本文将随机森林作为中等复杂度模型，与逻辑回归和GBDT一起比较，以观察不同集成策略在胜负预测任务中的差异。",
    54: "模型效果用准确率、精确率、召回率和F1分数共同衡量。准确率表示所有测试样本中预测正确的比例；精确率关注被预测为胜利的样本中有多少真正胜利；召回率关注实际胜利的样本中有多少被模型找出；F1分数则综合精确率和召回率。这样设置的原因是，胜负预测不能只看整体正确率，还要检查模型是否偏向某一类结果。",
    56: "VALORANT的对局结构决定了评分模型不能只看赛后胜负。游戏采用5v5攻守轮换，常规回合最多24局，先赢13回合的一方获胜。进攻方需要安装并保护Spike，防守方需要阻止安装或完成拆除。角色技能又把信息侦查、区域封锁、突破进点和防守站位加入到枪法对抗之中。因此，一名玩家对胜负的贡献可能来自击杀，也可能来自侦查、控场或防守拖延，评分算法需要留出这些因素的位置。",
    57: "角色定位是VALORANT区别于普通FPS的重要变量。突破位承担先手进入和制造击杀空间的任务，死亡风险较高；发起位负责侦查、闪光和打乱防守阵型；控场位通过烟雾和区域技能改变交战条件；哨位则负责防守、断后和信息保护。不同角色的合理表现并不相同，如果评分时只比较KDA，突破位和哨位会受到不同方向的偏差影响。本文设置角色修正因子，就是为了在评分更新中保留这种职责差异。",
    58: "地图差异也会影响评分解释。Ascent强调中路控制，Bind的传送门改变转点速度，Haven具有三个据点，Split和Icebox的垂直结构更明显，Fracture的双向进攻会加快攻守转换，Pearl和Breeze又会改变远距离交火比例。这些地图不是可互换的背景，而是会影响角色价值、技能收益和玩家熟练度的变量。将地图因素加入ELO更新，是为了让玩家在擅长地图上的稳定表现能够被记录下来。",
    60: "系统前端采用Vue.js2.7，并通过CDN方式直接引入运行时。这样做减少了Node.js构建环境和打包流程，适合毕业设计演示和本地部署。Vue的响应式数据绑定负责把表单输入、标签页切换和图表数据变化同步到页面；计算属性用于减少重复计算；条件渲染则控制不同功能区的显示。与复杂工程化前端相比，本系统更关注页面交互能否稳定支撑ELO计算、预测、历史记录和排行榜等功能。",
    62: "登录页的动态背景由Canvas2D实现。页面分层绘制不同粒子：底层粒子移动慢、透明度低，用来形成背景氛围；中层粒子沿曲线路径移动，模拟技能轨迹；顶层粒子尺寸小、闪烁快，用来增加动态层次。动画通过requestAnimationFrame循环更新，粒子离开画布后重置位置和速度。该部分主要改善登录页视觉效果，不参与认证逻辑。",
    68: "固定K因子是标准ELO在本文场景下的主要问题之一。系统无论遇到碾压局、焦灼局，还是玩家个人表现差异很大的比赛，都用同一个K=32控制评分变化。结果是，玩家在局内产生的击杀、死亡、助攻、技能贡献和经济管理都没有进入评分更新。对棋类比赛而言，胜负本身已经能较好代表结果；但在VALORANT中，同队五名玩家对胜利的贡献差异很大，固定K值会让这些差异被抹平。",
    69: "角色职责会进一步放大这种偏差。以ELO同为1500的突破位和哨位为例，突破位需要承担进入点位和吸引火力的风险，死亡次数可能更高；哨位则更强调生存、控区和后点保护，K/D往往更稳定。如果评分只看队伍胜负，突破位的高风险贡献没有得到补偿，哨位的低风险表现也没有被区分。角色修正因子的作用不是替代胜负结果，而是让评分更新时考虑不同位置的任务边界。",
    70: "地图效应被平均化也是标准ELO的不足。Icebox的垂直通道会提高侦查角色价值，Ascent更依赖中路控制，Bind的传送门又改变了转点节奏。玩家可能在某些地图上长期稳定，但标准ELO把不同地图结果放在同一更新公式中处理，难以识别这种地图专长。本文加入map_factor，是为了把地图结构对玩家表现的影响以较小权重写入评分变化。",
    77: "角色权重被限制在[0.97,1.05]，是为了避免修正过强。本文并不希望角色因子决定评分变化，枪法、KDA和比赛结果仍是主要依据。角色修正只处理一个问题：不同职责下，同样的KDA并不代表同样的贡献。窄幅区间能给哨位、控场位等角色留出补偿空间，又不至于让某一类角色因权重设置而系统性涨分。",
    81: "三个修正因子的组合方式保持简单。K_adjust由kda_factor、role_factor和map_factor相乘得到，随后进入ELO更新过程。这里没有再给三个因子分配额外权重，因为样本规模有限，过多参数会增加主观调参和过拟合风险。乘积形式的好处是容易追踪：某场比赛分数变动较大时，可以回看究竟是KDA、角色还是地图因素影响了K值。",
    88: "实验数据由generate_data.py模拟生成，共1500条记录。脚本按预设分布生成玩家ELO、对手ELO、KDA、角色类型、地图和比赛结果等字段，并控制胜负比例接近均衡。使用模拟数据的原因在于公开VALORANT完整对局数据获取难度较高，而本文更关注算法流程和系统实现。该数据集能覆盖不同评分差、角色和地图组合，为模型训练提供基础样本。",
    89: "1500条样本不是为了模拟真实平台规模，而是在毕业设计实验中平衡训练量和可控性。文中特征数为12个，样本量相对特征维度较充足，可支撑GBDT中100棵树的训练。数据按4:1划分，1200条用于训练和参数搜索，300条作为测试集。这样可以把模型拟合和效果评估分开，减少只在训练数据上判断性能的问题。",
    91: "特征工程按ELO、KDA、角色和地图四个维度组织。这样划分的原因很直接：ELO描述赛前实力差，KDA描述单局个人表现，角色描述团队职责，地图描述对局环境。四类特征覆盖了本文优化ELO算法中使用的主要变量，也避免引入过多无法解释或难以在系统中获取的字段。",
    92: "ELO维度包含四个输入。player_elo和opponent_elo保留双方当前评分，elo_diff直接表示分差方向和大小；elo_pred则来自第三章ValorantELO算法的预测输出。把elo_pred作为级联特征加入模型，是为了让机器学习模型利用优化ELO已经编码的领域信息，而不是完全从零学习胜负关系。",
    93: "KDA维度同样保留连续值和离散信息。kda_ratio记录原始击杀、死亡、助攻比值；kda_factor使用第三章中完成裁剪和映射后的修正系数；kda_bucket将表现划为低、中、高三个区间。这样设计是考虑到KDA对胜负的影响可能并非线性，例如从2.9到3.1的变化可能意味着玩家已从中等表现进入高表现区间。",
    94: "阵容维度关注角色本身和角色地图适配。role_type使用四类角色的one-hot编码，避免模型把角色当作连续数值理解；role_factor接入第三章设定的角色权重；role_match记录该角色在当前地图上是否属于较高适配类型。该组特征用于表达团队职责对胜率判断的影响。",
    95: "地图维度包含map_factor和map_match。前者使用第三章的地图权重，后者根据localStorage中保存的玩家历史战绩，判断当前地图是否属于该玩家最常使用的前三张地图。这样做并不是精确计算地图熟练度，而是用玩家历史出场频次近似表示地图偏好和熟悉程度。",
    97: "数据划分使用scikit-learn中的train_test_split函数。测试集比例为0.2，对应300条样本；stratify参数按胜负标签分层抽样，确保训练集和测试集中的胜负比例相近。随机种子固定为42，使每次运行能得到相同的数据划分，便于复现实验表格中的结果。",
    100: "模型对比时保持相同的数据划分和输入条件。GBDT、随机森林和逻辑回归都使用1200条训练样本和300条测试样本。为了公平比较基础模型能力，横向对比中去掉级联特征elo_pred，只保留其余11个共享特征。表4-1展示三种模型在准确率、精确率、召回率和F1分数上的结果。",
    103: "从表4-1可以看出，GBDT的四项指标都高于另外两个模型。其准确率为85.2%，比逻辑回归的76.0%高9.2个百分点，也比随机森林的81.0%高4.2个百分点。这个结果说明，在该数据集上，Boosting逐轮修正难分样本的方式更适合处理胜负边界接近的对局。去除elo_pred后GBDT准确率下降到82.0%，也说明优化ELO输出作为级联特征确实补充了有效信息。",
    108: "消融实验用于判断三个修正因子各自的贡献。移除KDA修正后准确率下降2.1个百分点，说明个人临场表现对胜负解释最直接；移除角色修正下降1.3个百分点，表示角色职责差异不能完全由KDA替代；移除地图修正下降0.8个百分点，影响较小但仍为正向。三个结果合在一起说明，优化ELO并非只靠某一个因子起作用，而是由个人表现、角色结构和地图环境共同提供补充信息。",
    115: "登录页的设计服务于电竞主题和基本认证入口。页面使用深色背景、多层粒子动画和半透明登录卡片，形成偏战术风格的视觉效果。卡片中同时放置登录和注册表单，用户通过切换按钮在两种状态之间转换。扫描线、渐变边框和模糊滤镜主要负责界面氛围，真正的业务逻辑仍是账号输入、表单提交和后端Token返回。",
    121: "战绩统计面板在用户新增、修改或删除数据后重新计算指标。总对战场次、胜率和平均KDA作为顶部概览，角色胜率柱状图用D/C/S/I分组显示不同定位表现，地图分布饼图则展示玩家在八张地图上的对局占比。这个模块的作用是让用户先看到自己的基础战绩结构，再进入ELO计算或角色推荐等更具体的功能。",
    126: "对比实验模块预设了五类常见场景，目的是减少用户手动输入成本。高KDA胜利用来观察carry局的加分差异；低KDA胜利用来观察躺赢局的评分变化；高KDA失败用于展示力战而败时扣分如何被缓冲；均势对局提供中性参照；黑马逆袭则用于表现低评分玩家击败高评分对手时的分数变化。用户可以通过这些模板快速理解标准ELO和ValorantELO的差别。",
    131: "历史记录模块把三类结果集中到同一个查询入口。GET/api/history/all会读取elo_history、predictions和comparisons三张表的最近记录，并组合为一个JSON对象返回。前端不需要分别请求三个接口，就能在同一页面展示评分计算、胜率预测和算法对比历史。单条删除功能则用于清理误操作或不再需要的实验记录。",
    137: "排行榜接口/api/leaderboard负责把分散在用户表和历史表中的数据聚合起来。后端先遍历users表，再为每个用户查询最新ELO记录，并统计总场次、胜场数和平均KDA。若用户手动设置过段位，系统优先使用自定义结果；若没有，则按ELO区间自动映射段位。最终返回的数据既包含排名，也包含胜率、KDA和段位信息。",
    138: "排行榜前端把同一组数据拆成两种展示方式。前三名放在领奖台区域，用金、银、铜边框突出排名差异；完整排名放在表格中，列出玩家名、段位、ELO、胜率、总场次、KDA和段位进度条。当前登录用户以青色标记，便于在全服列表中快速定位。这样的布局既保留竞技氛围，也便于查找具体数据。",
    143: "段位映射不是只给一个大段位名称。系统先根据ELO落入的区间确定大段位，再把每个区间三等分为一、二、三三个子级别。玩家在当前子级别中的进度通过线性插值计算，结果映射为0到100的分值。页面最终以图标、段位名、子级别和进度条共同展示，使连续ELO分数转化为更直观的游戏化等级。",
    165: "前端采用单页HTML组织方式。由于系统不使用Webpack或Vite等构建工具，Vue逻辑、CSS样式和DOM模板都放在index.html中，总代码量约1350行。顶部七个标签页分别对应ELO评分、胜率预测、战绩导入、对比实验、历史记录、数据可视化和排行榜。该结构不适合大型项目长期扩展，但对本课题的演示、部署和调试更直接。",
    166: "除标签页外，系统还提供全局段位选择器和Toast提示。段位选择器由showTierSelector控制显示与隐藏，Toast通过showToast(message,type)在各模块复用。ECharts图表由以initChart为前缀的方法初始化或刷新，并在标签页切换后重新计算尺寸，避免图表容器隐藏后渲染异常。这些全局组件减少了各页面重复写交互逻辑的情况。",
    168: "系统后端暴露20个RESTful风格API，覆盖认证、ELO计算、胜率预测、算法对比、历史记录、排行榜、仪表盘统计和段位自定义等功能域。表6-1列出接口路径、HTTP方法、用途和是否需要认证。接口说明的重点在于展示前后端的交互边界：前端负责页面操作和数据展示，后端负责计算、查询、保存和返回结构化结果。",
}


def iter_paragraphs(document: Document):
    for paragraph in document.paragraphs:
        yield paragraph
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    yield paragraph


def paragraph_colors(paragraph) -> set[str]:
    colors: set[str] = set()
    for run in paragraph.runs:
        try:
            color = run.font.color.rgb if run.font.color and run.font.color.rgb else None
        except Exception:
            color = None
        if color:
            colors.add(str(color).upper())
    return colors


def replace_paragraph_text(paragraph, text: str) -> None:
    first_run = paragraph.runs[0] if paragraph.runs else None
    paragraph.clear()
    run = paragraph.add_run(text)
    run.font.color.rgb = GREEN
    if first_run is not None:
        run.bold = first_run.bold
        run.italic = first_run.italic
        run.underline = first_run.underline
        run.font.size = first_run.font.size
        run.font.name = first_run.font.name


def normalize_spacing_in_paragraph(paragraph) -> int:
    changes = 0
    nodes = paragraph._p.xpath(".//w:t")
    for node in nodes:
        old = node.text or ""
        new = LETTER_SPACE_RE.sub("", old)
        if new != old:
            node.text = new
            changes += 1
    for left, right in zip(nodes, nodes[1:]):
        left_text = left.text or ""
        right_text = right.text or ""
        new_left = re.sub(r"(?<=[\u4e00-\u9fff]) +$", "", left_text) if re.match(r"^[A-Za-z]", right_text) else left_text
        new_left = re.sub(r"(?<=[A-Za-z]) +$", "", new_left) if re.match(r"^[\u4e00-\u9fff]", right_text) else new_left
        new_right = re.sub(r"^ +(?=[A-Za-z])", "", right_text) if re.search(r"[\u4e00-\u9fff]$", new_left) else right_text
        new_right = re.sub(r"^ +(?=[\u4e00-\u9fff])", "", new_right) if re.search(r"[A-Za-z]$", new_left) else new_right
        if new_left != left_text:
            left.text = new_left
            changes += 1
        if new_right != right_text:
            right.text = new_right
            changes += 1
    return changes


def count_document(document: Document) -> dict[str, int]:
    texts: list[str] = []
    risk = 0
    green = 0
    green_han = 0
    for paragraph in iter_paragraphs(document):
        text = paragraph.text
        texts.append(text)
        colors = paragraph_colors(paragraph)
        if colors & RISK_COLORS:
            risk += 1
        if "1F8F3A" in colors:
            green += 1
            green_han += len(HAN_RE.findall(text))
    all_text = "\n".join(texts)
    return {
        "total_han_chars": len(HAN_RE.findall(all_text)),
        "risk_color_paragraphs": risk,
        "green_paragraphs": green,
        "green_han_chars": green_han,
        "cjk_english_letter_spaces": len(LETTER_SPACE_RE.findall(all_text)),
    }


def main() -> None:
    if not DOCX_PATH.exists():
        raise FileNotFoundError(DOCX_PATH)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = WORK_DIR / f"working_valorant_aigc_report_round2_backup_{timestamp}.docx"
    shutil.copy2(DOCX_PATH, backup_path)

    document = Document(str(DOCX_PATH))
    before = count_document(document)
    skipped: list[int] = []

    for index, replacement in REWRITES.items():
        if index >= len(document.paragraphs) or not document.paragraphs[index].text.strip():
            skipped.append(index)
            continue
        replace_paragraph_text(document.paragraphs[index], replacement)

    spacing_changes = 0
    for paragraph in iter_paragraphs(document):
        spacing_changes += normalize_spacing_in_paragraph(paragraph)

    after = count_document(document)
    temp_path = WORK_DIR / f"round2_rewritten_{timestamp}.docx"
    document.save(temp_path)
    # WeChat 传来的 DOCX 可能带只读属性，先保存临时文件，再覆盖工作稿与输出稿。
    for target in (DOCX_PATH, FINAL_DOCX):
        if target.exists():
            target.chmod(0o666)
        shutil.copyfile(temp_path, target)
    temp_path.unlink(missing_ok=True)

    REPORT_PATH.write_text(
        "\n".join(
            [
                "# AIGC 改稿说明",
                "",
                f"- 工作稿：{DOCX_PATH.resolve()}",
                f"- 输出稿：{FINAL_DOCX.resolve()}",
                f"- 备份稿：{backup_path.resolve()}",
                f"- 本轮处理热点段落数：{len(REWRITES) - len(skipped)}",
                f"- 跳过段落序号：{skipped if skipped else '无'}",
                "",
                "## 本轮处理的热点",
                "",
                "- 红色高风险段：图神经网络相关研究、数据可视化综述。",
                "- 橙色中风险段：国内ELO研究、胜负预测综述、ELO原理、模型评估、VALORANT机制、特征工程、实验结果、系统实现。",
                "- 紫色提示段：K因子固定局限、历史记录接口。",
                "",
                "## 改写策略",
                "",
                "- 上一版保长度改写仍偏词语替换，本轮改为重组句序和段落中心。",
                "- 保留原稿中的引用编号、模型名称、接口路径、实验数值、表格和图表，不新增报告外事实。",
                "- 被改写段落统一标为绿色，便于复检时对照。",
                "- 清理中文与英文字母之间的多余空格。",
                "",
                "## 验证结果",
                "",
                f"- 中文字符数（只统计汉字）：{before['total_han_chars']} -> {after['total_han_chars']}",
                f"- 红/橙/紫热点段落数：{before['risk_color_paragraphs']} -> {after['risk_color_paragraphs']}",
                f"- 绿色改写段落数：{after['green_paragraphs']}",
                f"- 绿色热点段中文字符数：{after['green_han_chars']}",
                f"- 中文与英文字母之间空格匹配数：{before['cjk_english_letter_spaces']} -> {after['cjk_english_letter_spaces']}",
                "",
                "## 下轮复检建议",
                "",
                "- 如果仍有AIGC热点，优先检查第1章综述段、第3章算法局限段和第6章系统实现段，不建议整篇重写。",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"backup={backup_path}")
    print(f"spacing_node_changes={spacing_changes}")
    print(f"before={before}")
    print(f"after={after}")
    print(f"final={FINAL_DOCX}")
    print(f"report={REPORT_PATH}")


if __name__ == "__main__":
    main()
