// Parity tests: expected values are taken verbatim from the test suite of
// mapbox/supercluster (test/test.js + fixtures), so this suite verifies
// bit-for-bit behavioral parity with the reference implementation.

#derive(Debug)
suberror TestError {
  TestError(String)
}

fn expect_true(b : Bool, msg : String) -> Unit!TestError {
  if !b {
    println("ASSERT FAIL: \{msg}")
    raise TestError(msg)
  }
}

fn parse_json_or_fail(s : String) -> Json!TestError {
  try @json.parse(s) catch {
    _ => {
      println("ASSERT FAIL: fixture JSON parse failed")
      raise TestError("fixture JSON parse failed")
    }
  }
}

fn jarr(j : Json) -> Array[Json] {
  match j {
    Array(a) => a
    _ => []
  }
}

fn jobj(j : Json) -> Map[String, Json] {
  match j {
    Object(m) => m
    _ => {
      let m : Map[String, Json] = Map([])
      m
    }
  }
}

fn jnum(j : Json) -> Double {
  match j {
    Number(d, ..) => d
    _ => -1.0e308
  }
}

fn is_cluster_tags(tags : Json) -> Bool {
  match tags {
    Object(m) =>
      match m.get("cluster") {
        Some(True) => true
        _ => false
      }
    _ => false
  }
}

fn prop_string(j : Json, key : String) -> String {
  match j {
    Object(m) =>
      match m.get(key) {
        Some(String(s)) => s
        _ => ""
      }
    _ => ""
  }
}

fn load_places(options : Options) -> Supercluster!TestError {
  let points = try parse_geojson_points(places_json) catch {
    GeoJSONError(msg) => {
      println("ASSERT FAIL: \{msg}")
      raise TestError(msg)
    }
  }
  Supercluster::new(options).load(points)
}

test "kdbush range and within" {
  let tree = KDBush::new(3, 64)
  let _ = tree.add(encode(lng_x(0.0)), encode(lat_y(0.0)))
  let _ = tree.add(encode(lng_x(10.0)), encode(lat_y(10.0)))
  let _ = tree.add(encode(lng_x(50.0)), encode(lat_y(50.0)))
  let _ = tree.finish()
  // note: mercator y grows southward, so lat_y(1) < lat_y(-1)
  let r = tree.range(
    encode(lng_x(-1.0)),
    encode(lat_y(1.0)),
    encode(lng_x(1.0)),
    encode(lat_y(-1.0)),
  )
  expect_true(r.length() == 1, "range should find 1 item")
  let w = tree.within(
    encode(lng_x(10.0)).to_double(),
    encode(lat_y(10.0)).to_double(),
    100000.0,
  )
  expect_true(w.length() == 1, "within should find 1 item")
}

test "generates clusters properly (parity with mapbox/supercluster)" {
  let index = load_places(Options::new())
  let tile = index.get_tile(0, 0, 0)
  expect_true(tile is Some(_), "tile 0/0/0 should not be empty")
  let features = match tile {
    Some(fs) => fs
    None => []
  }
  let expected = parse_json_or_fail(places_tile_json)
  let exp_features = match jobj(expected).get("features") {
    Some(Array(fs)) => fs
    _ => []
  }
  expect_true(
    features.length() == exp_features.length(),
    "expected \{exp_features.length()} features, got \{features.length()}",
  )
  let mut i = 0
  while i < features.length() {
    let f = features[i]
    let em = jobj(exp_features[i])
    let geo = jarr(match em.get("geometry") {
      Some(g) => g
      None => Json::null()
    })
    let pos = jarr(geo[0])
    expect_true(f.x.to_double() == jnum(pos[0]), "tx mismatch at \{i}")
    expect_true(f.y.to_double() == jnum(pos[1]), "ty mismatch at \{i}")
    let exp_tags = match em.get("tags") {
      Some(t) => t
      None => Json::null()
    }
    expect_true(Json::equal(f.tags, exp_tags), "tags mismatch at \{i}")
    match (f.id, em.get("id")) {
      (Some(a), Some(b)) => expect_true(Json::equal(a, b), "id mismatch at \{i}")
      (None, None) => ()
      _ => expect_true(false, "id presence mismatch at \{i}")
    }
    i += 1
  }
}

