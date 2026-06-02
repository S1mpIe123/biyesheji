## Task Packet

- Scope: 对已生成的 AIGC 改稿版 DOCX 做二次返工，删除中文字符与英文/数字字符之间的多余空格，并压缩上轮绿色 AI 热点段落。
- Files to read: `output/aigc_revision/working_aigc_report.docx`; `plan/project-overview.md`; detection rewrite playbook; research writing core rules.
- Files allowed to edit: `output/aigc_revision/working_aigc_report.docx`; `output/aigc_revision/免费_Word标红版_AIGC检测报告_[基于springboot+vue的农产品]_改稿版.docx`; `output/aigc_revision/AIGC改稿说明.md`; `plan/progress.md`; helper script under `tools/`.
- Required skills: `research-writing-assistant`; `using-research-writing`; `paper-orchestration`; `writing-core`; `verification`; `academic-paper-composer`; `docx`.
- Evidence/data inputs: Existing DOCX text and color marks; project overview and source-code-supported facts from previous AIGC revision.
- Required artifacts: Updated DOCX, updated rework report, validation output for Chinese character count and CJK/ASCII spacing.
- Rejection checks: Do not redraw figures or tables; do not delete unsupported spans outside green hotspots; do not invent project facts; keep total Chinese characters excluding punctuation and English under 25000.
- Validation commands: Run a DOCX audit script to report paragraph/table count, total Chinese character count, green paragraph count, green character count, and remaining Chinese-English spacing matches.
