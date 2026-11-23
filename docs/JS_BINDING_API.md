# JS 绑定 API 文档（web-demo 实例版）

本文档描述 [`web-demo/mbapi/main.mbt`](../web-demo/mbapi/main.mbt) 通过
MoonBit `link.js.exports` 机制暴露给 JavaScript 的**全部 5 个函数**，所有
输入参数与输出结果均以 [`web-demo/app.js`](../web-demo/app.js) 的真实用法
为例。适用于任何想在浏览器/Node 中接入本库 JS 后端产物的场景。

- 产物文件：[`web-demo/mbapi.js`](../web-demo/mbapi.js)（ES Module，已入库，
  由 `moon build --target js web-demo/mbapi` 生成）
- 依赖：无（单文件即可 `import`，无需打包器）
- 对应库版本：moonbitgis/supercluster 0.1.0（`sc_version()` 可查）

**绑定层为什么有区域与坐标系接口**：WebGIS 实际项目中常需对海量 POI
数据快速展示分布，并按市 → 区/县 → 街道 → 社区等行政区划细分展示；
数据源又十分复杂——丰图地图、高德地图等商业地图服务输出 GCJ-02 或
BD-09 坐标，政务单位内部通常使用非标准坐标系、对外交换时才转为
WGS-84。因此绑定层在核心的「喂数据-建索引-视口查询」三步之外，增加了
`sc_set_regions`（行政区划锚定与过滤查询）与 `sc_build_index` 的
坐标系参数（GCJ-02 输入自动纠偏）。

---

## 1. 快速开始：web-demo 完整调用链

```js
// ── 第 0 步：数据胶水（必须先于动态 import！见 §2）──
globalThis.__SC_DATA = null;                       // 数据槽，稍后填充
globalThis.__SC_LNG  = i => globalThis.__SC_DATA[i * 3];     // 经度
globalThis.__SC_LAT  = i => globalThis.__SC_DATA[i * 3 + 1]; // 纬度
globalThis.__SC_CITY = i => globalThis.__SC_DATA[i * 3 + 2]; // 属性索引

// ── 第 1 步：导入产物模块，拿到全部导出函数 ──
const { sc_version, sc_set_regions, sc_build_index,
        sc_clusters, sc_clusters_in_region } = await import('./mbapi.js');

// ── 第 2 步（可选）：设置多边形区域（须在 sc_build_index 之前）──
const nRegions = sc_set_regions(citiesGeojsonText);   // 6 = 六市边界解析成功

// ── 第 3 步：喂数据并建索引（一次性，10 万点约 0.4s）──
globalThis.__SC_DATA = flatData;          // Float64Array，[lng, lat, cityIdx] × n
const nIndexed = sc_build_index(100000, 0);   // 0 = WGS-84 输入

// ── 第 4 步：视口查询（每次地图移动按需调用）──
const feats = JSON.parse(sc_clusters(113.0, 22.4, 114.5, 23.3, 9));

// ── 第 5 步（可选）：区域过滤查询 ──
const gz = JSON.parse(sc_clusters_in_region(0, 113.0, 22.4, 114.5, 23.3, 9));
```

---

## 2. 数据契约：`__SC_DATA` 与访问器胶水

MoonBit 侧不接收 JS 数组对象，而是通过三条 `extern "js"` 声明逐点回调
JS 函数读取数据。**产物在模块加载（`import` 执行）时就捕获
`globalThis.__SC_*` 的引用**，因此三条胶水函数必须先于 `import` 注册，
顺序颠倒会拿到 `undefined`。

| 全局名 | 类型 | 说明 |
| --- | --- | --- |
| `__SC_DATA` | `Float64Array` 或 `null` | 数据槽。按 `[lng0, lat0, attr0, lng1, lat1, attr1, …]` 平铺，步长 3。可在 import 后任意时刻替换/填充 |
| `__SC_LNG(i)` | `(Int) => Double` | 返回第 `i` 个点的经度（`__SC_DATA[i*3]`） |
| `__SC_LAT(i)` | `(Int) => Double` | 返回第 `i` 个点的纬度（`__SC_DATA[i*3+1]`） |
| `__SC_CITY(i)` | `(Int) => Int` | 返回第 `i` 个点的属性索引（`__SC_DATA[i*3+2]`） |

