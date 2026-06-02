## Task Packet

- Scope: 根据 VALORANT/ELO 主题 AIGC 标红版 Word 报告，对红色、橙色、紫色热点段落做降 AIGC 改写，并清理中文与英文字母之间的多余空格。
- Files to read: `output/aigc_revision_valorant/working_valorant_aigc_report.docx`; detection rewrite playbook; research writing core rules.
- Files allowed to edit: `output/aigc_revision_valorant/working_valorant_aigc_report.docx`; `output/aigc_revision_valorant/*_改稿版.docx`; `output/aigc_revision_valorant/AIGC改稿说明.md`; helper script under `tools/`.
- Required skills: `research-writing-assistant`; `using-research-writing`; `paper-orchestration`; `writing-core`; `verification`; `academic-paper-composer`; `docx`.
- Evidence/data inputs: Existing report text and color marks. No separate codebase was provided for this VALORANT project, so rewrites must stay inside the facts already present in the report.
- Required artifacts: Updated DOCX, separate rework report, validation output for hotspot counts, Chinese character count, green paragraph count, and CJK/English spacing.
- Rejection checks: Do not invent algorithms, datasets, APIs, metrics, or screenshots; do not redraw old figures/tables; preserve citations and section order; avoid formula/table changes unless rewriting surrounding prose.
- Validation commands: Run DOCX audit script to verify file opens, risk colors are cleared, green hotspot count equals processed count, Chinese-English letter spacing is zero, and DOCX zip structure is valid.
