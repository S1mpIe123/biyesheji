const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageBreak, PageNumber
} = require("docx");

// ========== 读取章节文件 ==========
const chaptersDir = "./chapters";
const chapterFiles = [
  "01_前言.md", "02_系统开发环境.md", "03_系统需求分析.md",
  "04_系统设计.md", "05_系统实现.md", "06_总结与展望.md"
];

function readMarkdown(filename) {
  const path = `${chaptersDir}/${filename}`;
  if (!fs.existsSync(path)) { console.log(`WARN: ${path} not found`); return []; }
  const text = fs.readFileSync(path, "utf-8");
  return parseMarkdownToDocx(text);
}

// ========== Markdown → docx 段落解析 ==========
function parseMarkdownToDocx(md) {
  const lines = md.split("\n");
  const paragraphs = [];
  let i = 0;
  let inRefSection = false;
  let inImagePlaceholder = false;

  while (i < lines.length) {
    let line = lines[i];

    // 检测参考文献区域
    if (/^## 本章参考文献/.test(line)) {
      inRefSection = true;
      i++;
      continue;
    }

    // 引用条目
    if (inRefSection && /^\[\d+\]/.test(line.trim())) {
      const refText = line.trim();
      paragraphs.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: 480, hanging: 480 },
        children: [new TextRun({ text: refText, font: "SimSun", size: 21 })]
      }));
      i++;
      continue;
    }

    // 空行
    if (line.trim() === "") {
      i++;
      continue;
    }

    // 图片占位块
    if (line.startsWith("> **[此处插入图") || line.startsWith("> 图")) {
      const imgMatch = line.match(/图(\d+-\d+)\s*(.*)/);
      if (imgMatch) {
        const caption = `图${imgMatch[1]} ${imgMatch[2]}`.trim();
        paragraphs.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: `[此处插入${caption}]`, font: "SimSun", size: 21, italics: true, color: "888888" })]
        }));
        paragraphs.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [new TextRun({ text: caption, font: "SimHei", size: 18, bold: true })]
        }));
      }
      i++;
      continue;
    }

    // 标题解析
    let heading = null;
    let headingText = "";
    if (line.startsWith("# ")) {
      heading = HeadingLevel.HEADING_1;
      headingText = line.substring(2).trim();
    } else if (line.startsWith("## ")) {
      heading = HeadingLevel.HEADING_2;
      headingText = line.substring(3).trim();
    } else if (line.startsWith("### ")) {
      heading = HeadingLevel.HEADING_3;
      headingText = line.substring(4).trim();
    }

    if (heading && headingText) {
      // 跳过"本章参考文献"的标题
      if (headingText.includes("本章参考文献")) {
        i++;
        continue;
      }
      const size = heading === HeadingLevel.HEADING_1 ? 32 : heading === HeadingLevel.HEADING_2 ? 28 : 24;
      paragraphs.push(new Paragraph({
        heading: heading,
        spacing: { before: heading === HeadingLevel.HEADING_1 ? 300 : 200, after: 160 },
        children: [new TextRun({ text: headingText, font: "SimHei", size: size, bold: true })]
      }));
      i++;
      continue;
    }

    // 分隔线
    if (line.trim() === "---") {
      i++;
      continue;
    }

    // 正文段落
    const cleaned = line.trim();
    if (cleaned.length > 0) {
      paragraphs.push(new Paragraph({
        spacing: { after: 80 },
        indent: { firstLine: 480 },
        children: [new TextRun({ text: cleaned, font: "SimSun", size: 24 })]
      }));
    }
    i++;
  }
  return paragraphs;
}

