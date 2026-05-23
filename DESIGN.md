# DESIGN.md

## Design Principles

- 简洁优先:在足够有效的前提下选择实现最简单的方案,避免过度设计。
- 根因导向:JSON 解析或 escape 行为出问题时,定位到具体 util 函数与输入,不在 UI 层"兜底"掩盖。
- 最小影响:改动范围尽量小,避免引入与当前任务无关的变更。
- 单一职责:每个组件/util 只解决一件事,边界清晰、可独立理解和测试。
- 显式边界:UI 组件与 storage / 网络通信只能经由 `src/utils/` 中的适配器,内部实现可替换而不影响调用方。
- Offline-first:核心能力(解析、转义、格式化、历史)在断网情况下完整可用;任何外部请求都必须是用户显式触发的。
- 体积自觉:依赖体积是产品体验的一部分。新增大块依赖(如代码高亮)需要懒加载或按需切片,参照 react-markdown + rehype-highlight 的拆分方式。

## Boundary Judgments

- **真相源 vs 派生层**:`source pane` 输入是真相源;`tree`、`history` 列表、`value popup` 内容都是派生层。派生层从输入推导,不应反向覆盖输入。
- **UI 层 vs 逻辑层**:可被 Node 测试覆盖的逻辑必须落在 `src/utils/`;依赖 React state 或 DOM 的代码留在 `src/components/`。这条边界保证 `pnpm test` 不需要浏览器环境。
- **本地 vs 远端**:`historyStore` 是本地的,任何远端协议(`transferShare`、`shareConfig`)都集中在显式命名的模块,审计与替换都更直接。
- **markdown 渲染范围**:`value popup` 的 markdown 模式只用于阅读,不参与 JSON 解析;markdown 与 JSON 树视图永远是两个独立的渲染管线。

## Long-Term Constraints

- `HISTORY_STORAGE_KEY`(`json-tool:history:v1`)和 `SHARE_ENDPOINT_KEY`(`json-tool:share-endpoint:v1`)是持久化契约,版本号变更必须附带迁移说明(见 `rules/public-interface-compatibility.md`)。
- Share URL hash 协议(`#share=...`)是对外协议,旧链接必须保持可解析。
- 不引入外部 CDN 字体或脚本(`@fontsource` 已经把字体打进 bundle)。
- 不引入需要后端的依赖;部署形态保持"静态资源 + nginx"。
- 不在没有用户操作的情况下做任何遥测、埋点或外发请求。

## Open Questions

_(暂无)_
