# Commit Convention

## 提交信息格式

- 使用 `<type>: <简述>` 形式,简述清晰反映改动意图。
- 常见 type:`feat`(新功能)、`fix`(修复)、`refactor`(重构)、`docs`(文档)、`test`(测试)、`chore`(杂项)、`build`(构建/Docker/CI)。
- 简述用陈述句,说明"做了什么",必要时正文补充"为什么"。

## 提交粒度

- 一个提交只做一件相对完整的事,避免把不相关修改混在同一个提交里。
- 代码改动与对应的文档更新应在同一个提交或紧邻的提交中。

## 分支命名

- 形式:`<前缀>/<简称>`。常见前缀:`feat`、`fix`、`refactor`、`docs`、`chore`。
- 简称用 kebab-case,反映改动主题,例如 `feat/full-markdown-parser`、`docs/project-scaffold`。

## 提交前检查

- 通过 `rules/validation-gate.md` 的验证门禁。
- 相关文档已按 `rules/design-doc-update-policy.md` 同步更新。
- `CHANGELOG.md` 已记录架构/接口/规则层面的变化。

## PR / Review

- PR 标题与首 commit 标题保持一致,清楚说明影响面。
- PR 描述至少覆盖:做了什么、为什么、如何验证、(如有)迁移说明。
- 触及公共契约(storage key、share 协议、镜像名)需在描述中标红,引用 `rules/public-interface-compatibility.md`。
