// Supercluster: fast geospatial point clustering based on a zoom-level
// hierarchy of KD-trees. Faithful port of mapbox/supercluster
// (BSD-2-Clause, (c) Volodymyr Agafonkin, Mapbox) to MoonBit.

/// Default identity map used for `Options::new`'s `map` label.
pub fn identity_props(props : Json) -> Json {
  props
}

/// Clustering options. Use labeled arguments to override defaults, e.g.
/// `Options::new(radius=60.0, extent=256.0, max_zoom=4)`.
pub struct Options {
  /// min zoom to generate clusters on
  min_zoom : Int
  /// max zoom level to cluster the points on (capped at 30)
  max_zoom : Int
  /// minimum points to form a cluster
  min_points : Int
  /// cluster radius in pixels
  radius : Double
  /// tile extent (radius is calculated relative to it)
  extent : Double
  /// size of the KD-tree leaf node, affects performance
  node_size : Int
  /// whether to generate numeric ids for input features
  generate_id : Bool
  /// properties to use for individual points when running the reducer
  map : (Json) -> Json
  /// a reduce function for calculating custom cluster properties
  reduce : Option[((Json, Json) -> Unit)]
}

/// Library defaults, identical to mapbox/supercluster:
/// min_zoom=0, max_zoom=16, min_points=2, radius=40, extent=512, node_size=64.
pub fn Options::new(
  min_zoom~ : Int = 0,
  max_zoom~ : Int = 16,
  min_points~ : Int = 2,
  radius~ : Double = 40.0,
  extent~ : Double = 512.0,
  node_size~ : Int = 64,
  generate_id~ : Bool = false,
  map~ : (Json) -> Json = identity_props,
  reduce~ : Option[((Json, Json) -> Unit)] = None,
) -> Options {
  {
    min_zoom,
    max_zoom,
    min_points,
    radius,
    extent,
    node_size,
    generate_id,
    map,
    reduce,
  }
}

/// An input GeoJSON Point/MultiPoint feature, pre-decomposed for the index.
pub struct InputPoint {
  /// optional feature id (number or string)
  id : Option[Json]
  /// feature properties (JsonObject), or Json::null() for null properties
  properties : Json
  /// one (lng, lat) pair for Point, several for MultiPoint
  coords : Array[(Double, Double)]
}

/// Convenience constructor for a single point feature.
pub fn InputPoint::of(lng : Double, lat : Double, properties : Json) -> InputPoint {
  let coords : Array[(Double, Double)] = [(lng, lat)]
  InputPoint::make(None, properties, coords)
}

/// General constructor for an input feature (Point/MultiPoint).
pub fn InputPoint::make(
  id : Option[Json],
  properties : Json,
  coords : Array[(Double, Double)],
) -> InputPoint {
  { id, properties, coords }
}

/// An output GeoJSON Point feature: either a cluster or a single input point.
pub struct Feature {
  /// cluster_id for clusters, original feature id for points (if any)
  id : Option[Json]
  /// cluster properties or original point properties
  properties : Json
  lng : Double
  lat : Double
  is_cluster : Bool
  /// cluster id (valid when `is_cluster`)
  cluster_id : Int
  /// number of original points under this feature (1 for single points)
  point_count : Int
}

/// Error raised by cluster lookups (`get_children`, `get_leaves`,
/// `get_cluster_expansion_zoom`) when the id does not exist.
#derive(Debug)
pub(all) suberror ClusterError {
  ClusterError(String)
}

/// Convert a feature back to a GeoJSON Feature object.
pub fn Feature::to_json(self : Feature) -> Json {
  let obj : Map[String, Json] = Map([])
  obj.set("type", Json::string("Feature"))
  match self.id {
    Some(id) => obj.set("id", id)
    None => ()
  }
  obj.set("properties", self.properties)
  let geometry : Map[String, Json] = Map([])
  geometry.set("type", Json::string("Point"))
  let coordinates : Array[Json] = [Json::number(self.lng), Json::number(self.lat)]
  geometry.set("coordinates", Json::array(coordinates))
  obj.set("geometry", Json::object(geometry))
  Json::object(obj)
}

