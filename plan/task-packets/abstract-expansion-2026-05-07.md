# Task Packet

- Scope: 扩写毕业论文中的中文摘要与英文 ABSTRACT，仅增强研究背景、系统设计、关键模块、测试结论和应用价值表述。
- Files to read: `毕业设计论文（待更改）.doc`; `农产品产销对接平台毕业论文.docx`; `plan/project-overview.md`; `plan/outline.md`; `plan/progress.md`
- Files allowed to edit: `农产品产销对接平台毕业论文_摘要扩写版.docx`; `plan/progress.md`
- Required skills: `docx`; `research-writing-assistant`; `using-research-writing`; `paper-orchestration`; `writing-core`; `prompts-collection`
- Evidence/data inputs: 论文已有摘要、项目概述、章节大纲、已完成章节进度。
- Required artifacts: 生成仅替换摘要和 ABSTRACT 的 Word 文档副本。
- Rejection checks: 不新增不可追溯文献；不修改目录之后正文；不使用项目符号堆叠摘要内容；英文摘要需与中文摘要信息一致。
- Validation commands: 使用 `python-docx` 读取输出文档，核对摘要段落、关键词、正文起始位置和文档段落数。
