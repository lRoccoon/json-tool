# Validation Gate

本文件定义一个任务进入「完成态」前必须满足的验证要求。

在声称「已完成」之前,必须留下验证证据。只凭静态阅读或历史经验判断「应该没问题」不算完成。

## Required Evidence

以下验证应尽量全部具备:

1. **自动化验证**:单元测试、构建、类型检查。
2. **mock / 沙箱验证**:本地 `pnpm dev` 跑通主路径,使用 canonical scenarios(见 `RELIABILITY.md`)。
3. **真实链路验证**:Docker 镜像构建并在本地拉起,确认 nginx 服务静态资源行为符合预期。

只通过其中一项或两项时,必须明确说明已验证部分、未验证部分及风险。

## Repository Commands

### 自动化验证

- 安装依赖:`pnpm install`
- 构建(含 `tsc -b` 类型检查):`pnpm build`
- 单元测试:`pnpm test`
- 预览生产构建:`pnpm preview`

### mock / 沙箱验证

- 启动开发服:`pnpm dev`(默认 `http://localhost:5173`)
- 主路径(canonical scenarios):
  1. 粘贴一段含 Unicode 转义的 JSON,验证 Unicode⇄中文切换与树视图渲染。
  2. 粘贴一段多重转义的 JSON 字符串,通过 Toolbar 还原为合法 JSON。
  3. 在树视图上把一个字符串值"按 JSON 展开",验证嵌套子树正确。
  4. 触发 History 自动保存(改输入、停顿 ≥ 600ms),验证 HistoryPanel 出现新条目;恢复、删除、清空操作均按预期。
  5. (可选)在 SharePanel 上传当前内容到默认端点,验证生成 `#share=<id>` 链接可在新窗口正确拉取。

### 真实链路验证

- 本地镜像构建:`docker build -t json-tool .`
- 本地运行镜像:`docker run --rm -p 8080:80 json-tool`,在浏览器访问 `http://localhost:8080` 跑通核心路径。
- CI 验证由 `.github/workflows/docker.yml` 在 push 后执行 multi-arch 构建。

## Minimal Verification Rule

- 只要修改了代码,就必须至少执行一次实际验证。
- 纯文档改动至少应在本地预览或在编辑器内 lint 检查,确保 Markdown 格式正确。
- 若全量构建/测试受环境阻塞,仍必须执行最小可行验证(如定向测试 `node --test --experimental-strip-types <file>`)。
- 若无法完成验证,必须明确说明已执行的验证、未验证部分及风险。