/// A vector-tile point as produced by `get_tile`.
pub struct TileFeature {
  /// pixel x within the tile (0..extent)
  x : Int
  /// pixel y within the tile (0..extent)
  y : Int
  /// cluster properties or original point properties
  tags : Json
  /// feature id (cluster id, generated id, or original id when available)
  id : Option[Json]
}

/// The clustering index. Build with `Supercluster::new(Options::new())`,
/// then call `load(points)` once and query repeatedly.
pub struct Supercluster {
  options : Options
  trees : FixedArray[KDBush]
  stride : Int
  cluster_props : Array[Json]
  mut num_points : Int
  /// per original point properties
  mut props : Array[Json]
  /// original Float64 mercator coords for drift-free single-point output
  mut coords : FixedArray[Double]
  /// per original point feature ids
  mut ids : FixedArray[Option[Json]]
}

const SCALE_F : Double = 1073741824.0 // 2^30

// Int32 encoding of source coords in [0, 1]: (coord - 0.5) * SCALE.
// Same encoding as the reference implementation (SMI fast path there).
pub fn encode(c : Double) -> Int {
  ((c - 0.5) * SCALE_F).to_int()
}

pub fn decode(v : Int) -> Double {
  v.to_double() / SCALE_F + 0.5
}

const OFFSET_ZOOM = 2
const OFFSET_ID = 3
const OFFSET_PARENT = 4
const OFFSET_NUM = 5
const OFFSET_PROP = 6

/// Create a new clustering index with the given options.
pub fn Supercluster::new(options : Options) -> Supercluster {
  let max_zoom = int_min(options.max_zoom, 30)
  let min_zoom = int_min(options.min_zoom, max_zoom)
  let opts = { ..options, max_zoom, min_zoom }
  let stride = match opts.reduce {
    Some(_) => 7
    None => 6
  }
  let trees : FixedArray[KDBush] = FixedArray::make(opts.max_zoom + 2, KDBush::new(0, 64))
  {
    options: opts,
    trees,
    stride,
    cluster_props: [],
    num_points: 0,
    props: [],
    coords: FixedArray::make(0, 0.0),
    ids: FixedArray::make(0, None),
  }
}

/// Load an array of input points and build the whole zoom hierarchy.
pub fn Supercluster::load(self : Supercluster, points : Array[InputPoint]) -> Supercluster {
  let opts = self.options
  let not_processed = opts.max_zoom + 1 // sentinel for "not yet processed"
  let stride = self.stride
  // features (incl. MultiPoint expansion) contribute one point each; features
  // without geometry keep a single empty slot so indices stay aligned with
  // the input, matching the reference implementation's numPoints counting
  let num_points = {
    let mut n = 0
    for p in points {
      n += if p.coords.length() == 0 {
        1
      } else {
        p.coords.length()
      }
    }
    n
  }
  self.num_points = num_points
  let props : Array[Json] = Array::make(num_points, Json::null())
  let coords : FixedArray[Double] = FixedArray::make(num_points * 2, 0.0)
  let ids : FixedArray[Option[Json]] = FixedArray::make(num_points, None)
  // generate a cluster record for each point and index them into a KD-tree
  let data : FixedArray[Int] = FixedArray::make(num_points * stride, 0)
  let mut w = 0
  let mut i = 0
  // index of the individual point (multiple per MultiPoint feature)
  for p in points {
    let n = p.coords.length()
    if n == 0 {
      // keep the slot so point indices stay aligned with input features
      i += 1
      continue
    }
    for c in 0..<n {
      let (lng, lat) = p.coords[c]
      let px = lng_x(lng)
      let py = lat_y(lat)
      coords[2 * i] = px
      coords[2 * i + 1] = py
      data[w] = encode(px)
      data[w + 1] = encode(py)
      data[w + OFFSET_ZOOM] = not_processed
      data[w + OFFSET_ID] = i
      data[w + OFFSET_PARENT] = -1
      data[w + OFFSET_NUM] = 1
      props[i] = p.properties
      match p.id {
        Some(id) => ids[i] = Some(id)
        None => ()
      }
      w += stride
      i += 1
    }
  }
  self.props = props
  self.coords = coords
  self.ids = ids
  let mut prev = data
  let mut prev_num = i
  self.trees[opts.max_zoom + 1] = self.create_tree(prev, prev_num)
  // cluster points on max zoom, then cluster the results on previous zoom,
  // etc.; results in a cluster hierarchy across zoom levels
  let mut z = opts.max_zoom
  while z >= opts.min_zoom {
    let out : FixedArray[Int] = FixedArray::make(prev_num * stride, 0)
    let written = self.cluster_points(prev, prev_num, z, out)
    if written == prev_num {
      // no clusters formed: same coords in same order, reuse the parent tree
      self.trees[z] = self.trees[z + 1]
    } else {
      self.trees[z] = self.create_tree(out, written)
      prev = out
      prev_num = written
    }
    z -= 1
  }
  self
}

