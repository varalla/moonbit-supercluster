// Static KD-tree over Int32-encoded mercator coordinates.
// Port of mourner/kdbush (BSD-2-Clause, (c) Volodymyr Agafonkin) used by supercluster:
// flat arrays + Floyd-Rivest selection + iterative range/within DFS.

/// A very fast static KD-tree. Points are added with `add(x, y)` and the tree
/// is built with `finish()`. Coordinates are stored as Int32 values.
pub struct KDBush {
  num_items : Int
  node_size : Int
  /// item indices, kd-sorted by `finish()`
  ids : FixedArray[Int]
  /// flat (x, y) pairs, kd-sorted in sync with `ids`
  coords : FixedArray[Int]
  /// insert cursor used while indexing
  mut pos : Int
  mut finished : Bool
  /// payload slab attached by the owner (supercluster keeps its flat
  /// point/cluster records here, one record per stride cells)
  mut data : FixedArray[Int]
}

/// Create an index that will hold `num_items` points.
/// `node_size` affects performance; 64 is a good default.
pub fn KDBush::new(num_items : Int, node_size : Int) -> KDBush {
  let ns = if node_size < 2 {
    2
  } else if node_size > 65535 {
    65535
  } else {
    node_size
  }
  {
    num_items,
    node_size: ns,
    ids: FixedArray::make(num_items, 0),
    coords: FixedArray::make(num_items * 2, 0),
    pos: 0,
    finished: false,
    data: FixedArray::make(0, 0),
  }
}

/// Add a point to the index. Returns the incremental index of the item.
pub fn KDBush::add(self : KDBush, x : Int, y : Int) -> Int {
  let index = self.pos >> 1
  self.ids[index] = index
  self.coords[self.pos] = x
  self.pos += 1
  self.coords[self.pos] = y
  self.pos += 1
  index
}

/// Perform indexing (kd-sort) of the added points.
pub fn KDBush::finish(self : KDBush) -> KDBush {
  let num_added = self.pos >> 1
  kd_sort(self.ids, self.coords, self.node_size, 0, num_added - 1, 0)
  self.finished = true
  self
}

/// Search the index for items within a given bounding box (Int32 coords).
/// Returns an array of item indices.
pub fn KDBush::range(
  self : KDBush,
  min_x : Int,
  min_y : Int,
  max_x : Int,
  max_y : Int,
) -> Array[Int] {
  let result : Array[Int] = []
  if self.num_items == 0 {
    return result
  }
  let stack : FixedArray[Int] = FixedArray::make(192, 0)
  stack[0] = 0
  stack[1] = self.ids.length() - 1
  stack[2] = 0
  let mut sp = 3
  let ids = self.ids
  let coords = self.coords
  let node_size = self.node_size
  // iteratively search for items in range in the kd-sorted arrays
  while sp > 0 {
    sp -= 1
    let axis = stack[sp]
    sp -= 1
    let right = stack[sp]
    sp -= 1
    let left = stack[sp]
    // if we reached a "tree node", search linearly
    if right - left <= node_size {
      for i in left..<(right + 1) {
        let x = coords[2 * i]
        let y = coords[2 * i + 1]
        if x >= min_x && x <= max_x && y >= min_y && y <= max_y {
          result.push(ids[i])
        }
      }
      continue
    }
    // otherwise find the middle index and include it if it's in range
    let m = (left + right) >> 1
    let x = coords[2 * m]
    let y = coords[2 * m + 1]
    if x >= min_x && x <= max_x && y >= min_y && y <= max_y {
      result.push(ids[m])
    }
    // queue search in halves that intersect the query
    let go_left = if axis == 0 {
      min_x <= x
    } else {
      min_y <= y
    }
    if go_left {
      stack[sp] = left
      sp += 1
      stack[sp] = m - 1
      sp += 1
      stack[sp] = 1 - axis
      sp += 1
    }
    let go_right = if axis == 0 {
      max_x >= x
    } else {
      max_y >= y
    }
    if go_right {
      stack[sp] = m + 1
      sp += 1
      stack[sp] = right
      sp += 1
      stack[sp] = 1 - axis
      sp += 1
    }
  }
  result
}