test "supports minPoints option" {
  let index = load_places(Options::new(min_points=5))
  let tile = index.get_tile(0, 0, 0)
  expect_true(tile is Some(_), "tile 0/0/0 should not be empty")
  let features = match tile {
    Some(fs) => fs
    None => []
  }
  let expected = parse_json_or_fail(places_tile_min5_json)
  let exp_features = match jobj(expected).get("features") {
    Some(Array(fs)) => fs
    _ => []
  }
  expect_true(features.length() == exp_features.length(), "feature count mismatch")
  let mut i = 0
  while i < features.length() {
    let f = features[i]
    let em = jobj(exp_features[i])
    let geo = jarr(match em.get("geometry") {
      Some(g) => g
      None => Json::null()
    })
    let pos = jarr(geo[0])
    expect_true(f.x.to_double() == jnum(pos[0]) && f.y.to_double() == jnum(pos[1]), "coords mismatch at \{i}")
    let exp_tags = match em.get("tags") {
      Some(t) => t
      None => Json::null()
    }
    expect_true(Json::equal(f.tags, exp_tags), "tags mismatch at \{i}")
    i += 1
  }
}

test "returns children of a cluster" {
  let index = load_places(Options::new())
  let children = index.get_children(164)
  let counts : Array[Json] = []
  for p in children {
    counts.push(Json::number(p.point_count.to_double()))
  }
  let expected : Array[Json] = [
    Json::number(6.0),
    Json::number(7.0),
    Json::number(2.0),
    Json::number(1.0),
  ]
  expect_true(counts.length() == 4, "expected 4 children")
  let mut i = 0
  while i < 4 {
    expect_true(Json::equal(counts[i], expected[i]), "child count \{i} mismatch")
    i += 1
  }
}

test "returns leaves of a cluster" {
  let index = load_places(Options::new())
  let leaves = index.get_leaves(164, 10, 5)
  let names = [
    "Niagara Falls",
    "Cape San Blas",
    "Cape Sable",
    "Cape Canaveral",
    "San  Salvador",
    "Cabo Gracias a Dios",
    "I. de Cozumel",
    "Grand Cayman",
    "Miquelon",
    "Cape Bauld",
  ]
  expect_true(leaves.length() == 10, "expected 10 leaves")
  let mut i = 0
  while i < 10 {
    expect_true(prop_string(leaves[i].properties, "name") == names[i], "leaf \{i} name mismatch")
    i += 1
  }
}

test "generates unique ids with generateId option" {
  let index = load_places(Options::new(generate_id=true))
  let tile = index.get_tile(0, 0, 0)
  let features = match tile {
    Some(fs) => fs
    None => []
  }
  let ids : Array[Json] = []
  for f in features {
    if !is_cluster_tags(f.tags) {
      match f.id {
        Some(id) => ids.push(id)
        None => ()
      }
    }
  }
  let expected : Array[Json] = [
    Json::number(12.0),
    Json::number(20.0),
    Json::number(21.0),
    Json::number(22.0),
    Json::number(24.0),
    Json::number(28.0),
    Json::number(30.0),
    Json::number(62.0),
    Json::number(81.0),
    Json::number(118.0),
    Json::number(119.0),
    Json::number(125.0),
    Json::number(81.0),
    Json::number(118.0),
  ]
  expect_true(ids.length() == expected.length(), "expected \{expected.length()} ids, got \{ids.length()}")
  let mut i = 0
  while i < expected.length() {
    expect_true(Json::equal(ids[i], expected[i]), "id \{i} mismatch")
    i += 1
  }
}

test "getLeaves handles null-property features" {
  let points = parse_geojson_points(places_json)
  let null_props_point = InputPoint::make(
    None,
    Json::null(),
    [(-79.04411780507252, 43.08771393436908)],
  )
  points.push(null_props_point)
  let index = Supercluster::new(Options::new()).load(points)
  let leaves = index.get_leaves(165, 1, 6)
  expect_true(leaves.length() == 1, "expected 1 leaf")
  expect_true(leaves[0].properties is Null, "leaf properties should be null")
}

