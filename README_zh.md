# moonbit-supercluster

[English](README.md) | 简体中文

[MoonBit](https://www.moonbitlang.com/) 版
[mapbox/supercluster](https://github.com/mapbox/supercluster) 移植 —— 面向
浏览器（WebGIS）的高速地理点聚合库 —— 并内嵌移植了它所依赖的静态 KD-tree
[mourner/kdbush](https://github.com/mourner/kdbush)。

可运行于 MoonBit **JS 后端**（Node.js / 浏览器），并为 Wasm 后端做好准备，
非常适合基于 MoonBit 的 WebGIS 技术栈。

```
moon test --target js
# Total tests: 17, passed: 17, failed: 0.
```

> **状态**：🚧 开发中 —— 目前为可运行 demo（17/17 对拍测试通过），作品尚未完成。

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
| `parse_geojson_points(json)` | GeoJSON 适配器：FeatureCollection → `Array[InputPoint]` |

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

### 错误处理

可能失败的函数会抛出类型化错误，可用模式匹配处理：

```moonbit
let children = try index.get_children(164) catch {
  ClusterError(msg) => { /* "No cluster with the specified id." */ }
}
let points = try @sc.parse_geojson_points(s) catch {
  GeoJSONError(msg) => { /* JSON 非法 / 几何类型不支持 ... */ }
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

17 个测试，其中大部分是**与原版实现的对拍测试**：期望值（簇 id、点数、
tile 坐标、展开 zoom）逐字取自上游 `test/test.js` 测试套件及其
`places.json` fixture，嵌入于 `src/places_fixture_test.mbt`。

```
moon test --target js
# Total tests: 17, passed: 17, failed: 0.
```

## 项目结构

```
src/
  geo.mbt                  墨卡托投影辅助函数（lngX/latY/xLng/yLat）
  kdbush.mbt               静态 KD-tree：扁平 Int 数组 + Floyd–Rivest 选择
  supercluster.mbt         核心：缩放层级、聚类、查询、tile 输出
  geojson.mbt              GeoJSON Point/MultiPoint 输入适配器
  places_fixture_test.mbt  嵌入的上游 fixture（对拍测试）
  supercluster_test.mbt    17 个测试，含对拍断言
examples/demo/             可运行示例
```

## 许可证

BSD-2-Clause —— 本项目为以下作品的衍生作品：

- [mapbox/supercluster](https://github.com/mapbox/supercluster)
  © Volodymyr Agafonkin, Mapbox
- [mourner/kdbush](https://github.com/mourner/kdbush) © Volodymyr Agafonkin

详见 [LICENSE](LICENSE)。测试中使用的上游 fixture 采用相同许可证。