/// Get clusters within a bounding box [min_lng, min_lat, max_lng, max_lat]
/// at the given zoom. Handles boxes crossing the international dateline
/// and degenerate bbox values the same way as the reference implementation.
pub fn Supercluster::get_clusters(
  self : Supercluster,
  min_lng0 : Double,
  min_lat0 : Double,
  max_lng0 : Double,
  max_lat0 : Double,
  zoom : Int,
) -> Array[Feature] {
  let mut min_lng = ((min_lng0 + 180.0) % 360.0 + 360.0) % 360.0 - 180.0
  let min_lat = double_max(-90.0, double_min(90.0, min_lat0))
  let mut max_lng = if max_lng0 == 180.0 {
    180.0
  } else {
    ((max_lng0 + 180.0) % 360.0 + 360.0) % 360.0 - 180.0
  }
  let max_lat = double_max(-90.0, double_min(90.0, max_lat0))
  if max_lng0 - min_lng0 >= 360.0 {
    min_lng = -180.0
    max_lng = 180.0
  } else if min_lng > max_lng {
    // bbox crosses the international dateline: query both hemispheres
    let eastern_hem = self.get_clusters(min_lng, min_lat, 180.0, max_lat, zoom)
    let western_hem = self.get_clusters(-180.0, min_lat, max_lng, max_lat, zoom)
    for f in western_hem {
      eastern_hem.push(f)
    }
    return eastern_hem
  }
  let tree = self.trees[self.limit_zoom(zoom)]
  let ids = tree.range(
    encode(lng_x(min_lng)),
    encode(lat_y(max_lat)),
    encode(lng_x(max_lng)),
    encode(lat_y(min_lat)),
  )
  let clusters : Array[Feature] = []
  for id in ids {
    clusters.push(self.feature_json(tree.data, self.stride * id))
  }
  clusters
}

/// Get the children (immediate descendants) of a cluster.
/// Raises if there is no cluster with the specified id.
pub fn Supercluster::get_children(self : Supercluster, cluster_id : Int) -> Array[Feature]!ClusterError {
  let origin_id = self.get_origin_id(cluster_id)
  let origin_zoom = self.get_origin_zoom(cluster_id)
  let error = ClusterError("No cluster with the specified id.")
  if origin_zoom < 0 || origin_zoom >= self.trees.length() {
    raise error
  }
  let tree = self.trees[origin_zoom]
  if origin_id < 0 || origin_id >= tree.num_items {
    raise error
  }
  let data = tree.data
  let r = self.options.radius / (self.options.extent * (1 << (origin_zoom - 1)).to_double())
  let x = data[origin_id * self.stride].to_double()
  let y = data[origin_id * self.stride + 1].to_double()
  let ids = tree.within(x, y, r * SCALE_F)
  let children : Array[Feature] = []
  for id in ids {
    let k = id * self.stride
    if data[k + OFFSET_PARENT] == cluster_id {
      children.push(self.feature_json(data, k))
    }
  }
  if children.is_empty() {
    raise error
  }
  children
}

/// Get the leaves (original points) of a cluster, paginated by
/// `limit` (default 10) and `offset` (default 0).
pub fn Supercluster::get_leaves(
  self : Supercluster,
  cluster_id : Int,
  limit : Int,
  offset : Int,
) -> Array[Feature]!ClusterError {
  // reference impl: `limit = limit || 10` (0/undefined means default 10)
  let limit2 = if limit == 0 { 10 } else { limit }
  let leaves : Array[Feature] = []
  let _ = self.append_leaves(leaves, cluster_id, limit2, offset, 0)
  leaves
}