test "returns cluster expansion zoom" {
  let index = load_places(Options::new())
  expect_true(index.get_cluster_expansion_zoom(164) == 1, "expansion zoom of 164")
  expect_true(index.get_cluster_expansion_zoom(196) == 1, "expansion zoom of 196")
  expect_true(index.get_cluster_expansion_zoom(581) == 2, "expansion zoom of 581")
  expect_true(index.get_cluster_expansion_zoom(1157) == 2, "expansion zoom of 1157")
  expect_true(index.get_cluster_expansion_zoom(4134) == 3, "expansion zoom of 4134")
}

test "returns cluster expansion zoom for maxZoom" {
  let index = load_places(Options::new(radius=60.0, extent=256.0, max_zoom=4))
  expect_true(index.get_cluster_expansion_zoom(2504) == 5, "expansion zoom of 2504")
}

fn get_sum(j : Json) -> Double {
  match j {
    Object(m) =>
      match m.get("sum") {
        Some(Number(d, ..)) => d
        _ => 0.0
      }
    _ => 0.0
  }
}

fn check_tile_sums(
  tile : Option[Array[TileFeature]],
  expected : Array[Double],
  label : String,
) -> Unit!TestError {
  let features = match tile {
    Some(fs) => fs
    None => []
  }
  let sums : Array[Double] = []
  for f in features {
    match f.tags {
      Object(m) =>
        match m.get("sum") {
          Some(Number(d, ..)) => if d != 0.0 {
            sums.push(d)
          }
          _ => ()
        }
      _ => ()
    }
  }
  expect_true(sums.length() == expected.length(), "\{label}: expected \{expected.length()} sums, got \{sums.length()}")
  let mut i = 0
  while i < expected.length() {
    expect_true(sums[i] == expected[i], "\{label}: sum \{i} mismatch: \{sums[i]} vs \{expected[i]}")
    i += 1
  }
}

test "aggregates cluster properties with reduce" {
  let index = load_places(
    Options::new(
      radius=100.0,
      map=fn(props) {
        let m : Map[String, Json] = Map([])
        match props {
          Object(pm) =>
            match pm.get("scalerank") {
              Some(sr) => m.set("sum", sr)
              None => m.set("sum", Json::null())
            }
          _ => ()
        }
        Json::object(m)
      },
      reduce=Some(fn(a, b) {
        let total = get_sum(a) + get_sum(b)
        match a {
          Object(m) => m.set("sum", Json::number(total))
          _ => ()
        }
      }),
    ),
  )
  check_tile_sums(index.get_tile(1, 0, 0), [146.0, 84.0, 63.0, 23.0, 34.0, 12.0, 19.0, 29.0, 8.0, 8.0, 80.0, 35.0], "z1")
  check_tile_sums(index.get_tile(0, 0, 0), [298.0, 122.0, 12.0, 36.0, 98.0, 7.0, 24.0, 8.0, 125.0, 98.0, 125.0, 12.0, 36.0, 8.0], "z0")
}

test "returns clusters when query crosses international dateline" {
  let points : Array[InputPoint] = [
    InputPoint::make(None, Json::null(), [(-178.989, 0.0)]),
    InputPoint::make(None, Json::null(), [(-178.990, 0.0)]),
    InputPoint::make(None, Json::null(), [(-178.991, 0.0)]),
    InputPoint::make(None, Json::null(), [(-178.992, 0.0)]),
  ]
  let index = Supercluster::new(Options::new()).load(points)
  let non_crossing = index.get_clusters(-179.0, -10.0, -177.0, 10.0, 1)
  let crossing = index.get_clusters(179.0, -10.0, -177.0, 10.0, 1)
  expect_true(non_crossing.length() > 0, "non-crossing query should find clusters")
  expect_true(crossing.length() > 0, "crossing query should find clusters")
  expect_true(non_crossing.length() == crossing.length(), "crossing and non-crossing results should match")
}

test "does not crash on weird bbox values" {
  let index = load_places(Options::new())
  expect_true(index.get_clusters(129.426390, -103.720017, -445.930843, 114.518236, 1).length() == 26, "bbox 1")
  expect_true(index.get_clusters(112.207836, -84.578666, -463.149397, 120.169159, 1).length() == 27, "bbox 2")
  expect_true(index.get_clusters(129.886277, -82.332680, -445.470956, 120.390930, 1).length() == 26, "bbox 3")
  expect_true(index.get_clusters(458.220043, -84.239039, -117.137190, 120.206585, 1).length() == 25, "bbox 4")
  expect_true(index.get_clusters(456.713058, -80.354196, -118.644175, 120.539148, 1).length() == 25, "bbox 5")
  expect_true(index.get_clusters(453.105328, -75.857422, -122.251904, 120.732760, 1).length() == 25, "bbox 6")
  expect_true(index.get_clusters(-180.0, -90.0, 180.0, 90.0, 1).length() == 61, "world bbox")
}

