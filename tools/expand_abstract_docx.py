from copy import deepcopy
from pathlib import Path

from docx import Document


BASE_DIR = Path(__file__).resolve().parents[1]
SOURCE = BASE_DIR / "农产品产销对接平台毕业论文.docx"
OUTPUT = BASE_DIR / "农产品产销对接平台毕业论文_摘要扩写版.docx"


CHINESE_ABSTRACT = [
    "农产品流通领域长期存在供需信息分散、交易链条较长、库存变化难以及时传递等问题，供应端与采购端之间的信息不对称会直接影响农产品销售效率和市场响应速度。随着农业数字化转型持续推进，利用Web应用技术建设面向供应商、采购商和普通消费者的线上产销对接平台，能够为供需信息集中发布、交易过程跟踪和库存数据同步提供技术支撑。本文围绕农产品产销对接场景，设计并实现了一个基于Spring Boot和Vue的农产品产销对接平台，在传统农产品商城功能基础上扩展供应发布、采购需求、智能匹配推荐、撮合记录跟踪、订单库存同步和数据分析等业务模块，使平台具备信息展示、供需撮合、交易执行和运营管理的一体化能力。",
    "系统采用前后端分离架构，后端以Spring Boot 3.3.1为核心框架，整合MyBatis完成数据持久化操作，使用MySQL存储用户、商品、供应信息、采购需求、撮合记录和订单等业务数据；前端基于Vue 3.3.4构建页面交互，结合Element Plus组件库和Axios请求库实现用户操作、表单提交、列表查询和数据展示。平台面向管理员、供应商、采购商和普通购买用户四类角色提供差异化功能。管理员负责用户管理、分类维护、信息审核、订单跟踪和数据分析；供应商可以发布农产品供应信息、查看推荐采购需求并处理发货流程；采购商可以发布采购需求、浏览供应信息并发起撮合意向；普通购买用户可以通过商城完成商品浏览、购物车管理和订单提交。",
    "在核心业务设计上，智能匹配推荐模块以产品名称匹配为前提，结合分类、时间、价格、地区和数量等维度构建规则权重算法，对供应信息与采购需求进行综合评分，减少无效推荐并提高供需对接的针对性。撮合记录管理模块围绕待确认、已确认、已支付、待发货、待收货、已完成等状态建立完整流转过程，状态变化时联动库存锁定、释放和扣减逻辑。订单管理模块将商城下单行为与来源供应库存关联，用户下单时同步扣减库存，订单取消时返还库存，从数据层面保证商城交易流与供需对接流的一致性。系统测试结果表明，各功能模块能够按照设计流程正常运行，用户角色权限、供需信息审核、智能匹配推荐、撮合状态流转、订单库存同步等核心业务逻辑符合预期。平台基本实现了农产品供应方、采购方和普通购买用户之间的信息连接与交易闭环，对提升农产品流通效率、降低供需搜寻成本和完善交易过程管理具有一定的应用价值。",
]

ENGLISH_ABSTRACT = [
    "The circulation of agricultural products has long been affected by scattered supply-demand information, lengthy transaction chains, and delayed transmission of inventory changes. Information asymmetry between suppliers and buyers directly influences sales efficiency and market response. With the continued development of agricultural digital transformation, a web-based online supply-demand matching platform can provide technical support for centralized information publishing, transaction process tracking, and synchronized inventory management. Focusing on agricultural product supply-demand matching, this thesis designs and implements a platform based on Spring Boot and Vue. On the basis of a traditional agricultural product marketplace, the system extends business modules such as supply publishing, purchase demand publishing, intelligent matching recommendation, matching record tracking, order-inventory synchronization, and data analysis, enabling integrated support for information display, supply-demand coordination, transaction execution, and platform operation management.",
    "The system adopts a front-end and back-end separated architecture. The back end uses Spring Boot 3.3.1 as the core framework, integrates MyBatis for data persistence, and stores business data such as users, products, supply information, purchase demands, matching records, and orders in MySQL. The front end is developed with Vue 3.3.4, Element Plus, and Axios to support user interaction, form submission, list query, and data presentation. The platform provides differentiated functions for four types of users: administrator, supplier, buyer, and shopper. Administrators manage users, categories, information review, order tracking, and data analysis. Suppliers publish agricultural product supply information, view recommended purchase demands, and handle delivery. Buyers publish procurement demands, browse supply information, and initiate matching intentions. Shoppers complete product browsing, cart management, and order submission through the marketplace module.",
    "In the core business design, the intelligent matching recommendation module takes product name matching as a prerequisite and builds a rule-based weighted algorithm using category, time, price, region, and quantity as scoring dimensions. This design reduces invalid recommendations and improves the relevance of supply-demand matching. The matching record management module establishes a complete workflow covering pending confirmation, confirmed, paid, pending delivery, pending receipt, and completed states. State changes are linked with inventory locking, release, and deduction logic. The order management module associates marketplace purchases with source supply inventory, deducts inventory when an order is placed, and restores inventory when an order is cancelled, thereby maintaining data consistency between marketplace transactions and supply-demand matching. System testing shows that the main functional modules operate according to the designed workflow, and the core business logic, including role permissions, information review, matching recommendation, matching status transition, and order-inventory synchronization, meets the expected requirements. The platform realizes an information connection and transaction loop among suppliers, buyers, and shoppers, and has practical value for improving circulation efficiency, reducing search costs, and strengthening transaction process management for agricultural products.",
]


