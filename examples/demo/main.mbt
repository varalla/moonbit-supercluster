// Demo: cluster a synthetic dataset of ~1500 points around China city
// hotspots, print per-zoom cluster counts, expansion zooms and a tile.

/// deterministic LCG random generator
struct Rng {
  mut s : Int
}

fn Rng::next(self : Rng) -> Double {
  // Int overflow wraps, which is fine for a demo PRNG
  self.s = self.s * 1103515245 + 12345
  (self.s >> 1 & 0x3fffffff).to_double() / 1073741824.0
}

fn hotspots() -> Array[(String, Double, Double, Int)] {
  [
    ("Beijing", 116.4074, 39.9042, 500),
    ("Shanghai", 121.4737, 31.2304, 400),
    ("Chengdu", 104.0668, 30.5728, 300),
    ("Guangzhou", 113.2644, 23.1291, 200),
    ("Urumqi", 87.6177, 43.7928, 100),
  ]
}

fn build_points() -> Array[@sc.InputPoint] {
  let rng = Rng::{ s: 42 }
  let props : Map[String, Json] = Map([])
  props.set("kind", Json::string("hotspot"))
  let scattered : Map[String, Json] = Map([])
  scattered.set("kind", Json::string("scattered"))
  let points : Array[@sc.InputPoint] = []
  for hs in hotspots() {
    let (_name, lng0, lat0, count) = hs
    for _i in 0..<count {
      // jitter within ~1.5 degrees
      let lng = lng0 + (rng.next() - 0.5) * 3.0
      let lat = lat0 + (rng.next() - 0.5) * 3.0
      points.push(@sc.InputPoint::of(lng, lat, Json::object(props)))
    }
  }
  for _i in 0..<500 {
    let lng = 73.0 + rng.next() * (135.0 - 73.0)
    let lat = 18.0 + rng.next() * (53.0 - 18.0)
    points.push(@sc.InputPoint::of(lng, lat, Json::object(scattered)))
  }
  points[0] = @sc.InputPoint::make(
    Some(Json::string("first")),
    Json::object(props),
    [(116.4074, 39.9042)],
  )
  points
}

fn cluster_err_msg(e : @sc.ClusterError) -> String {
  match e {
    @sc.ClusterError(m) => m
  }
}

fn main {
  let points = build_points()
  let index = @sc.Supercluster::new(@sc.Options::new()).load(points)
  println("loaded \{index.num_points} points")
  println("--- clusters per zoom ---")
  let mut z = 0
  while z <= 16 {
    let clusters = index.get_clusters(73.0, 18.0, 135.0, 53.0, z)
    let mut clustered = 0
    for c in clusters {
      if c.is_cluster {
        clustered += c.point_count
      }
    }
    println("z\{z}: \{clusters.length()} features, \{clustered} points inside clusters")
    z += 1
  }
  // take the biggest cluster at z3 and inspect it
  let mut best = None
  let mut best_count = 0
  for c in index.get_clusters(73.0, 18.0, 135.0, 53.0, 3) {
    if c.is_cluster && c.point_count > best_count {
      best_count = c.point_count
      best = Some(c)
    }
  }
  match best {
    Some(c) => {
      println("--- biggest cluster at z3 ---")
      println("cluster_id=\{c.cluster_id} point_count=\{c.point_count} lng=\{c.lng} lat=\{c.lat}")
      let ez = try Ok(index.get_cluster_expansion_zoom(c.cluster_id)) catch {
        e => Err(e)
      }
      match ez {
        Ok(ezz) => println("expansion zoom: \{ezz}")
        Err(e) => println("expansion zoom error: \{cluster_err_msg(e)}")
      }
      let leaves = try Ok(index.get_leaves(c.cluster_id, 5, 0)) catch {
        e => Err(e)
      }
      match leaves {
        Ok(ls) => {
          println("first \{ls.length()} leaves:")
          for l in ls {
            println("  (\{l.lng}, \{l.lat})")
          }
        }
        Err(e) => println("leaves error: \{cluster_err_msg(e)}")
      }
    }
    None => println("no clusters at z3")
  }
  // vector tile demo
  println("--- tile z3/6/3 ---")
  match index.get_tile(3, 6, 3) {
    Some(tile) => println("tile has \{tile.length()} point features")
    None => println("tile is empty")
  }
  println("done.")
}
