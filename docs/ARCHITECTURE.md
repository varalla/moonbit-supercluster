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
├── .trae/rules/                Trae 项目记忆（随仓库同步）
├── src/
│   ├── geo.mbt                 墨卡托投影 + JS 兼容数值函数（~55 行）
│   ├── kdbush.mbt              静态 KD-tree（~320 行）
│   ├── supercluster.mbt        聚类核心（~760 行）
│   ├── geojson.mbt             GeoJSON 输入适配器（~100 行）
│   ├── places_fixture_test.mbt 上游 places.json fixture（行字符串嵌入）
│   └── supercluster_test.mbt   17 个测试（含对拍断言，~470 行）
└── examples/demo/main.mbt      可运行示例：2000 合成点 + 聚类统计 + tile 查询
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

## 7. 测试与对拍策略

17 个测试全部在 `moon test --target js` 下运行，核心方法是**对拍（parity testing）**：

- 期望值（簇 id、点数、tile 坐标、展开 zoom、children/leaves 内容）逐字取自上游 `test/test.js` 及其 `places.json` fixture（159 个点，嵌入 [places_fixture_test.mbt](../src/places_fixture_test.mbt)）；
- tile 测试逐字节比对 `tags`（含 cluster/cluster_id/point_count/point_count_abbreviated）；
- 覆盖边界：`generateId` 序列、null-property 要素、跨日期变更线 bbox、退化 bbox 计数（26/27/26/25/25/25/61）、同坐标点、MultiPoint、零输入、`map/reduce` 求和链路、`minPoints/radius/extent/maxZoom` 各选项。

## 8. 复杂度

| 操作 | 复杂度 |
| --- | --- |
| `load()` | O((max_zoom - min_zoom + 1) · n log n)：每层一次 Floyd–Rivest 构建（近似线性）+ 一遍聚类扫描 |
| `get_clusters` / `get_tile` | O(log n + k)，k 为命中数 |
| `get_children` / `get_leaves` / expansion zoom | O(log n + 子树大小) |
| 内存 | 每层 `n_layer × stride × 4` 字节 + 每树两份 Int32 数组 |

## 9. 与上游的差异点汇总

| # | 上游（JS） | 本移植（MoonBit） |
| --- | --- | --- |
| 1 | 越界读 `OFFSET_PROP` 得 `undefined` | 显式边界检查，可见行为一致（属性为空对象） |
| 2 | `Math.round` 半数向上 | `js_round = (d + 0.5).floor()` |
| 3 | 数字缩写经 `Number::toString` | `double_to_js_string` 复现同格式 |
| 4 | 无 geometry 要素 `i++; continue` 留洞 | 同样保留空槽，索引/cluster_id 口径一致 |
| 5 | 对象引用共享（reduce 副作用） | `shallow_clone_json` 显式浅拷贝，语义等价但更可控 |
| 6 | 递归 DFS（V8 栈深限制） | 手工栈迭代，无栈深风险 |

## 10. 开发者速查

```
moon test --target js                 # 全量测试（17/17）
moon run examples/demo --target js    # 可运行示例
```

- 本机无 C 编译器，统一用 `--target js`；Wasm 后端理论上兼容（纯 MoonBit，无 FFI）。
- 改聚类语义前先读 [5.2 槽布局](#52-扁平槽布局stride--6-或-7)与 [5.3 cluster_id 编码](#53-cluster_id-位打包)，测试期望值改动需回原版 JS 重新生成。
- 更多环境注意事项见 [.trae/rules/project_memory.md](../.trae/rules/project_memory.md)。
