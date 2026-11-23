# moonbit-supercluster 项目结构与实现逻辑详解

> 本文面向想要理解/参与开发的读者，逐文件拆解项目结构，并深入讲解移植的算法核心。
> 上游参考：[mapbox/supercluster](https://github.com/mapbox/supercluster) v7（JS）、[mourner/kdbush](https://github.com/mourner/kdbush)（JS）。
> 配套阅读：[README.md](../README.md)（使用手册）/ [README_zh.md](../README_zh.md)（中文使用手册）

## 1. 总体架构

```
GeoJSON 字符串
      │  @json.parse（moonbitlang/core/json）
      ▼
┌──────────────┐   Array[InputPoint]   ┌───────────────────────────────┐
│  geojson.mbt │ ────────────────────► │        supercluster.mbt       │
│  输入适配层   │                       │  load() 一次性构建 zoom 层级   │
└──────────────┘                       │                               │
                                       │  z16: KD-tree ─ 聚类 ─► z15   │
                                       │  z15: KD-tree ─ 聚类 ─► z14   │
                                       │  ...自顶向下逐层聚类...        │
                                       │  z1:  KD-tree                 │
                                       └──────────────┬────────────────┘
                                                      │ 查询
                     get_clusters / get_children / get_leaves /
                     get_cluster_expansion_zoom / get_tile
                                                      ▼
                                              Array[Feature] / Array[TileFeature]
```

三条设计原则（均与上游一致）：

1. **一次性预计算**：`load()` 期间从最大 zoom 向最小 zoom 逐层聚类并各建一棵 KD-tree，之后所有查询都是纯遍历。
2. **整数化热路径**：坐标编码为 Int32（scale 2³⁰），聚类与查询全程整数运算，与 JS 原版的 SMI 快路径对齐。
3. **扁平数据槽**：所有点/簇记录存进一个 `FixedArray[Int]`，每条记录 `stride` 个字段，无逐点对象，缓存友好。

### 1.1 索引语义澄清（FAQ）

**Q1：索引是建立在 0–1 墨卡托上的吗？**

是。所有经纬度先经 [lng_x / lat_y](../src/geo.mbt#L7-L22) 映射到 Web 墨卡托的 **`[0, 1]`** 区间（y 向南单调递增、纬度在极点截断），随后编码为 Int32：

```
encode(c) = ((c - 0.5) * 2^30).to_int()   // supercluster.mbt L155
```

之后 KD-tree 的排序、bbox `range` 查询全部在这批 Int32 上进行，浮点数只出现在输入/输出边界。

**Q2：是"只读局部数据、拉近时再读"吗？**

一半对：

- **查询是按需的**：`get_clusters(bbox, zoom)` / `get_tile(z,x,y)` 只对对应 zoom 层的树做 range 查询，**返回**视口内的那一小部分簇/点；拉近后簇经 `get_children` 展开为子簇乃至单点，观感上像"加载更多"。
- **建索引是全量的**：`load(points)` 一次性把全部点投影编码，自 maxZoom 向下逐层聚合，**预建 0..maxZoom+1 共 maxZoom+2 棵 KD-tree**。地图拉近拉远只是换一个 zoom 参数去查内存里已有的另一棵树——没有任何重新读取或重建。原始数据必须全部驻留内存，本库不做磁盘 IO、不做惰性加载。

**Q3：只建了坐标索引，无法按名称等其他字段查询吗？**

对。KDBush 只索引 `(x, y)` 两个 Int32 通道，KD 排序也只按坐标。名称等属性的处理方式是：

- 每个原始点的 properties 存在 `props[]` 数组，按点号 `OFFSET_ID` 对齐（[load 时写入](../src/supercluster.mbt#L238)）；
- 输出 feature 时按点号回查并附带（[feature_json](../src/supercluster.mbt#L651-L652)）；簇属性靠用户提供的 `map`/`reduce` 在建索引时聚合（见 5.7）。

因此"按名称找点"在本库（及上游 mapbox/supercluster）中均不支持——只能线性扫描 `props` 数组，或在应用层自建名称 → 点号的二级索引。

## 2. 目录结构

```
moonbit-supercluster/
├── moon.mod                    模块定义（TOML）：moonbitgis/supercluster 0.1.0
├── LICENSE                     BSD-2-Clause（含上游归属声明）
├── README.md / README_zh.md    双语使用文档
├── docs/ARCHITECTURE.md        本文
├── .trae/rules/                Trae 项目记忆（随仓库同步）
├── src/
│   ├── geo.mbt                 墨卡托投影 + JS 兼容数值函数（~55 行）
│   ├── coord.mbt               坐标系输入：WGS-84/GCJ-02/BD-09 纠偏（§12.1）
│   ├── polygon.mbt             多边形区域：PIP 射线法 + GeoJSON 解析（§12.2）
│   ├── kdbush.mbt              静态 KD-tree（~320 行）
│   ├── supercluster.mbt        聚类核心（~760 行）
│   ├── geojson.mbt             GeoJSON 输入适配器（~100 行）
│   ├── places_fixture_test.mbt 上游 places.json fixture（行字符串嵌入）
│   ├── supercluster_test.mbt   17 个对拍测试（期望值逐字取自上游）
│   └── features_test.mbt       扩展功能测试：坐标对拍 + 区域锚定（9 个）
├── examples/demo/main.mbt      可运行示例：2000 合成点 + 聚类统计 + tile 查询
└── web-demo/                   浏览器在线演示（纯静态站点，见 §7）
    ├── index.html / app.js     地图页：胶水函数、Leaflet 渲染、统计面板
    ├── mbapi/main.mbt          MoonBit 包装包（link.js.exports 导出绑定）
    ├── mbapi.js                入库的 JS 后端编译产物（moon build 输出）
    ├── data/gd_points.json     广东省六城 10 万合成点（tools/gen_data.js 生成）
    └── tools/                  gen_data.js（造数据）/ serve.js（静态服务器）
```

## 3. geo.mbt —— 投影与 JS 兼容层

| 函数 | 作用 |
| --- | --- |
| [lng_x / lat_y](../src/geo.mbt#L7-L23) | 经纬度 → 球面墨卡托 `[0,1]`。`lat_y` 用 `atan(exp(π·(1-2y)))` 反解，注意 **y 向南单调递增**（`lat_y(-1) > lat_y(1)`），写 bbox 查询时 min/max 必须换向 |
| [x_lng / y_lat](../src/geo.mbt#L25-L35) | 上述逆变换，用于把内部坐标还原为经纬度输出 |
| [js_round](../src/geo.mbt#L37) | `(d + 0.5).floor()`，复现 JS `Math.round` 的"半数向上"语义（MoonBit `.round()` 是银行家舍入） |
| `int_max / int_min / double_max / double_min` | 无分支辅助函数 |

## 4. kdbush.mbt —— 静态 KD-tree

KDBush 是 supercluster 的底层空间索引：**只支持点、构建后不可修改、查询极快**。

### 4.1 数据布局

```moonbit
pub struct KDBush {
  node_size : Int               // 每节点点数（64 默认），叶子线性扫描阈值
  num_items : Int
  mut pos : Int                 // add() 写入游标
  mut finished : Bool
  ids    : FixedArray[Int]      // 点 id，按 KD 顺序排列
  coords : FixedArray[Int]      // 2i=经度编码, 2i+1=纬度编码，与 ids 平行
  mut data : FixedArray[Int]    // supercluster 层级数据的引用（供查询回调取记录）
}
```

### 4.2 构建：Floyd–Rivest 选择代替排序

[kd_sort](../src/kdbush.mbt#L235-L253) 递归分治：按 x/y 交替轴把中位点转轴，左侧子树轴垂直于父轴。
关键在 [kd_select](../src/kdbush.mbt#L254)：不是完整排序，而是 **Floyd–Rivest 选择算法**——只在 `[left, right]` 区间内选出中位、把更小的挪到左边，复杂度近似 O(n)。它有两个阶段：

- **Floyd 循环**：区间大于 600 时用采样把目标区间收缩到中位数附近（`n/8` 窗口）；
- **Floyd 聚类选择**：短区间内每次划分把相等的元素聚到一侧，避免重复元素退化。

`[kd_swap_item](../src/kdbush.mbt#L314)` 同时交换 `ids` 与 `coords` 两个平行数组。

### 4.3 查询：迭代式 DFS + 手工栈

- [range](../src/kdbush.mbt#L64)：bbox 查询。用 `FixedArray[Int]` 当手工栈（容量 192，够 30 层深），循环代替递归；`distX/node_size` 剪枝决定是否下潜子树。
- [within](../src/kdbush.mbt#L143)：半径查询，返回所有距 `(qx,qy)` 小于 `r` 的点 id，供聚类阶段找邻居。

## 5. supercluster.mbt —— 聚类核心

### 5.1 坐标编码：Int32 Mercator

```
encode(c) = ((c - 0.5) * 2^30).to_int()      // [supercluster.mbt L155]
decode(v) = v / 2^30 + 0.5                    // [L159]
```

`[0,1]` 的墨卡托坐标映射到 ±2²⁹ 的整数区间，精度约 ±1e-9（≈ 厘米级），与 JS 原版 `(c - 0.5) * SCALE` 落入 SMI 快路径的行为一致。

### 5.2 扁平槽布局（stride = 6 或 7）

每条点/簇记录占 `stride` 个 `Int`：

```
偏移          字段              点(leaf)          簇(cluster)
k + 0        x                 经度编码          加权中心经度编码
k + 1        y                 纬度编码          加权中心纬度编码
k + OFFSET_ZOOM(2)   zoom      "未处理"哨兵      簇所属 zoom
k + OFFSET_ID(3)     id        原始点索引 i       cluster_id（见 5.3）
k + OFFSET_PARENT(4) parentId  -1                父簇 cluster_id
k + OFFSET_NUM(5)    num       1                 聚合点数
k + OFFSET_PROP(6)   props     （仅 stride=7）   cluster_props 下标
```

- 无 `reduce` 时 `stride = 6`，此时上游 JS 会越界读 `OFFSET_PROP` 槽并被静默当作 `undefined`；移植版用显式边界检查（`prop_index >= 0 && < cluster_props.length()`）复现同样的可见行为——簇属性退化为 `{}`。
- 输出侧平行数组：`props[i]`（原始点属性）、`coords[2i]`（原始 Double 墨卡托坐标，单点输出零漂移）、`ids[i]`（原始要素 id）。

### 5.3 cluster_id 位打包

```
cluster_id = (origin_index << 5) + (zoom + 1) + num_points     // L565
origin_index = (cluster_id - num_points) >> 5                   // get_origin_id
origin_zoom  = (cluster_id - num_points) % 32                   // get_origin_zoom
```

5 个低位存 zoom（0..30），高位存该 zoom 层槽位号；`+ num_points` 把簇 id 空间平移到点 id 空间之上，保证互不冲突。`generate_id=true` 时另发一个从 0 递增的对外 id（存在 OFFSET_ID 槽）。

### 5.4 load()：自顶向下逐层聚类

[load](../src/supercluster.mbt#L192-L270) 流程：

1. 展开 MultiPoint（每个坐标一条记录）；**无 geometry 的要素保留一个空槽**，`i++` 跳过 —— 点索引与输入要素对齐，`num_points` 按 feature 计数（上游行为，直接影响 cluster_id 口径）。
2. 为每个点写一条 leaf 记录（`OFFSET_ZOOM = max_zoom + 1` 哨兵、`OFFSET_NUM = 1`、`OFFSET_PARENT = -1`），建 `trees[max_zoom + 1]`。
3. `z` 从 `max_zoom` 循环到 `min_zoom`：对上一层的数据跑 [cluster_points](../src/supercluster.mbt#L518) 得到下一层，建 `trees[z]`。
4. 若某层聚类没有合并任何点（`written == prev_num`），**复用父层树**（与上游 `_limitZoom` 语义一致）。

### 5.5 cluster_points：单层聚类算法

[cluster_points](../src/supercluster.mbt#L518-L627) 对每个点：

1. 已处理过（`zoom <= z`）则跳过；否则打上 `zoom = z` 标记。
2. `tree.within_into(x, y, r, neighbor_ids)` 找半径 `r = radius / (extent · 2^z) · 2^30` 内所有未处理邻居，累加各自的 `numPoints`。
3. **成簇条件**：邻居贡献 > 自身点数 且 总数 ≥ `min_points`。
4. 成簇时写一条簇记录到输出：坐标为点数加权中心，`OFFSET_PARENT` 回填到每个被合并的邻居（构成树形），累计 `map/reduce` 属性到 `cluster_props`。
5. 单点不成簇时原样复制到下一层，并把 `OFFSET_ZOOM` 标为当前 zoom（防止重复处理）。

### 5.6 查询接口

| 接口 | 实现 |
| --- | --- |
| [get_clusters](../src/supercluster.mbt#L275) | 取 `trees[limit_zoom(z)]` 做 `range` 查询；**跨日期变更线的 bbox 拆成东/西半球两次查询再合并**，与上游的退化 bbox 特判一致。输出经 `feature_json` 转成 `Feature` |
| [get_children](../src/supercluster.mbt#L319) | 取 origin 层 +1 层的树，`range` 查父簇坐标点，过滤 `OFFSET_PARENT == cluster_id`；找不到抛 `ClusterError` |
| [get_leaves](../src/supercluster.mbt#L350) | 迭代 [append_leaves](../src/supercluster.mbt#L363)：簇 → children 递归下潜，遇 leaf 收集，支持 `limit/offset` 分页 |
| [get_cluster_expansion_zoom](../src/supercluster.mbt#L450) | 从 origin zoom 逐层取 children，直到某层展开为多于 1 个子项 |
| [get_tile](../src/supercluster.mbt#L398) | 按 `2^z` 计算瓦片边界并**外扩 radius**（捕捉跨界簇），`range` 查询后由 [add_tile_features](../src/supercluster.mbt#L479) 把坐标归一化到 `extent × extent` 像素空间，产出 `TileFeature{x, y, tags, id}`；簇/点的 tags 均含 `point_count(_abbreviated)`，缩写格式对齐 JS `Number::toString` |

### 5.7 map / reduce 属性聚合

```moonbit
pub struct Options {
  ...
  map    : Json -> Json                 // 每点进入聚合前的投影（默认恒等）
  reduce : Option[(Json, Json) -> Unit] // Some(fn(acc, child)) 逐子项折叠
}
```

- 聚类时（[L576-L588](../src/supercluster.mbt#L576-L588)）：首个成员 `map(clone)` 作为 acc 存入 `cluster_props`，此后每个成员 `reduce(acc, map(child))`。
- 跨 zoom 簇合并时对已有簇做浅拷贝再继续 reduce（[shallow_clone_json](../src/supercluster.mbt#L711)），避免破坏父层数据。
- `reduce = None` 时走 5.2 所述的越界复现路径。

### 5.8 Feature / TileFeature 输出

- `Feature{id, properties, lng, lat, is_cluster, cluster_id, point_count}` —— 簇的坐标经 `decode` 还原为经纬度；单点直接用原始 Double 坐标（**零编码漂移**）。
- `id` 字段：簇为数字；单点取原始 GeoJSON 要素 id（`Option[Json]`）。

## 6. geojson.mbt —— 输入适配

[parse_geojson_points](../src/geojson.mbt#L12) 接收 FeatureCollection 字符串：

1. `@json.parse` 解析（失败抛 `GeoJSONError`）；
2. 遍历 features：`Point` → 单坐标；`MultiPoint` → 展开为多条记录；其他 geometry 类型（如无 geometry）→ 保留占位（维持索引对齐）；
3. [parse_pos](../src/geojson.mbt#L78) 校验 `[lng, lat]` 均为 JSON 数字，越界经纬度同样编码（与上游一致，不裁剪）。

## 7. web-demo —— 浏览器端绑定与在线演示

[`web-demo/`](../web-demo/) 是一个纯静态站点，把本库的 MoonBit JS 后端编译
产物接入 Leaflet，对广东省六城共 **10 万合成点**做真实地图聚合——这是
「JS 后端 + 浏览器场景」的端到端验证，也是黑客松演示素材的来源。

### 7.1 架构与数据流

```
gd_points.json（10 万点 [lng, lat, cityIdx]）
      │ fetch → app.js
      ▼
Float64Array 平铺 [lng, lat, cityIdx] × n ──► globalThis.__SC_DATA
globalThis.__SC_LNG / __SC_LAT / __SC_CITY    （JS 侧逐点访问器）
      │ extern "js" 逐点回调（main.mbt 顶部声明）
      ▼
┌──────────────────────────────────────────┐
│ web-demo/mbapi/main.mbt                  │
│  sc_set_regions(geojson) 解析城市边界 → 区域数组 │
│  sc_build_index(n, coord_sys) 组装 InputPoint → load() │
│  sc_clusters(bbox, zoom)  get_clusters → JSON 字符串 │
│  sc_clusters_in_region(id, bbox, zoom)   区域过滤查询 │
│  （moon.pkg: link.js.exports 导出表）     │
└──────────────────────────────────────────┘
      │ 返回紧凑 JSON 字符串
      ▼
app.js：Leaflet 分档渲染（簇 divIcon / 单点 circleMarker）+ 统计面板
```

### 7.2 绑定要点

- **导出机制**：[mbapi/moon.pkg](../web-demo/mbapi/moon.pkg) 用
  `link: { "js": { "exports": [...] } }` 把 `sc_version / sc_build_index /
  sc_clusters / sc_set_regions / sc_clusters_in_region` 挂到产物模块的
  ES 导出表上，`app.js` 通过 `await import('./mbapi.js')` 拿到（见产物
  [mbapi.js](../web-demo/mbapi.js) 末尾的 `export {...}`）。
- **胶水函数必须先于动态 import 设置**：MoonBit 产物在**模块加载时**就捕获
  `globalThis.__SC_*` 胶水函数引用（mbapi.js 顶部的三个 `const` 赋值），
  内部再惰性解引用 `__SC_DATA`——因此 app.js 先注册胶水再 `import`，
  顺序颠倒会拿到 undefined。
- **数据契约**：`__SC_DATA` 为 `Float64Array`，按 `[lng, lat, cityIdx]`
  平铺；MoonBit 侧经 `extern "js"` 声明三个访问器逐点读取，避免把 10 万点
  直接传给 JSON 解析器。城市名（cityIdx → 广州/深圳/…）在 MoonBit 侧查表
  转为点属性 `name`。
- **结果序列化**：`sc_clusters` 手写 `StringBuilder` 拼紧凑 JSON
  （`lng/lat` + 簇：`cluster/id/count`；单点：`cluster/name`），浏览器侧
  一次 `JSON.parse` 拿到整批，再经 Leaflet 渲染。
- **查询参数**：app.js 在 `moveend`/`zoomend` 时取地图视口 bbox 与
  `Math.round(getZoom())`（钳到 0–16）调 `sc_clusters`，与「查询按需、
  索引全量驻留内存」的语义一致（见 §1.1 Q2）。
- **产物**：`web-demo/mbapi.js` 是提交入库的编译产物，由
  `moon build --target js web-demo/mbapi` 生成于
  `target/js/release/build/web-demo/mbapi/mbapi.js`；改动 main.mbt 后需重新
  构建并覆盖（target/ 不入库，产物入库以保证静态站点开箱可用）。

### 7.3 渲染与统计

- 簇标记按 `count` 分四档（<10 / <50 / <200 / 其余）配尺寸与配色，对齐
  原版 supercluster 的分档风格；≥10000 显示为 "Nk" 缩写。
- 统计面板实时显示：绑定版本（`sc_version`，兼作 JS 绑定冒烟测试）、
  点位总数、索引构建耗时（含数据下载与 `load()`）、**当前坐标系**
  （WGS-84 / GCJ-02）、**区域筛选**（全部区域 / 选中城市）、当前 zoom、
  视野要素数（簇/单点拆分）、最大簇、最近一次查询耗时。
- **扩展功能演示控件**（右上角面板内，见 §12）：
  - 「切换 GCJ-02 数据」按钮：JS 侧把 WGS-84 数据正变换为 GCJ-02（模拟
    国内数据源），以 `coord_system = Gcj02` 重建索引——输出还原 GCJ-02
    与高德底图对齐；WGS-84 模式下可见 ~500m 底图偏移。
  - 「全部区域」下拉：六市行政区划（`data/gd_cities.json`，DataV GeoJSON，
    GCJ-02，feature 下标即 region id）以蓝色虚线叠加；选市后查询改走
    `sc_clusters_in_region`（簇按中心判定、单点按锚定 id），选中边界
    橙色高亮。坐标系/区域两个演示可叠加：WGS-84 模式下边界先在 JS 侧
    GCJ→WGS 还原再喂给索引，保证两模式 PIP 判定一致。

### 7.4 数据生成与运行

- [`tools/gen_data.js`](../web-demo/tools/gen_data.js)：按六城中心 +
  高斯扰动生成 10 万点（广州 2.8 万 / 深圳 2.4 万 / 东莞 1.4 万 /
  佛山 1.3 万 / 中山 1.1 万 / 珠海 1 万），写入 `data/gd_points.json`
  （模拟接口返回的本地数据）。
- [`data/gd_cities.json`](../web-demo/data/gd_cities.json)：六市行政区划
  边界（DataV 合并 FeatureCollection，GCJ-02 与高德瓦片对齐），顺序为
  广州/深圳/珠海/佛山/东莞/中山，properties 含 `name`/`adcode`。
- [`tools/serve.js`](../web-demo/tools/serve.js)：极简静态服务器，默认
  8787 端口。必须经 HTTP 访问而非 `file://`（fetch + ES module 限制）。

### 7.5 JS 调用速查

应用侧接入本库 JS 产物的完整调用序列（与 §7.2 绑定要点一一对应）。
每个函数的**输入参数、返回值与错误行为的逐项说明**（以 web-demo/app.js
真实用法为例）见 [JS_BINDING_API.md](JS_BINDING_API.md)：

```js
// 1) 注册胶水访问器 —— 必须先于动态 import（产物加载时捕获引用）
globalThis.__SC_DATA = null;
globalThis.__SC_LNG  = i => globalThis.__SC_DATA[i * 3];
globalThis.__SC_LAT  = i => globalThis.__SC_DATA[i * 3 + 1];
globalThis.__SC_CITY = i => globalThis.__SC_DATA[i * 3 + 2];
const { sc_version, sc_build_index, sc_clusters,
        sc_set_regions, sc_clusters_in_region } =
  await import('./mbapi.js');

// 2)（可选）设置多边形区域：GeoJSON 字符串 → 区域数组，数组下标即
//    region id；失败（非法 GeoJSON）返回 -1。须在 sc_build_index 之前调用
sc_set_regions(citiesGeojsonText);

// 3) 喂数据并建索引（一次性）：__SC_DATA 填为 [lng, lat, cityIdx] 平铺
//    Float64Array 后调用；coord_sys 0 = WGS-84（默认），1 = GCJ-02 输入
//    （内部纠偏回 WGS-84 聚类，输出还原 GCJ-02）。返回索引点数
sc_build_index(pts.length, 0);

// 4) 视口查询（按需）：bbox 四至 + 整数 zoom，返回 JSON 字符串
const feats = JSON.parse(sc_clusters(w, s, e, n, zoom));
// 簇:   { lng, lat, cluster: true,  id, count }
// 单点: { lng, lat, cluster: false, name: "广州" }

// 5)（可选）区域过滤查询：簇按中心判定（还原到输入坐标系后 PIP），
//    单点按 load 时锚定的 region id；无效 id 返回 "[]"
const rfeats = JSON.parse(sc_clusters_in_region(0, w, s, e, n, zoom)); // 0=广州
```

导出函数签名（MoonBit 侧，见
[mbapi/main.mbt](../web-demo/mbapi/main.mbt)）：

- `sc_version() -> String` —— 版本串，兼作绑定冒烟测试
- `sc_set_regions(geojson : String) -> Int` —— 解析城市边界 GeoJSON 为
  多边形区域，返回区域数（-1 = 解析失败）
- `sc_build_index(count : Int, coord_sys : Int) -> Int` —— 逐点读取数据、
  组装 `InputPoint`、`load()` 全量预建（`coord_sys`: 0 = Wgs84、
  1 = Gcj02），返回索引点数
- `sc_clusters(min_lng, min_lat, max_lng, max_lat : Double, zoom : Int)
  -> String` —— bbox 视口查询，手写 StringBuilder 序列化为紧凑 JSON
- `sc_clusters_in_region(region_id : Int, min_lng, ..., zoom) -> String`
  —— 区域过滤查询，失败/无效 id 返回 `"[]"`

## 8. 测试与对拍策略

26 个测试全部在 `moon test --target js` 下运行，分两部分：

**核心对拍（17 个）**，方法是**对拍（parity testing）**：

- 期望值（簇 id、点数、tile 坐标、展开 zoom、children/leaves 内容）逐字取自上游 `test/test.js` 及其 `places.json` fixture（159 个点，嵌入 [places_fixture_test.mbt](../src/places_fixture_test.mbt)）；
- tile 测试逐字节比对 `tags`（含 cluster/cluster_id/point_count/point_count_abbreviated）；
- 覆盖边界：`generateId` 序列、null-property 要素、跨日期变更线 bbox、退化 bbox 计数（26/27/26/25/25/25/61）、同坐标点、MultiPoint、零输入、`map/reduce` 求和链路、`minPoints/radius/extent/maxZoom` 各选项。

**扩展功能（9 个，[features_test.mbt](../src/features_test.mbt)）**：

- 坐标转换对拍：wgs84↔gcj02、gcj02↔bd09、bd09→wgs84 各转换与独立 JS 实现（eviltransform 系公式）比对，容差 1e-9 度；境外点直通；
- 多边形：带洞 PIP（甜甜圈奇偶规则）、GeoJSON FeatureCollection/MultiPolygon 解析、Point 几何拒绝；
- 区域端到端：load 锚定 + `get_clusters_in_region` 簇中心判定、无效 region id 抛错、GCJ-02 输入 round-trip（输出还原到输入坐标系）。

## 9. 复杂度

| 操作 | 复杂度 |
| --- | --- |
| `load()` | O((max_zoom - min_zoom + 1) · n log n)：每层一次 Floyd–Rivest 构建（近似线性）+ 一遍聚类扫描 |
| `get_clusters` / `get_tile` | O(log n + k)，k 为命中数 |
| `get_children` / `get_leaves` / expansion zoom | O(log n + 子树大小) |
| 内存 | 每层 `n_layer × stride × 4` 字节 + 每树两份 Int32 数组 |

## 10. 与上游的差异点汇总

| # | 上游（JS） | 本移植（MoonBit） |
| --- | --- | --- |
| 1 | 越界读 `OFFSET_PROP` 得 `undefined` | 显式边界检查，可见行为一致（属性为空对象） |
| 2 | `Math.round` 半数向上 | `js_round = (d + 0.5).floor()` |
| 3 | 数字缩写经 `Number::toString` | `double_to_js_string` 复现同格式 |
| 4 | 无 geometry 要素 `i++; continue` 留洞 | 同样保留空槽，索引/cluster_id 口径一致 |
| 5 | 对象引用共享（reduce 副作用） | `shallow_clone_json` 显式浅拷贝，语义等价但更可控 |
| 6 | 递归 DFS（V8 栈深限制） | 手工栈迭代，无栈深风险 |

## 11. 开发者速查

```
moon test --target js                 # 全量测试（26/26：17 对拍 + 9 扩展）
moon run examples/demo --target js    # 控制台示例
moon build --target js web-demo/mbapi # 构建 web-demo 绑定产物
node web-demo/tools/serve.js          # 在线演示（http://localhost:8787）
```

- 本机无 C 编译器，native 后端不可用；日常用 `--target js`。
- **Wasm 后端实测（2026-11-23）**：核心库 `src` 为纯 MoonBit 无 FFI，
  `moon test --target wasm-gc src` 与 `moon test --target wasm src`
  均 **26/26 全绿**。但浏览器绑定层 [mbapi](../web-demo/mbapi/main.mbt)
  使用的 `extern "js"` 在 wasm-gc 后端**不支持**（实测报错），要出 wasm
  产物需重写绑定 FFI：宿主一次性喂数据（替代逐点回调）+ 字符串经
  缓冲区出参（wasm 导出签名仅数值类型）+ `fetch`/`instantiate` 的
  loader.js 胶水——浏览器不能直接 `import` `.wasm` 文件。当前对外产物
  以 JS 后端 `mbapi.js` 为准。
- 改聚类语义前先读 [5.2 槽布局](#52-扁平槽布局stride--6-或-7)与 [5.3 cluster_id 编码](#53-cluster_id-位打包)，测试期望值改动需回原版 JS 重新生成。
- 更多环境注意事项见 [.trae/rules/project_memory.md](../.trae/rules/project_memory.md)。

## 12. 扩展功能实现（2026-11-23）

**开发动机（真实业务痛点）**：WebGIS 实际项目开发中，常常要处理海量且
复杂的 POI 数据并快速展示空间分布，业务上又需要以市 → 区/县 → 街道 →
社区等行政区划为维度细分展示；同时数据源十分复杂——丰图地图、高德地图
等商业地图服务输出 GCJ-02 或 BD-09 坐标，政务单位内部通常使用非标准
坐标系、对外交换时才转为 WGS-84。上游 supercluster 只解决了「快」；
两个扩展分别对应这两类痛点：坐标系输入兼容常见业务坐标系，多边形区域
聚合支撑按行政区划粒度的过滤查询。

两个扩展均为**边界层功能**：核心聚类路径（[0,1] 墨卡托 Int32 索引、逐层聚类、
查询算法）完全不动，默认关闭时行为与上游逐位一致（17 个对拍测试逐字未改）。

### 12.1 坐标系输入：WGS-84 / GCJ-02 / BD-09（coord.mbt）

**问题背景**：国内地图数据因法规加密——GCJ-02（火星坐标，高德/腾讯）对
WGS-84 施加非线性扰动；BD-09（百度）在 GCJ-02 之上再加一层偏移。数据源
与底图坐标系不一致时要素整体偏移 300–700 米。现实数据源尤其复杂：
商业采购的地图服务（丰图地图、高德地图等）输出 GCJ-02 或 BD-09 坐标，
政务单位内部通常使用非标准坐标系、对外交换时才转为 WGS-84——库需要
开箱兼容这些常见业务坐标系。

**设计：边界转换，不动索引核心**

```
输入(GCJ-02/BD-09) ──纠偏──► WGS-84 ──lng_x/lat_y──► [0,1] 墨卡托 ──encode──► Int32 索引
                                                                     │
输出 ◄──正变换(精确)── WGS-84 ◄──x_lng/y_lat── 内部墨卡托 ◄───────────┘
```

- `Options.coord_system`（默认 `Wgs84` = 不开启）。`load()` 在
  `lng_x/lat_y` 投影**之前**调 `input_to_wgs84` 纠偏；
  `feature_json` 输出前调 `wgs84_to_input` 还原回输入坐标系——保证
  GCJ-02 数据 + GCJ-02 底图正确叠加。Wgs84 时两个函数均为恒等，热路径
  零开销、输出逐位不变。
- **正逆不对称**：WGS→GCJ 正变换是确定性公式（**精确**）；GCJ→WGS 无解析
  逆解，采用不动点迭代 `w = w + gcj - wgs_to_gcj(w)`，**固定 2 次**，实测
  round-trip 误差 ~3e-9 度（约 0.3 毫米，比 1 次迭代的 1–2 米改善三个数量级）。
  BD-09→GCJ-02、GCJ-02→BD-09 均有精确公式；BD→WGS = 精确剥层 + 2 次迭代。
- **境外直通**：`out_of_china` 判定（经纬度外包矩形）内的点不做任何转换
  （扰动公式在境外无意义，上游惯例亦如此）。
- **对拍**：转换公式与独立 JS 实现（eviltransform 系）比对，容差 1e-9 度
  （广州/北京参考点 + 境外伦敦点），见 [features_test.mbt](../src/features_test.mbt)。
- 导出 API：`wgs84_to_gcj02` / `gcj02_to_wgs84` / `gcj02_to_bd09` /
  `bd09_to_gcj02` / `bd09_to_wgs84` / `wgs84_to_bd09`（pub，可独立使用）。

### 12.2 多边形区域：load 时锚定 + 簇中心判定（polygon.mbt）

**设计：多边形不进索引，PIP 是查询层**。KD-tree 的范围搜索天生矩形，
多边形通过两种机制结合：

1. **load 时锚定（预聚合）**：`Options.regions`（默认空数组 = 不开启）传入
   GeoJSON Polygon/MultiPolygon/FeatureCollection 解析出的多边形数组，
   数组下标即 region id。`load()` 对每个输入点做一次 point-in-polygon
   （在**输入坐标系**空间判定），把首次命中的区域号写入平行数组
   `region_ids[i]`（-1 = 全部区域之外）。缩放层级索引不受影响。
2. **查询时簇中心判定**：`get_clusters_in_region(region_id, bbox, zoom)`
   在 `get_clusters` 的 bbox 粗筛结果上过滤——**簇**把中心还原到输入坐标
   系后做 PIP（簇中心落在多边形内即归入该区域，语义为近似：跨边界簇会
   整体归入中心侧）；**单点**按 load 时锚定的 region id 精确匹配。语义
   由用户在设计阶段确认：缩放后更精细的簇同样按簇中心判定。
   无效 region id 抛 `PolygonError`。

**实现细节**：

- **PIP 算法**：even-odd 射线法（ray casting），逐环判定后奇偶翻转——
  外环 + 洞环天然支持（甜甜圈中心落入洞内即排除）。单环 O(边数)，先比
  `(yi > y) != (yj > y)` 再算交点横坐标，多数点两步淘汰。
- **GeoJSON 解析**（`parse_polygons`）：接受 FeatureCollection / 特征数组 /
  单个 Feature / 单个 geometry；Polygon 产出一个区域，MultiPolygon 每个
  成员产出一个区域，按输入顺序编号。Point 等非法几何抛 `PolygonError`。
- **查询管线**：bbox 粗筛走既有 `get_clusters_pred`（`get_clusters` 的
  predicate 内部变体，日期线递归同样生效）→ 每要素 O(多边形边数) 精筛。
  10 万点场景 bbox 命中数十至数百要素，精筛微秒级。
- **性能取舍**：锚定发生在 load 时（每点一次 PIP，bbox 淘汰先行，10 万点
  增量 < 10%），换取查询时零 PIP 的单点匹配；区域固定的行政区划统计场景
  也可在数据生产阶段离线打标签，运行时增量归零。

**复用与边界**：`Polygon` / `parse_polygons` 为独立 pub API；`region_ids`
仅在 `regions` 非空时填充；两功能正交（GCJ-02 输入 + 区域可同时开启，
锚定在输入坐标系空间、簇中心判定前先把 WGS-84 中心还原回输入坐标系）。
