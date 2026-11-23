// Browser wrapper: expose the supercluster index to JavaScript through the
// moon build JS-backend `exports` mechanism (see moon.pkg `link.js.exports`).
//
// Data contract with app.js (must be set before calling sc_build_index):
//   globalThis.__SC_DATA : Float64Array, flat [lng, lat, cityIdx] * n
//   globalThis.__SC_LNG(i) / __SC_LAT(i) / __SC_CITY(i) : element accessors
//
// Demo extensions (2026-11-23):
//   sc_set_regions(geojson)  : polygon regions, array index = region id
//   sc_build_index(count, sys) : sys 0 = Wgs84, 1 = Gcj02
//   sc_clusters_in_region(region_id, ...) : region-filtered query

extern "js" fn js_data_lng(i : Int) -> Double = "globalThis.__SC_LNG"
extern "js" fn js_data_lat(i : Int) -> Double = "globalThis.__SC_LAT"
extern "js" fn js_data_city(i : Int) -> Int = "globalThis.__SC_CITY"

let cities : Array[String] = ["广州", "深圳", "东莞", "佛山", "中山", "珠海"]

let index_ref : Ref[Option[@sc.Supercluster]] = Ref(None)
let regions_ref : Ref[Array[@sc.Polygon]] = Ref([])
let coord_ref : Ref[@sc.CoordSystem] = Ref(@sc.Wgs84)

/// Library version tag, also used as a smoke test for the JS binding.
pub fn sc_version() -> String {
  "moonbitgis/supercluster 0.1.0 (MoonBit JS backend)"
}

/// Parse a GeoJSON FeatureCollection of city polygons into regions.
/// Returns the number of regions, or -1 if the GeoJSON is invalid.
pub fn sc_set_regions(geojson : String) -> Int {
  let r : Result[Array[@sc.Polygon], Error] = try {
    Ok(@sc.parse_polygons(@json.parse(geojson)))
  } catch {
    e => Err(e)
  }
  match r {
    Ok(polys) => {
      regions_ref.val = polys
      polys.length()
    }
    Err(_) => -1
  }
}

/// Read `count` points from JS-provided data and build the whole zoom
/// hierarchy. `coord_sys`: 0 = Wgs84 (no conversion), 1 = Gcj02 (input
/// data is GCJ-02; converted to WGS-84 internally, output restored).
/// Returns the number of indexed points.
pub fn sc_build_index(count : Int, coord_sys : Int) -> Int {
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
  let coord_system : @sc.CoordSystem = if coord_sys == 1 {
    @sc.Gcj02
  } else {
    @sc.Wgs84
  }
  coord_ref.val = coord_system
  let index = @sc.Supercluster::new(
    @sc.Options::new(
      min_points=3,
      radius=60.0,
      max_zoom=16,
      coord_system=coord_system,
      regions=regions_ref.val,
    ),
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
    Some(index) =>
      render_feats(index.get_clusters(min_lng, min_lat, max_lng, max_lat, zoom))
  }
}

/// Region-filtered query: clusters judged by center (in the input coord
/// system), single points by the region anchored at load time.
/// Invalid region ids yield "[]".
pub fn sc_clusters_in_region(
  region_id : Int,
  min_lng : Double,
  min_lat : Double,
  max_lng : Double,
  max_lat : Double,
  zoom : Int,
) -> String {
  match index_ref.val {
    None => "[]"
    Some(index) => {
      let r : Result[Array[@sc.Feature], Error] = try {
        Ok(index.get_clusters_in_region(region_id, min_lng, min_lat, max_lng, max_lat, zoom))
      } catch {
        e => Err(e)
      }
      match r {
        Ok(feats) => render_feats(feats)
        Err(_) => "[]"
      }
    }
  }
}

/// Render features as a compact JSON array string.
fn render_feats(feats : Array[@sc.Feature]) -> String {
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
