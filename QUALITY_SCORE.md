# QUALITY_SCORE.md

## Quality Dimensions

- **正确性**:行为符合 `PRODUCT_SENSE.md` 中的核心场景与验收口径,边界条件(空输入、超长字段、嵌套 JSON、Unicode 转义)均有覆盖。
- **边界清晰**:UI 组件不直接访问 storage / 网络;纯逻辑保持在 `src/utils/`,符合 `ARCHITECTURE.md` 的稳定层划分。
- **可读性**:命名说明意图(`historyStore` 而不是 `store`、`transferShare` 而不是 `api`);组件文件长度可控,长 hook 抽离;不依赖隐式约定。
- **可测试性**:解析、转义、historyStore 中的关键逻辑通过 `pnpm test` 可直接验证,新增/修改这些路径时必须新增对应测试。
- **可维护性**:改动最小化、无无关变更;依赖增量评估 bundle 体积影响;`App.tsx` 顶层状态控制在可阅读范围。
- **文档一致**:相关文档与代码同步更新(见 `rules/design-doc-update-policy.md`)。`CHANGELOG.md` 记录架构边界、公共契约、规则层面的变更。
- **离线一致**:默认状态下无任何外部网络请求;新增依赖不引入 CDN;新增能力默认在断网下不报红。

## Delivery Standard

一个任务进入"交付态"需要同时满足:

- 通过 `rules/validation-gate.md` 列出的验证项(至少包含 `pnpm build` 与 `pnpm test`)。
- 触及公共契约(`HISTORY_STORAGE_KEY`、`SHARE_ENDPOINT_KEY`、share hash 协议、镜像名)时,已按 `rules/public-interface-compatibility.md` 处理兼容性。
- 触及架构边界、安全策略、产品语义时,相关根文档与 `docs/` 下专题文档已同步更新。
- `CHANGELOG.md` 已追加一条说明改了什么、为什么。
- PR 描述包含影响面、验证证据、(如有)迁移说明。

## Review Lens

按以下顺序检查(先发现问题就先反馈,不必走完):

1. **行为正确性**:改动是否真的解决了它声明要解决的问题?canonical scenarios 是否仍能跑通?
2. **边界遵守**:有没有把副作用放进 UI 组件、把 React 引入 utils、绕过 historyStore 直接读 localStorage?
3. **公共契约**:是否动了 storage key、share 协议、镜像名等长期契约?有没有迁移说明?
4. **可读性与体积**:命名是否能让下一个人快速定位职责?新增依赖是否值得它的体积?
5. **文档同步**:架构/安全/产品/前端语义改动是否同步到了相应文档?`CHANGELOG.md` 是否更新?
6. **离线承诺**:默认状态是否仍无外部请求?新增的 fetch 是否由用户显式触发?
