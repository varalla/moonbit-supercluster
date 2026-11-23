# moonbit-supercluster

[English](README.md) | 简体中文

[MoonBit](https://www.moonbitlang.com/) 版
[mapbox/supercluster](https://github.com/mapbox/supercluster) 移植 —— 面向
浏览器（WebGIS）的高速地理点聚合库 —— 并内嵌移植了它所依赖的静态 KD-tree
[mourner/kdbush](https://github.com/mourner/kdbush)。

**为什么做这两个扩展**：WebGIS 实际项目开发中，常常要处理海量且复杂的
POI 数据，并快速展示其空间分布；业务上又往往需要以市 → 区/县 → 街道 →
社区等行政区划为维度做细分展示。上游 supercluster 解决的是「快」——
海量点的高性能聚合查询；本项目在纯 MoonBit 移植之上，针对上述真实开发
痛点增补了两项能力：**坐标系输入**（GCJ-02 / BD-09）解决国内加密数据与
底图错位的问题；**多边形区域聚合**在 `load()` 时即将每个点锚定到所属
行政区划，支持按市/区/县等粒度直接过滤查询。详见
[坐标系输入](#坐标系输入gcj-02--bd-09)与[多边形区域](#多边形区域)。

可运行于 MoonBit **JS 后端**（Node.js / 浏览器）；核心库为纯 MoonBit 无
FFI，已在 **wasm / wasm-gc 后端通过全量测试（26/26）**，浏览器 wasm 绑定
（替代 `extern "js"` 逐点回调的 FFI）在规划中，非常适合基于 MoonBit 的
WebGIS 技术栈。

```
moon test --target js
# Total tests: 26, passed: 26, failed: 0.
```

> **状态**：🚧 开发中 —— 目前为可运行 demo（26/26 测试通过，其中 17 个为
> 与原版逐字对拍），作品尚未完成。

## 为什么快

对地图上的海量点，`supercluster` 在 `load()` 时一次性构建缩放层级 KD-tree
体系，此后每次查询只是对扁平整数数组的迭代式 DFS 遍历：

- **Int32 编码的球面墨卡托坐标**（比例尺 `2^30`），热路径保持整数运算，与
  原版实现完全一致。
- **Floyd–Rivest 选择算法**划分 KD-tree，无需完整排序。
- **扁平记录槽**（`Int` FixedArray，每个点/簇一条记录），聚类过程不产生
  逐点对象。
- **跨国际日期变更线的 bbox 查询**会拆分为两个半球查询，与上游行为一致，
  包括各种退化 bbox 值的处理。

## 索引原理

理解三个关键语义，可以避免误用：

1. **索引建立在 [0,1] 墨卡托上**。所有经纬度先投影到 Web 墨卡托的 `[0, 1]`
   区间（y 向南递增，纬度在极点截断），再编码为 Int32
   （`encode(c) = (c - 0.5) × 2³⁰`）。此后 KD-tree 排序与 bbox
   查询全程整数运算，浮点数只出现在输入/输出边界。
2. **建索引是全量的，查询才是按需的**。`load(points)` 一次性加载全部点，
   自 `max_zoom` 向下逐层聚类，预建 `max_zoom + 2` 棵 KD-tree（每层一棵）。
   之后地图拉近拉远只是换一个 zoom 参数去查内存里已有的另一棵树——
   `get_clusters` / `get_tile` 只**返回**视口内的那一小部分，不做任何
   重新读取或重建。数据必须全部驻留内存：本库不做磁盘 IO、不做惰性加载。
3. **只建坐标索引，属性不参与索引**。KD-tree 只索引 `(x, y)` 两个通道；
   名称等属性存放在平行数组 `props[]` 中，按点号对齐，输出 feature
   时才附带上来。簇属性通过 `map`/`reduce` 在建索引时聚合。
   因此**按名称等字段检索点不受支持**——只能线性扫描
   `props` 数组，或在应用层自建名称 → 点号的二级索引。

更多实现细节（槽布局、cluster_id 位打包、逐层聚类算法、对拍策略）见
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 安装

```
moon add moonbitgis/supercluster
```

然后在包配置中引入：

```
import {
  "moonbitgis/supercluster/src" @sc,
}
```

## 快速上手

```moonbit
// 1. 解析 GeoJSON FeatureCollection（Point / MultiPoint）
let points = @sc.parse_geojson_points(geojson_string)

// 2. 构建索引
let index = @sc.Supercluster::new(@sc.Options::new(
  min_points=3,
  radius=60.0,
)).load(points)

// 3. 在指定 zoom 下按 bbox [min_lng, min_lat, max_lng, max_lat] 查询簇
let clusters = index.get_clusters(-180.0, -85.0, 180.0, 85.0, 3)
for c in clusters {
  println("cluster \{c.cluster_id}: \{c.point_count} points at (\{c.lng}, \{c.lat})")
}
```

可运行示例（2000 个合成点、各 zoom 聚类统计、最大簇展开、tile 查询）位于
`examples/demo`：

```
moon run examples/demo --target js
```

## 浏览器在线演示

[`web-demo/`](web-demo/) 是一个纯静态站点：Leaflet 地图 + MoonBit JS 后端
编译产物，对广东省六城市（广州、深圳、东莞、佛山、中山、珠海）的
**10 万合成点**做真实地图聚合：

```
cd web-demo
node tools/gen_data.js     # 重新生成 data/gd_points.json（可选，已入库）
node tools/serve.js        # 在 http://localhost:8787 提供服务
```

浏览器打开 <http://localhost:8787> —— 页面必须经 HTTP 访问（不能直接以
`file://` 打开），因为它需要 fetch 数据并使用 ES module。

工作方式：

- [`web-demo/mbapi/main.mbt`](web-demo/mbapi/main.mbt) 包装本库，通过
  MoonBit `link.js.exports` 机制向 JS 暴露五个函数：`sc_version`、
  `sc_build_index`（用 JS 侧提供的数据组装 `InputPoint` 并执行 `load()`，
  第二参数选坐标系）、`sc_clusters`（bbox 查询，返回紧凑 JSON 字符串）、
  `sc_set_regions`（解析城市边界 GeoJSON 作为多边形区域）与
  `sc_clusters_in_region`（区域过滤查询）。
- 数据以扁平 `Float64Array`（`[lng, lat, cityIdx] × n`）跨越边界，配合三个
  访问器胶水函数（`__SC_LNG` / `__SC_LAT` / `__SC_CITY`）由 MoonBit 侧
  `extern "js"` 逐点读取——避免把 10 万点塞进 JSON 解析器的开销。
- [`data/gd_cities.json`](web-demo/data/gd_cities.json) 是六市行政区划边界
  （DataV GeoJSON，GCJ-02 坐标系，与高德底图对齐），**feature 数组下标即
  region id**。
- [`app.js`](web-demo/app.js) 把簇渲染为分档着色/分级的圆形标记（原版
  supercluster 风格），单点渲染为小圆点，并实时显示统计面板：索引构建
  耗时、当前坐标系、区域筛选、视野内要素数（簇/单点）、最大簇与最近查询
  耗时。页面含两个扩展功能演示控件（见下）。
- [`web-demo/mbapi.js`](web-demo/mbapi.js) 是入库的 MoonBit 编译产物；
  改动 `main.mbt` 后用 `moon build --target js web-demo/mbapi` 重新构建，
  并将 `target/js/release/build/web-demo/mbapi/mbapi.js` 覆盖过来。

### 页面演示操作（扩展功能示例）

页面右上角面板内有两个控件，对应库的两个扩展功能：

**① 坐标系切换（GCJ-02 输入演示）**

1. 初始为 WGS-84 模式：原始数据直接建索引，点位相对高德底图（GCJ-02）
   有约 500m 的系统性偏移；
2. 点击「切换 GCJ-02 数据」按钮：JS 侧把 WGS-84 数据正变换为 GCJ-02
   （模拟国内数据源），再以 `coord_system = Gcj02` **重建整个索引**——
   MoonBit 内部纠偏回 WGS-84 聚类，输出时还原 GCJ-02，点位与高德底图
   完全对齐；
3. 观察「当前坐标系」行变为「GCJ-02（已纠偏）」，按钮文字变为
   「切回 WGS-84 数据」，可来回切换对比偏移效果。

**② 行政区划区域查询（多边形区域演示）**

1. 页面加载时自动把 `gd_cities.json` 喂给 `sc_set_regions`，六个市的
   边界以蓝色虚线叠加在底图上（feature 下标即 region id：0 广州 /
   1 深圳 / 2 珠海 / 3 佛山 / 4 东莞 / 5 中山）；
2. 在「全部区域」下拉中选任一城市：查询改走
   `sc_clusters_in_region(region_id, …)`——**簇按中心判定**（中心落在
   市界内即整簇归入，缩放后同规则），单点按 load 时锚定的 region id
   精确匹配；「区域筛选」行显示城市名，视野要素数明显下降；
3. 选中城市的边界以橙色实线高亮；切回「全部区域」恢复全量查询。
4. 两个演示可叠加：GCJ-02 模式下喂原始 GCJ 边界，WGS-84 模式下边界先
   在 JS 侧 GCJ→WGS 还原再喂给索引，保证两种模式下 PIP 判定一致。

JS 侧调用速查（三步 + 可选的区域/坐标系扩展）：

```js
// 1) 先注册胶水访问器，再动态 import —— 顺序不能反：
//    MoonBit 产物在模块加载时捕获 globalThis.__SC_* 引用
globalThis.__SC_DATA = null;                       // 数据槽，稍后填充
globalThis.__SC_LNG  = i => globalThis.__SC_DATA[i * 3];     // 经度
globalThis.__SC_LAT  = i => globalThis.__SC_DATA[i * 3 + 1]; // 纬度
globalThis.__SC_CITY = i => globalThis.__SC_DATA[i * 3 + 2]; // 属性索引
const { sc_version, sc_build_index, sc_clusters } =
  await import('./mbapi.js');                      // ES Module，无需打包器

// 2) （可选）设置多边形区域：GeoJSON 字符串 → 区域数组（数组下标即
//    region id），须在 sc_build_index 之前调用
sc_set_regions(citiesGeojsonText);

// 3) 喂数据并建索引（一次性；__SC_DATA 为 [lng, lat, cityIdx] 平铺
//    Float64Array；10 万点全量预建约 0.4s；第二参数 0=WGS-84，1=GCJ-02）
sc_build_index(pts.length);

// 4) 视口查询（每次地图移动按需调用；返回紧凑 JSON 字符串）
const feats = JSON.parse(sc_clusters(w, s, e, n, zoom));   // zoom 取整数
// 簇:   { lng, lat, cluster: true,  id, count }
// 单点: { lng, lat, cluster: false, name: "广州" }

// 5)（可选）区域过滤查询：簇按中心、单点按 load 时锚定的 region id
const rfeats = JSON.parse(sc_clusters_in_region(0, w, s, e, n, zoom)); // 0=广州
```

## API

| API | 说明 |
| --- | --- |
| `Supercluster::new(options)` | 按选项创建索引 |
| `load(points)` | 构建缩放层级 KD-tree（只调用一次） |
| `get_clusters(min_lng, min_lat, max_lng, max_lat, zoom)` | bbox 查询，支持跨日期变更线 |
| `get_children(cluster_id)` | 簇的直接子节点 |
| `get_leaves(cluster_id, limit, offset)` | 簇下的全部原始点 |
| `get_cluster_expansion_zoom(cluster_id)` | 该簇展开时的 zoom |
| `get_tile(x, y, z)` | 单个 tile 的矢量瓦片式点要素 |
| `get_clusters_in_region(region_id, bbox..., zoom)` | 区域查询：簇按中心、单点按锚定 id，见[多边形区域](#多边形区域) |
| `parse_geojson_points(json)` | GeoJSON 适配器：FeatureCollection → `Array[InputPoint]` |
| `parse_polygons(json)` | GeoJSON Polygon/MultiPolygon/FeatureCollection → `Array[Polygon]` |
| `wgs84_to_gcj02` 等 6 个转换函数 | 坐标系互转，可独立调用，见[坐标系输入](#坐标系输入gcj-02--bd-09) |

查询结果为 `Feature`，含 `lng`、`lat`、`is_cluster`、`cluster_id`、
`point_count`、`properties`；tile 结果为 `TileFeature`，含像素坐标 `x`、
`y`、`tags` 和要素 `id`。

### 选项

所有选项与上游的默认值和语义一致：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `min_zoom` | `0` | 生成簇的最小 zoom |
| `max_zoom` | `16` | 生成簇的最大 zoom |
| `min_points` | `2` | 成簇所需的最少点数 |
| `radius` | `40.0` | 簇半径（以 `extent` 归一化的像素） |
| `extent` | `512.0` | tile 范围（瓦片为 `extent × extent` 像素） |
| `node_size` | `64` | KD-tree 节点大小，影响查询性能 |
| `generate_id` | `false` | 生成单调递增的簇 id |
| `map` | 恒等 | 聚合前派生每点属性 |
| `reduce` | `None` | `Some(fn(acc, props))` —— 将子节点属性聚合进簇 |
| `coord_system` | `Wgs84` | 输入坐标系，见[坐标系输入](#坐标系输入gcj-02--bd-09) |
| `regions` | `[]` | 多边形区域（空 = 关闭），见[多边形区域](#多边形区域) |

属性聚合示例 —— `map` 从每个点中提取待聚合字段，`reduce` 将子节点累加进
簇的运行总和：

```moonbit
// map: {mag: 4.2} -> {sum: 4.2}
fn map_mag(props : Json) -> Json {
  match props {
    Object(m) =>
      match m.get("mag") {
        Some(Number(d, ..)) => Json::object([("sum", Json::number(d))])
        _ => Json::object([("sum", Json::number(0.0))])
      }
    _ => Json::object([("sum", Json::number(0.0))])
  }
}

// reduce: sum += 子节点 sum
fn reduce_sum(acc : Json, props : Json) -> Unit {
  match (acc, props) {
    (Object(a), Object(p)) => {
      let old = match a.get("sum") {
        Some(Number(d, ..)) => d
        _ => 0.0
      }
      let add = match p.get("sum") {
        Some(Number(d, ..)) => d
        _ => 0.0
      }
      a.set("sum", Json::number(old + add))
    }
    _ => ()
  }
}

let index = @sc.Supercluster::new(
  @sc.Options::new(map=map_mag, reduce=Some(reduce_sum)),
).load(points)
```

### 坐标系输入（GCJ-02 / BD-09）

国内地图数据因法规加密：高德/腾讯用 GCJ-02（火星坐标），百度在其上再加
一层偏移（BD-09），GPS 原始数据是 WGS-84。声明 `coord_system` 后，
`load()` 在投影前自动纠偏，查询输出自动还原回输入坐标系——GCJ-02 数据
配 GCJ-02 底图（高德）即可正确叠加：

```moonbit
let index = @sc.Supercluster::new(
  @sc.Options::new(coord_system=@sc.Gcj02),   // 或 @sc.Bd09
).load(points)                                 // points 为 GCJ-02 坐标
// clusters 中的 lng/lat 仍是 GCJ-02，可直接画在高德底图上
```

原理：索引核心始终建立在 WGS-84 [0,1] 墨卡托上，转换只发生在
输入/输出边界。GCJ→WGS 逆变换无解析解，采用不动点迭代（固定 2 次），
round-trip 误差约 0.3 毫米；境外点自动直通不做转换。六个转换函数
（`wgs84_to_gcj02` 等）也可独立调用。

### 多边形区域

`regions` 传入 GeoJSON Polygon / MultiPolygon / FeatureCollection（用
`parse_polygons` 解析），数组下标即区域 id（0, 1, 2…）。`load()` 时每个点
做一次 point-in-polygon 判定**锚定**到区域（层级索引行为完全不变）；查询时
**簇按簇中心**判定归属、单点按锚定 id 精确匹配：

```moonbit
let regions = @sc.parse_polygons(geojson_string)   // FeatureCollection 等
let index = @sc.Supercluster::new(
  @sc.Options::new(regions=regions),
).load(points)

// 区域 0 内的簇/点（bbox + zoom 与 get_clusters 相同）
let feats = try index.get_clusters_in_region(0, 113.0, 21.0, 116.0, 24.0, 6) catch {
  PolygonError(msg) => { /* region id 越界 */ }
}
```

带洞多边形受支持（even-odd 射线法，外环 + 洞环奇偶判定）。注意语义：
簇是聚合体，**跨边界的簇按簇中心整体归入一侧**；缩放后更精细的簇同样按
簇中心判定。两个选项可同时开启（如 GCJ-02 输入 + 行政区划锚定）。

### 错误处理

可能失败的函数会抛出类型化错误，可用模式匹配处理：

```moonbit
let children = try index.get_children(164) catch {
  ClusterError(msg) => { /* "No cluster with the specified id." */ }
}
let points = try @sc.parse_geojson_points(s) catch {
  GeoJSONError(msg) => { /* JSON 非法 / 几何类型不支持 ... */ }
}
let regions = try @sc.parse_polygons(fc) catch {
  PolygonError(msg) => { /* 非法几何 / region id 越界 ... */ }
}
```

## 行为对齐说明

本移植追求与 JS 原版**逐位一致的行为对齐**，包括其边界怪癖：

- 通过本地 `js_round` 复现 JS `Math.round` 语义（.5 向上取整）。
- 用 JS `Number::toString` 规则格式化缩写计数（`point_count_abbreviated`）。
- 无 geometry 的要素会保留索引槽位，使点 id 与输入要素对齐，与上游
  `numPoints` 计数完全一致。
- 未设置 `reduce` 时（`stride = 6`），上游实现会越界读取属性槽，JS 中被
  静默当作 `undefined`；本移植用显式边界检查复现相同的可见行为。

## 测试

26 个测试：17 个**与原版实现的对拍测试**（期望值逐字取自上游 `test/test.js`
及其 `places.json` fixture，嵌入于 `src/places_fixture_test.mbt`）+ 9 个
扩展功能测试（坐标转换对拍独立 JS 实现、带洞 PIP、区域锚定端到端）。

```
moon test --target js
# Total tests: 26, passed: 26, failed: 0.
```

## 项目结构

```
src/
  geo.mbt                  墨卡托投影辅助函数（lngX/latY/xLng/yLat）
  coord.mbt                坐标系输入：WGS-84/GCJ-02/BD-09 纠偏
  polygon.mbt              多边形区域：PIP 射线法 + GeoJSON 解析
  kdbush.mbt               静态 KD-tree：扁平 Int 数组 + Floyd–Rivest 选择
  supercluster.mbt         核心：缩放层级、聚类、查询、tile 输出
  geojson.mbt              GeoJSON Point/MultiPoint 输入适配器
  places_fixture_test.mbt  嵌入的上游 fixture（对拍测试）
  supercluster_test.mbt    17 个对拍测试
  features_test.mbt        扩展功能测试（坐标对拍 + 区域锚定，9 个）
examples/demo/             可运行控制台示例（2000 合成点）
web-demo/                  浏览器在线演示：Leaflet 地图 + 10 万点聚合，
                           含 JS 后端编译产物（mbapi.js）
  mbapi/                   MoonBit 包装包（link.js.exports）
  app.js / index.html      地图页：胶水、渲染、统计面板
  data/gd_points.json      合成数据集（重新生成：tools/gen_data.js）
  tools/serve.js           极简静态服务器（端口 8787）
```

## 许可证

BSD-2-Clause —— 本项目为以下作品的衍生作品：

- [mapbox/supercluster](https://github.com/mapbox/supercluster)
  © Volodymyr Agafonkin, Mapbox
- [mourner/kdbush](https://github.com/mourner/kdbush) © Volodymyr Agafonkin

详见 [LICENSE](LICENSE)。测试中使用的上游 fixture 采用相同许可证。
