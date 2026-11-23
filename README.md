# moonbit-supercluster

English | [简体中文](README_zh.md)

A pure [MoonBit](https://www.moonbitlang.com/) port of
[mapbox/supercluster](https://github.com/mapbox/supercluster) — a very fast
geospatial point clustering library for browsers (WebGIS) — including an
embedded port of [mourner/kdbush](https://github.com/mourner/kdbush), the
static KD-tree it is built on.

Runs on the MoonBit **JS backend** (Node.js / browsers) and is ready for the
Wasm backend, making it a natural fit for MoonBit-based WebGIS stacks.

```
moon test --target js
# Total tests: 26, passed: 26, failed: 0.
```

> **Status**: 🚧 in development — currently a runnable demo (26/26 tests pass,
> 17 of them verbatim parity tests against the upstream), the work is not finished yet.

## Why it's fast

Given a large set of points on a map, `supercluster` builds a hierarchy of
zoom-level KD-trees once at `load()` time, so every later query is just an
iterative DFS traversal over flat integer arrays:

- **Int32-encoded spherical Mercator coordinates** (scale `2^30`) keep the
  hot path in integer arithmetic, exactly like the reference implementation.
- **Floyd–Rivest selection** partitions the KD-tree without a full sort.
- **Flat record slab** (`Int` FixedArray, one record per point/cluster) — no
  per-point objects in the clustering pass.
- **Dateline-aware bbox queries** split crossing boxes into two hemisphere
  queries, matching upstream behavior including degenerate bbox values.

## How indexing works

Three key semantics to know before using the library:

1. **The index lives in [0,1] spherical Mercator.** All lng/lat pairs are
   projected to the Web Mercator `[0, 1]` range (y grows southward, latitudes
   are clamped at the poles), then encoded as Int32
   (`encode(c) = (c - 0.5) × 2³⁰`). KD-tree partitioning and bbox queries run
   entirely in integer arithmetic; floats only appear at the I/O boundary.
2. **Index building is eager; queries are on-demand.** `load(points)` loads
   every point once and clusters top-down from `max_zoom`, pre-building
   `max_zoom + 2` KD-trees (one per zoom level). Panning and zooming a map
   just queries a different in-memory tree with a different zoom parameter —
   `get_clusters` / `get_tile` only **return** the small subset inside the
   viewport; nothing is re-read or rebuilt. All data must stay resident in
   memory: no disk I/O, no lazy loading.
3. **Only coordinates are indexed; properties are not.** The KD-tree indexes
   just the `(x, y)` channels. Properties such as names live in a parallel
   `props[]` array aligned by point index and are attached when features are
   emitted; cluster properties are aggregated via `map`/`reduce` at load
   time. **Searching points by name or any other field is not supported** —
   either scan the `props` array linearly or build your own name → index map
   in the application layer.

For implementation details (record slab layout, cluster_id bit packing, the
per-zoom clustering algorithm, parity testing), see
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Installation

```
moon add moonbitgis/supercluster
```

Then import it in your package config:

```
import {
  "moonbitgis/supercluster/src" @sc,
}
```

## Quick start

```moonbit
// 1. parse a GeoJSON FeatureCollection (Point / MultiPoint features)
let points = @sc.parse_geojson_points(geojson_string)

// 2. build the index
let index = @sc.Supercluster::new(@sc.Options::new(
  min_points=3,
  radius=60.0,
)).load(points)

// 3. query clusters for a bbox [min_lng, min_lat, max_lng, max_lat] at a zoom
let clusters = index.get_clusters(-180.0, -85.0, 180.0, 85.0, 3)
for c in clusters {
  println("cluster \{c.cluster_id}: \{c.point_count} points at (\{c.lng}, \{c.lat})")
}
```

A runnable demo (2000 synthetic points, per-zoom cluster counts, biggest
cluster expansion, tile query) lives in `examples/demo`:

```
moon run examples/demo --target js
```

## Browser demo

[`web-demo/`](web-demo/) is a static site that plugs the MoonBit JS-backend
build artifact into a Leaflet map and clusters **100,000 synthetic points**
spread around six Guangdong cities (Guangzhou, Shenzhen, Dongguan, Foshan,
Zhongshan, Zhuhai):

```
cd web-demo
node tools/gen_data.js     # regenerate data/gd_points.json (optional, committed)
node tools/serve.js        # serve at http://localhost:8787
```

Open <http://localhost:8787> in a browser — the page must be served over HTTP
(not opened as `file://`) because it fetches data and uses ES modules.

How it works:

- [`web-demo/mbapi/main.mbt`](web-demo/mbapi/main.mbt) wraps the library and
  exposes five functions to JavaScript via the MoonBit `link.js.exports`
  mechanism: `sc_version`, `sc_build_index` (assembles `InputPoint`s from
  JS-provided data and runs `load()`, with a coordinate-system parameter),
  `sc_clusters` (bbox query returning a compact JSON string),
  `sc_set_regions` (parses city-boundary GeoJSON into polygon regions) and
  `sc_clusters_in_region` (region-filtered query).
- Data crosses the boundary as a flat `Float64Array` (`[lng, lat, cityIdx] ×
  n`) plus three accessor glue functions (`__SC_LNG` / `__SC_LAT` /
  `__SC_CITY`) that MoonBit reads via `extern "js"` — avoiding the cost of
  pushing 100k points through a JSON parser.
- [`data/gd_cities.json`](web-demo/data/gd_cities.json) holds the six-city
  administrative boundaries (DataV GeoJSON, GCJ-02, aligned with the AMap
  basemap); **the feature array index is the region id**.
- [`app.js`](web-demo/app.js) renders clusters as size/color-graded circle
  markers (upstream supercluster style buckets) and single points as small
  circle markers, with a live stats panel: index build time, current
  coordinate system, region filter, per-viewport feature counts (clusters
  vs. points), biggest cluster and query latency. The page includes two
  demo controls for the extended features (see below).
- [`web-demo/mbapi.js`](web-demo/mbapi.js) is the committed MoonBit build
  artifact. After changing `main.mbt`, rebuild with
  `moon build --target js web-demo/mbapi` and copy
  `target/js/release/build/web-demo/mbapi/mbapi.js` over it.

### Demo walkthrough (extended-feature examples)

Two controls sit in the top-right panel, one per library extension:

**① Coordinate-system toggle (GCJ-02 input demo)**

1. Starts in WGS-84 mode: raw data goes straight into the index, so markers
   sit ~500m off the AMap basemap (GCJ-02);
2. Click the "切换 GCJ-02 数据" (switch to GCJ-02) button: JS converts the
   WGS-84 data to GCJ-02 (simulating a domestic data source) and rebuilds
   the whole index with `coord_system = Gcj02` — MoonBit converts back to
   WGS-84 internally for clustering and restores GCJ-02 on output, so
   markers align exactly with the basemap;
3. The "当前坐标系" (current coord system) row switches to GCJ-02 and the
   button label flips; toggle back and forth to compare the offset.

**② Administrative-region query (polygon region demo)**

1. On page load the demo feeds `gd_cities.json` to `sc_set_regions`; the
   six city boundaries overlay the map as dashed blue lines (feature index
   = region id: 0 Guangzhou / 1 Shenzhen / 2 Zhuhai / 3 Foshan /
   4 Dongguan / 5 Zhongshan);
2. Pick a city from the "全部区域" (all regions) dropdown: queries switch
   to `sc_clusters_in_region(region_id, …)` — **clusters are judged by
   center** (a cluster belongs to the region if its center falls inside,
   same rule after zooming) while single points match the region anchored
   at load time; the "区域筛选" (region filter) row shows the city name
   and the visible feature count drops;
3. The selected city's boundary is highlighted in solid orange; switch
   back to "全部区域" to restore full queries.
4. The two demos compose: in GCJ-02 mode the raw GCJ boundaries are fed
   as-is; in WGS-84 mode they are converted GCJ→WGS in JS first, keeping
   PIP judgment consistent in both modes.

JS-side calling quick reference (three steps + optional region/coord-system
extensions):

```js
// 1) Register the glue accessors BEFORE the dynamic import — order matters:
//    the MoonBit artifact captures the globalThis.__SC_* references at load time
globalThis.__SC_DATA = null;                       // data slot, filled later
globalThis.__SC_LNG  = i => globalThis.__SC_DATA[i * 3];     // longitude
globalThis.__SC_LAT  = i => globalThis.__SC_DATA[i * 3 + 1]; // latitude
globalThis.__SC_CITY = i => globalThis.__SC_DATA[i * 3 + 2]; // property index
const { sc_version, sc_build_index, sc_clusters } =
  await import('./mbapi.js');                      // ES module, no bundler needed

// 2) (Optional) set polygon regions: GeoJSON text → region array (array
//    index = region id); must run before sc_build_index
sc_set_regions(citiesGeojsonText);

// 3) Feed data and build the index (once; __SC_DATA is a flat [lng, lat,
//    cityIdx] Float64Array; 100k points fully pre-built in ~0.4s;
//    2nd arg: 0 = WGS-84, 1 = GCJ-02)
sc_build_index(pts.length);

// 4) Viewport query (on every map move; returns a compact JSON string)
const feats = JSON.parse(sc_clusters(w, s, e, n, zoom));   // integer zoom
// cluster:    { lng, lat, cluster: true,  id, count }
// single point: { lng, lat, cluster: false, name: "Guangzhou" }

// 5) (Optional) region-filtered query: clusters by center, points by the
//    region anchored at load time
const rfeats = JSON.parse(sc_clusters_in_region(0, w, s, e, n, zoom)); // 0=Guangzhou
```

## API

| API | Description |
| --- | --- |
| `Supercluster::new(options)` | create an index with options |
| `load(points)` | build the zoom hierarchy of KD-trees (call once) |
| `get_clusters(min_lng, min_lat, max_lng, max_lat, zoom)` | bbox query, dateline-aware |
| `get_children(cluster_id)` | immediate descendants of a cluster |
| `get_leaves(cluster_id, limit, offset)` | original points under a cluster |
| `get_cluster_expansion_zoom(cluster_id)` | zoom at which the cluster expands |
| `get_tile(x, y, z)` | vector-tile-style point features for one tile |
| `get_clusters_in_region(region_id, bbox..., zoom)` | region query: clusters by center, points by anchored id, see [Polygon regions](#polygon-regions) |
| `parse_geojson_points(json)` | GeoJSON adapter: FeatureCollection → `Array[InputPoint]` |
| `parse_polygons(json)` | GeoJSON Polygon/MultiPolygon/FeatureCollection → `Array[Polygon]` |
| `wgs84_to_gcj02` and 5 more | coordinate system conversions, see [Coordinate systems](#coordinate-systems-gcj-02--bd-09) |

Query results are `Feature` values with `lng`, `lat`, `is_cluster`,
`cluster_id`, `point_count` and `properties`; tile results are `TileFeature`
values with pixel-space `x`, `y`, `tags` and feature `id`.

### Options

All options match the upstream defaults and semantics:

| Option | Default | Description |
| --- | --- | --- |
| `min_zoom` | `0` | min zoom at which clusters are generated |
| `max_zoom` | `16` | max zoom at which clusters are generated |
| `min_points` | `2` | minimum points to form a cluster |
| `radius` | `40.0` | cluster radius in pixels (`extent`-normalized) |
| `extent` | `512.0` | tile extent (tiles are `extent × extent` px) |
| `node_size` | `64` | KD-tree node size; affects query performance |
| `generate_id` | `false` | generate monotonically increasing cluster ids |
| `map` | identity | derive per-point properties before aggregation |
| `reduce` | `None` | `Some(fn(acc, props))` — aggregate child properties into clusters |
| `coord_system` | `Wgs84` | input coordinate system, see [Coordinate systems](#coordinate-systems-gcj-02--bd-09) |
| `regions` | `[]` | polygon regions (empty = disabled), see [Polygon regions](#polygon-regions) |

Example with property aggregation — `map` extracts the fields to aggregate
from each point, `reduce` folds a child into the cluster's running sum:

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

// reduce: sum += child sum
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

### Coordinate systems (GCJ-02 / BD-09)

Chinese map data is legally encrypted: AMap/Tencent use GCJ-02 ("Mars
coordinates", a nonlinear perturbation of WGS-84) and Baidu adds another
offset layer (BD-09); raw GPS data is WGS-84. Declare `coord_system` and
`load()` converts to WGS-84 before projection, while query outputs are
converted back to the input system — so GCJ-02 data overlays correctly on a
GCJ-02 basemap (e.g. AMap):

```moonbit
let index = @sc.Supercluster::new(
  @sc.Options::new(coord_system=@sc.Gcj02),   // or @sc.Bd09
).load(points)                                 // points are GCJ-02 coords
// cluster lng/lat remain GCJ-02 — plot them directly on the AMap basemap
```

How it works: the index core always lives in WGS-84 [0,1] spherical Mercator;
conversion only happens at the input/output boundary. GCJ→WGS has no analytic
inverse, so a fixed-point iteration (2 rounds) is used — round-trip error is
about 0.3 millimeters; points outside China pass through untouched. The six
conversion functions (`wgs84_to_gcj02`, etc.) are public and usable standalone.

### Polygon regions

Pass GeoJSON Polygon / MultiPolygon / FeatureCollection via `parse_polygons`
to `regions`; the array index is the region id (0, 1, 2…). At `load()` time
every point is **anchored** to the first polygon containing it (one
point-in-polygon test per point; the zoom hierarchy is untouched). At query
time **clusters are judged by their center** and single points match their
anchored id:

```moonbit
let regions = @sc.parse_polygons(geojson_string)   // FeatureCollection etc.
let index = @sc.Supercluster::new(
  @sc.Options::new(regions=regions),
).load(points)

// clusters/points inside region 0 (bbox + zoom same as get_clusters)
let feats = try index.get_clusters_in_region(0, 113.0, 21.0, 116.0, 24.0, 6) catch {
  PolygonError(msg) => { /* region id out of range */ }
}
```

Polygons with holes are supported (even-odd ray casting over outer ring +
holes). Semantics note: clusters are aggregates — a cluster **straddling a
polygon boundary is attributed entirely to the side its center falls on**;
finer clusters after zooming are judged the same way. Both options compose
(e.g. GCJ-02 input + administrative-region anchoring).

### Error handling

Fallible functions raise typed errors you can match on:

```moonbit
let children = try index.get_children(164) catch {
  ClusterError(msg) => { /* "No cluster with the specified id." */ }
}
let points = try @sc.parse_geojson_points(s) catch {
  GeoJSONError(msg) => { /* invalid JSON / unsupported geometry ... */ }
}
let regions = try @sc.parse_polygons(fc) catch {
  PolygonError(msg) => { /* invalid geometry / region id out of range ... */ }
}
```

## Behavior parity notes

This port aims for **bit-for-bit behavioral parity** with the JS original,
including its edge-case quirks:

- JS `Math.round` semantics (round half up) via a local `js_round`.
- JS `Number::toString` formatting for abbreviated counts (`point_count_abbreviated`).
- Features without geometry keep an index slot so point ids stay aligned with
  the input, exactly like upstream `numPoints` counting.
- With `reduce` unset (`stride = 6`), the upstream implementation reads the
  property slot out of bounds, which JS silently treats as `undefined`;
  the port reproduces the same visible behavior with an explicit bounds check.

## Tests

26 tests: 17 **parity tests against the reference implementation** (expected
values taken verbatim from the upstream `test/test.js` suite and its
`places.json` fixture, embedded in `src/places_fixture_test.mbt`) plus 9
extension tests (coordinate conversions parity-checked against an independent
JS implementation, holed-polygon PIP, region anchoring end-to-end).

```
moon test --target js
# Total tests: 26, passed: 26, failed: 0.
```

## Project layout

```
src/
  geo.mbt                  Mercator projection helpers (lngX/latY/xLng/yLat)
  coord.mbt                Coordinate systems: WGS-84/GCJ-02/BD-09 conversion
  polygon.mbt              Polygon regions: PIP ray casting + GeoJSON parsing
  kdbush.mbt               Static KD-tree: flat Int arrays + Floyd–Rivest select
  supercluster.mbt         Core: zoom hierarchy, clustering, queries, tiles
  geojson.mbt              GeoJSON Point/MultiPoint input adapter
  places_fixture_test.mbt  Embedded upstream fixtures (parity tests)
  supercluster_test.mbt    17 parity tests
  features_test.mbt        Extension tests (coord parity + regions, 9)
examples/demo/             Runnable console demo (2000 synthetic points)
web-demo/                  Browser demo: Leaflet map + 100k points,
                           JS-backend build artifact (mbapi.js)
  mbapi/                   MoonBit wrapper package (link.js.exports)
  app.js / index.html      Map page: glue, rendering, stats panel
  data/gd_points.json      Synthetic dataset (regenerate: tools/gen_data.js)
  tools/serve.js           Minimal static server (port 8787)
```

## License

BSD-2-Clause — this is a derivative work of:

- [mapbox/supercluster](https://github.com/mapbox/supercluster)
  © Volodymyr Agafonkin, Mapbox
- [mourner/kdbush](https://github.com/mourner/kdbush) © Volodymyr Agafonkin

See [LICENSE](LICENSE). Upstream fixtures used in tests carry the same license.
