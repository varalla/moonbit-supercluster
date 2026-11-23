// Tests for the extension features: coordinate system conversion
// (GCJ-02 / BD-09), polygon regions and get_clusters_in_region.
// Reference values generated with an independent JS implementation of the
// eviltransform formulas (node), matching the parity methodology used for
// the core suite.

const FEAT_EPS : Double = 1.0e-9

const FC_JSON : String =
  #|{"type":"FeatureCollection","features":[
  #|  {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}},
  #|  {"type":"Feature","geometry":{"type":"MultiPolygon","coordinates":[[[[2,0],[3,0],[3,1],[2,1],[2,0]]],[[[4,0],[5,0],[5,1],[4,1],[4,0]]]]}}
  #|]}

const BAD_JSON : String =
  #|{"type":"Feature","geometry":{"type":"Point","coordinates":[1,2]}}

fn expect_eq_abs(actual : Double, expected : Double, eps : Double) -> Unit!TestError {
  if (actual - expected).abs() >= eps {
    println("ASSERT FAIL: expected \{expected}, got \{actual}")
    raise TestError("double mismatch")
  }
}

test "coord: wgs84 -> gcj02 (guangzhou/beijing, parity vs JS reference)" {
  let (lng, lat) = wgs84_to_gcj02(113.2644, 23.1291)
  expect_eq_abs(lng, 113.269729592103076, FEAT_EPS)
  expect_eq_abs(lat, 23.126423339922844, FEAT_EPS)
  let (lng2, lat2) = wgs84_to_gcj02(116.404, 39.915)
  expect_eq_abs(lng2, 116.410244499169380, FEAT_EPS)
  expect_eq_abs(lat2, 39.916404281501642, FEAT_EPS)
}

test "coord: gcj02 -> wgs84 recovers originals (2 fixed-point iterations)" {
  let (lng, lat) = gcj02_to_wgs84(113.269729592103076, 23.126423339922844)
  expect_eq_abs(lng, 113.264400002776725, FEAT_EPS)
  expect_eq_abs(lat, 23.129100003092859, FEAT_EPS)
  let (lng2, lat2) = gcj02_to_wgs84(116.410244499169380, 39.916404281501642)
  expect_eq_abs(lng2, 116.404000000153815, FEAT_EPS)
  expect_eq_abs(lat2, 39.915000000070428, FEAT_EPS)
}

test "coord: bd09 layer conversions (parity vs JS reference)" {
  let (lng, lat) = gcj02_to_bd09(116.410244499169380, 39.916404281501642)
  expect_eq_abs(lng, 116.416627243787332, FEAT_EPS)
  expect_eq_abs(lat, 39.922699552216216, FEAT_EPS)
  let (g_lng, g_lat) = bd09_to_gcj02(116.416627243787332, 39.922699552216216)
  expect_eq_abs(g_lng, 116.410245062296184, FEAT_EPS)
  expect_eq_abs(g_lat, 39.916403256363040, FEAT_EPS)
  let (w_lng, w_lat) = bd09_to_wgs84(116.416627243787332, 39.922699552216216)
  expect_eq_abs(w_lng, 116.404000563501754, FEAT_EPS)
  expect_eq_abs(w_lat, 39.914998975011009, FEAT_EPS)
}

test "coord: out-of-china points pass through unchanged" {
  let (lng, lat) = wgs84_to_gcj02(-0.1276, 51.5072)
  expect_eq_abs(lng, -0.1276, FEAT_EPS)
  expect_eq_abs(lat, 51.5072, FEAT_EPS)
}

test "polygon: even-odd pip handles holes" {
  let square = Polygon::new([[(0.0, 0.0), (4.0, 0.0), (4.0, 4.0), (0.0, 4.0)]])
  let donut = Polygon::new([
    [(0.0, 0.0), (4.0, 0.0), (4.0, 4.0), (0.0, 4.0)],
    [(1.0, 1.0), (3.0, 1.0), (3.0, 3.0), (1.0, 3.0)],
  ])
  expect_true(square.contains(0.5, 0.5), "pip: inside square")
  expect_true(square.contains(2.0, 2.0), "pip: center of square")
  expect_true(!square.contains(5.0, 5.0), "pip: outside square")
  expect_true(donut.contains(0.5, 0.5), "pip: inside outer ring")
  expect_true(!donut.contains(2.0, 2.0), "pip: donut hole is excluded")
  expect_true(!donut.contains(5.0, 5.0), "pip: outside donut")
}

test "polygon: parse geojson featurecollection / multi polygon" {
  let gj = parse_json_or_fail(FC_JSON)
  let regions = parse_polygons(gj) catch {
    PolygonError(msg) => {
      println("ASSERT FAIL: \{msg}")
      raise TestError(msg)
    }
  }
  expect_true(regions.length() == 3, "fc: 1 polygon + multi polygon of 2")
  expect_true(regions[0].contains(0.5, 0.5), "region0 contains interior")
  expect_true(!regions[0].contains(2.5, 0.5), "region0 excludes other cells")
  expect_true(regions[1].contains(2.5, 0.5), "region1 from multipolygon[0]")
  expect_true(regions[2].contains(4.5, 0.5), "region2 from multipolygon[1]")
  // invalid geometry type must raise
  let bad = parse_json_or_fail(BAD_JSON)
  let r : Result[Array[Polygon], PolygonError] = try Ok(parse_polygons(bad)) catch {
    e => Err(e)
  }
  let rejected = match r {
    Err(PolygonError(_)) => true
    _ => false
  }
  expect_true(rejected, "point geometry is rejected")
}

