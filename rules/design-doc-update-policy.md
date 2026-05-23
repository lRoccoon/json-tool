# Design Doc Update Policy

本文件规定何时必须同步更新文档,以及更新到什么程度。目标是让文档持续可用于导航,而不是变成失真的伪真相源。

## 何时必须更新文档

当改动涉及以下任一项时,必须在同一变更内同步检查并更新文档:

- 架构边界或模块职责(例如 UI 组件与 utils 之间的分工变化)
- 公共契约:`HISTORY_STORAGE_KEY`、`SHARE_ENDPOINT_KEY`、share URL hash 协议、Docker 镜像名、对外输出结构
- 目录结构、关键文件位置、代码入口
- 可靠性策略、降级策略、回滚方式
- 安全策略、信任边界、日志规范、外部网络请求范围
- 产品视角的目标用户、场景判断或验收口径
- 前端设计语言(配色、字体、信息密度、组件约束)
- 协作规则本身

## 更新到什么程度

- 文档说明"是什么、在哪、为什么",不复制实现细节——细节以代码为准。
- 更新目标是让协作者更快定位代码和规则。
- 发现文档与代码冲突时,以代码为准,并修正文档而不是放任失真。

## 至少检查的文档

`README.md`、`ARCHITECTURE.md`、`DESIGN.md`、`PRODUCT_SENSE.md`、`FRONTEND.md`、`RELIABILITY.md`、`SECURITY.md`、`QUALITY_SCORE.md`、`docs/` 下对应专题文档、`CHANGELOG.md`。
