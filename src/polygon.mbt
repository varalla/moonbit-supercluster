// Polygon regions: planar polygons in lng/lat degrees with even-odd
// point-in-polygon testing, plus GeoJSON parsing. Regions are attached via
// `Options.regions`; every input point is then anchored to the first
// polygon containing it (array index = region id), see `Supercluster::load`.

/// Error raised when region/GeoJSON input cannot be parsed or a region id
/// is out of range.
#derive(Debug)
pub(all) suberror PolygonError {
  PolygonError(String)
}

/// A planar polygon: `rings[0]` is the outer ring, the remaining rings are
/// holes. Even-odd rule across all rings handles holes automatically.
pub struct Polygon {
  rings : Array[Array[(Double, Double)]]
}

/// Build a polygon from rings of (lng, lat) vertices.
pub fn Polygon::new(rings : Array[Array[(Double, Double)]]) -> Polygon {
  { rings, }
}

/// Point-in-polygon test via even-odd ray casting (with-hole aware).
pub fn Polygon::contains(self : Polygon, lng : Double, lat : Double) -> Bool {
  let mut inside = false
  for ring in self.rings {
    if ring_contains(ring, lng, lat) {
      inside = !inside
    }
  }
  inside
}

/// Classic even-odd ray casting for a single ring.
fn ring_contains(
  ring : Array[(Double, Double)],
  x : Double,
  y : Double,
) -> Bool {
  let mut inside = false
  let n = ring.length()
  let mut j = n - 1
  for i in 0..<n {
    let (xi, yi) = ring[i]
    let (xj, yj) = ring[j]
    if (yi > y) != (yj > y) {
      let cross_x = (xj - xi) * (y - yi) / (yj - yi) + xi
      if x < cross_x {
        inside = !inside
      }
    }
    j = i
  }
  inside
}

/// Parse region polygons from GeoJSON. Accepts a FeatureCollection, a JSON
/// array of features/geometries, or a single feature/geometry. Polygon
/// features contribute one region each, MultiPolygon features contribute
/// one region per member polygon; regions are numbered in input order and
/// that index is the region id used by `get_clusters_in_region`.
pub fn parse_polygons(json : Json) -> Array[Polygon]!PolygonError {
  let result : Array[Polygon] = []
  collect_polygons(json, result)
  result
}

fn collect_polygons(json : Json, out : Array[Polygon]) -> Unit!PolygonError {
  let err : String = "not a Polygon/Feature/FeatureCollection JSON value"
  match json {
    Array(items) =>
      for item in items {
        collect_polygons(item, out)
      }
    Object(m) =>
      match m.get("type") {
        Some(String("FeatureCollection")) =>
          match m.get("features") {
            Some(Array(features)) =>
              for f in features {
                collect_polygons(f, out)
              }
            _ => raise PolygonError("FeatureCollection needs a features array")
          }
        Some(String("Feature")) =>
          match m.get("geometry") {
            Some(g) => collect_polygons(g, out)
            None => raise PolygonError("Feature needs a geometry")
          }
        Some(String("Polygon")) => out.push(parse_polygon_rings(m))
        Some(String("MultiPolygon")) =>
          match m.get("coordinates") {
            Some(Array(polys)) =>
              for poly in polys {
                let tmp : Map[String, Json] = Map([])
                tmp.set("type", Json::string("Polygon"))
                tmp.set("coordinates", poly)
                out.push(parse_polygon_rings(tmp))
              }
            _ => raise PolygonError("MultiPolygon needs coordinates")
          }
        _ => raise PolygonError(err)
      }
    _ => raise PolygonError(err)
  }
}

/// Parse a Polygon object's `coordinates` into rings of (lng, lat) pairs.
fn parse_polygon_rings(obj : Map[String, Json]) -> Polygon!PolygonError {
  match obj.get("coordinates") {
    Some(Array(rings)) => {
      let parsed : Array[Array[(Double, Double)]] = []
      for ring in rings {
        parsed.push(parse_ring(ring))
      }
      Polygon::new(parsed)
    }
    _ => raise PolygonError("Polygon needs coordinates")
  }
}

fn parse_ring(ring : Json) -> Array[(Double, Double)]!PolygonError {
  match ring {
    Array(positions) => {
      let pts : Array[(Double, Double)] = []
      for pos in positions {
        match pos {
          Array(nums) =>
            if nums.length() >= 2 {
              pts.push((jnum_or_fail(nums[0]), jnum_or_fail(nums[1])))
            } else {
              raise PolygonError("position needs at least 2 numbers")
            }
          _ => raise PolygonError("position must be an array of numbers")
        }
      }
      pts
    }
    _ => raise PolygonError("ring must be an array of positions")
  }
}

fn jnum_or_fail(j : Json) -> Double!PolygonError {
  match j {
    Number(d, ..) => d
    _ => raise PolygonError("expected a number in coordinates")
  }
}