test "makes sure same-location points are clustered" {
  let points : Array[InputPoint] = [
    InputPoint::make(None, Json::null(), [(-1.426798, 53.943034)]),
    InputPoint::make(None, Json::null(), [(-1.426798, 53.943034)]),
  ]
  let index = Supercluster::new(Options::new(max_zoom=20, extent=8192.0, radius=16.0)).load(points)
  expect_true(index.trees[20].num_items == 1, "same-location points should merge into 1 record")
}

test "makes sure unclustered point coords are not rounded" {
  let points : Array[InputPoint] = [
    InputPoint::make(
      None,
      Json::null(),
      [(173.19150559062456, -41.340357424709275)],
    ),
  ]
  let index = Supercluster::new(Options::new(max_zoom=19)).load(points)
  let tile = index.get_tile(20, 1028744, 656754)
  expect_true(tile is Some(_), "tile should exist")
  let features = match tile {
    Some(fs) => fs
    None => []
  }
  expect_true(features.length() >= 1, "tile should have features")
  expect_true(features[0].x == 421 && features[0].y == 281, "expected [421, 281], got [\{features[0].x}, \{features[0].y}]")
}

test "expands MultiPoint features into individual points" {
  let mp_props : Map[String, Json] = Map([])
  mp_props.set("a", Json::number(1.0))
  let p_props : Map[String, Json] = Map([])
  p_props.set("b", Json::number(2.0))
  let points : Array[InputPoint] = [
    InputPoint::make(
      Some(Json::string("mp")),
      Json::object(mp_props),
      [(0.0, 0.0), (0.001, 0.001), (50.0, 50.0)],
    ),
    InputPoint::make(None, Json::object(p_props), [(0.0, 0.0)]),
  ]
  let index = Supercluster::new(Options::new()).load(points)
  let clusters = index.get_clusters(-180.0, -85.0, 180.0, 85.0, 5)
  expect_true(clusters.length() == 2, "expected 2 features, got \{clusters.length()}")
  expect_true(clusters[0].point_count == 3, "first feature should aggregate 3 points")
  let c1 = clusters[1]
  let dlng = if c1.lng - 49.999999999999986 < 0.0 {
    49.999999999999986 - c1.lng
  } else {
    c1.lng - 49.999999999999986
  }
  expect_true(dlng < 1.0e-12 && (c1.lat - 50.0).abs() < 1.0e-12, "unexpected coords (\{c1.lng}, \{c1.lat})")
  expect_true(Json::equal(c1.properties, Json::object(mp_props)), "properties should pass through")
  match c1.id {
    Some(String(s)) => expect_true(s == "mp", "id should be 'mp'")
    _ => expect_true(false, "id should be 'mp'")
  }
  let leaves = index.get_leaves(clusters[0].cluster_id, 10, 0)
  expect_true(leaves.length() == 3, "expected 3 leaves")
  expect_true(Json::equal(leaves[0].properties, Json::object(mp_props)), "leaf 0")
  expect_true(Json::equal(leaves[1].properties, Json::object(p_props)), "leaf 1")
  expect_true(Json::equal(leaves[2].properties, Json::object(mp_props)), "leaf 2")
}

test "does not throw on zero items" {
  let index = Supercluster::new(Options::new()).load([])
  expect_true(index.get_clusters(-180.0, -85.0, 180.0, 85.0, 0).is_empty(), "no clusters on empty input")
}

test "geo helpers roundtrip" {
  let lng = 116.4074
  let lat = 39.9042
  let x = lng_x(lng)
  let y = lat_y(lat)
  expect_true((x_lng(x) - lng).abs() < 1.0e-12, "lng roundtrip")
  expect_true((y_lat(y) - lat).abs() < 1.0e-12, "lat roundtrip")
}
