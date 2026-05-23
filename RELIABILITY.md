# RELIABILITY.md

## Failure Modes

- **JSON 解析失败**:用户输入不是合法 JSON。`tryParseJson` 返回 `{ ok: false, error }`,UI 显示原始错误信息,不尝试自动修复。
- **localStorage 不可用 / 配额超限**:浏览器隐私模式、磁盘满或第三方上下文限制时,`historyStore` 的 setter/getter 失败。
- **历史写入抖动**:输入连续变更触发频繁写入,可能拖慢交互(已通过 `HISTORY_SAVE_DELAY = 600ms` debouce)。
- **Share 端点不可达**:上传/拉取时网络异常、DNS 失败、TLS 错误、4xx/5xx 响应。
- **Share 内容过大**:`fetchSharedContent` 设置 `MAX_FETCH_BYTES = 8MiB`,超过此阈值视为失败。
- **嵌套 JSON 过深 / 单字段过长**:树视图懒展开,长字段进 `Value Popup`,避免一次性渲染。
- **markdown 渲染异常**:`react-markdown` 解析包含畸形 markdown 的字符串。

## Degradation Strategy

- localStorage 写入失败时,内存中的历史列表仍正常工作,只是不持久化。下一次能写入时恢复。
- localStorage 读取失败时,`loadHistory()` 返回空数组,UI 走"暂无历史"状态。
- Share 上传/拉取失败时,UI 以明确的错误文案提示,**不**回退到任何其它端点、**不**重试。
- 解析失败时保持 source pane 内容原样,树区显示错误;切回合法输入立即恢复。
- 所有降级都必须是**显式可见**的:不允许静默吞错。

## Recovery & Rollback

- 历史快照按 `MAX_HISTORY_ENTRIES = 20` 截断,新条目按内容去重(同内容不重复加入)。
- 用户可在 HistoryPanel 中:恢复单条、删除单条、清空全部——清空动作不可撤销,UI 应有显式确认。
- Share 链接是单向的:打开 `#share=<id>` 拉取内容后,清空 hash 不会回写到端点。
- 持久化键名变更必须保留旧键的读取兼容期,或在 `CHANGELOG.md` 给出迁移说明(见 `rules/public-interface-compatibility.md`)。

## Replay & Canonical Scenarios

用于 verify 与回归的典型样例:

- 含 Unicode 转义的 JSON 字符串:`"\\u4e2d\\u6587"` → Unicode⇄中文 → 解析为合法 JSON。
- 多次转义的 JSON 字符串(`"{\\\\\\"a\\\\\\":1}"`):通过 escape toolkit 还原。
- 嵌套 JSON:某字段值是 `'{"inner":{"x":1}}'`,在 tree 上展开为子树。
- 大体量 JSON(数 MB 量级):验证逐层展开不冻结 UI、Value Popup 能正常打开。
- localStorage 中预置 21 条历史:验证只保留最新 20 条。
- 打开 `#share=<不存在>`:验证 fetch 失败时 UI 显示明确错误,默认 source pane 内容不被覆盖。

## Verification Requirements

- 任何修改解析、转义、history、share 行为的改动,必须在 `pnpm test` 中有对应单元覆盖(`jsonUtils.test.ts` / `historyStore.test.ts`)。
- 任何修改 UI 渲染、降级提示的改动,需在本地 `pnpm dev` 跑一次以上述 canonical scenarios 之一,确认 UI 表现。
- 任何修改 Share 协议或端点的改动,需明确说明对旧链接的兼容方式。
- 详细验证命令见 `rules/validation-gate.md`。
