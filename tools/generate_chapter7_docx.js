const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, HeadingLevel, BorderStyle,
  PageBreak
} = require("docx");

const mdPath = "C:\\Users\\张博源\\Desktop\\毕设\\农产品\\chapters\\07_系统测试.md";
const outPath = "C:\\Users\\张博源\\Desktop\\毕设\\农产品\\chapters\\07_系统测试_v2.docx";

const lines = fs.readFileSync(mdPath, "utf-8").split(/\r?\n/);

function parseInlineBold(text) {
  const runs = [];
  const parts = text.split("**");
  parts.forEach((part, i) => {
    if (part.length === 0) return;
    if (i % 2 === 1) {
      runs.push(new TextRun({ text: part, bold: true, font: "宋体", size: 24 }));
    } else {
      runs.push(new TextRun({ text: part, font: "宋体", size: 24 }));
    }
  });
  return runs;
}

const children = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Empty line = skip (spacing comes from paragraph properties)
  if (line.trim() === "") continue;

  // Heading 1: # 系统测试
  if (line.startsWith("# ")) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240, line: 360 },
      children: [new TextRun({ text: line.slice(2).trim(), bold: true, font: "黑体", size: 32 })],
    }));
    continue;
  }

  // Heading 2: ## 6.1 测试环境
  if (line.startsWith("## ")) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200, line: 360 },
      children: [new TextRun({ text: line.slice(3).trim(), bold: true, font: "黑体", size: 28 })],
    }));
    continue;
  }

  // Blockquote (image placeholder)
  if (line.startsWith("> ")) {
    const quoteText = line.slice(2);
    const isBoldLine = quoteText.startsWith("**[");
    // Skip the **[此处插入...]** bold wrapper
    let displayText = quoteText;
    let runs = [];
    if (isBoldLine) {
      runs = parseInlineBold(quoteText);
    } else {
      runs = [new TextRun({ text: quoteText, font: "楷体", size: 21, italics: true, color: "555555" })];
    }
    children.push(new Paragraph({
      spacing: { before: 80, after: 80, line: 300 },
      indent: { left: 720 },
      border: { left: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 8 } },
      children: runs,
    }));
    continue;
  }

  // Separator line: ---
  if (line.trim() === "---") {
    children.push(new Paragraph({
      spacing: { before: 120, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 4 } },
      children: [],
    }));
    continue;
  }

  // Regular paragraph
  const runs = parseInlineBold(line);
  children.push(new Paragraph({
    spacing: { before: 60, after: 60, line: 360 },
    indent: { firstLine: 480 },
    children: runs,
  }));
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "宋体", size: 24 },
        paragraph: { spacing: { line: 360 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "黑体" },
        paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "黑体" },
        paragraph: { spacing: { before: 200, after: 200 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log("OK: " + outPath + " (" + buf.length + " bytes)");
});
