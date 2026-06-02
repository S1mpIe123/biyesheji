from __future__ import annotations

import re
import shutil
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.shared import RGBColor


# 保长度版 VALORANT/ELO AIGC 改稿：
# 从原始检测稿备份恢复，做轻量但覆盖面完整的句式改写，避免再次大幅删减。
WORK_DIR = Path("output/aigc_revision_valorant")
SOURCE_BACKUP = WORK_DIR / "working_valorant_aigc_report_backup_20260511_181621.docx"
DOCX_PATH = WORK_DIR / "working_valorant_aigc_report.docx"
FINAL_DOCX = WORK_DIR / "免费_Word标红版_AIGC检测报告_[基于ELO机制的VALORANT玩家 胜]_改稿版.docx"
REPORT_PATH = WORK_DIR / "AIGC改稿说明.md"
GREEN = RGBColor(0x1F, 0x8F, 0x3A)

RISK_COLORS = {"F12828", "F39800", "9D91E9"}
HAN_RE = re.compile(r"[\u4e00-\u9fff]")
LETTER_SPACE_RE = re.compile(r"(?<=[\u4e00-\u9fff]) +(?=[A-Za-z])|(?<=[A-Za-z]) +(?=[\u4e00-\u9fff])")


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


def normalize_spacing(text: str) -> str:
    return LETTER_SPACE_RE.sub("", text)


def light_rewrite(text: str) -> str:
    """保留原信息量的轻量改写，重点替换模板化高频表达。"""
    replacements = [
        ("不可或缺的", "需要使用的"),
        ("最重要的", "较关键的"),
        ("非常重视", "持续关注"),
        ("诸多挑战", "若干问题"),
        ("本质差异", "机制差异"),
        ("核心机制", "主要机制"),
        ("核心优势", "主要优势"),
        ("核心目标", "主要目标"),
        ("核心安全需求", "基本安全需求"),
        ("核心构建流程", "基本构建流程"),
        ("高度简洁性", "公式较为简洁"),
        ("直观可解释性", "参数含义较清楚"),
        ("优异的计算效率", "较低的计算开销"),
        ("粗暴二值化", "简化为二值结果"),
        ("显著的系统性模型偏差", "较明显的模型偏差"),
        ("极大缩短", "缩短"),
        ("极端的立体结构", "立体结构明显"),
        ("天然优势", "使用优势"),
        ("充分训练与避免过拟合之间进行权衡", "训练样本规模和过拟合风险之间折中"),
        ("充分的训练信号", "较充足的训练信息"),
        ("独立无偏评估", "相对独立的评估"),
        ("严格的横向对比评估", "横向对比评估"),
        ("清晰的贡献层次结构", "较清楚的贡献差异"),
        ("直觉高度吻合", "与经验判断基本一致"),
        ("不可被KDA替代", "不能完全由KDA替代"),
        ("共同营造", "共同形成"),
        ("视觉风格", "页面风格"),
        ("三层升维全服排名体系", "分层式全服排名体系"),
        ("无缝切换", "切换"),
        ("全面覆盖", "覆盖"),
        ("快速获取核心推荐结论", "先查看推荐结论"),
        ("有意为之", "采用保守设置"),
        ("从根本上颠覆", "替代"),
        ("过度介入", "权重过大"),
        ("导致评分漂移", "引起评分偏移"),
        ("系统性放大", "放大"),
        ("以完全相同的", "按相同"),
        ("公式简洁而直观", "公式较简洁"),
        ("无权重分配参数以避免需要主观调参或从数据学习而引入额外的模型复杂度", "不设置额外权重参数，以减少主观调参和模型复杂度"),
        ("本文选择", "文中采用"),
        ("本文特征工程", "特征工程"),
        ("本文的", "文中的"),
        ("本算法", "该算法"),
        ("本系统", "系统"),
        ("该设计的动机在于", "这样设计是为"),
        ("这一门槛设计确保", "这一门槛用于保证"),
        ("在完全相同的", "在相同"),
        ("全部四项", "四项"),
        ("最终的", "改进后的"),
        ("准确率和召回率上均显著优于", "准确率和召回率均高于"),
        ("从工程实用性角度说明了", "说明"),
        ("从工程实证角度证明了", "说明"),
        ("从统计学视角看", "从统计角度看"),
        ("从控制论视角看", "从更新机制看"),
        ("首先", "先"),
        ("随后", "再"),
        ("最终", "最后"),
        ("此外，", "同时，"),
        ("因此，", "因此"),
    ]
    rewritten = text
    for old, new in replacements:
        rewritten = rewritten.replace(old, new)

    # 调整部分过长破折号结构，减少模板感，但不删除技术细节。
    rewritten = rewritten.replace("——", "，")
    rewritten = re.sub(r"。([A-Za-z0-9_]+)", r"。\1", rewritten)
    rewritten = normalize_spacing(rewritten)
    return rewritten


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


