# AGENTS.md

本文件是 AI 与工程协作者进入 json-tool 仓库的统一入口。它规定阅读顺序、协作边界和验证入口。

## Required Reading Before Code Changes

在修改代码、文档或协作契约前,先按顺序阅读:

1. `AGENTS.md`
2. `ARCHITECTURE.md`
3. `README.md`
4. `DESIGN.md`
5. `PRODUCT_SENSE.md`
6. `FRONTEND.md`
7. `RELIABILITY.md`
8. `SECURITY.md`
9. `docs/design-docs/` 下相关专题文档
10. `docs/product-specs/` 下相关能力说明
11. `rules/` 下协作与验证规则

然后回到代码本身确认实现、入口和当前行为。

## Source Of Truth

- 代码是唯一核心源。
- 文档主要用于索引、导航和补充代码中无法直接提取的原则信息。
- 如果文档与代码冲突,以代码为准。
- 发现文档失真时,优先修正文档索引和原则说明,而不是让文档继续充当伪真相源。

## Engineering Role

默认设计角色是一名高级前端工程师。这意味着:

- 优先按长期可维护性设计,而不是只追求短期功能堆叠。
- 先划清职责边界(纯逻辑 vs UI 组件),再继续扩展模块。
- 当文件过长、职责混杂、review 成本明显上升时,应先做结构拆分。
- 默认保守对待 localStorage 键名、分享协议、对外输出结构等公共契约。
- 关注 bundle 体积:新增依赖时优先评估是否可以懒加载或按需引入。

## Documentation Governance

当修改以下任一内容时,必须同步检查并更新文档:

- 架构边界或模块职责(`src/components/` 与 `src/utils/` 之间的分工)
- localStorage 键名、share 协议、URL hash 协议等公共契约
- 目录结构、关键文件位置、代码入口
- 可靠性策略(降级行为、本地存储失败回退)
- 安全策略(share 端点信任边界、用户输入处理)
- 产品视角的目标用户、场景判断或验收口径
- 前端设计语言(配色、字体、信息密度)

文档更新目标是让协作者更快定位代码和规则,不是让文档重复实现细节。

至少同步检查并更新:`README.md`、`ARCHITECTURE.md`、`DESIGN.md`、`PRODUCT_SENSE.md`、`FRONTEND.md`、`RELIABILITY.md`、`SECURITY.md`、`docs/` 下对应专题文档、`CHANGELOG.md`。

## Working Rule

- 先看入口文档和规则,再回到代码确认真实实现。
- 长期设计放在 `docs/design-docs/`。
- 用户视角能力说明放在 `docs/product-specs/`。
- 自动生成产物只放在 `docs/generated/`。
- 外部规范、框架说明和参考材料只放在 `docs/references/`。
- 协作规则只放在 `rules/`。
- 变更记录只放在 `CHANGELOG.md`。
- 不要在仓库文档里记录待办、进行中任务或执行状态。

## Core Vocabulary

- `source pane`:左侧输入栏,接收原始/转义/Unicode JSON。
- `tree`:右侧解析后的树视图,支持逐层展开和节点级操作。
- `history entry`:在 localStorage 中按内容去重的快照(默认上限 20 条)。
- `share endpoint`:可选的远端文本存储地址(默认 `https://t.herf.cc`),用于把当前内容生成可分享链接。
- `value popup`:对长文本/嵌套 JSON 的全屏查看弹窗,带 markdown 与 unescape 切换。
- `validation gate`:声明一个任务进入完成态前必须满足的验证要求。
- `changelog`:只记录已经发生的功能、结构和规则变化。

## Validation Index

- 完成态验证门禁:`rules/validation-gate.md`
- 提交规范:`rules/commit-convention.md`
- 文档更新策略:`rules/design-doc-update-policy.md`
- 公共接口兼容性:`rules/public-interface-compatibility.md`
- 并行协作与 ownership 规则:`rules/plan-mode-subagents.md`
