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
# Total tests: 17, passed: 17, failed: 0.
```

> **Status**: 🚧 in development — currently a runnable demo (17/17 parity tests pass), the work is not finished yet.

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
  exposes three functions to JavaScript via the MoonBit `link.js.exports`
  mechanism: `sc_version`, `sc_build_index` (assembles `InputPoint`s from
  JS-provided data and runs `load()`) and `sc_clusters` (bbox query returning
  a compact JSON string).
- Data crosses the boundary as a flat `Float64Array` (`[lng, lat, cityIdx] ×
  n`) plus three accessor glue functions (`__SC_LNG` / `__SC_LAT` /
  `__SC_CITY`) that MoonBit reads via `extern "js"` — avoiding the cost of
  pushing 100k points through a JSON parser.
- [`app.js`](web-demo/app.js) renders clusters as size/color-graded circle
  markers (upstream supercluster style buckets) and single points as small
  circle markers, with a live stats panel: index build time, per-viewport
  feature counts (clusters vs. points), biggest cluster and query latency.
- [`web-demo/mbapi.js`](web-demo/mbapi.js) is the committed MoonBit build
  artifact. After changing `main.mbt`, rebuild with
  `moon build --target js web-demo/mbapi` and copy
  `target/js/release/build/web-demo/mbapi/mbapi.js` over it.

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
| `parse_geojson_points(json)` | GeoJSON adapter: FeatureCollection → `Array[InputPoint]` |

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

### Error handling

Fallible functions raise typed errors you can match on:

```moonbit
let children = try index.get_children(164) catch {
  ClusterError(msg) => { /* "No cluster with the specified id." */ }
}
let points = try @sc.parse_geojson_points(s) catch {
  GeoJSONError(msg) => { /* invalid JSON / unsupported geometry ... */ }
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

17 tests, most of them **parity tests against the reference implementation**:
expected values (cluster ids, point counts, tile coordinates, expansion zooms)
are taken verbatim from the upstream `test/test.js` suite and its
`places.json` fixture, embedded in `src/places_fixture_test.mbt`.

```
moon test --target js
# Total tests: 17, passed: 17, failed: 0.
```

## Project layout

```
src/
  geo.mbt                  Mercator projection helpers (lngX/latY/xLng/yLat)
  kdbush.mbt               Static KD-tree: flat Int arrays + Floyd–Rivest select
  supercluster.mbt         Core: zoom hierarchy, clustering, queries, tiles
  geojson.mbt              GeoJSON Point/MultiPoint input adapter
  places_fixture_test.mbt  Embedded upstream fixtures (parity tests)
  supercluster_test.mbt    17 tests incl. parity assertions
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