`__SC_CITY` 的语义由宿主决定：web-demo 里它是城市表下标，MoonBit 侧查
`["广州","深圳","东莞","佛山","中山","珠海"]` 表转为点属性 `name`；
其它应用可以放任何整数索引（如类别 id），只是越界时点属性 name 会变成
`"未知"`。

> 设计动机：10 万点走 `Float64Array` 平铺 + 逐点访问器，避免把整个数组
> 序列化成 JSON 再解析的双份开销。

---

## 3. API 详解

### 3.1 `sc_version() -> String`

| | |
| --- | --- |
| 输入参数 | 无 |
| 返回 | 版本串，如 `"moonbitgis/supercluster 0.1.0 (MoonBit JS backend)"` |
| 错误 | 无 |

兼作 JS 绑定冒烟测试——app.js 启动时调用它并显示在统计面板第一行，
能拿到串说明导出机制、模块加载全部正常。

### 3.2 `sc_set_regions(geojson : String) -> Int`

设置多边形区域（对应库的 `Options.regions~` / `parse_polygons`）。

| 输入参数 | 类型 | 说明 |
| --- | --- | --- |
| `geojson` | `String` | GeoJSON 文本，接受 `FeatureCollection` / `Feature[]` / 单个 `Feature` / 单个 geometry；几何类型接受 `Polygon` 与 `MultiPolygon`（每个 Polygon 成员算一个区域） |

| 返回 | 含义 |
| --- | --- |
| `>= 0` | 成功解析出的区域数量，**数组的下标即 region id** |
| `-1` | JSON 解析失败或几何不合法（如 Point 几何），区域状态保持不变 |

- **调用时机**：必须在 `sc_build_index` **之前**——区域锚定发生在
  `load()` 时，建索引后再设置区域对已建索引无效。
- **可重复调用**：每次调用整体替换区域数组，之后需重新
  `sc_build_index` 才会按新区域锚定。
- **坐标系一致性**：区域多边形必须与点数据同一坐标系（见 §4）。

web-demo 用法（[app.js](../web-demo/app.js) `buildIndex`）：GCJ-02 模式
直接喂原始边界文本；WGS-84 模式先在 JS 侧把边界 GCJ→WGS 还原，再
`JSON.stringify` 后传入：

```js
sc_set_regions(mode === 'gcj02'
  ? citiesGcjText
  : JSON.stringify(polyToWgs(citiesGcj)));
```

### 3.3 `sc_build_index(count : Int, coord_sys : Int) -> Int`

从 `__SC_DATA` 读取 `count` 个点并构建完整缩放层级索引（对应库的
`load()`，内部预建 maxZoom+2 棵 kdbush 树）。

| 输入参数 | 类型 | 说明 |
| --- | --- | --- |
| `count` | `Int` | 点数；MoonBit 逐点调用 `__SC_LNG(0..count-1)` 等访问器 |
| `coord_sys` | `Int` | 输入点坐标系：`0` = WGS-84（原样使用）；`1` = GCJ-02（投影前先纠偏回 WGS-84，输出要素时再还原为 GCJ-02） |

| 返回 | 含义 |
| --- | --- |
| `Int` | 实际索引的点数（web-demo 中等于 `count`） |

- **一次性**：每次调用完整重建全部层级（10 万点 ~0.4s），无增量更新。
- **GCJ-02 模式的语义**：输入数据是 GCJ-02 时传 `1`，聚类计算在
  WGS-84 空间进行（与全球索引一致），查询返回的 `lng/lat` 已还原回
  GCJ-02——因此可直接叠在 GCJ-02 底图（高德/腾讯）上。
- BD-09 目前未在绑定层暴露（库支持 `Options.coord_system = Bd09`，需要
  时在 main.mbt 加一个取值即可）。

