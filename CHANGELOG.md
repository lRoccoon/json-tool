# CHANGELOG.md

本文件只记录**已经发生**的功能、结构和规则变化。不记待办、不记计划、不记进行中任务。

## 记录约定

- 只记已发生的变化,按时间倒序(最新在上)。
- 每条变更说明"改了什么"和"为什么",必要时指向相关文档或代码入口。
- 架构边界、公共接口、规则的变化必须记录。
- 不在本文件记录任务状态或执行进度。

## 变更记录

### 2026-06-26
- feat: 新增「JSON 比较」视图(顶部 tab + `#diff` hash 路由),对两段 JSON 做结构化语义比较——对象键顺序无关、数组按下标对齐、区分新增/删除/修改/类型变化,并左右并排(GitHub 语义配色,适配现有调色板)高亮。入口 `src/components/JsonDiff.tsx`,引擎 `src/utils/jsonDiff.ts`。
- feat: 比较支持嵌套 JSON 字符串解析(单节点「嵌套解析」+「全部解析嵌套」)、「仅显示差异」折叠未变更子树、变化值逐字符行内高亮、按小数位「数字精度」忽略数字微小差异。
- refactor: `App` 抽为薄壳并按视图切换,现有主工具机械抽离为 `src/components/FormatTool.tsx`(行为不变)。

### 2026-05-23
- docs: 引入文档治理骨架(`AGENTS.md` / `ARCHITECTURE.md` / `DESIGN.md` / `PRODUCT_SENSE.md` / `FRONTEND.md` / `RELIABILITY.md` / `SECURITY.md` / `QUALITY_SCORE.md`),沉淀稳定边界与原则。
- docs: 新增 `docs/{design-docs,product-specs,references,generated}/` 目录,分离手写设计、产品视角、外部参考与生成产物。
- docs: 新增 `rules/`,定义提交规范、验证门禁、文档更新策略、公共接口兼容性、并行协作约定。
- docs: `README.md` 补充目录地图,指向新增文档结构。