// ========== 构建文档 ==========
async function buildDocx() {
  // 读取各章节
  const chap1 = readMarkdown("01_前言.md");
  const chap2 = readMarkdown("02_系统开发环境.md");
  const chap3 = readMarkdown("03_系统需求分析.md");
  const chap4 = readMarkdown("04_系统设计.md");
  const chap5 = readMarkdown("05_系统实现.md");
  const chap6 = readMarkdown("06_总结与展望.md");

  const bodyFont = "SimSun";
  const headingFont = "SimHei";
  const bodySize = 24; // 12pt = 24 half-pts

  // ===== 封面 =====
  const coverPage = [
    new Paragraph({ spacing: { before: 2400 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: "本科毕业设计（论文）", font: headingFont, size: 44, bold: true })]
    }),
    new Paragraph({ spacing: { before: 600 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "题目：基于Spring Boot和Vue的", font: headingFont, size: 32, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: "农产品产销对接平台设计与实现", font: headingFont, size: 32, bold: true })]
    }),
    new Paragraph({ spacing: { before: 1200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "学    院：____________________", font: bodyFont, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "专    业：____________________", font: bodyFont, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "姓    名：____________________", font: bodyFont, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "学    号：____________________", font: bodyFont, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "指导教师：____________________", font: bodyFont, size: 28 })]
    }),
    new Paragraph({ spacing: { before: 1200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "2026年5月", font: bodyFont, size: 28 })]
    }),
  ];

  // ===== 中文摘要 =====
  const cnAbstract = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "摘  要", font: headingFont, size: 32, bold: true })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "农产品流通领域长期面临供需信息分散、传统交易效率较低、库存与采购需求难以及时匹配等问题。随着Web应用开发技术的成熟和农业数字化转型的推进，构建面向农产品供应商、采购商和普通消费者的线上产销对接平台具有现实可行性。本文设计并实现了一个基于Spring Boot和Vue的农产品产销对接平台，在传统商城功能基础上扩展了供应发布、采购需求、智能匹配推荐、撮合记录跟踪、订单库存同步和数据分析等核心业务模块。",
        font: bodyFont, size: bodySize
      })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "系统后端采用Spring Boot 3.3.1框架整合MyBatis和MySQL数据库，前端采用Vue 3.3.4框架结合Element Plus组件库和Axios请求库，前后端分离架构下通过RESTful接口进行JSON数据交换。系统面向管理员、供应商、采购商和普通购买用户四类角色提供差异化的功能支持。智能匹配推荐模块基于产品名称、分类、时间、价格、地区和数量六个维度的规则权重算法计算供需匹配得分。撮合记录管理模块实现了从待确认到已完成的完整状态流转体系，状态变化时触发库存锁定与释放。订单管理模块在商品下单时同步扣减来源供应库存，订单取消时同步返还，保证了商城交易与供应库存之间的数据一致性。",
        font: bodyFont, size: bodySize
      })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "系统功能测试结果表明，各模块能够按照设计逻辑正确运行，核心业务流程的数据一致性得到保证。平台基本实现了农产品供应方、采购方和普通购买用户之间的信息对接与交易闭环。",
        font: bodyFont, size: bodySize
      })]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    new Paragraph({
      children: [
        new TextRun({ text: "关键词：", font: headingFont, size: bodySize, bold: true }),
        new TextRun({ text: "农产品产销对接；Spring Boot；Vue；MySQL；智能匹配；订单管理", font: bodyFont, size: bodySize })
      ]
    }),
  ];

  // ===== 英文摘要 =====
  const enAbstract = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "ABSTRACT", font: "Times New Roman", size: 32, bold: true })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "The agricultural product circulation sector has long faced challenges including fragmented supply-demand information, low transaction efficiency, and difficulty in timely matching inventory with procurement needs. With the maturation of web application technologies and the advancement of agricultural digital transformation, building an online supply-demand matching platform for agricultural product suppliers, buyers, and consumers is both feasible and practically valuable. This thesis designs and implements an agricultural product supply-demand matching platform based on Spring Boot and Vue, extending traditional e-commerce functionality with core modules such as supply publishing, purchase demand publishing, rule-based matching recommendation, matching record tracking, order-inventory synchronization, and data analysis.",
        font: "Times New Roman", size: bodySize
      })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "The backend adopts the Spring Boot 3.3.1 framework integrated with MyBatis and MySQL, while the frontend uses Vue 3.3.4 with Element Plus and Axios. The system serves four user roles — administrator, supplier, buyer, and shopper — with differentiated functionality. The matching recommendation module calculates compatibility scores using a rule-based weighted algorithm across six dimensions: product name, category, time, price, region, and quantity. The matching record module implements a complete status transition workflow from pending confirmation to completed, triggering inventory locking and releasing upon status changes. The order management module synchronously deducts source supply inventory upon purchase and restores it upon cancellation, ensuring data consistency between marketplace transactions and supply inventory.",
        font: "Times New Roman", size: bodySize
      })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "Functional testing demonstrates that all modules operate correctly according to the designed logic, with data consistency maintained across core business workflows. The platform achieves information matching and transaction closure among suppliers, buyers, and shoppers.",
        font: "Times New Roman", size: bodySize
      })]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    new Paragraph({
      children: [
        new TextRun({ text: "Key words: ", font: "Times New Roman", size: bodySize, bold: true }),
        new TextRun({ text: "agricultural product matching; Spring Boot; Vue; MySQL; rule-based recommendation; order management", font: "Times New Roman", size: bodySize })
      ]
    }),
  ];

  // ===== 目录 =====
  const tocSection = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: "目  录", font: headingFont, size: 32, bold: true })]
    }),
    new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
  ];

  // ===== 致谢 =====
  const ackSection = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "致  谢", font: headingFont, size: 32, bold: true })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "本毕业设计论文的完成得到了多方面的支持与帮助，在此致以诚挚的谢意。",
        font: bodyFont, size: bodySize
      })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "感谢指导教师在选题方向、系统设计、论文写作和修改过程中给予的悉心指导。从开题阶段的选题论证到系统开发过程中的技术建议，再到论文撰写阶段的审阅修改，导师的专业意见和严格要求对本论文的完成起到了关键作用。",
        font: bodyFont, size: bodySize
      })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "感谢学院各位老师在本科学习期间的教学与培养，为本项目的完成提供了必要的知识储备和技术基础。感谢各位同学在系统测试、资料整理和论文排版过程中提供的帮助与建议。",
        font: bodyFont, size: bodySize
      })]
    }),
    new Paragraph({
      spacing: { after: 80 }, indent: { firstLine: 480 },
      children: [new TextRun({
        text: "感谢家人在求学期间的理解、支持与鼓励，为本论文的顺利完成提供了坚实的后盾。",
        font: bodyFont, size: bodySize
      })]
    }),
  ];

  // ===== 参考文献（全文统一16篇） =====
  const references = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: "参考文献", font: headingFont, size: 32, bold: true })]
    }),
  ];

  const refList = [
    "[1] 张小燕, 陶卫卫, 沈慧. 物联网和人工智能助推智慧农业产销一体化平台建设模式研究[J]. 现代农业研究, 2024, 30(8): 14-17.",
    "[2] 马述忠, 濮方清, 肖赵华. 农业大数据的流动过程和价值创造——基于供需匹配视角的分析[J]. 农业经济问题, 2024.",
    "[3] 马晓丽. 我国农产品市场信息不对称问题研究[D]. 泰安: 山东农业大学, 2010.",
    "[4] 董秋丽, 孙立霞, 段祎林. 浅析\"互联网+\"农产品供需信息平台[J]. 投资与创业, 2022, 33(3): 217-219.",
    "[5] 郭杰, 孙琪恒, 郭辰. 农产品产销对接双边匹配方法研究[J]. 时代经贸, 2025(1).",
    "[6] 李刚. 轻量级Java EE企业应用实战[M]. 北京: 电子工业出版社, 2021.",
    "[7] 汪云飞. Spring Boot企业级开发教程[M]. 北京: 电子工业出版社, 2021.",
    "[8] 尤雨溪. Vue.js设计与实现[M]. 北京: 人民邮电出版社, 2022.",
    "[9] 张海藩. 软件工程导论[M]. 北京: 清华大学出版社, 2019.",
    "[10] 杨光梅. 乡村振兴视域下农产品供应链系统设计[J]. 食品工业, 2023, 44(2).",
    "[11] 彭望, 董太琼, 刘秋榕. 基于语义分析的农产品供求信息汇聚系统设计与实现[J]. 中国信息化, 2023(2): 45-48.",
    "[12] 王珊, 萨师煊. 数据库系统概论[M]. 北京: 高等教育出版社, 2014.",
    "[13] 刘云生. 数据库系统概论[M]. 北京: 清华大学出版社, 2020.",
    "[14] Craig Walls. Spring实战[M]. 北京: 人民邮电出版社, 2022.",
    "[15] MyBatis Team. MyBatis 3 User Guide[EB/OL]. 2024.",
    "[16] Element Plus Team. Element Plus Documentation[EB/OL]. 2024.",
  ];

  refList.forEach(ref => {
    references.push(new Paragraph({
      spacing: { after: 60 },
      indent: { left: 480, hanging: 480 },
      children: [new TextRun({ text: ref, font: bodyFont, size: 21 })]
    }));
  });

  // ===== 组装所有section =====
  const allChildren = [
    ...coverPage,
    ...cnAbstract,
    ...enAbstract,
    ...tocSection,
    ...chap1,
    ...chap2,
    ...chap3,
    ...chap4,
    ...chap5,
    ...chap6,
    ...ackSection,
    ...references,
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: bodyFont, size: bodySize } }
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: headingFont },
          paragraph: { spacing: { before: 300, after: 180 }, outlineLevel: 0 }
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: headingFont },
          paragraph: { spacing: { before: 200, after: 140 }, outlineLevel: 1 }
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: headingFont },
          paragraph: { spacing: { before: 160, after: 120 }, outlineLevel: 2 }
        },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "基于Spring Boot和Vue的农产品产销对接平台设计与实现", font: bodyFont, size: 18, color: "888888" })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "第 ", font: bodyFont, size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], font: bodyFont, size: 18 }),
              new TextRun({ text: " 页", font: bodyFont, size: 18 })
            ]
          })]
        })
      },
      children: allChildren,
    }]
  });

  // ===== 输出文件 =====
  const buffer = await Packer.toBuffer(doc);
  const outputPath = "./农产品产销对接平台毕业论文.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log(`DOCX generated: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

buildDocx().catch(err => { console.error(err); process.exit(1); });
