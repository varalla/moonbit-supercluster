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
moon build --target js web-demo/mbapi   # 构建 web-demo 绑定产物 → target/js/release/build/web-demo/mbapi/mbapi.js（覆盖 web-demo/mbapi.js）
node web-demo/tools/serve.js            # 在线演示 http://localhost:8787
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
web-demo/                  浏览器在线演示（Leaflet + 广东六城 10 万点，详见 docs/ARCHITECTURE.md §7）
  mbapi/main.mbt           MoonBit 包装包：link.js.exports 导出 sc_version/sc_build_index/sc_clusters
  mbapi.js                 入库的 moon build JS 产物（改动 main.mbt 后需重建覆盖）
  app.js / index.html      地图页：__SC_* 胶水（必须先于动态 import 设置）+ 分档渲染 + 统计面板
  data/gd_points.json      10 万合成点（tools/gen_data.js 生成）
  tools/                   gen_data.js（造数据）/ serve.js（静态服务器，端口 8787，须 HTTP 访问）
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
- 测试包是 BlackboxTest，看不到私有值 → fixture/encode/decode 需 pub 或放 `*_test.mbt`；但**未限定名可用**（隐式 import，moon check 会给警告可忽略）
- `#derive(Debug)` 的 suberror 打印**不含消息负载** → 调试时在断言/catch 里加 println
- **续行不能以二元运算符开头**（`/ x` 报 parse error）→ 运算符放上一行行尾，或拆分子/分母变量
- `Result` 无 `is_err()` 方法 → 用 `match r { Err(...) => true, _ => false }` 判断
- `#|` 行字符串**不能缩进在括号内**（只能列 0 顶格）→ 需要内嵌 JSON 时定义顶层 `const X : String = #|...`
- 带默认值标签参数的构造器：`Supercluster::new(Options::new(coord_system=Gcj02, regions=...))`（new 接收位置参数 Options）
- 函数返回 `Result[.., XxxError]` 时 catch 标注：`let r : Result[_, XxxError] = try Ok(f()) catch { e => Err(e) }`

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

- `docs/ARCHITECTURE.md`：逐文件实现详解；§1.1「索引语义澄清 FAQ」——(1) 索引建在 [0,1] 墨卡托 + Int32 编码上；(2) load() 全量预建 maxZoom+2 棵树、查询按需（无磁盘 IO/惰性加载，拉近=查内存里更高 zoom 的树）；(3) 仅坐标索引，属性存平行数组 props[] 按点号附带，按名称检索不支持；§7「web-demo 浏览器端绑定」——数据流（Float64Array 平铺 + extern "js" 逐点访问器）、link.js.exports 导出机制、胶水函数必须先于动态 import 设置、产物入库策略；§7.5 JS 调用速查（三步）
- README/README_zh：新增「索引原理 / How indexing works」节（FAQ 精简版）+「浏览器在线演示 / Browser demo」节（web-demo 运行方式与绑定说明）+ 顶部状态行（🚧 开发中）

## 扩展功能（2026-11-23 新增，26/26 测试 = 17 对拍 + 9 扩展）

- **坐标系输入**（`src/coord.mbt`）：`Options.coord_system~`（默认 Wgs84 = 不开启），可选 Gcj02/Bd09。load() 投影前纠偏到 WGS-84，feature_json 输出前还原回输入坐标系（GCJ 数据配高德底图）。GCJ→WGS 逆变换**固定迭代 2 次**（round-trip 误差 ~3e-9 度 ≈ 0.3mm；单次近似是 1–2m）；正变换精确；境外点（out_of_china 矩形）直通。6 个转换函数 pub 可独立用。对拍：eviltransform 系 JS 公式独立生成期望值，容差 1e-9 度。
- **多边形区域**（`src/polygon.mbt`）：`Options.regions~`（默认空数组 = 关闭），传 `parse_polygons(json)` 解析的 GeoJSON Polygon/MultiPolygon/FeatureCollection，**数组下标即 region id**。load() 时每点做 even-odd 射线法 PIP（带洞支持）**锚定**到 region_ids[i]（-1=区域外），层级索引行为不变；`get_clusters_in_region(region_id, bbox..., zoom)`：**簇按中心**判定（中心还原到输入坐标系后 PIP——用户确认的语义：跨边界簇整体归中心侧，缩放后同规则）、单点按锚定 id 精确匹配；无效 id 抛 `PolygonError`。实现用 `get_clusters_pred`（get_clusters 的 predicate 内部变体，日期线递归生效）。
- **设计取舍（用户拍板）**：序列化/反序列化方案**放弃不做**；两功能均为边界层，默认关闭时行为与上游逐位一致（17 个对拍测试未动）。未来可拓展方向：MVT 瓦片二进制输出、KNN、增量更新、Wasm 验证。
- 提交拆分手法：`supercluster.mbt`/`features_test.mbt` 两功能交织 → 先备份完整版到 %TEMP%，摘除 region 部分跑 22/22 提交 coord，再恢复跑 26/26 提交 region（每次提交独立编译全绿）。

