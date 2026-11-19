// Web Mercator projection helpers.
// Port of the helpers in mapbox/supercluster (BSD-2-Clause, (c) Volodymyr Agafonkin).

const PI_F : Double = 3.141592653589793

/// longitude/latitude to spherical mercator in [0..1] range
pub fn lng_x(lng : Double) -> Double {
  lng / 360.0 + 0.5
}

/// latitude to spherical mercator in [0..1] range (clamped to poles)
pub fn lat_y(lat : Double) -> Double {
  let sin = @math.sin(lat * PI_F / 180.0)
  let y = 0.5 - 0.25 * @math.ln((1.0 + sin) / (1.0 - sin)) / PI_F
  if y < 0.0 {
    0.0
  } else if y > 1.0 {
    1.0
  } else {
    y
  }
}

/// spherical mercator x to longitude
pub fn x_lng(x : Double) -> Double {
  (x - 0.5) * 360.0
}

/// spherical mercator y to latitude
pub fn y_lat(y : Double) -> Double {
  let y2 = (180.0 - y * 360.0) * PI_F / 180.0
  360.0 * @math.atan(@math.exp(y2)) / PI_F - 90.0
}

/// JS-style Math.round (round half toward +infinity), used to keep
/// bit-for-bit parity with the reference implementation.
fn js_round(d : Double) -> Double {
  (d + 0.5).floor()
}

fn int_max(a : Int, b : Int) -> Int {
  if a > b {
    a
  } else {
    b
  }
}

fn int_min(a : Int, b : Int) -> Int {
  if a < b {
    a
  } else {
    b
  }
}
