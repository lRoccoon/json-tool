# ARCHITECTURE.md

## Purpose

`ARCHITECTURE.md` 记录 json-tool 仓库内长期稳定、不可轻易破坏的边界,以及后续代码应落在什么位置。它不记录任务状态,也不重复接口细节。

## Stable Layers

- 协作入口层:`AGENTS.md` 规定阅读顺序、协作边界和验证入口。
- 顶层专题层:根目录专题文档(DESIGN/PRODUCT_SENSE/FRONTEND/RELIABILITY/SECURITY/QUALITY_SCORE)记录代码中提不出来的原则、产品和安全约束。
- 设计索引层:`docs/design-docs/` 记录设计主题入口和代码地图。
- 产品索引层:`docs/product-specs/` 记录场景入口和用户流入口。
- 参考层:`docs/generated/` 与 `docs/references/` 分别存放生成产物和外部参考。
- 规则层:`rules/` 记录稳定的协作规则和完成态门禁。
- 变更记录层:`CHANGELOG.md` 记录已发生的治理和功能变化。
- 应用入口层:`index.html` + `src/main.tsx` + `src/App.tsx` 负责挂载与顶层状态编排,不写业务逻辑。
- UI 组件层:`src/components/` 每个文件负责一块独立的 UI 关注点(Toolbar / JsonTree / JsonNode / ValuePopup / HistoryPanel / SharePanel),不直接访问 storage 或网络。
- 纯逻辑层:`src/utils/` 收集与 React 无关的纯函数与适配器(`jsonUtils`、`historyStore`、`shareConfig`、`transferShare`、`markdown`),可被 Node test runner 直接覆盖。
- 构建与运行时层:`vite.config.ts`、`tsconfig*.json`、`Dockerfile`、`nginx.conf`、`docker-compose.yml` 负责打包与静态托管。
- 持续集成层:`.github/workflows/` 负责镜像构建与发布。

## Non-Negotiable Boundaries

- 不要让文档充当接口真相源。
- 不要把任务状态写进仓库文档。
- 不要把自动生成内容和手写设计混放。
- 不要让公共接口在没有迁移说明的情况下发生破坏性变化(包括:`HISTORY_STORAGE_KEY`、`SHARE_ENDPOINT_KEY`、share URL hash 协议、docker 镜像名)。
- 不要让单个模块同时承担 orchestration、UI、storage、network 多种职责。
- `src/utils/jsonUtils.ts` 与 `src/utils/historyStore.ts` 必须保持纯函数风格(不直接依赖 React、不直接读 DOM),以便 Node test runner 覆盖。
- 不允许在 `src/components/` 内直接读写 localStorage 或发起 `fetch`;这类副作用统一走 `src/utils/`。
- 不允许引入外部 CDN 资源(字体、JS、CSS),offline-first 是产品承诺。
- 不允许在非用户显式触发(SharePanel 上传按钮、URL hash 拉取)的情况下发起任何外部网络请求。

## Future Codebase Guidance

- 新增能力时先确认它属于哪个稳定层;若不属于任何现有层,先定义新层再写代码。
- 模块名即职责:`historyStore` 只管 localStorage 的历史快照,`transferShare` 只管远端 PUT/GET 协议,`shareConfig` 只管端点校验。新功能命名同样应让职责自解释。
- localStorage 中的历史快照是可重建的派生数据(用户随时可清空),不是真相源——真相源永远是当前 `source pane` 的输入。
- 文件变长(经验阈值约 400 行)、职责变杂时,先拆分再继续扩展。`App.tsx` 已承担较多顶层状态编排,新增能力优先抽离到 hook 或新组件。
- 任何新增的"外部端点"必须有显式的开关或用户操作触发,不允许在初始化时自动发起请求。