/// Search the index for items within a radius of the query point
/// (query coords/radius are Doubles over Int32-encoded coords).
/// Returns an array of item indices.
pub fn KDBush::within(self : KDBush, qx : Double, qy : Double, r : Double) -> Array[Int] {
  let result : Array[Int] = []
  if self.num_items == 0 {
    return result
  }
  let stack : FixedArray[Int] = FixedArray::make(192, 0)
  stack[0] = 0
  stack[1] = self.ids.length() - 1
  stack[2] = 0
  let mut sp = 3
  let ids = self.ids
  let coords = self.coords
  let node_size = self.node_size
  let r2 = r * r
  // iteratively search for items within radius in the kd-sorted arrays
  while sp > 0 {
    sp -= 1
    let axis = stack[sp]
    sp -= 1
    let right = stack[sp]
    sp -= 1
    let left = stack[sp]
    // if we reached a "tree node", search linearly
    if right - left <= node_size {
      for i in left..<(right + 1) {
        let dx = coords[2 * i].to_double() - qx
        let dy = coords[2 * i + 1].to_double() - qy
        if dx * dx + dy * dy <= r2 {
          result.push(ids[i])
        }
      }
      continue
    }
    let m = (left + right) >> 1
    let dx = coords[2 * m].to_double() - qx
    let dy = coords[2 * m + 1].to_double() - qy
    if dx * dx + dy * dy <= r2 {
      result.push(ids[m])
    }
    let x = coords[2 * m].to_double()
    let y = coords[2 * m + 1].to_double()
    let go_left = if axis == 0 {
      qx - r <= x
    } else {
      qy - r <= y
    }
    if go_left {
      stack[sp] = left
      sp += 1
      stack[sp] = m - 1
      sp += 1
      stack[sp] = 1 - axis
      sp += 1
    }
    let go_right = if axis == 0 {
      qx + r >= x
    } else {
      qy + r >= y
    }
    if go_right {
      stack[sp] = m + 1
      sp += 1
      stack[sp] = right
      sp += 1
      stack[sp] = 1 - axis
      sp += 1
    }
  }
  result
}

/// Allocation-friendly variant of `within`: writes matching ids into `out`
/// (must be at least `num_items` long) and returns the number of matches.
pub fn KDBush::within_into(
  self : KDBush,
  qx : Double,
  qy : Double,
  r : Double,
  out : FixedArray[Int],
) -> Int {
  let result : Array[Int] = self.within(qx, qy, r)
  let n = result.length()
  let mut i = 0
  while i < n {
    out[i] = result[i]
    i += 1
  }
  n
}

/// kd-sort both arrays for efficient search: items in [left..right] are
/// partitioned by the middle item on `axis`, alternating axes down the tree.
fn kd_sort(
  ids : FixedArray[Int],
  coords : FixedArray[Int],
  node_size : Int,
  left : Int,
  right : Int,
  axis : Int,
) -> Unit {
  if right - left <= node_size {
    return
  }
  let m = (left + right) >> 1
  kd_select(ids, coords, m, left, right, axis)
  kd_sort(ids, coords, node_size, left, m - 1, 1 - axis)
  kd_sort(ids, coords, node_size, m + 1, right, 1 - axis)
}

/// Custom Floyd-Rivest selection algorithm: partially sort ids and coords so
/// that items in [left..k-1] are smaller than the k-th item (on either axis).
fn kd_select(
  ids : FixedArray[Int],
  coords : FixedArray[Int],
  k : Int,
  left0 : Int,
  right0 : Int,
  axis : Int,
) -> Unit {
  let mut left = left0
  let mut right = right0
  while right > left {
    if right - left > 600 {
      let n = (right - left + 1).to_double()
      let m = (k - left + 1).to_double()
      let z = @math.ln(n)
      let s = 0.5 * @math.exp(2.0 * z / 3.0)
      let sign = if m - n / 2.0 < 0.0 {
        -1.0
      } else {
        1.0
      }
      let sd = 0.5 * (z * s * (n - s) / n).sqrt() * sign
      let new_left = int_max(left, (k.to_double() - m * s / n + sd).floor().to_int())
      let new_right = int_min(right, (k.to_double() + (n - m) * s / n + sd).floor().to_int())
      kd_select(ids, coords, k, new_left, new_right, axis)
    }
    // partition around the k-th item
    let t = coords[2 * k + axis]
    let mut i = left
    let mut j = right
    kd_swap_item(ids, coords, left, k)
    if coords[2 * right + axis] > t {
      kd_swap_item(ids, coords, left, right)
    }
    while i < j {
      kd_swap_item(ids, coords, i, j)
      i += 1
      j -= 1
      while coords[2 * i + axis] < t {
        i += 1
      }
      while coords[2 * j + axis] > t {
        j -= 1
      }
    }
    if coords[2 * left + axis] == t {
      kd_swap_item(ids, coords, left, j)
    } else {
      j += 1
      kd_swap_item(ids, coords, j, right)
    }
    if j <= k {
      left = j + 1
    }
    if k <= j {
      right = j - 1
    }
  }
}

fn kd_swap_item(ids : FixedArray[Int], coords : FixedArray[Int], i : Int, j : Int) -> Unit {
  let ti = ids[i]
  ids[i] = ids[j]
  ids[j] = ti
  let tx = coords[2 * i]
  coords[2 * i] = coords[2 * j]
  coords[2 * j] = tx
  let ty = coords[2 * i + 1]
  coords[2 * i + 1] = coords[2 * j + 1]
  coords[2 * j + 1] = ty
}