fn Supercluster::append_leaves(
  self : Supercluster,
  result : Array[Feature],
  cluster_id : Int,
  limit : Int,
  offset : Int,
  skipped0 : Int,
) -> Int!ClusterError {
  let children = self.get_children(cluster_id)
  let mut skipped = skipped0
  for child in children {
    if child.is_cluster {
      if skipped + child.point_count <= offset {
        // skip the whole cluster
        skipped += child.point_count
      } else {
        // enter the cluster
        skipped = self.append_leaves(result, child.cluster_id, limit, offset, skipped)
      }
    } else if skipped < offset {
      // skip a single point
      skipped += 1
    } else {
      // add a single point
      result.push(child)
    }
    if result.length() == limit {
      break
    }
  }
  skipped
}

/// Get a vector tile of clustered points for tile (z, x, y).
/// Returns None when the tile is empty.
pub fn Supercluster::get_tile(self : Supercluster, z : Int, x : Int, y : Int) -> Option[Array[TileFeature]] {
  let tree = self.trees[self.limit_zoom(z)]
  let z2 = 1 << z
  let opts = self.options
  let p = opts.radius / opts.extent
  let top = encode((y.to_double() - p) / z2.to_double())
  let bottom = encode((y.to_double() + 1.0 + p) / z2.to_double())
  let features : Array[TileFeature] = []
  self.add_tile_features(
    tree.range(
      encode((x.to_double() - p) / z2.to_double()),
      top,
      encode((x.to_double() + 1.0 + p) / z2.to_double()),
      bottom,
    ),
    tree.data,
    x,
    y,
    z2,
    features,
  )
  if x == 0 {
    // left edge of the globe: also query the wrapped right edge
    self.add_tile_features(
      tree.range(encode(1.0 - p / z2.to_double()), top, encode(1.0), bottom),
      tree.data,
      z2,
      y,
      z2,
      features,
    )
  }
  if x == z2 - 1 {
    // right edge of the globe: also query the wrapped left edge
    self.add_tile_features(
      tree.range(encode(0.0), top, encode(p / z2.to_double()), bottom),
      tree.data,
      -1,
      y,
      z2,
      features,
    )
  }
  if features.is_empty() {
    None
  } else {
    Some(features)
  }
}

/// Get the zoom at which a cluster expands into its children
/// (the minimal zoom where the cluster splits).
pub fn Supercluster::get_cluster_expansion_zoom(self : Supercluster, cluster_id0 : Int) -> Int!ClusterError {
  let mut expansion_zoom = self.get_origin_zoom(cluster_id0) - 1
  let mut cluster_id = cluster_id0
  while expansion_zoom <= self.options.max_zoom {
    let children = self.get_children(cluster_id)
    expansion_zoom += 1
    if children.length() != 1 {
      break
    }
    let c0 = children[0]
    if !c0.is_cluster {
      raise ClusterError("No cluster with the specified id.")
    }
    cluster_id = c0.cluster_id
  }
  expansion_zoom
}

fn Supercluster::create_tree(self : Supercluster, data : FixedArray[Int], num_items : Int) -> KDBush {
  let tree = KDBush::new(num_items, self.options.node_size)
  let stride = self.stride
  for i in 0..<num_items {
    let _ = tree.add(data[i * stride], data[i * stride + 1])
  }
  let _ = tree.finish()
  tree.data = data
  tree
}

fn Supercluster::add_tile_features(
  self : Supercluster,
  ids : Array[Int],
  data : FixedArray[Int],
  x : Int,
  y : Int,
  z2 : Int,
  tile : Array[TileFeature],
) -> Unit {
  let opts = self.options
  for i in ids {
    let k = i * self.stride
    let is_cluster = data[k + OFFSET_NUM] > 1
    let (tags, px, py) = if is_cluster {
      let tags = get_cluster_properties(data, k, self.cluster_props)
      (tags, decode(data[k]), decode(data[k + 1]))
    } else {
      let orig_index = data[k + OFFSET_ID]
      (self.props[orig_index], self.coords[2 * orig_index], self.coords[2 * orig_index + 1])
    }
    let tx = js_round(opts.extent * (px * z2.to_double() - x.to_double())).to_int()
    let ty = js_round(opts.extent * (py * z2.to_double() - y.to_double())).to_int()
    // assign id: cluster id, generated point id, or original input id
    let orig_index = data[k + OFFSET_ID]
    let id = if is_cluster || opts.generate_id {
      Some(Json::number(orig_index.to_double()))
    } else {
      self.ids[orig_index]
    }
    tile.push({ x: tx, y: ty, tags, id })
  }
}

