// Tests for the coordinate-system extension: WGS-84 / GCJ-02 / BD-09
// conversions and their wiring through load()/feature output.
// Reference values generated with an independent JS implementation of the
// eviltransform formulas (node), matching the parity methodology used for
// the core suite.

const FEAT_EPS : Double = 1.0e-9

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