web-demo 用法：切换坐标系按钮点击时整索引重建：

```js
async function buildIndex(mode) {
  globalThis.__SC_DATA = mode === 'gcj02' ? toGcjData() : wgsData;
  sc_set_regions(/* 与 mode 匹配的边界 */);
  state.total = sc_build_index(nPts, mode === 'gcj02' ? 1 : 0);
}
```

### 3.4 `sc_clusters(min_lng, min_lat, max_lng, max_lat : Double, zoom : Int) -> String`

bbox 视口查询（对应库的 `get_clusters`，支持跨日期变更线 bbox）。

| 输入参数 | 类型 | 说明 |
| --- | --- | --- |
| `min_lng` | `Double` | 视口西界（经度） |
| `min_lat` | `Double` | 视口南界（纬度） |
| `max_lng` | `Double` | 视口东界（经度） |
| `max_lat` | `Double` | 视口北界（纬度） |
| `zoom` | `Int` | 整数 zoom 级别；超出 0–maxZoom 时行为同上游（低于 min_zoom 返回单点，高于 max_zoom 用 maxZoom 层） |

| 返回 | 含义 |
| --- | --- |
| `String` | 紧凑 JSON 数组字符串，元素格式见 §5；索引未建立时返回 `"[]"` |

web-demo 用法：`moveend`/`zoomend` 时取 Leaflet 视口四至与
`Math.min(16, Math.max(0, Math.round(map.getZoom())))`：

```js
const b = map.getBounds();
const raw = sc_clusters(b.getWest(), b.getSouth(), b.getEast(), b.getNorth(), z);
const feats = JSON.parse(raw);
```

### 3.5 `sc_clusters_in_region(region_id : Int, min_lng, min_lat, max_lng, max_lat : Double, zoom : Int) -> String`

区域过滤查询（对应库的 `get_clusters_in_region`）。参数同 §3.4，另加：

| 输入参数 | 类型 | 说明 |
| --- | --- | --- |
| `region_id` | `Int` | 区域 id，即 `sc_set_regions` 解析出的数组下标 |

| 返回 | 含义 |
| --- | --- |
| `String` | 同 §5 格式的 JSON 数组字符串 |
| `"[]"` | 索引未建立、`region_id` 无效（越界）或查询失败 |

**判定语义**（与上游行为兼容前提下扩展的规则）：

- **簇按中心判定**：簇中心还原到输入坐标系后做点在多边形内（PIP）
  测试——中心落在市界内，则整簇（无论多大）归入该区域；缩放后出现更
  精细的子簇时同样按子簇中心判定。跨边界簇整体归中心一侧，不拆分。
- **单点按锚定 id**：每个点在 `load()` 时已按坐标锚定 region id
  （-1 = 区域外），查询时精确匹配，与查询 bbox 无关。

web-demo 用法（下拉选市后）：

```js
const raw = state.region >= 0
  ? sc_clusters_in_region(state.region, w, s, e, n, z)
  : sc_clusters(w, s, e, n, z);
```

---

## 4. 坐标系约定（点数据 × 区域多边形）

`sc_build_index` 的 `coord_sys` 与 `sc_set_regions` 的多边形**必须一致**，
否则 PIP 锚定会在错误的坐标系里判定：

| 模式 | 点数据 | 区域多边形 | 输出 `lng/lat` | 典型底图 |
| --- | --- | --- | --- | --- |
| `coord_sys = 0`（WGS-84） | WGS-84 | WGS-84（GCJ 边界需先还原） | WGS-84 | OSM/天地图 |
| `coord_sys = 1`（GCJ-02） | GCJ-02 | GCJ-02（DataV/高德系边界原样可用） | GCJ-02 | 高德/腾讯 |

web-demo 的处理：`gd_points.json` 是 WGS-84 合成点，`gd_cities.json`
是 GCJ-02 边界。GCJ 模式下点数据先在 JS 侧正变换成 GCJ-02 再建索引、
边界原样喂入；WGS 模式下点数据原样、边界先 GCJ→WGS 还原——保证两种
模式下点与区域在同一坐标系中锚定。

