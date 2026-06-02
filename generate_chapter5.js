const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TabStopType, TabStopPosition
} = require("docx");

const md = fs.readFileSync(
  "C:/Users/张博源/Desktop/毕设/农产品/chapters/05_系统实现.md",
  "utf-8"
);

const lines = md.split(/\r?\n/);
const children = [];

let i = 0;
while (i < lines.length) {
  const line = lines[i];

  // 水平线/分隔符
  if (/^---+$/.test(line.trim())) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } },
        children: []
      })
    );
    i++;
    continue;
  }

  // 空行
  if (line.trim() === "") {
    i++;
    continue;
  }

  // ## → Heading 2
  if (/^##\s/.test(line)) {
    const text = line.replace(/^##\s+/, "");
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 200 },
        children: [new TextRun({ text, font: "黑体", size: 28, bold: true, color: "000000" })]
      })
    );
    i++;
    continue;
  }

  // # → Heading 1
  if (/^#\s/.test(line)) {
    const text = line.replace(/^#\s+/, "");
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 280 },
        children: [new TextRun({ text, font: "黑体", size: 32, bold: true, color: "000000" })]
      })
    );
    i++;
    continue;
  }

  // 引用块 > [...]**
  if (/^>\s/.test(line)) {
    // 收集连续的引用块
    const quoteLines = [];
    while (i < lines.length && /^>\s/.test(lines[i])) {
      let q = lines[i].replace(/^>\s*/, "");
      // 移除markdown加粗标记
      q = q.replace(/\*\*/g, "");
      quoteLines.push(q);
      i++;
    }
    const text = quoteLines.join("\n");
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 120 },
        indent: { left: 720 },
        children: [
          new TextRun({
            text,
            font: "宋体",
            size: 21,
            italics: true,
            color: "444444"
          })
        ]
      })
    );
    continue;
  }

  // 普通段落 —— 收集连续非空、非特殊行
  let paraText = line;
  i++;
  while (i < lines.length && lines[i].trim() !== "" && !/^(#|>|---)/.test(lines[i])) {
    paraText += "\n" + lines[i];
    i++;
  }

  // 去掉markdown加粗 **text**
  paraText = paraText.replace(/\*\*/g, "");

  // 检测是否为参考文献条目
  if (/^\[\d+\]/.test(paraText)) {
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: 480 },
        children: [
          new TextRun({ text: paraText, font: "宋体", size: 21, color: "333333" })
        ]
      })
    );
  } else {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: paraText,
            font: "宋体",
            size: 24  // 小四 = 12pt = 24 half-pt
          })
        ]
      })
    );
  }
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "宋体", size: 24 }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(
    "C:/Users/张博源/Desktop/毕设/农产品/chapters/05_系统实现.docx",
    buffer
  );
  console.log("OK: 05_系统实现.docx");
});