## 黑客松提交流程要点（2026-11-20 对话）

- 组委会不会主动看仓库 → 必须通过原报名渠道（表单/群/Issue）主动回复「已完成」+ 仓库链接 + 成果一句话 + 演示方式
- 真正完成时的标记动作清单：README 状态行改 ✅ → 打 tag（附注测试结果）→ 建 Release → `moon publish` 到 mooncakes.io → 录 demo 视频/截图
- 当前阶段只推代码与文档，不做任何"完成"性质的对外标记

## Demo 材料清单（标记立项/评审阶段，2026-11-20）

**【立项】报名初立项阶段需先准备（当前全部就绪，只差填表单）：**

1. ✅ 可运行代码仓库（gitee+GitHub 双仓库，GitHub 仓库已确认为 public：匿名访问仓库页与 API 均 200，2026-11-23）
2. ✅ 项目简介文案（一句话+亮点，README 开头可直接复用：纯 MoonBit 移植 mapbox/supercluster 含 kdbush；26/26 对拍全绿；扁平整数数组；JS 后端可用，核心库 wasm/wasm-gc 测试通过）
3. ✅ 可复现验证命令（`moon test --target js` / `moon run examples/demo --target js`）
4. ✅ demo 运行演示（examples/demo 控制台版 + web-demo 在线地图版，web-demo 已含 GCJ-02 切换与六市区域筛选两个扩展功能演示）
5. ✅ 报名表基础字段（项目名/团队联系方式/仓库链接/立项编号）——**2026-11-22 已通过报名渠道提交，进入立项/初审阶段**

**【评审】作品提交/评审阶段再补：**

6. ⚠️ 对拍验证证据截图（`moon test` 输出 "Total tests: 26, passed: 26"，5 分钟可补）
7. ❌ 演示视频（1–5 分钟：介绍→测试全绿→demo→地图效果；Win+G 或 OBS 录制）
8. ❌ 效果截图/GIF（2–3 张：测试输出、demo 输出、地图渲染）
9. ❌ mooncakes.io 发布（可选硬证据，需注册 moonbitgis 账号后 `moon publish`；注意与"未完成"口径的关系）
10. ✅ 在线地图体验页（web-demo：Leaflet 真实地图 + 广东 10 万点聚合，一举三得——同时产出 #4 增强版/#6/#8 的素材；演示录屏 #7 仍需录制）

**最小补齐路径**：必做 = #6 截图 + #7 录屏（跑一遍测试+demo+web-demo 后一次性录完；web-demo 素材已有，见 #10）。

## 待办 / 后续方向

- [ ] mooncakes.io 发布（`moon publish`，需注册 moonbitgis 账号）
- [ ] Wasm 绑定产物落地（核心库已验证：`moon test --target wasm-gc src` / `--target wasm src` 均 26/26 全绿，2026-11-23；卡点在 web-demo/mbapi 的 `extern "js"` 不支持 wasm-gc 后端，需重写 FFI——宿主一次性喂数据 + 字符串缓冲区出参 + loader.js，浏览器不能直接 import .wasm；当前对外产物仅 JS 后端 mbapi.js）
- [ ] 性能基准对比原版 JS（100 万点 load + 查询耗时）
- [ ] 黑客松提交材料（演示视频/截图）
