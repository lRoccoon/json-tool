# JSON 比较工具 设计文档

- 状态：待评审
- 日期：2026-06-26
- 分支：`feat/json-diff`

## 1. 目标与范围

在现有 JSON 工具中新增「JSON 比较」能力：给定两个 JSON 字符串，按结构语义比较其内容差异，并以左右并排（side-by-side）形式高亮展示新增 / 删除 / 修改。要求：

- 作为一个新的视图存在，可从当前主页面跳转进入、并能跳回。
- 支持对 value 中的 JSON 字符串进一步解析后再比较（默认手动逐个展开，另提供「一键全部解析」）。
- 差异高亮参考 GitHub diff 的语义配色，但适配到现有暖色「编辑工程」调色板，视觉上与现有界面一致。

### 非目标（YAGNI）

- 数组不做 LCS / 最小编辑距离对齐，先用下标逐元素对齐（留作后续增强）。
- 不做三方比较、不做合并 / 应用 patch、不做导出 diff 文件。
- 不引入路由库、不引入新的 diff 第三方依赖。

## 2. 导航与整体结构

**视图切换走 URL hash，零新依赖。**

- App header 增加两个 tab：**格式化**（默认视图）/ **比较**。点击切换 `window.location.hash`：主视图为空 hash，比较视图为 `#diff`。
- App 监听 `hashchange` 同步内部 `view: 'format' | 'diff'` 状态；首屏根据初始 hash 决定视图。
- 与现有分享机制不冲突：`parseShareHash` 只识别形如 `share=<http url>` 的段（必须含 `=` 且值为 http(s) URL），`#diff` 不含 `=`，被安全忽略；反之 `#share=...` 也不会被误判为 `#diff`。
- 分享内容加载逻辑（`parseShareHash` + `fetchSharedContent`）仍只作用于主（格式化）视图。

**组件重构（服务于本需求的定向改造）：**

- 将现有主工具（当前 `App.tsx` 中 `<main>` 内的输入区 + 结构树及其全部状态）**机械抽取**为 `FormatTool.tsx`，行为不变。
- `App.tsx` 退化为薄壳：维护 `view` 状态、渲染共享 header（标题 + tab 导航），按 `view` 渲染 `<FormatTool/>` 或 `<JsonDiff/>`。
- 理由：当前 `App.tsx` 约 470 行且状态密集，新增同级视图前先解耦，使两个视图各自内聚、互不干扰。这是为本需求服务的定向改造，不做无关重构。

### 新增 / 改动文件

```
src/App.tsx                     改为薄壳：view 状态 + header 导航 + 视图切换
src/components/FormatTool.tsx   新增：现有主工具机械搬迁（输入 + 结构树）
src/components/JsonDiff.tsx     新增：比较页（两个输入 + 汇总 + 控制条 + 结果）
src/components/DiffTree.tsx     新增：并排 diff 树容器（展开 / 嵌套 / 仅看差异状态）
src/components/DiffRow.tsx      新增：单个 diff 节点的左右两格渲染
src/utils/jsonDiff.ts           新增：纯比较逻辑 + 类型
src/utils/jsonDiff.test.ts      新增：单测（沿用 node --test）
src/App.css                     新增 diff 相关样式 + 配色变量；header 导航样式
package.json                    test 脚本加入 jsonDiff.test.ts
```

## 3. 比较算法与数据模型

`jsonDiff.ts` 为纯函数，产出一棵统一 diff 树，供并排视图渲染。

### 类型

```ts
type DiffStatus =
  | 'unchanged'   // 两侧相等
  | 'added'       // 仅 B 有
  | 'removed'     // 仅 A 有
  | 'changed'     // 同一位置，基础值或类型发生变化
  | 'children';   // 容器自身存在、但其子孙存在差异

interface DiffNode {
  key: string | number | null;   // 对象 key / 数组下标 / 根为 null
  path: string;                  // JSON Pointer 风格（复用 encodeJsonPathSegment）
  status: DiffStatus;
  // 叶子：两侧原始值（缺失侧为 undefined）
  left?: JsonValue;
  right?: JsonValue;
  // 容器：左右是否为数组 / 对象，用于渲染括号
  leftKind?: 'object' | 'array';
  rightKind?: 'object' | 'array';
  children?: DiffNode[];
  // 该叶子是否由「嵌套 JSON 字符串解析」展开而来（影响渲染与复制）
  nestedParsed?: boolean;
}

interface DiffOptions {
  shouldParseNested: (path: string) => boolean;
}

function diffJson(a: JsonValue, b: JsonValue, options: DiffOptions): DiffNode;
function summarizeDiff(root: DiffNode): { added: number; removed: number; changed: number };
```

### 规则

- **对象**：按 key 比较，键顺序无关。
  - key 仅在 A → `removed`；仅在 B → `added`；两侧都有 → 递归比较子节点。
  - 子节点出现任何非 `unchanged` → 父容器标 `children`。
- **数组**：按下标 `i` 对齐逐元素比较。
  - 较长一侧多出的元素 → `added`（B 长）/ `removed`（A 长）。