---

## 5. 输出 JSON 格式

`sc_clusters` / `sc_clusters_in_region` 返回的字符串是紧凑 JSON 数组，
每元素为一个要素，两种形态：

**簇（cluster）**：

```json
{ "lng": 113.26440, "lat": 23.12910, "cluster": true, "id": 1153433652, "count": 28141 }
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `lng` / `lat` | `Double` | 簇中心（已按 coord_sys 还原到输入坐标系） |
| `cluster` | `Boolean` | 恒为 `true`，用于区分形态 |
| `id` | `Int` | cluster_id，可用它进一步调库的 `get_children` / `get_leaves` / expansion zoom |
| `count` | `Int` | 簇内点数；web-demo 据此分档渲染（<10 / <50 / <200 / 其余）并做缩写显示（≥10000 → "Nk"） |

**单点（point）**：

```json
{ "lng": 113.93041, "lat": 22.53291, "cluster": false, "name": "深圳" }
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `lng` / `lat` | `Double` | 点坐标（同上） |
| `cluster` | `Boolean` | 恒为 `false` |
| `name` | `String` | 点属性 `name`（web-demo 中由 `__SC_CITY` 索引查城市表得到） |

> 绑定层只透出 `name` 一个属性以压缩输出体积；需要全部属性时可直接
> 使用库 API `get_clusters` 返回的 `Feature.properties`（完整 Json）。

序列化由 MoonBit 侧手写 `StringBuilder` 完成（无中间 Json 值开销），
浏览器侧一次 `JSON.parse` 拿整批。10 万点、z9 全省视野约 88 个要素，
解析耗时可忽略。

---

## 6. web-demo 集成要点备忘

以下是 app.js 实际运行中值得复用的细节：

1. **查询时机**：`moveend` + `zoomend` 事件驱动，zoom 取
   `Math.round(map.getZoom())` 并钳制到 0–16（与 `max_zoom=16` 选项一致）。
2. **渲染分档**（对齐原版 supercluster 风格）：

   | count | 半径 | 配色 |
   | --- | --- | --- |
   | <10 | 14px | 浅绿底 / 深绿字 |
   | <50 | 18px | 绿底 / 深绿字 |
   | <200 | 22px | 黄底 / 白字 |
   | ≥200 | 28px | 红底 / 白字 |

3. **统计面板数据来源**：点位总数与构建耗时来自 `sc_build_index`
   返回值与调用前后 `performance.now()` 差值；查询耗时同理包裹
   `sc_clusters`；版本来自 `sc_version()`。
4. **重建索引时序**：切换坐标系/区域时同步重建（禁用按钮防连点），
   重建完成后再 `redraw()`，避免查询打到旧索引。
5. **重建产物**：改动 [main.mbt](../web-demo/mbapi/main.mbt) 后执行
   `moon build --target js web-demo/mbapi`，将
   `target/js/release/build/web-demo/mbapi/mbapi.js` 覆盖
   [`web-demo/mbapi.js`](../web-demo/mbapi.js)。

---

## 7. 与库 API 的对应关系

| 绑定函数 | 对应库 API（moonbitgis/supercluster/src） |
| --- | --- |
| `sc_version` | —（绑定层自带） |
| `sc_set_regions` | `parse_polygons` |
| `sc_build_index` | `Supercluster::new(Options::new(...))` + `load`（含 `coord_system~` / `regions~` 选项） |
| `sc_clusters` | `get_clusters` |
| `sc_clusters_in_region` | `get_clusters_in_region` |

更底层的能力（`get_children` / `get_leaves` / `get_tile` /
`get_cluster_expansion_zoom`、6 个坐标转换函数、`parse_geojson_points`）
见 [README API 表](../README_zh.md#api) 与
[ARCHITECTURE.md](ARCHITECTURE.md)，当前未在绑定层导出，需要时在
[mbapi/moon.pkg](../web-demo/mbapi/moon.pkg) 的 exports 表与 main.mbt 中
补一行包装即可。
