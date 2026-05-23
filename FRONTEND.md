# FRONTEND.md

## Scope

本文件覆盖 json-tool 的 Web 前端——这是项目唯一的客户端形态,没有移动端、桌面端或浏览器插件。

## Design Philosophy

整体走"编辑稿(editorial)"取向:暖色纸面背景、明确的衬线标题、稳定的字距,让长时间盯着 JSON 不刺眼。

- **安静默认**:UI 不抢戏。空状态没有营销文案,只有"粘进来"这件事的提示。
- **节奏感**:Toolbar 给操作分组,树视图给信息分层,Value Popup 给"想细看的那一段"独立画面。三层节奏不互相干扰。
- **信息密度面向代码读者**:JSON tree 信息密度偏高,字号小、行高紧凑;Toolbar / 标题区则放大留白。两套节奏并存,不混用。
- **不追求"现代感"装饰**:不加阴影/玻璃/粒子,不上动效——所有视觉重量留给内容本身。

## Design System & Consistency

- **配色**:暖纸面调色板。背景偏米白/浅杏,前景偏深棕黑;强调色克制,优先用字重和留白制造层级。
- **字体**:`Instrument Serif`(衬线,作显示与品牌字)+ `IBM Plex Sans`(无衬线,UI 文本)+ `IBM Plex Mono`(等宽,JSON / 代码)。三者均通过 `@fontsource` 打入 bundle,不依赖任何 CDN。
- **图标与符号**:能用文字说清就用文字;按钮文案优先动词("展开 / 折叠 / 复制")。
- **变更约束**:新页面/新组件应优先复用上述配色与字体规范;明确的重设计任务才允许偏离。

## Constraints

- **技术栈**:Vite 5 + React 18 + TypeScript 5。无状态管理库(`useState` / `useMemo` 已足够),无 CSS 框架(普通 CSS + `App.css`)。
- **依赖体积**:任何增量依赖都要评估对生产 bundle 的影响。代码高亮(`rehype-highlight`)采用懒加载,曾经把 bundle 从 508K 压到 177K——后续高耗依赖需照同样思路处理。
- **可访问性**:键盘可达是默认要求;Value Popup、HistoryPanel 等浮层需支持 Esc 关闭。配色需保证正文与背景对比度足够。
- **浏览器范围**:现代 evergreen 浏览器(Chrome / Edge / Firefox / Safari 最近两个大版本)。不投入 IE / 老旧移动浏览器。
- **离线**:产线环境无外部 CDN 依赖。字体、JS、CSS 全部经过 Vite 打包,nginx 直接服务静态资源。
- **打包产物**:`dist/` 由 `pnpm build` 输出,Dockerfile 第二阶段把它复制进 nginx 镜像。

## Client/Server Boundary

- 没有自有后端;运行时 = nginx 服务静态资源 + 浏览器内 JS。
- 唯一会触达远端的能力是 **Share**:
  - 上传:用户点击 SharePanel 的上传按钮,把当前文本 PUT 到 `transferShare.uploadToTransfer` 指定的端点。
  - 拉取:打开 `#share=<id>` 链接时,通过 `fetchSharedContent` GET 同一端点的对应路径,最大读取 8MiB。
  - 默认端点 `https://t.herf.cc` 来自 `shareConfig.DEFAULT_SHARE_ENDPOINT`,可被用户在 UI 中覆盖。
- 客户端不做任何"安全等同后端"的校验承诺:Share 拉取到的内容仍按 untrusted 输入对待,统一走与本地输入相同的解析路径。
- 默认状态(未上传、未打开 share 链接)下不应有任何对外网络请求,这一约束在 `PRODUCT_SENSE.md` 的验收口径中体现。