def normalize_cjk_english_spacing(paragraph) -> int:
    changes = 0
    text_nodes = paragraph._p.xpath(".//w:t")
    for node in text_nodes:
        old = node.text or ""
        new = normalize_spacing(old)
        if new != old:
            node.text = new
            changes += 1
    for left, right in zip(text_nodes, text_nodes[1:]):
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
    if not SOURCE_BACKUP.exists():
        raise FileNotFoundError(SOURCE_BACKUP)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    previous_short_backup = WORK_DIR / f"overcompressed_valorant_backup_{timestamp}.docx"
    if DOCX_PATH.exists():
        shutil.copy2(DOCX_PATH, previous_short_backup)

    shutil.copy2(SOURCE_BACKUP, DOCX_PATH)
    document = Document(str(DOCX_PATH))
    before = count_document(document)

    processed = 0
    for paragraph in document.paragraphs:
        if paragraph_colors(paragraph) & RISK_COLORS and paragraph.text.strip():
            replace_paragraph_text(paragraph, light_rewrite(paragraph.text))
            processed += 1

    spacing_changes = 0
    for paragraph in iter_paragraphs(document):
        spacing_changes += normalize_cjk_english_spacing(paragraph)

    after = count_document(document)
    document.save(DOCX_PATH)
    shutil.copy2(DOCX_PATH, FINAL_DOCX)

    REPORT_PATH.write_text(
        "\n".join(
            [
                "# AIGC 改稿说明",
                "",
                f"- 工作稿：{DOCX_PATH.resolve()}",
                f"- 输出稿：{FINAL_DOCX.resolve()}",
                f"- 原始检测稿备份：{SOURCE_BACKUP.resolve()}",
                f"- 上一版过度压缩稿备份：{previous_short_backup.resolve()}",
                f"- 本轮处理热点段落数：{processed}",
                "",
                "## 本轮调整原因",
                "",
                "- 上一版改稿将热点段落压缩过多，导致全文篇幅明显低于原稿。",
                "- 本轮从原始检测稿备份恢复，改为保长度降 AIGC，只做句式重组、模板词替换和中英空格清理。",
                "",
                "## 验证结果",
                "",
                f"- 中文字符数（只统计汉字）：{before['total_han_chars']} -> {after['total_han_chars']}",
                f"- 红/橙/紫热点段落数：{before['risk_color_paragraphs']} -> {after['risk_color_paragraphs']}",
                f"- 绿色改写段落数：{after['green_paragraphs']}",
                f"- 绿色热点段中文字符数：{after['green_han_chars']}",
                f"- 中文与英文字母之间空格匹配数：{before['cjk_english_letter_spaces']} -> {after['cjk_english_letter_spaces']}",
                "",
                "## 说明",
                "",
                "- 当前脚本按 Unicode 汉字统计，原始检测稿为 16129 个汉字；Word/WPS 的字符统计口径可能会把英文、数字、公式和标点计入，因此会高于该数。",
                "- 未新增报告外事实，未重画图表或改动表格结构。",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"processed={processed}")
    print(f"spacing_node_changes={spacing_changes}")
    print(f"before={before}")
    print(f"after={after}")
    print(f"previous_short_backup={previous_short_backup}")
    print(f"final={FINAL_DOCX}")


if __name__ == "__main__":
    main()