fn Supercluster::limit_zoom(self : Supercluster, z : Int) -> Int {
  int_max(self.options.min_zoom, int_min(z, self.options.max_zoom + 1))
}

/// The core clustering pass for one zoom level: reads `data`, writes
/// clustered records into `out`, returns the number of records written.
fn Supercluster::cluster_points(
  self : Supercluster,
  data : FixedArray[Int],
  num_items : Int,
  zoom : Int,
  out : FixedArray[Int],
) -> Int {
  let opts = self.options
  let r = opts.radius / (opts.extent * (1 << zoom).to_double()) * SCALE_F
  let not_processed = opts.max_zoom + 1
  let tree = self.trees[zoom + 1]
  let stride = self.stride
  let limit = num_items * stride
  let neighbor_ids : FixedArray[Int] = FixedArray::make(num_items, 0)
  let mut cursor = 0
  // loop through each point
  let mut i = 0
  while i < limit {
    // if we've already visited the point at this zoom level, skip it
    if data[i + OFFSET_ZOOM] <= zoom {
      i += stride
      continue
    }
    data[i + OFFSET_ZOOM] = zoom
    // find all nearby points
    let x = data[i]
    let y = data[i + 1]
    let neighbor_count = tree.within_into(x.to_double(), y.to_double(), r, neighbor_ids)
    let num_points_origin = data[i + OFFSET_NUM]
    let mut num_points = num_points_origin
    // count the number of points in a potential cluster
    for n in 0..<neighbor_count {
      let k = neighbor_ids[n] * stride
      // filter out neighbors that are already processed
      if data[k + OFFSET_ZOOM] > zoom {
        num_points += data[k + OFFSET_NUM]
      }
    }
    // if there were neighbors to merge, and there are enough points to form
    // a cluster
    if num_points > num_points_origin && num_points >= opts.min_points {
      let mut wx = x.to_double() * num_points_origin.to_double()
      let mut wy = y.to_double() * num_points_origin.to_double()
      let mut cluster_properties : Option[Json] = None
      let mut cluster_prop_index = -1
      // encode both zoom and point index on which the cluster originated --
      // offset by total length of features
      let id = ((i / stride) << 5) + (zoom + 1) + self.num_points
      for n in 0..<neighbor_count {
        let k = neighbor_ids[n] * stride
        if data[k + OFFSET_ZOOM] <= zoom {
          continue
        }
        data[k + OFFSET_ZOOM] = zoom // save the zoom (doesn't get processed twice)
        let num_points2 = data[k + OFFSET_NUM]
        wx += data[k].to_double() * num_points2.to_double() // accumulate weighted center
        wy += data[k + 1].to_double() * num_points2.to_double()
        data[k + OFFSET_PARENT] = id
        match opts.reduce {
          Some(reduce) =>
            match cluster_properties {
              None => {
                let init = self.map_props(data, i, true)
                cluster_prop_index = self.cluster_props.length()
                self.cluster_props.push(init)
                cluster_properties = Some(init)
                reduce(init, self.map_props(data, k, false))
              }
              Some(acc) => reduce(acc, self.map_props(data, k, false))
            }
          None => ()
        }
      }
      data[i + OFFSET_PARENT] = id
      out[cursor] = (wx / num_points.to_double()).to_int()
      out[cursor + 1] = (wy / num_points.to_double()).to_int()
      out[cursor + OFFSET_ZOOM] = not_processed
      out[cursor + OFFSET_ID] = id
      out[cursor + OFFSET_PARENT] = -1
      out[cursor + OFFSET_NUM] = num_points
      if stride == 7 {
        out[cursor + OFFSET_PROP] = cluster_prop_index
      }
      cursor += stride
    } else {
      // leave points as unclustered
      for j in 0..<stride {
        out[cursor + j] = data[i + j]
      }
      cursor += stride
      if num_points > 1 {
        for n in 0..<neighbor_count {
          let k = neighbor_ids[n] * stride
          if data[k + OFFSET_ZOOM] <= zoom {
            continue
          }
          data[k + OFFSET_ZOOM] = zoom
          for j in 0..<stride {
            out[cursor + j] = data[k + j]
          }
          cursor += stride
        }
      }
    }
    i += stride
  }
  cursor / stride
}

