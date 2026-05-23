# Public Interface Compatibility

本文件规定公共接口的兼容性要求。它保护对外契约不被无声破坏。

## 什么算「公共接口」

本项目的公共接口包括:

- **localStorage 键名与 schema**
  - `json-tool:history:v1`(`HISTORY_STORAGE_KEY`,`src/utils/historyStore.ts`)
  - `json-tool:share-endpoint:v1`(`SHARE_ENDPOINT_KEY`,`src/utils/shareConfig.ts`)
- **URL 协议**
  - `#share=<id>` hash 协议(`src/utils/transferShare.ts` 的 `parseShareHash`)
- **Share 端点协议**
  - 远端文本存储的 PUT/GET 接口约定(路径、字段名、限制),见 `transferShare` 模块。
- **构建与发布产物**
  - Docker 镜像名 `ghcr.io/lroccoon/json-tool`,镜像 tag 规则(`latest`、`dev`、`sha-<short>`、`v*`)。
  - GitHub Actions workflow 名称、触发条件。

## 兼容性要求

- 默认保守对待公共接口:能向后兼容就不做破坏性变更。
- 破坏性变更必须附带迁移说明:变了什么、为什么、调用方/旧链接/旧历史如何迁移。
- 破坏性变更必须记入 `CHANGELOG.md`,并更新相关设计文档与 README 的目录地图。
- 字段/参数优先「新增」而非「修改语义」;废弃应有过渡期。
- localStorage 版本号(`:v1`)升级时,新版本代码必须能读取旧版本数据(读时迁移),或在 UI 中明确告知用户旧数据将被丢弃。

## 变更检查清单

- [ ] 是否破坏了现有调用方/旧链接/旧 localStorage 数据?
- [ ] 是否提供了迁移路径或过渡期?
- [ ] 是否更新了相关文档(`ARCHITECTURE.md`、`SECURITY.md`、`FRONTEND.md` Client/Server Boundary、`CHANGELOG.md`)?
- [ ] 持久化格式变更是否可重建/可回滚?
- [ ] Docker 镜像名或 tag 规则是否变化?如变化,是否在 README 与 CI 文档同步说明?