- **基础值**：相等 → `unchanged`；不等（含类型变化，如 `string` ↔ `object`、`number` ↔ `string`）→ `changed`。
- **类型从基础值变为容器**（或反之）整体记为 `changed`（左右各自按其原貌渲染，不做跨类型子树对齐）。
- **嵌套 JSON 字符串**：对某叶子路径，若 `options.shouldParseNested(path)` 为真，且两侧值都满足 `isLikelyJsonString`，则各自 `JSON.parse` 后作为子结构递归 diff，节点 `nestedParsed = true`；任一侧解析失败则回退为普通字符串比较。
- **相等判定**：基础值用严格相等；容器通过递归比较得出，不依赖 `JSON.stringify` 顺序，从而对键顺序不敏感。

## 4. 界面、交互与配色

### 布局（side-by-side）

- 上方：左右两个输入框（**A（旧）** / **B（新）**），各自带字符数与解析状态提示（有效 / 无法解析，复用主工具的提示风格）。
- 两侧都解析成功时，实时（`useMemo`）计算 diff 并在下方渲染结果（与主工具「输入即时出树」体验一致）。
- 下方：**汇总条** `+N 新增 · -N 删除 · ~N 修改` + **控制条**，再下是并排 diff 结果。
- 并排结果由同一棵 diff 树渲染，每个节点产出左右两格，保证左右行对齐：
  - `removed`：左格有内容（红），右格留空占位。
  - `added`：左格留空占位，右格有内容（绿）。
  - `changed`：左格旧值（红 token），右格新值（绿 token）。
  - `unchanged`：两侧一致，不高亮。
  - 容器（`children`）：左右同步展开 / 折叠。

### 控制条

- **展开层级**：与主工具一致的层级下拉（1–5 / 全部）。
- **仅显示差异**：开启后折叠（隐藏）全部 `unchanged` 子树，只保留含差异的路径，便于大 JSON 定位。
- **全部解析嵌套**：一键把所有 `isLikelyJsonString` 的字符串作为 JSON 解析后比较；关闭时回到默认逐个手动展开。
- 单个 nested 候选叶子：行内提供「嵌套解析」按钮，按路径手动展开（与现有结构树交互一致）。这些手动展开的路径与「全部解析嵌套」共同构成 `shouldParseNested` 谓词。

### 配色（GitHub 语义，适配现有调色板）

新增 CSS 变量（值绿用调色板 `--ok` 系，红用 `--accent` 系，落在 `--paper` 背景上不突兀）：

```
--diff-add-bg:    rgba(61,107,69,.12);   --diff-add-line:  var(--ok);
--diff-del-bg:    rgba(184,69,60,.12);   --diff-del-line:  var(--accent);
--diff-token-add: rgba(61,107,69,.24);   --diff-token-del: rgba(184,69,60,.24);
```

- 行级：新增 / 删除整行用对应底色 + 左侧竖条（`--diff-*-line`）。
- token 级：`changed` 仅高亮变化的 value token（key 保持常态）。

### 实现约束

- 实现阶段使用 frontend-design skill 辅助打磨视觉细节，但必须沿用现有「编辑工程」调色板与排版（serif 标题、mono 值、paper/ink 体系），保证与主工具一致，不引入异质风格。

## 5. 数据流与状态

- `App`：`view`（由 hash 派生）。`hashchange` → setView；tab 点击 → 改 hash。
- `JsonDiff` 本地状态：`inputA`、`inputB`、`parseAll`、`parsedPaths: Set<string>`（手动展开）、`onlyDiff`、`expandLevel`、容器展开覆盖。
- `parsedA = tryParseJson(inputA)`、`parsedB = tryParseJson(inputB)`。
- `diff = useMemo(() => diffJson(a, b, { shouldParseNested }), [a, b, parseAll, parsedPaths])`，其中 `shouldParseNested(path) = parseAll || parsedPaths.has(path)`。

## 6. 错误处理

- 任一侧为空：提示「等待输入」，不渲染 diff。
- 任一侧解析失败：在该侧显示「无法解析 · <错误信息>」，不渲染 diff（与主工具一致）。
- 嵌套字符串解析失败：静默回退为普通字符串比较，不报错。

## 7. 测试

`src/utils/jsonDiff.test.ts`（`node --test`，加入 `package.json` 的 `test` 脚本）覆盖：

- 对象：新增 key、删除 key、修改 value、键顺序不同但内容相同判 `unchanged`。
- 类型变化：`number` ↔ `string`、基础值 ↔ 容器。
- 数组：等长逐元素差异、长度不等的尾部 added / removed。
- 嵌套 JSON 字符串：`shouldParseNested` 开启时递归子 diff、解析失败时回退字符串比较。
- `summarizeDiff` 计数正确。

纯渲染组件（DiffTree/DiffRow）以手动验证为主（构建 + 实际运行观察），逻辑核心由 `jsonDiff` 单测保障。

## 8. 验证标准

- `pnpm test` 全绿（含新增 jsonDiff 单测）。
- `pnpm build`（`tsc -b && vite build`）通过，无类型错误。
- 运行后人工验证：tab 切换正确改 hash 并可前进 / 后退；并排高亮、仅显示差异、嵌套解析（逐个 + 一键）均符合预期；主（格式化）视图行为与重构前一致。
