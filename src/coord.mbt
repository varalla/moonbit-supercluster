// Input coordinate system support: WGS-84 (GPS), GCJ-02 (Chinese encrypted
// coordinates used by AMap/Tencent) and BD-09 (Baidu's further offset).
//
// The index core always operates on WGS-84 [0,1] spherical mercator, so the
// conversions here only live at the load/query boundary:
//   - on `load`, input coords are converted to WGS-84 before projection;
//   - on query output, coords are converted back to the input system, so
//     features overlay correctly on a basemap of the same system.
//
// Formulas follow the widely used eviltransform reference (MIT).

/// Supported input coordinate systems.
pub(all) enum CoordSystem {
  /// GPS raw coordinates; no conversion (default)
  Wgs84
  /// Chinese encrypted coordinates (AMap / Tencent maps)
  Gcj02
  /// Baidu coordinates (BD-09, further offset on top of GCJ-02)
  Bd09
}

const GCJ_A : Double = 6378245.0
const GCJ_EE : Double = 0.00669342162296594323
/// PI * 3000 / 180, used by the BD-09 formulas
const BD_PI_X : Double = PI_F * 3000.0 / 180.0

fn out_of_china(lng : Double, lat : Double) -> Bool {
  lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

fn gcj_transform_lat(x : Double, y : Double) -> Double {
  let mut ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * (x.abs()).sqrt()
  ret += (20.0 * @math.sin(6.0 * x * PI_F) + 20.0 * @math.sin(2.0 * x * PI_F)) * 2.0 / 3.0
  ret += (20.0 * @math.sin(y * PI_F) + 40.0 * @math.sin(y / 3.0 * PI_F)) * 2.0 / 3.0
  ret += (160.0 * @math.sin(y / 12.0 * PI_F) + 320.0 * @math.sin(y * PI_F / 30.0)) * 2.0 / 3.0
  ret
}

fn gcj_transform_lng(x : Double, y : Double) -> Double {
  let mut ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * (x.abs()).sqrt()
  ret += (20.0 * @math.sin(6.0 * x * PI_F) + 20.0 * @math.sin(2.0 * x * PI_F)) * 2.0 / 3.0
  ret += (20.0 * @math.sin(x * PI_F) + 40.0 * @math.sin(x / 3.0 * PI_F)) * 2.0 / 3.0
  ret += (150.0 * @math.sin(x / 12.0 * PI_F) + 300.0 * @math.sin(x / 30.0 * PI_F)) * 2.0 / 3.0
  ret
}

/// Exact forward transform WGS-84 -> GCJ-02 (deterministic perturbation).
pub fn wgs84_to_gcj02(lng : Double, lat : Double) -> (Double, Double) {
  if out_of_china(lng, lat) {
    return (lng, lat)
  }
  let rad_lat = lat * PI_F / 180.0
  let mut magic = @math.sin(rad_lat)
  magic = 1.0 - GCJ_EE * magic * magic
  let sqrt_magic = magic.sqrt()
  let d_lat = gcj_transform_lat(lng - 105.0, lat - 35.0) * 180.0 /
    ((GCJ_A * (1.0 - GCJ_EE)) / (magic * sqrt_magic) * PI_F)
  let d_lng = gcj_transform_lng(lng - 105.0, lat - 35.0) * 180.0 /
    (GCJ_A / sqrt_magic * @math.cos(rad_lat) * PI_F)
  (lng + d_lng, lat + d_lat)
}

/// Inverse transform GCJ-02 -> WGS-84 via fixed-point iteration.
/// The GCJ perturbation has no analytic inverse; two iterations recover the
/// original coordinates to well under a millimeter. Outside China the
/// transform is identity, so those points pass through unchanged.
pub fn gcj02_to_wgs84(lng : Double, lat : Double) -> (Double, Double) {
  let mut w_lng = lng
  let mut w_lat = lat
  for _ in 0..<2 {
    let (g_lng, g_lat) = wgs84_to_gcj02(w_lng, w_lat)
    w_lng += lng - g_lng
    w_lat += lat - g_lat
  }
  (w_lng, w_lat)
}

/// Exact transform GCJ-02 -> BD-09 (Baidu's extra offset layer).
pub fn gcj02_to_bd09(lng : Double, lat : Double) -> (Double, Double) {
  let z = (lng * lng + lat * lat).sqrt() + 0.00002 * @math.sin(lat * BD_PI_X)
  let theta = @math.atan2(lat, lng) + 0.000003 * @math.cos(lng * BD_PI_X)
  (z * @math.cos(theta) + 0.0065, z * @math.sin(theta) + 0.006)
}

/// Exact transform BD-09 -> GCJ-02.
pub fn bd09_to_gcj02(lng : Double, lat : Double) -> (Double, Double) {
  let x = lng - 0.0065
  let y = lat - 0.006
  let z = (x * x + y * y).sqrt() - 0.00002 * @math.sin(y * BD_PI_X)
  let theta = @math.atan2(y, x) - 0.000003 * @math.cos(x * BD_PI_X)
  (z * @math.cos(theta), z * @math.sin(theta))
}

/// Transform BD-09 -> WGS-84 (BD-09 -> GCJ-02 exact, then 2-iteration inverse).
pub fn bd09_to_wgs84(lng : Double, lat : Double) -> (Double, Double) {
  let (g_lng, g_lat) = bd09_to_gcj02(lng, lat)
  gcj02_to_wgs84(g_lng, g_lat)
}

/// Transform WGS-84 -> BD-09 (exact forward layering).
pub fn wgs84_to_bd09(lng : Double, lat : Double) -> (Double, Double) {
  let (g_lng, g_lat) = wgs84_to_gcj02(lng, lat)
  gcj02_to_bd09(g_lng, g_lat)
}

/// Load-time boundary: input coordinate system -> WGS-84.
fn input_to_wgs84(
  system : CoordSystem,
  lng : Double,
  lat : Double,
) -> (Double, Double) {
  match system {
    Wgs84 => (lng, lat)
    Gcj02 => gcj02_to_wgs84(lng, lat)
    Bd09 => bd09_to_wgs84(lng, lat)
  }
}

/// Query-time boundary: WGS-84 -> input coordinate system (exact forwards).
fn wgs84_to_input(
  system : CoordSystem,
  lng : Double,
  lat : Double,
) -> (Double, Double) {
  match system {
    Wgs84 => (lng, lat)
    Gcj02 => wgs84_to_gcj02(lng, lat)
    Bd09 => wgs84_to_bd09(lng, lat)
  }
}
