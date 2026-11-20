// Browser wrapper: expose the supercluster index to JavaScript through the
// moon build JS-backend `exports` mechanism (see moon.pkg `link.js.exports`).
//
// Data contract with app.js (must be set before calling sc_build_index):
//   globalThis.__SC_DATA : Float64Array, flat [lng, lat, cityIdx] * n
//   globalThis.__SC_LNG(i) / __SC_LAT(i) / __SC_CITY(i) : element accessors

extern "js" fn js_data_lng(i : Int) -> Double = "globalThis.__SC_LNG"
extern "js" fn js_data_lat(i : Int) -> Double = "globalThis.__SC_LAT"
extern "js" fn js_data_city(i : Int) -> Int = "globalThis.__SC_CITY"

let cities : Array[String] = ["广州", "深圳", "东莞", "佛山", "中山", "珠海"]

let index_ref : Ref[Option[@sc.Supercluster]] = Ref(None)

/// Library version tag, also used as a smoke test for the JS binding.
pub fn sc_version() -> String {
  "moonbitgis/supercluster 0.1.0 (MoonBit JS backend)"
}

/// Read `count` points from JS-provided data, build the whole zoom hierarchy.
/// Returns the number of indexed points.
pub fn sc_build_index(count : Int) -> Int {
  let points : Array[@sc.InputPoint] = []
  for i in 0..<count {
    let city = js_data_city(i)
    let name = if city >= 0 && city < cities.length() {
      cities[city]
    } else {
      "未知"
    }
    let props : Map[String, Json] = Map([])
    props.set("name", Json::string(name))
    points.push(
      @sc.InputPoint::of(js_data_lng(i), js_data_lat(i), Json::object(props)),
    )
  }
  let index = @sc.Supercluster::new(
    @sc.Options::new(min_points=3, radius=60.0, max_zoom=16),
  ).load(points)
  index_ref.val = Some(index)
  index.num_points
}

/// Query clusters/points inside a bbox at a zoom level.
/// Returns a compact JSON array string for the browser to parse.
pub fn sc_clusters(
  min_lng : Double,
  min_lat : Double,
  max_lng : Double,
  max_lat : Double,
  zoom : Int,
) -> String {
  match index_ref.val {
    None => "[]"
    Some(index) => {
      let feats = index.get_clusters(min_lng, min_lat, max_lng, max_lat, zoom)
      let buf = StringBuilder()
      buf.write_string("[")
      for i, f in feats {
        if i > 0 {
          buf.write_string(",")
        }
        buf.write_string("{\"lng\":")
        buf.write_string(f.lng.to_string())
        buf.write_string(",\"lat\":")
        buf.write_string(f.lat.to_string())
        if f.is_cluster {
          buf.write_string(",\"cluster\":true,\"id\":")
          buf.write_string(f.cluster_id.to_string())
          buf.write_string(",\"count\":")
          buf.write_string(f.point_count.to_string())
          buf.write_string("}")
        } else {
          buf.write_string(",\"cluster\":false,\"name\":\"")
          buf.write_string(point_name(f.properties))
          buf.write_string("\"}")
        }
      }
      buf.write_string("]")
      buf.to_string()
    }
  }
}

fn point_name(props : Json) -> String {
  match props {
    Object(m) =>
      match m.get("name") {
        Some(String(s)) => s
        _ => ""
      }
    _ => ""
  }
}

fn main {
  let _ = sc_version()
}