def normalize(text: str) -> str:
    """统一去掉空格，便于匹配 Word 中可能带空格的标题。"""
    return "".join(text.split()).lower()


def find_heading(paragraphs, candidates):
    """根据多个候选标题定位段落下标，避免依赖固定段落编号。"""
    normalized = {normalize(item) for item in candidates}
    for index, paragraph in enumerate(paragraphs):
        if normalize(paragraph.text) in normalized:
            return index
    raise ValueError(f"未找到标题: {candidates}")


def find_marker(paragraphs, candidates):
    """定位区间结束标记；关键词行通常包含冒号和具体词语，所以使用前缀匹配。"""
    normalized = [normalize(item) for item in candidates]
    for index, paragraph in enumerate(paragraphs):
        text = normalize(paragraph.text)
        if any(text.startswith(item) for item in normalized):
            return index
    raise ValueError(f"未找到标记: {candidates}")


def clone_paragraph_format(target, source):
    """复制原摘要段落的段落级样式，使替换后的文字尽量保持原文版式。"""
    target.style = source.style
    target.alignment = source.alignment
    target.paragraph_format.first_line_indent = source.paragraph_format.first_line_indent
    target.paragraph_format.left_indent = source.paragraph_format.left_indent
    target.paragraph_format.right_indent = source.paragraph_format.right_indent
    target.paragraph_format.space_before = source.paragraph_format.space_before
    target.paragraph_format.space_after = source.paragraph_format.space_after
    target.paragraph_format.line_spacing = source.paragraph_format.line_spacing
    target.paragraph_format.line_spacing_rule = source.paragraph_format.line_spacing_rule


def replace_between(doc, start_index, end_index, new_texts):
    """替换两个标题之间的正文段落，不改变标题和后续正文结构。"""
    paragraphs = doc.paragraphs
    old_paragraphs = paragraphs[start_index + 1 : end_index]
    if not old_paragraphs:
        raise ValueError("目标区间内没有可替换段落")

    template = old_paragraphs[0]
    for offset, text in enumerate(new_texts):
        if offset < len(old_paragraphs):
            paragraph = old_paragraphs[offset]
            paragraph.text = text
        else:
            # 新增段落时复制原段落 XML，再替换文字，确保样式继承一致。
            new_element = deepcopy(template._p)
            old_paragraphs[-1]._p.addnext(new_element)
            paragraph = paragraphs[start_index + 1 + offset]
            paragraph.text = text
            clone_paragraph_format(paragraph, template)

    for paragraph in old_paragraphs[len(new_texts) :]:
        paragraph._element.getparent().remove(paragraph._element)


def main():
    doc = Document(SOURCE)

    paragraphs = doc.paragraphs
    zh_start = find_heading(paragraphs, ["摘要", "摘 要"])
    zh_end = find_marker(paragraphs, ["关键词", "关键字"])
    replace_between(doc, zh_start, zh_end, CHINESE_ABSTRACT)

    # 中文摘要替换会删除原区间内的空段落，因此英文摘要的下标需要重新读取。
    paragraphs = doc.paragraphs
    en_start = find_heading(paragraphs, ["ABSTRACT"])
    en_end = find_marker(paragraphs, ["Key words", "Keywords", "Key Words"])
    replace_between(doc, en_start, en_end, ENGLISH_ABSTRACT)

    doc.save(OUTPUT)


if __name__ == "__main__":
    main()
