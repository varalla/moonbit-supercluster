# 项目记忆：moonbit-supercluster（Trae 项目规则 / Project Memory）

> 本文件是项目工作记忆，随仓库同步。更换设备后 `git pull` 即可让 Trae 恢复全部上下文。

## 项目概述

- **定位**：MoonBit 黑客松 2026 参赛项目——纯 MoonBit 移植 [mapbox/supercluster](https://github.com/mapbox/supercluster)（含内嵌 [mourner/kdbush](https://github.com/mourner/kdbush)），海量地图点聚合库。mooncakes.io 无同类实现（已实测检索）。
- **仓库**：双仓库——gitee `https://gitee.com/YWNdesign/moonbit-supercluster`（origin，主仓库）+ GitHub 镜像 `https://github.com/varalla/moonbit-supercluster`（remote 名 `github`）。**注意：本地 master 已跟踪 github/master**，默认 push 会去 GitHub，推 gitee 需显式 `git push origin master`。
- **本地路径**：`C:\Users\Admin\Desktop\前端项目\moonbit-supercluster`
- **模块名**：`moonbitgis/supercluster`，版本 0.1.0，License BSD-2-Clause（与上游一致，注明衍生作品归属）
- **状态**：🚧 **开发中（对外口径）**——技术上 17/17 测试全绿（对拍原版套件）、demo 可运行、双语 README 已推送，但**作品尚未完成，只是可运行 demo**。README 状态行写「🚧 开发中」，任何对外材料不得声称已完成；曾按"已完成"打过 `v0.1.0` tag 后按用户要求撤回（本地+双远程已删），真完成前勿再打 release tag。

## 构建与验证命令

本机无 C 编译器 → **native 不可用，统一用 JS 后端**（node v16 可用）：

```
moon test --target js          # 17/17 全绿
moon run examples/demo --target js
```

moon CLI 不在 PATH，需全路径调用：`& "$env:USERPROFILE\.moon\bin\moon.exe" <cmd>`，且必须在项目目录运行（cwd 带上）。

## 目录结构

```
src/
  geo.mbt                  墨卡托投影（lng_x/lat_y/x_lng/y_lat）、js_round（(d+0.5).floor() 对齐 Math.round）
  kdbush.mbt               静态 KD-tree：Int32 扁平数组 + Floyd-Rivest select + 迭代 range/within DFS
  supercluster.mbt         核心 ~700 行：load/get_clusters/get_children/get_leaves/get_tile/expansion zoom/map+reduce
  geojson.mbt              parse_geojson_points：GeoJSON Point/MultiPoint → Array[InputPoint]
  places_fixture_test.mbt  上游 places.json fixture（#| 行字符串嵌入，114KB）
  supercluster_test.mbt    17 个测试，期望值逐字取自原版 test/test.js
examples/demo/             可运行示例（2000 合成点）
```

## 对拍对齐的关键语义（改代码前必读）

1. **null geometry 要素保留槽位**：原版 `i++; continue`，点索引与输入要素对齐；`numPoints` 按 feature 计数（places.json = 163 而非 162 实际点数），cluster_id = `(i/stride << 5) + (zoom+1) + num_points`，此口径错了 id 会整体偏移。
2. **无 reduce 时 stride=6**，`data[k+OFFSET_PROP]` 是垃圾值；原版 JS 越界读静默得 `undefined`→`Object.assign({}, undefined)` 得 `{}`。MoonBit 用显式边界检查（`prop_index >= 0 && < cluster_props.length()`）复现可见行为，get_cluster_properties 里。
3. **point_count_abbreviated**：count < 1000 时是**数字**不是字符串（JSON 里无引号）；≥1000 才是 "4.1k" 字符串。
4. **墨卡托 y 向南增大**：`lat_y(-1) > lat_y(1)`，写 range/bbox 查询时 min_y 必须用 lat_y(max_lat)。
5. `encode(c) = ((c-0.5)*2^30).to_int()`；SCALE_F = 1073741824.0。

## MoonBit 语法坑（2026-11 工具链，moon 0.1.20261117）

- Json 新枚举 API：`Number(Double, repr~)/String/Array/Object(Map)/Null/True/False`；相等比较用 `Json::equal`；解析 `@json.parse`（catch 后错误是 `@json.ParseError`，有 `to_string()`）
- `"""` 三引号不可用 → `#|` 行字符串（会正确拼接换行）
- 插值 `\(...)` 弃用 → `\{expr}`；浮点字面量必须带点（`1.0e-12`，`1e-12` 报错）
- 错误类型：`pub(all) suberror XxxError { XxxError(String) }` + 前置 `#derive(Debug)`；`!Err` 标注仅弃用警告；catch 里 `e` 是 Error 接口**没有 to_string**，需标注 `Result[_, @json.ParseError]` 再取
- `f!(...)` 调用已移除、`try?` 已移除 → `try Ok(expr) catch { e => Err(e) }`
- 结构体跨包不能用字面量 → 工厂函数（如 `InputPoint::make`）；`mut` 写在字段前 `mut field : Type`
- `@math` 无 log/sqrt → `@math.ln`、内置 `.sqrt()`；顶层常量用 `const NAME : Type`
- `Map::new()` 弃用 → `Map([])`
- moon.pkg DSL：`import { "pkg" @alias, }`（逗号分隔）；moon.mod 为 TOML
- 测试包是 BlackboxTest，看不到私有值 → fixture/encode/decode 需 pub 或放 `*_test.mbt`
- `#derive(Debug)` 的 suberror 打印**不含消息负载** → 调试时在断言/catch 里加 println

## 环境注意事项

- Shell 沙箱会拦截对项目目录的写操作 → moon/git/复制等命令需 `dangerouslyDisableSandbox: true`
- PowerShell 不支持 `cat <<'EOF'` heredoc → git commit 多行消息用多个 `-m` 参数
- **不要用 PowerShell Set-Content 改 moon.mod 等配置文件**——会加 BOM 导致 moon 解析报 "Lexing error at 0..3"，改用编辑工具
- moon 测试 stderr INFO 日志噪音大，过滤 `Total tests|ASSERT FAIL` 看结果

## 约定

- 对拍期望值改动必须同步跑原版 JS（此前用 %TEMP% 下 sc_index.js + sc_places*.json 生成 fixture）
- 测试失败消息通过 `expect_true` 内嵌 println("ASSERT FAIL: ...") 输出（Debug 不打印负载）
- git push：**默认只推 gitee**（`git push origin master`）；GitHub 镜像按用户指示单独推。GitHub 连接不稳（Connection reset/超时常见），失败直接重试一次即可
- commit 消息：用户要求"不做明确备注"时用模糊风格 `chore: misc config`（参考 9258c4b/aea574b）；正式功能提交用描述性英文标题（参考 becd611/d4514f8/78fef69）

## 文档体系（2026-11-20 新增）

- `docs/ARCHITECTURE.md`：逐文件实现详解；§1.1「索引语义澄清 FAQ」——(1) 索引建在 [0,1] 墨卡托 + Int32 编码上；(2) load() 全量预建 maxZoom+2 棵树、查询按需（无磁盘 IO/惰性加载，拉近=查内存里更高 zoom 的树）；(3) 仅坐标索引，属性存平行数组 props[] 按点号附带，按名称检索不支持
- README/README_zh：新增「索引原理 / How indexing works」节（FAQ 精简版）+ 顶部状态行（🚧 开发中）

## 黑客松提交流程要点（2026-11-20 对话）

- 组委会不会主动看仓库 → 必须通过原报名渠道（表单/群/Issue）主动回复「已完成」+ 仓库链接 + 成果一句话 + 演示方式
- 真正完成时的标记动作清单：README 状态行改 ✅ → 打 tag（附注测试结果）→ 建 Release → `moon publish` 到 mooncakes.io → 录 demo 视频/截图
- 当前阶段只推代码与文档，不做任何"完成"性质的对外标记

## 待办 / 后续方向

- [ ] mooncakes.io 发布（`moon publish`，需注册 moonbitgis 账号）
- [ ] Wasm 后端验证（`moon test --target wasm`，当前仅验证 JS）
- [ ] 性能基准对比原版 JS（100 万点 load + 查询耗时）
- [ ] 黑客松提交材料（演示视频/截图）
