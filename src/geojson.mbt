// GeoJSON input adapter: parse a Point/MultiPoint FeatureCollection string
// into the array of `InputPoint` expected by `Supercluster::load`.

/// Error raised when parsing invalid GeoJSON input.
#derive(Debug)
pub(all) suberror GeoJSONError {
  GeoJSONError(String)
}

/// Parse a GeoJSON `FeatureCollection` whose features are Point or
/// MultiPoint geometries. Raises on invalid input.
pub fn parse_geojson_points(json : String) -> Array[InputPoint]!GeoJSONError {
  let root : Json = try @json.parse(json) catch {
    _ => raise GeoJSONError("GeoJSON error: invalid JSON")
  }
  let features : Array[Json] = match root {
    Object(m) =>
      match m.get("features") {
        Some(Array(fs)) => fs
        _ => raise GeoJSONError("GeoJSON error: expected FeatureCollection with a features array")
      }
    _ => raise GeoJSONError("GeoJSON error: root must be a FeatureCollection object")
  }
  let result : Array[InputPoint] = []
  for f in features {
    let id : Option[Json] = match f {
      Object(m) => m.get("id")
      _ => None
    }
    let properties : Json = match f {
      Object(m) =>
        match m.get("properties") {
          Some(p) => p
          None => Json::null()
        }
      _ => raise GeoJSONError("GeoJSON error: feature must be an object")
    }
    // features without geometry keep a (empty) slot so that point indices
    // stay aligned with input features, matching the reference implementation
    let coords : Array[(Double, Double)] = match f {
      Object(m) =>
        match m.get("geometry") {
          Some(Object(g)) => parse_geometry_coords(g)
          _ => []
        }
      _ => raise GeoJSONError("GeoJSON error: feature must be an object")
    }
    result.push({ id, properties, coords })
  }
  result
}

fn parse_geometry_coords(g : Map[String, Json]) -> Array[(Double, Double)]!GeoJSONError {
  let gtype = match g.get("type") {
    Some(String(s)) => s
    _ => raise GeoJSONError("GeoJSON error: geometry missing type")
  }
  let cs = match g.get("coordinates") {
    Some(Array(a)) => a
    _ => raise GeoJSONError("GeoJSON error: geometry missing coordinates")
  }
  let result : Array[(Double, Double)] = []
  if gtype == "Point" {
    result.push(parse_pos(cs))
  } else if gtype == "MultiPoint" {
    for c in cs {
      match c {
        Array(arr) => result.push(parse_pos(arr))
        _ => raise GeoJSONError("GeoJSON error: MultiPoint coordinates must be positions")
      }
    }
  } else {
    raise GeoJSONError("GeoJSON error: only Point and MultiPoint geometries are supported")
  }
  result
}

fn parse_pos(a : Array[Json]) -> (Double, Double)!GeoJSONError {
  if a.length() < 2 {
    raise GeoJSONError("GeoJSON error: position must be [lng, lat]")
  }
  let lng = match a[0] {
    Number(d, ..) => d
    _ => raise GeoJSONError("GeoJSON error: position lng must be a number")
  }
  let lat = match a[1] {
    Number(d, ..) => d
    _ => raise GeoJSONError("GeoJSON error: position lat must be a number")
  }
  (lng, lat)
}
