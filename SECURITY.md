# SECURITY.md

## Authentication & Authorization

- 项目无自有后端、无账户体系,因此不存在用户认证与授权模型。
- Share 端点采用裸路径 PUT/GET(默认 `https://t.herf.cc`),任何持有 share id 的人都能读取——这是**故意的弱模型**,用户应据此决定是否上传敏感内容。
- 用户对端点拥有完全控制:可在 SharePanel 配置自托管地址,默认端点没有特权地位。

## Data & Privacy

- 默认情况下,所有内容只存在于当前浏览器(`source pane` 状态 + `localStorage` 历史快照)。
- localStorage 数据:
  - `json-tool:history:v1`:最近 20 条快照,内容、大小、时间戳。
  - `json-tool:share-endpoint:v1`:用户自定义的 share 端点。
- 触达远端的仅有 Share 通道:上传时**完整明文**通过 HTTPS PUT 到端点;拉取时同样以明文 GET 返回。中转方可见全部内容,用户必须自己评估是否上传敏感数据。
- 不做任何 analytics、埋点、性能上报、错误上报。任何引入此类能力的提议必须在 PR 中标红讨论。

## Trust Boundaries

- **用户输入(source pane)**:untrusted。解析失败必须 catch,不能让浏览器抛出未处理异常。
- **localStorage 读出的历史**:轻度可信(同源 + 浏览器维护),但解析仍走与新输入相同的路径。
- **Share 端点拉取的内容**:**untrusted**。即使端点是默认地址,也按陌生输入处理:不直接 `eval`、不 `innerHTML`、所有 markdown 渲染走 react-markdown(它默认对 HTML 做过滤)。
- **URL hash**:untrusted。`parseShareHash` 必须对 id 做格式校验。

## Logging Standard

- 浏览器端只允许打 `console.warn` / `console.error`,且仅用于开发期排查。生产构建不应主动产生 console 噪声。
- 不允许把以下信息写入任何日志或外部请求:
  - 用户输入的 JSON 内容(除非是用户显式触发的 Share 上传)。
  - localStorage 的历史快照。
  - 自定义 share 端点。
- 错误处理路径在抛出前可保留简短上下文(操作名、错误码),但不携带 payload。

## Security Boundaries

- 不引入外部 CDN 资源(字体、脚本、样式),避免供应链劫持。
- 不在客户端代码里硬编码任何凭证、token、API key。
- 不允许在 dev/preview 之外为应用注入任意环境变量(`VITE_*` 之外的变量不会被打包,这条边界保持)。
- 删除历史、清空全部历史、切换 share 端点等可见副作用的操作,必须由用户在 UI 上显式触发,不能由代码默认执行。
- 任何新增的对外网络请求,必须在 `FRONTEND.md` 的 Client/Server Boundary 中登记,并在 PR 描述里说明数据流向。