/// get index of the point from which the cluster originated
fn Supercluster::get_origin_id(self : Supercluster, cluster_id : Int) -> Int {
  (cluster_id - self.num_points) >> 5
}

/// get zoom of the point from which the cluster originated
fn Supercluster::get_origin_zoom(self : Supercluster, cluster_id : Int) -> Int {
  (cluster_id - self.num_points) % 32
}

fn Supercluster::feature_json(self : Supercluster, data : FixedArray[Int], k : Int) -> Feature {
  let i = data[k + OFFSET_ID]
  let is_cluster = data[k + OFFSET_NUM] > 1
  let id = if is_cluster {
    Some(Json::number(i.to_double()))
  } else {
    self.ids[i]
  }
  let (properties, lng, lat, cluster_id, point_count) = if is_cluster {
    let props = get_cluster_properties(data, k, self.cluster_props)
    let cid = data[k + OFFSET_ID]
    let pc = data[k + OFFSET_NUM]
    (props, x_lng(decode(data[k])), y_lat(decode(data[k + 1])), cid, pc)
  } else {
    let props = self.props[i]
    (props, x_lng(self.coords[2 * i]), y_lat(self.coords[2 * i + 1]), 0, 1)
  }
  { id, properties, lng, lat, is_cluster, cluster_id, point_count }
}

/// apply the user-provided map function to point/cluster properties
fn Supercluster::map_props(self : Supercluster, data : FixedArray[Int], i : Int, clone : Bool) -> Json {
  if data[i + OFFSET_NUM] > 1 {
    let props = self.cluster_props[data[i + OFFSET_PROP]]
    if clone {
      shallow_clone_json(props)
    } else {
      props
    }
  } else {
    let original = self.props[data[i + OFFSET_ID]]
    let result = (self.options.map)(original)
    if clone {
      shallow_clone_json(result)
    } else {
      result
    }
  }
}

fn get_cluster_properties(data : FixedArray[Int], i : Int, cluster_props : Array[Json]) -> Json {
  let count = data[i + OFFSET_NUM]
  // below 1000 the reference implementation keeps the raw number (not a string)
  let abbrev = if count >= 10000 {
    Json::string(js_round(count.to_double() / 1000.0).to_int().to_string() + "k")
  } else if count >= 1000 {
    let v = js_round(count.to_double() / 100.0) / 10.0
    Json::string(double_to_js_string(v) + "k")
  } else {
    Json::number(count.to_double())
  }
  let prop_index = data[i + OFFSET_PROP]
  let result : Map[String, Json] = Map([])
  // NOTE: the reference implementation reads clusterProps[propIndex] without a
  // bounds check; with stride=6 (no reduce) propIndex is garbage and the JS
  // OOB read yields `undefined`, which Object.assign treats as {}. A bounds
  // check reproduces that behavior exactly.
  if prop_index >= 0 && prop_index < cluster_props.length() {
    match cluster_props[prop_index] {
      Object(m) =>
        for k, v in m {
          result.set(k, v)
        }
      _ => ()
    }
  }
  result.set("cluster", Json::boolean(true))
  result.set("cluster_id", Json::number(data[i + OFFSET_ID].to_double()))
  result.set("point_count", Json::number(count.to_double()))
  result.set("point_count_abbreviated", abbrev)
  Json::object(result)
}

// shallow-clone a JSON object (equivalent of JS `Object.assign({}, props)`)
fn shallow_clone_json(v : Json) -> Json {
  match v {
    Object(m) => {
      let copy : Map[String, Json] = Map([])
      for k, val in m {
        copy.set(k, val)
      }
      Json::object(copy)
    }
    other => other
  }
}

// format a Double the way JavaScript's String(n) does for the values
// that can appear here (integral values without a trailing ".0")
fn double_to_js_string(d : Double) -> String {
  if d == d.floor() {
    d.to_int().to_string()
  } else {
    d.to_string()
  }
}

fn double_max(a : Double, b : Double) -> Double {
  if a > b {
    a
  } else {
    b
  }
}

fn double_min(a : Double, b : Double) -> Double {
  if a < b {
    a
  } else {
    b
  }
}