test "region: load anchors points; query filters by anchored region" {
  // region 0 covers a Guangzhou-ish rect, region 1 a disjoint rect
  let regions : Array[Polygon] = [
    Polygon::new([[(113.0, 22.0), (114.0, 22.0), (114.0, 23.5), (113.0, 23.5)]]),
    Polygon::new([[(114.5, 22.0), (115.5, 22.0), (115.5, 23.0), (114.5, 23.0)]]),
  ]
  let pts : Array[InputPoint] = [
    InputPoint::of(113.3, 22.5, Json::null()),
    InputPoint::of(113.4, 22.5, Json::null()),
    InputPoint::of(113.5, 22.5, Json::null()),
    InputPoint::of(113.6, 23.2, Json::null()),
    InputPoint::of(115.0, 22.5, Json::null()),
    InputPoint::of(115.1, 22.5, Json::null()),
    InputPoint::of(115.2, 22.5, Json::null()),
    InputPoint::of(116.5, 24.5, Json::null()), // outside all regions
  ]
  let sc = Supercluster::new(Options::new(regions~)).load(pts)
  // zoom 6: the 0.1-deg-apart trios merge into clusters, far points stay solo
  let all = sc.get_clusters(-180.0, -85.0, 180.0, 85.0, 6)
  expect_true(all.length() == 4, "whole-world query: 2 clusters + 2 solo points")
  let r0 = sc.get_clusters_in_region(0, -180.0, -85.0, 180.0, 85.0, 6) catch {
    PolygonError(msg) => {
      println("ASSERT FAIL: \{msg}")
      raise TestError(msg)
    }
  }
  expect_true(r0.length() == 2, "region0: 1 cluster + 1 solo point")
  let mut cluster_count = 0
  let mut point_count = 0
  for f in r0 {
    if f.is_cluster {
      cluster_count += 1
      expect_true(f.point_count == 3, "region0 cluster has 3 points")
    } else {
      point_count += 1
      expect_eq_abs(f.lng, 113.6, FEAT_EPS)
      expect_eq_abs(f.lat, 23.2, FEAT_EPS)
    }
  }
  expect_true(cluster_count == 1 && point_count == 1, "region0: 1 cluster + 1 point")
  let r1 = sc.get_clusters_in_region(1, -180.0, -85.0, 180.0, 85.0, 6) catch {
    PolygonError(msg) => {
      println("ASSERT FAIL: \{msg}")
      raise TestError(msg)
    }
  }
  expect_true(r1.length() == 1, "region1: single cluster")
  expect_true(r1[0].is_cluster && r1[0].point_count == 3, "region1 cluster of 3")
  // zoom-in yields exactly the anchored single points of region 0
  let r0_hi = sc.get_clusters_in_region(0, -180.0, -85.0, 180.0, 85.0, 12) catch {
    PolygonError(msg) => {
      println("ASSERT FAIL: \{msg}")
      raise TestError(msg)
    }
  }
  expect_true(r0_hi.length() == 4, "region0 at z12: 4 solo points")
  // region queries partition the default query output
  expect_true(all.length() == r0.length() + r1.length() + 1, "unanchored points stay outside regions")
}

test "region: invalid region id raises PolygonError" {
  let sc = Supercluster::new(
    Options::new(
      regions=[
        Polygon::new([[(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]]),
      ],
    ),
  ).load([InputPoint::of(0.5, 0.5, Json::null())])
  let r : Result[Array[Feature], PolygonError] = try {
    Ok(sc.get_clusters_in_region(5, -180.0, -85.0, 180.0, 85.0, 6))
  } catch {
    e => Err(e)
  }
  let raised = match r {
    Err(PolygonError(_)) => true
    _ => false
  }
  expect_true(raised, "region id 5 is out of range")
}

test "coord: gcj02 input round-trips through load/query" {
  let sc = Supercluster::new(Options::new(coord_system=Gcj02)).load([
    InputPoint::of(113.2644, 23.1291, Json::null()),
    InputPoint::of(116.404, 39.915, Json::null()),
  ])
  let feats = sc.get_clusters(-180.0, -85.0, 180.0, 85.0, 16)
  expect_true(feats.length() == 2, "two far-apart points stay separate at z16")
  for f in feats {
    let in_gz = (f.lng - 113.2644).abs() < 1.0
    if in_gz {
      // output must come back in the input (GCJ-02) system
      expect_eq_abs(f.lng, 113.2644, 1.0e-8)
      expect_eq_abs(f.lat, 23.1291, 1.0e-8)
    } else {
      expect_eq_abs(f.lng, 116.404, 1.0e-8)
      expect_eq_abs(f.lat, 39.915, 1.0e-8)
    }
  }
}
