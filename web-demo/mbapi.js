function _M0TPB5ArrayGsE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function $oob() {
  throw new Error("Index out of bounds");
}
class $PanicError extends Error {}
function $panic(message) {
  throw new $PanicError(message);
}
function _M0TPB13StringBuilder(param0) {
  this.val = param0;
}
const _M0FPB12random__seed = () => {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj != null && typeof cryptoObj.getRandomValues === "function") {
    try {
      const array = new Uint32Array(1);
      cryptoObj.getRandomValues(array);
      return array[0] | 0; // Convert to signed 32
    } catch (_) {
      // The host refuses Web Crypto here, e.g. Workers at module load
    }
  }
  return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random
};
function _M0TPC16string10StringView(param0, param1, param2) {
  this.str = param0;
  this.start = param1;
  this.end = param2;
}
const _M0FPB19int__to__string__js = (x, radix) => {
  return x.toString(radix);
};
function _M0TPB4IterGUsRPC14json4JsonEE(param0, param1) {
  this.f = param0;
  this.size_hint = param1;
}
function _M0TPB5ArrayGRPC14json4JsonE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function $make_array_len_and_init(a, b) {
  const arr = new Array(a);
  arr.fill(b);
  return arr;
}
function _M0TPB3MapGsRPC14json4JsonE(param0, param1, param2, param3, param4, param5, param6) {
  this.entries = param0;
  this.size = param1;
  this.capacity = param2;
  this.capacity_mask = param3;
  this.grow_at = param4;
  this.head = param5;
  this.tail = param6;
}
function _M0TPB5EntryGsRPC14json4JsonE(param0, param1, param2, param3, param4, param5) {
  this.prev = param0;
  this.next = param1;
  this.psl = param2;
  this.hash = param3;
  this.key = param4;
  this.value = param5;
}
function _M0TPB8MutLocalGORPB5EntryGsRPC14json4JsonEE(param0) {
  this.val = param0;
}
function _M0TPB8MutLocalGiE(param0) {
  this.val = param0;
}
const _M0MPC16double6Double8mod__ffi = (a, b) => (a % b);
function _M0DTPC14json4Json4Null() {}
_M0DTPC14json4Json4Null.prototype.$tag = 0;
const _M0DTPC14json4Json4Null__ = new _M0DTPC14json4Json4Null();
function _M0DTPC14json4Json4True() {}
_M0DTPC14json4Json4True.prototype.$tag = 1;
const _M0DTPC14json4Json4True__ = new _M0DTPC14json4Json4True();
function _M0DTPC14json4Json5False() {}
_M0DTPC14json4Json5False.prototype.$tag = 2;
const _M0DTPC14json4Json5False__ = new _M0DTPC14json4Json5False();
function _M0DTPC14json4Json6Number(param0, param1) {
  this._0 = param0;
  this._1 = param1;
}
_M0DTPC14json4Json6Number.prototype.$tag = 3;
function _M0DTPC14json4Json6String(param0) {
  this._0 = param0;
}
_M0DTPC14json4Json6String.prototype.$tag = 4;
function _M0DTPC14json4Json5Array(param0) {
  this._0 = param0;
}
_M0DTPC14json4Json5Array.prototype.$tag = 5;
function _M0DTPC14json4Json6Object(param0) {
  this._0 = param0;
}
_M0DTPC14json4Json6Object.prototype.$tag = 6;
function _M0TPC13ref3RefGORP310moonbitgis12supercluster3src12SuperclusterE(param0) {
  this.val = param0;
}
function _M0TP310moonbitgis12supercluster3src7Options(param0, param1, param2, param3, param4, param5, param6, param7, param8) {
  this.min_zoom = param0;
  this.max_zoom = param1;
  this.min_points = param2;
  this.radius = param3;
  this.extent = param4;
  this.node_size = param5;
  this.generate_id = param6;
  this.map = param7;
  this.reduce = param8;
}
function _M0TP310moonbitgis12supercluster3src10InputPoint(param0, param1, param2) {
  this.id = param0;
  this.properties = param1;
  this.coords = param2;
}
function _M0TPB5ArrayGUddEE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TP310moonbitgis12supercluster3src6KDBush(param0, param1, param2, param3, param4, param5, param6) {
  this.num_items = param0;
  this.node_size = param1;
  this.ids = param2;
  this.coords = param3;
  this.pos = param4;
  this.finished = param5;
  this.data = param6;
}
function _M0TP310moonbitgis12supercluster3src12Supercluster(param0, param1, param2, param3, param4, param5, param6, param7) {
  this.options = param0;
  this.trees = param1;
  this.stride = param2;
  this.cluster_props = param3;
  this.num_points = param4;
  this.props = param5;
  this.coords = param6;
  this.ids = param7;
}
function _M0TPB5ArrayGiE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0TPB9ArrayViewGUsRPC14json4JsonEE(param0, param1, param2) {
  this.buf = param0;
  this.start = param1;
  this.end = param2;
}
function _M0TPB8MutLocalGdE(param0) {
  this.val = param0;
}
function _M0TPB8MutLocalGORPC14json4JsonE(param0) {
  this.val = param0;
}
function _M0TPB8MutLocalGAiE(param0) {
  this.val = param0;
}
function _M0TP310moonbitgis12supercluster3src7Feature(param0, param1, param2, param3, param4, param5, param6) {
  this.id = param0;
  this.properties = param1;
  this.lng = param2;
  this.lat = param3;
  this.is_cluster = param4;
  this.cluster_id = param5;
  this.point_count = param6;
}
function _M0TPB5ArrayGRP310moonbitgis12supercluster3src7FeatureE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
const _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi13js__data__lng = globalThis.__SC_LNG;
const _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi13js__data__lat = globalThis.__SC_LAT;
const _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi14js__data__city = globalThis.__SC_CITY;
function _M0TPB5ArrayGRP310moonbitgis12supercluster3src10InputPointE(param0, param1) {
  this.buf = param0;
  this.len = param1;
}
function _M0DTPC16option6OptionGdE4None() {}
_M0DTPC16option6OptionGdE4None.prototype.$tag = 0;
const _M0DTPC16option6OptionGdE4None__ = new _M0DTPC16option6OptionGdE4None();
function _M0DTPC16option6OptionGdE4Some(param0) {
  this._0 = param0;
}
_M0DTPC16option6OptionGdE4Some.prototype.$tag = 1;
function _M0DTPC16option6OptionGOWRPC14json4JsonRPC14json4JsonEuE4None() {}
_M0DTPC16option6OptionGOWRPC14json4JsonRPC14json4JsonEuE4None.prototype.$tag = 0;
const _M0DTPC16option6OptionGOWRPC14json4JsonRPC14json4JsonEuE4None__ = new _M0DTPC16option6OptionGOWRPC14json4JsonRPC14json4JsonEuE4None();
function _M0DTPC16option6OptionGOWRPC14json4JsonRPC14json4JsonEuE4Some(param0) {
  this._0 = param0;
}
_M0DTPC16option6OptionGOWRPC14json4JsonRPC14json4JsonEuE4Some.prototype.$tag = 1;
const _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger = { method_0: _M0IPB13StringBuilderPB6Logger13write__string, method_1: _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE, method_2: _M0IPB13StringBuilderPB6Logger11write__view, method_3: _M0IPB13StringBuilderPB6Logger11write__char, method_4: _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE, method_5: _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE };
const _M0MPB4Iter4nextN6constrS159GUsRPC14json4JsonEE = 0;
const _M0MPB4Iter4nextN6constrS160GUsRPC14json4JsonEE = 0;
const _M0MPB4Iter3newN6constrS169GUsRPC14json4JsonEE = 0;
const _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi6cities = new _M0TPB5ArrayGsE(["广州", "深圳", "东莞", "佛山", "中山", "珠海"], 6);
const _M0FPB4seed = _M0FPB12random__seed();
const _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi10index__ref = _M0MPC13ref3Ref3RefGORP310moonbitgis12supercluster3src12SuperclusterE(undefined);
function _M0MPC15array5Array6bufferGRP310moonbitgis12supercluster3src7FeatureE(self) {
  return self.buf;
}
function _M0MPC15array5Array6bufferGiE(self) {
  return self.buf;
}
function _M0FPB4rotl(x, r) {
  return x << r | (x >>> (32 - r | 0) | 0);
}
function _M0FPB13consume4__acc(acc, input) {
  return Math.imul(_M0FPB4rotl((acc >>> 0) + ((Math.imul(input, -1028477379) | 0) >>> 0) | 0, 17), 668265263) | 0;
}
function _M0MPB18UninitializedArray6lengthGRP310moonbitgis12supercluster3src7FeatureE(self) {
  return self.length;
}
function _M0MPB18UninitializedArray6lengthGiE(self) {
  return self.length;
}
function _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGiEE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const _tmp$2 = dst_offset + i | 0;
        const _tmp$3 = src_offset + i | 0;
        if (_tmp$2 >>> 0 < dst.length) {
          dst[_tmp$2] = _tmp$3 >>> 0 < src.length ? src[_tmp$3] : $oob();
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    let _tmp$2 = len > 0;
    while (true) {
      const i = _tmp;
      const _more = _tmp$2;
      if (_more) {
        const _tmp$3 = dst_offset + i | 0;
        const _tmp$4 = src_offset + i | 0;
        if (_tmp$3 >>> 0 < dst.length) {
          dst[_tmp$3] = _tmp$4 >>> 0 < src.length ? src[_tmp$4] : $oob();
        } else {
          $oob();
        }
        _tmp = i - 1 | 0;
        _tmp$2 = i > 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGRPC14json4JsonEE(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const _tmp$2 = dst_offset + i | 0;
        const _tmp$3 = src_offset + i | 0;
        if (_tmp$2 >>> 0 < dst.length) {
          dst[_tmp$2] = _tmp$3 >>> 0 < src.length ? src[_tmp$3] : $oob();
        } else {
          $oob();
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    let _tmp$2 = len > 0;
    while (true) {
      const i = _tmp;
      const _more = _tmp$2;
      if (_more) {
        const _tmp$3 = dst_offset + i | 0;
        const _tmp$4 = src_offset + i | 0;
        if (_tmp$3 >>> 0 < dst.length) {
          dst[_tmp$3] = _tmp$4 >>> 0 < src.length ? src[_tmp$4] : $oob();
        } else {
          $oob();
        }
        _tmp = i - 1 | 0;
        _tmp$2 = i > 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function _M0MPB18UninitializedArray12unsafe__blitGRP310moonbitgis12supercluster3src7FeatureE(dst, dst_offset, src, src_offset, len) {
  _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGRPC14json4JsonEE(dst, dst_offset, src, src_offset, len);
}
function _M0MPB18UninitializedArray12unsafe__blitGiE(dst, dst_offset, src, src_offset, len) {
  _M0MPC15array10FixedArray12unsafe__blitGRPB17UnsafeMaybeUninitGiEE(dst, dst_offset, src, src_offset, len);
}
function _M0MPB18UninitializedArray23unsafe__make__and__blitGRP310moonbitgis12supercluster3src7FeatureE(src, allocate_len, src_offset, dst_offset, blit_len) {
  const dst = new Array(allocate_len);
  _M0MPB18UninitializedArray12unsafe__blitGRP310moonbitgis12supercluster3src7FeatureE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0MPB18UninitializedArray23unsafe__make__and__blitGiE(src, allocate_len, src_offset, dst_offset, blit_len) {
  const dst = new Array(allocate_len);
  _M0MPB18UninitializedArray12unsafe__blitGiE(dst, dst_offset, src, src_offset, blit_len);
  return dst;
}
function _M0FPB11range__fits(offset, len, length) {
  return offset >= 0 && offset <= (length - len | 0);
}
function _M0MPB13StringBuilder13write__objectGiE(self, obj) {
  _M0IP016_24default__implPB4Show6outputGiE(obj, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPB18UninitializedArray23make__and__blit_2einnerGRP310moonbitgis12supercluster3src7FeatureE(src, allocate_len, len, src_offset, dst_offset) {
  if (allocate_len >= 0 && (len >= 0 && (_M0FPB11range__fits(src_offset, len, _M0MPB18UninitializedArray6lengthGRP310moonbitgis12supercluster3src7FeatureE(src)) && _M0FPB11range__fits(dst_offset, len, allocate_len)))) {
    return _M0MPB18UninitializedArray23unsafe__make__and__blitGRP310moonbitgis12supercluster3src7FeatureE(src, allocate_len, src_offset, dst_offset, len);
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(8);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "bounds check failed: allocate_len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, allocate_len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", dst_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, dst_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src.length = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, _M0MPB18UninitializedArray6lengthGRP310moonbitgis12supercluster3src7FeatureE(src));
    return $panic(_M0MPB13StringBuilder10to__string(_string_builder));
  }
}
function _M0MPB18UninitializedArray23make__and__blit_2einnerGiE(src, allocate_len, len, src_offset, dst_offset) {
  if (allocate_len >= 0 && (len >= 0 && (_M0FPB11range__fits(src_offset, len, _M0MPB18UninitializedArray6lengthGiE(src)) && _M0FPB11range__fits(dst_offset, len, allocate_len)))) {
    return _M0MPB18UninitializedArray23unsafe__make__and__blitGiE(src, allocate_len, src_offset, dst_offset, len);
  } else {
    const _string_builder = _M0MPB13StringBuilder21StringBuilder_2einner(8);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, "bounds check failed: allocate_len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, allocate_len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, src_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", dst_offset = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, dst_offset);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", len = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, len);
    _M0IPB13StringBuilderPB6Logger13write__string(_string_builder, ", src.length = ");
    _M0MPB13StringBuilder13write__objectGiE(_string_builder, _M0MPB18UninitializedArray6lengthGiE(src));
    return $panic(_M0MPB13StringBuilder10to__string(_string_builder));
  }
}
function _M0MPB13StringBuilder21StringBuilder_2einner(capacity) {
  return capacity >= 0 ? new _M0TPB13StringBuilder("") : $panic("capacity must be non-negative");
}
function _M0MPB13StringBuilder10to__string(self) {
  return self.val;
}
function _M0IPB13StringBuilderPB6Logger11write__char(self, ch) {
  self.val = `${self.val}${String.fromCodePoint(ch)}`;
}
function _M0IPB13StringBuilderPB6Logger13write__string(self, str) {
  self.val = `${self.val}${str}`;
}
function _M0MPC16uint166UInt1622is__leading__surrogate(self) {
  return self >= 55296 && self <= 56319;
}
function _M0MPC16uint166UInt1623is__trailing__surrogate(self) {
  return self >= 56320 && self <= 57343;
}
function _M0FPB14avalanche__acc(acc) {
  let acc$2 = acc;
  acc$2 = acc$2 ^ (acc$2 >>> 15 | 0);
  acc$2 = Math.imul(acc$2, -2048144777) | 0;
  acc$2 = acc$2 ^ (acc$2 >>> 13 | 0);
  acc$2 = Math.imul(acc$2, -1028477379) | 0;
  acc$2 = acc$2 ^ (acc$2 >>> 16 | 0);
  return acc$2;
}
function _M0FPB13finalize__acc(acc) {
  return _M0FPB14avalanche__acc(acc);
}
function _M0IP016_24default__implPB6Logger28write__string__interpolationGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0IP016_24default__implPB6Logger5writeGRPB13StringBuilderE(self, show) {
  show.method_table.method_0(show.self, { self: self, method_table: _M0FP092moonbitlang_2fcore_2fbuiltin_2fStringBuilder_24as_24_40moonbitlang_2fcore_2fbuiltin_2eLogger });
}
function _M0MPC16string6String21clamped__view_2einner(self, start, end) {
  const len = self.length;
  const lo = start <= 0 ? 0 : start >= len ? len : _M0MPC16uint166UInt1623is__trailing__surrogate(self.charCodeAt(start)) && _M0MPC16uint166UInt1622is__leading__surrogate(self.charCodeAt(start - 1 | 0)) ? start + 1 | 0 : start;
  let hi;
  if (end === undefined) {
    hi = len;
  } else {
    const _Some = end;
    const _e = _Some;
    hi = _e <= 0 ? 0 : _e >= len ? len : _M0MPC16uint166UInt1623is__trailing__surrogate(self.charCodeAt(_e)) && _M0MPC16uint166UInt1622is__leading__surrogate(self.charCodeAt(_e - 1 | 0)) ? _e - 1 | 0 : _e;
  }
  return lo >= hi ? new _M0TPC16string10StringView(self, lo, lo) : new _M0TPC16string10StringView(self, lo, hi);
}
function _M0IP016_24default__implPB6Logger16write__substringGRPB13StringBuilderE(self, value, start, len) {
  _M0IPB13StringBuilderPB6Logger11write__view(self, _M0MPC16string6String21clamped__view_2einner(value, start, start + len | 0));
}
function _M0IP016_24default__implPB4Show6outputGiE(self, logger) {
  logger.method_table.method_0(logger.self, _M0IPC13int3IntPB4Show10to__string(self));
}
function _M0MPB4Iter4nextGUsRPC14json4JsonEE(self) {
  const _func = self.f;
  const result = _func();
  const _bind = self.size_hint;
  if (result === undefined) {
    self.size_hint = _M0MPB4Iter4nextN6constrS160GUsRPC14json4JsonEE;
  } else {
    if (_bind === undefined) {
    } else {
      const _Some = _bind;
      const _n = _Some;
      self.size_hint = _n > 0 ? _n - 1 | 0 : _M0MPB4Iter4nextN6constrS159GUsRPC14json4JsonEE;
    }
  }
  return result;
}
function _M0MPC13int3Int18to__string_2einner(self, radix) {
  return _M0FPB19int__to__string__js(self, radix);
}
function _M0MPB4Iter3newGUsRPC14json4JsonEE(f, size_hint) {
  let size_hint$2;
  if (size_hint === undefined) {
    size_hint$2 = undefined;
  } else {
    const _Some = size_hint;
    const _n = _Some;
    size_hint$2 = _n > 0 ? _n : _M0MPB4Iter3newN6constrS169GUsRPC14json4JsonEE;
  }
  return new _M0TPB4IterGUsRPC14json4JsonEE(f, size_hint$2);
}
function _M0MPC16string10StringView9to__owned(self) {
  return self.str.substring(self.start, self.end);
}
function _M0IPB13StringBuilderPB6Logger11write__view(self, str) {
  self.val = `${self.val}${_M0MPC16string10StringView9to__owned(str)}`;
}
function _M0MPC15array5Array6lengthGUddEE(self) {
  return self.len;
}
function _M0MPC15array5Array6lengthGiE(self) {
  return self.len;
}
function _M0FPB23array__growth__capacity(current, len, required) {
  if (required < len) {
    $panic("Array capacity overflow");
  }
  const start = current === 0 ? 8 : current;
  let _tmp = start;
  while (true) {
    const space = _tmp;
    if (space < required) {
      const next = Math.imul(space, 2) | 0;
      if (next <= space) {
        return required;
      }
      _tmp = next;
      continue;
    } else {
      return space;
    }
  }
}
function _M0MPC15array5Array8capacityGRP310moonbitgis12supercluster3src7FeatureE(self) {
  return _M0MPC15array5Array6bufferGRP310moonbitgis12supercluster3src7FeatureE(self).length;
}
function _M0MPC15array5Array8capacityGiE(self) {
  return _M0MPC15array5Array6bufferGiE(self).length;
}
function _M0MPC15array5Array14resize__bufferGRP310moonbitgis12supercluster3src7FeatureE(self, new_capacity) {
  const old_buf = self.buf;
  self.buf = [];
  const len = self.len;
  const copy_len = len < new_capacity ? len : new_capacity;
  const new_buf = _M0MPB18UninitializedArray23make__and__blit_2einnerGRP310moonbitgis12supercluster3src7FeatureE(old_buf, new_capacity, copy_len, 0, 0);
  self.buf = new_buf;
}
function _M0MPC15array5Array14resize__bufferGiE(self, new_capacity) {
  const old_buf = self.buf;
  self.buf = [];
  const len = self.len;
  const copy_len = len < new_capacity ? len : new_capacity;
  const new_buf = _M0MPB18UninitializedArray23make__and__blit_2einnerGiE(old_buf, new_capacity, copy_len, 0, 0);
  self.buf = new_buf;
}
function _M0MPC15array5Array7reallocGRP310moonbitgis12supercluster3src7FeatureE(self, required) {
  const old_cap = _M0MPC15array5Array8capacityGRP310moonbitgis12supercluster3src7FeatureE(self);
  const new_cap = _M0FPB23array__growth__capacity(old_cap, self.len, required);
  _M0MPC15array5Array14resize__bufferGRP310moonbitgis12supercluster3src7FeatureE(self, new_cap);
}
function _M0MPC15array5Array7reallocGiE(self, required) {
  const old_cap = _M0MPC15array5Array8capacityGiE(self);
  const new_cap = _M0FPB23array__growth__capacity(old_cap, self.len, required);
  _M0MPC15array5Array14resize__bufferGiE(self, new_cap);
}
function _M0MPC15array5Array4pushGRP310moonbitgis12supercluster3src7FeatureE(self, value) {
  if (self.len === _M0MPC15array5Array6bufferGRP310moonbitgis12supercluster3src7FeatureE(self).length) {
    _M0MPC15array5Array7reallocGRP310moonbitgis12supercluster3src7FeatureE(self, self.len + 1 | 0);
  }
  const length = self.len;
  self.buf[length] = value;
  self.len = length + 1 | 0;
}
function _M0MPC15array5Array4pushGiE(self, value) {
  if (self.len === _M0MPC15array5Array6bufferGiE(self).length) {
    _M0MPC15array5Array7reallocGiE(self, self.len + 1 | 0);
  }
  const length = self.len;
  self.buf[length] = value;
  self.len = length + 1 | 0;
}
function _M0IPC13int3IntPB4Show10to__string(self) {
  return _M0MPC13int3Int18to__string_2einner(self, 10);
}
function _M0MPC15array5Array20unsafe__make__uninitGRPC14json4JsonE(len) {
  return new _M0TPB5ArrayGRPC14json4JsonE(new Array(len), len);
}
function _M0MPC16option6Option6unwrapGRPB5EntryGsRPC14json4JsonEE(self) {
  if (self === undefined) {
    return $panic();
  } else {
    const _Some = self;
    return _Some;
  }
}
function _M0FPB21calc__grow__threshold(capacity) {
  if (16 === 0) {
    $panic();
  }
  const _tmp = Math.imul(capacity / 16 | 0, 13) | 0;
  if (16 === 0) {
    $panic();
  }
  if (16 === 0) {
    $panic();
  }
  return _tmp + ((Math.imul(capacity % 16 | 0, 13) | 0) / 16 | 0) | 0;
}
function _M0MPC13int3Int20next__power__of__two(self) {
  if (self >= 0) {
    if (self <= 1) {
      return 1;
    }
    if (self > 1073741824) {
      return 1073741824;
    }
    return (2147483647 >> (Math.clz32(self - 1 | 0) - 1 | 0)) + 1 | 0;
  } else {
    return $panic();
  }
}
function _M0FPB8new__mapGsRPC14json4JsonE(capacity) {
  const capacity$2 = _M0MPC13int3Int20next__power__of__two(capacity);
  const _bind = capacity$2 - 1 | 0;
  const _bind$2 = _M0FPB21calc__grow__threshold(capacity$2);
  const _bind$3 = $make_array_len_and_init(capacity$2, undefined);
  const _bind$4 = undefined;
  return new _M0TPB3MapGsRPC14json4JsonE(_bind$3, 0, capacity$2, _bind, _bind$2, _bind$4, -1);
}
function _M0FPB21capacity__for__length(length) {
  if (length <= _M0FPB21calc__grow__threshold(1073741824)) {
    let capacity = _M0MPC13int3Int20next__power__of__two(length);
    if (length > _M0FPB21calc__grow__threshold(capacity)) {
      capacity = Math.imul(capacity, 2) | 0;
    }
    return capacity;
  } else {
    return $panic("Map capacity overflow");
  }
}
function _M0MPC13int3Int3max(self, other) {
  return self > other ? self : other;
}
function _M0MPB3Map20add__entry__to__tailGsRPC14json4JsonE(self, idx, entry) {
  const _bind = self.tail;
  if (_bind === -1) {
    self.head = entry;
  } else {
    const _tmp = self.entries;
    _M0MPC16option6Option6unwrapGRPB5EntryGsRPC14json4JsonEE(_bind >>> 0 < _tmp.length ? _tmp[_bind] : $oob()).next = entry;
  }
  self.tail = idx;
  self.entries[idx] = entry;
  self.size = self.size + 1 | 0;
}
function _M0MPB3Map10set__entryGsRPC14json4JsonE(self, entry, new_idx) {
  const _bind = entry.next;
  if (_bind === undefined) {
    self.tail = new_idx;
  } else {
    const _Some = _bind;
    const _next = _Some;
    _next.prev = new_idx;
  }
  self.entries[new_idx] = entry;
}
function _M0MPB3Map10push__awayGsRPC14json4JsonE(self, idx, entry) {
  let _tmp = entry.psl + 1 | 0;
  let _tmp$2 = (idx + 1 | 0) & self.capacity_mask;
  let _tmp$3 = entry;
  while (true) {
    const psl = _tmp;
    const idx$2 = _tmp$2;
    const entry$2 = _tmp$3;
    const _bind = self.entries[idx$2];
    if (_bind === undefined) {
      entry$2.psl = psl;
      _M0MPB3Map10set__entryGsRPC14json4JsonE(self, entry$2, idx$2);
      return;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (psl > _curr_entry.psl) {
        entry$2.psl = psl;
        _M0MPB3Map10set__entryGsRPC14json4JsonE(self, entry$2, idx$2);
        _tmp = _curr_entry.psl + 1 | 0;
        _tmp$2 = (idx$2 + 1 | 0) & self.capacity_mask;
        _tmp$3 = _curr_entry;
        continue;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = (idx$2 + 1 | 0) & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map20rehash__place__entryGsRPC14json4JsonE(self, outer) {
  const hash = outer.hash;
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      outer.psl = psl;
      outer.prev = self.tail;
      _M0MPB3Map20add__entry__to__tailGsRPC14json4JsonE(self, idx, outer);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr = _Some;
      if (psl > _curr.psl) {
        _M0MPB3Map10push__awayGsRPC14json4JsonE(self, idx, _curr);
        outer.psl = psl;
        outer.prev = self.tail;
        _M0MPB3Map20add__entry__to__tailGsRPC14json4JsonE(self, idx, outer);
        return undefined;
      } else {
        _tmp = psl + 1 | 0;
        _tmp$2 = (idx + 1 | 0) & self.capacity_mask;
        continue;
      }
    }
  }
}
function _M0MPB3Map4growGsRPC14json4JsonE(self) {
  const old_head = self.head;
  const new_capacity = self.capacity << 1;
  self.entries = $make_array_len_and_init(new_capacity, undefined);
  self.capacity = new_capacity;
  self.capacity_mask = new_capacity - 1 | 0;
  self.grow_at = _M0FPB21calc__grow__threshold(self.capacity);
  self.size = 0;
  self.head = undefined;
  self.tail = -1;
  let _tmp = old_head;
  while (true) {
    const x = _tmp;
    if (x === undefined) {
      return;
    } else {
      const _Some = x;
      const _e = _Some;
      const next_in_chain = _e.next;
      _e.next = undefined;
      _M0MPB3Map20rehash__place__entryGsRPC14json4JsonE(self, _e);
      _tmp = next_in_chain;
      continue;
    }
  }
}
function _M0MPB3Map15set__with__hashGsRPC14json4JsonE(self, key, value, hash) {
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const psl = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      if (self.size >= self.grow_at) {
        _M0MPB3Map4growGsRPC14json4JsonE(self);
        _tmp = 0;
        _tmp$2 = hash & self.capacity_mask;
        continue;
      }
      const _bind$2 = self.tail;
      const _bind$3 = undefined;
      const entry = new _M0TPB5EntryGsRPC14json4JsonE(_bind$2, _bind$3, psl, hash, key, value);
      _M0MPB3Map20add__entry__to__tailGsRPC14json4JsonE(self, idx, entry);
      return undefined;
    } else {
      const _Some = _bind;
      const _curr_entry = _Some;
      if (_curr_entry.hash === hash && _curr_entry.key === key) {
        _curr_entry.value = value;
        return undefined;
      }
      if (psl > _curr_entry.psl) {
        if (self.size >= self.grow_at) {
          _M0MPB3Map4growGsRPC14json4JsonE(self);
          _tmp = 0;
          _tmp$2 = hash & self.capacity_mask;
          continue;
        }
        _M0MPB3Map10push__awayGsRPC14json4JsonE(self, idx, _curr_entry);
        const _bind$2 = self.tail;
        const _bind$3 = undefined;
        const entry = new _M0TPB5EntryGsRPC14json4JsonE(_bind$2, _bind$3, psl, hash, key, value);
        _M0MPB3Map20add__entry__to__tailGsRPC14json4JsonE(self, idx, entry);
        return undefined;
      }
      _tmp = psl + 1 | 0;
      _tmp$2 = (idx + 1 | 0) & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map3setGsRPC14json4JsonE(self, key, value) {
  _M0MPB3Map15set__with__hashGsRPC14json4JsonE(self, key, value, _M0IPC16string6StringPB4Hash4hash(key));
}
function _M0MPB3Map3MapGsRPC14json4JsonE(arr, capacity) {
  const length = arr.end - arr.start | 0;
  let capacity$2;
  if (capacity === undefined) {
    capacity$2 = length === 0 ? 8 : _M0FPB21capacity__for__length(length);
  } else {
    const _Some = capacity;
    const _capacity = _Some;
    capacity$2 = _capacity >= 0 ? _M0FPB21capacity__for__length(_M0MPC13int3Int3max(_capacity, length)) : $panic("capacity must be non-negative");
  }
  const m = _M0FPB8new__mapGsRPC14json4JsonE(capacity$2);
  const _bind = arr.end - arr.start | 0;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const e = arr.buf[arr.start + _ | 0];
      _M0MPB3Map3setGsRPC14json4JsonE(m, e._0, e._1);
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return m;
}
function _M0MPB3Map3getGsRPC14json4JsonE(self, key) {
  const hash = _M0IPC16string6StringPB4Hash4hash(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _entry = _Some;
      if (_entry.hash === hash && _entry.key === key) {
        return _entry.value;
      }
      if (i > _entry.psl) {
        return undefined;
      }
      _tmp = i + 1 | 0;
      _tmp$2 = (idx + 1 | 0) & self.capacity_mask;
      continue;
    }
  }
}
function _M0MPB3Map4iterGsRPC14json4JsonE(self) {
  const curr_entry = new _M0TPB8MutLocalGORPB5EntryGsRPC14json4JsonEE(self.head);
  const len = self.size;
  const remaining = new _M0TPB8MutLocalGiE(len);
  return _M0MPB4Iter3newGUsRPC14json4JsonEE(() => {
    _L: {
      if (remaining.val > 0) {
        const _bind = curr_entry.val;
        if (_bind === undefined) {
          break _L;
        } else {
          const _Some = _bind;
          const _x = _Some;
          const _key = _x.key;
          const _value = _x.value;
          const _next = _x.next;
          curr_entry.val = _next;
          remaining.val = remaining.val - 1 | 0;
          return { _0: _key, _1: _value };
        }
      } else {
        break _L;
      }
    }
    return undefined;
  }, len);
}
function _M0MPB3Map5iter2GsRPC14json4JsonE(self) {
  return _M0MPB3Map4iterGsRPC14json4JsonE(self);
}
function _M0MPB5Iter24nextGsRPC14json4JsonE(self) {
  return _M0MPB4Iter4nextGUsRPC14json4JsonEE(self);
}
function _M0IPC16string6StringPB4Hash4hash(self) {
  let acc = (_M0FPB4seed >>> 0) + (374761393 >>> 0) | 0;
  const _bind = self.length;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      acc = (acc >>> 0) + (4 >>> 0) | 0;
      const v = self.charCodeAt(i);
      acc = _M0FPB13consume4__acc(acc, v);
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return _M0FPB13finalize__acc(acc);
}
function _M0MPC16double6Double7to__int(self) {
  return self !== self ? 0 : self >= 2147483647 ? 2147483647 : self <= -2147483648 ? -2147483648 : self | 0;
}
function _M0MPC16double6Double5floor(_tmp) {
  return Math.floor(_tmp);
}
function _M0IPC16double6DoublePB3Mod3mod(self, other) {
  return _M0MPC16double6Double8mod__ffi(self, other);
}
function _M0MPC15array5Array2atGUddEE(self, index) {
  const len = self.len;
  return index >= 0 && index < len ? _M0MPC15array5Array6bufferGRP310moonbitgis12supercluster3src7FeatureE(self)[index] : $panic();
}
function _M0MPC15array5Array2atGiE(self, index) {
  const len = self.len;
  return index >= 0 && index < len ? _M0MPC15array5Array6bufferGiE(self)[index] : $panic();
}
function _M0MPC15array5Array3setGRPC14json4JsonE(self, index, value) {
  const len = self.len;
  if (index >= 0 && index < len) {
    _M0MPC15array5Array6bufferGRP310moonbitgis12supercluster3src7FeatureE(self)[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function _M0MPC15array5Array4makeGRPC14json4JsonE(len, elem) {
  const arr = _M0MPC15array5Array20unsafe__make__uninitGRPC14json4JsonE(len);
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < len) {
      arr.buf[i] = elem;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function _M0MPC14json4Json6object(object) {
  return new _M0DTPC14json4Json6Object(object);
}
function _M0MPC14json4Json4null() {
  return _M0DTPC14json4Json4Null__;
}
function _M0MPC14json4Json6number(number, repr) {
  return new _M0DTPC14json4Json6Number(number, repr);
}
function _M0MPC14json4Json6string(string) {
  return new _M0DTPC14json4Json6String(string);
}
function _M0MPC14json4Json7boolean(boolean) {
  return boolean ? _M0DTPC14json4Json4True__ : _M0DTPC14json4Json5False__;
}
function _M0MPC13ref3Ref3RefGORP310moonbitgis12supercluster3src12SuperclusterE(x) {
  return new _M0TPC13ref3RefGORP310moonbitgis12supercluster3src12SuperclusterE(x);
}
function _M0FPC14math3sin(_tmp) {
  return Math.sin(_tmp);
}
function _M0FPC14math4atan(_tmp) {
  return Math.atan(_tmp);
}
function _M0FPC14math2ln(_tmp) {
  return Math.log(_tmp);
}
function _M0FPC14math3exp(_tmp) {
  return Math.exp(_tmp);
}
function _M0FP310moonbitgis12supercluster3src15identity__props(props) {
  return props;
}
function _M0MP310moonbitgis12supercluster3src7Options11new_2einner(min_zoom, max_zoom, min_points, radius, extent, node_size, generate_id, map, reduce) {
  return new _M0TP310moonbitgis12supercluster3src7Options(min_zoom, max_zoom, min_points, radius, extent, node_size, generate_id, map, reduce);
}
function _M0MP310moonbitgis12supercluster3src7Options3new(min_zoom$46$opt, max_zoom$46$opt, min_points$46$opt, radius$46$opt, extent$46$opt, node_size$46$opt, generate_id$46$opt, map$46$opt, reduce$46$opt) {
  let min_zoom;
  if (min_zoom$46$opt === undefined) {
    min_zoom = 0;
  } else {
    const _Some = min_zoom$46$opt;
    min_zoom = _Some;
  }
  let max_zoom;
  if (max_zoom$46$opt === undefined) {
    max_zoom = 16;
  } else {
    const _Some = max_zoom$46$opt;
    max_zoom = _Some;
  }
  let min_points;
  if (min_points$46$opt === undefined) {
    min_points = 2;
  } else {
    const _Some = min_points$46$opt;
    min_points = _Some;
  }
  let radius;
  if (radius$46$opt.$tag === 1) {
    const _Some = radius$46$opt;
    radius = _Some._0;
  } else {
    radius = 40;
  }
  let extent;
  if (extent$46$opt.$tag === 1) {
    const _Some = extent$46$opt;
    extent = _Some._0;
  } else {
    extent = 512;
  }
  let node_size;
  if (node_size$46$opt === undefined) {
    node_size = 64;
  } else {
    const _Some = node_size$46$opt;
    node_size = _Some;
  }
  const generate_id = generate_id$46$opt === -1 ? false : generate_id$46$opt;
  let map;
  if (map$46$opt === undefined) {
    map = _M0FP310moonbitgis12supercluster3src15identity__props;
  } else {
    const _Some = map$46$opt;
    map = _Some;
  }
  let reduce;
  if (reduce$46$opt.$tag === 1) {
    const _Some = reduce$46$opt;
    reduce = _Some._0;
  } else {
    reduce = undefined;
  }
  return _M0MP310moonbitgis12supercluster3src7Options11new_2einner(min_zoom, max_zoom, min_points, radius, extent, node_size, generate_id, map, reduce);
}
function _M0MP310moonbitgis12supercluster3src10InputPoint4make(id, properties, coords) {
  return new _M0TP310moonbitgis12supercluster3src10InputPoint(id, properties, coords);
}
function _M0MP310moonbitgis12supercluster3src10InputPoint2of(lng, lat, properties) {
  const coords = new _M0TPB5ArrayGUddEE([{ _0: lng, _1: lat }], 1);
  return _M0MP310moonbitgis12supercluster3src10InputPoint4make(undefined, properties, coords);
}
function _M0FP310moonbitgis12supercluster3src6encode(c) {
  return _M0MPC16double6Double7to__int((c - 0.5) * 1073741824);
}
function _M0FP310moonbitgis12supercluster3src6decode(v) {
  return (v + 0) / 1073741824 + 0.5;
}
function _M0FP310moonbitgis12supercluster3src8int__min(a, b) {
  return a < b ? a : b;
}
function _M0MP310moonbitgis12supercluster3src6KDBush3new(num_items, node_size) {
  const ns = node_size < 2 ? 2 : node_size > 65535 ? 65535 : node_size;
  return new _M0TP310moonbitgis12supercluster3src6KDBush(num_items, ns, $make_array_len_and_init(num_items, 0), $make_array_len_and_init(Math.imul(num_items, 2) | 0, 0), 0, false, $make_array_len_and_init(0, 0));
}
function _M0MP310moonbitgis12supercluster3src12Supercluster3new(options) {
  const max_zoom = _M0FP310moonbitgis12supercluster3src8int__min(options.max_zoom, 30);
  const min_zoom = _M0FP310moonbitgis12supercluster3src8int__min(options.min_zoom, max_zoom);
  const opts = new _M0TP310moonbitgis12supercluster3src7Options(min_zoom, max_zoom, options.min_points, options.radius, options.extent, options.node_size, options.generate_id, options.map, options.reduce);
  const _bind = opts.reduce;
  const stride = _bind === undefined ? 6 : 7;
  const trees = $make_array_len_and_init(opts.max_zoom + 2 | 0, _M0MP310moonbitgis12supercluster3src6KDBush3new(0, 64));
  return new _M0TP310moonbitgis12supercluster3src12Supercluster(opts, trees, stride, new _M0TPB5ArrayGRPC14json4JsonE([], 0), 0, new _M0TPB5ArrayGRPC14json4JsonE([], 0), $make_array_len_and_init(0, 0), $make_array_len_and_init(0, undefined));
}
function _M0FP310moonbitgis12supercluster3src6lat__y(lat) {
  const sin = _M0FPC14math3sin(lat * 3.1415926535897931 / 180);
  const y = 0.5 - 0.25 * _M0FPC14math2ln((1 + sin) / (1 - sin)) / 3.1415926535897931;
  return y < 0 ? 0 : y > 1 ? 1 : y;
}
function _M0FP310moonbitgis12supercluster3src6lng__x(lng) {
  return lng / 360 + 0.5;
}
function _M0MP310moonbitgis12supercluster3src6KDBush6within(self, qx, qy, r) {
  const result = new _M0TPB5ArrayGiE([], 0);
  if (self.num_items === 0) {
    return result;
  }
  const stack = $make_array_len_and_init(192, 0);
  if (0 >>> 0 < stack.length) {
    stack[0] = 0;
  } else {
    $oob();
  }
  if (1 >>> 0 < stack.length) {
    stack[1] = self.ids.length - 1 | 0;
  } else {
    $oob();
  }
  if (2 >>> 0 < stack.length) {
    stack[2] = 0;
  } else {
    $oob();
  }
  const sp = new _M0TPB8MutLocalGiE(3);
  const ids = self.ids;
  const coords = self.coords;
  const node_size = self.node_size;
  const r2 = r * r;
  while (true) {
    if (sp.val > 0) {
      sp.val = sp.val - 1 | 0;
      const _tmp = sp.val;
      const axis = _tmp >>> 0 < stack.length ? stack[_tmp] : $oob();
      sp.val = sp.val - 1 | 0;
      const _tmp$2 = sp.val;
      const right = _tmp$2 >>> 0 < stack.length ? stack[_tmp$2] : $oob();
      sp.val = sp.val - 1 | 0;
      const _tmp$3 = sp.val;
      const left = _tmp$3 >>> 0 < stack.length ? stack[_tmp$3] : $oob();
      if ((right - left | 0) <= node_size) {
        const _bind = right + 1 | 0;
        let _tmp$4 = left;
        while (true) {
          const i = _tmp$4;
          if (i < _bind) {
            const _tmp$5 = Math.imul(2, i) | 0;
            const dx = (_tmp$5 >>> 0 < coords.length ? coords[_tmp$5] : $oob()) + 0 - qx;
            const _tmp$6 = (Math.imul(2, i) | 0) + 1 | 0;
            const dy = (_tmp$6 >>> 0 < coords.length ? coords[_tmp$6] : $oob()) + 0 - qy;
            if (dx * dx + dy * dy <= r2) {
              _M0MPC15array5Array4pushGiE(result, i >>> 0 < ids.length ? ids[i] : $oob());
            }
            _tmp$4 = i + 1 | 0;
            continue;
          } else {
            break;
          }
        }
        continue;
      }
      const m = (left + right | 0) >> 1;
      const _tmp$4 = Math.imul(2, m) | 0;
      const dx = (_tmp$4 >>> 0 < coords.length ? coords[_tmp$4] : $oob()) + 0 - qx;
      const _tmp$5 = (Math.imul(2, m) | 0) + 1 | 0;
      const dy = (_tmp$5 >>> 0 < coords.length ? coords[_tmp$5] : $oob()) + 0 - qy;
      if (dx * dx + dy * dy <= r2) {
        _M0MPC15array5Array4pushGiE(result, m >>> 0 < ids.length ? ids[m] : $oob());
      }
      const _tmp$6 = Math.imul(2, m) | 0;
      const x = (_tmp$6 >>> 0 < coords.length ? coords[_tmp$6] : $oob()) + 0;
      const _tmp$7 = (Math.imul(2, m) | 0) + 1 | 0;
      const y = (_tmp$7 >>> 0 < coords.length ? coords[_tmp$7] : $oob()) + 0;
      const go_left = axis === 0 ? qx - r <= x : qy - r <= y;
      if (go_left) {
        const _tmp$8 = sp.val;
        if (_tmp$8 >>> 0 < stack.length) {
          stack[_tmp$8] = left;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
        const _tmp$9 = sp.val;
        if (_tmp$9 >>> 0 < stack.length) {
          stack[_tmp$9] = m - 1 | 0;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
        const _tmp$10 = sp.val;
        if (_tmp$10 >>> 0 < stack.length) {
          stack[_tmp$10] = 1 - axis | 0;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
      }
      const go_right = axis === 0 ? qx + r >= x : qy + r >= y;
      if (go_right) {
        const _tmp$8 = sp.val;
        if (_tmp$8 >>> 0 < stack.length) {
          stack[_tmp$8] = m + 1 | 0;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
        const _tmp$9 = sp.val;
        if (_tmp$9 >>> 0 < stack.length) {
          stack[_tmp$9] = right;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
        const _tmp$10 = sp.val;
        if (_tmp$10 >>> 0 < stack.length) {
          stack[_tmp$10] = 1 - axis | 0;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
      }
      continue;
    } else {
      break;
    }
  }
  return result;
}
function _M0MP310moonbitgis12supercluster3src6KDBush12within__into(self, qx, qy, r, out) {
  const result = _M0MP310moonbitgis12supercluster3src6KDBush6within(self, qx, qy, r);
  const n = _M0MPC15array5Array6lengthGiE(result);
  const i = new _M0TPB8MutLocalGiE(0);
  while (true) {
    if (i.val < n) {
      const _tmp = i.val;
      if (_tmp >>> 0 < out.length) {
        out[_tmp] = _M0MPC15array5Array2atGiE(result, i.val);
      } else {
        $oob();
      }
      i.val = i.val + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return n;
}
function _M0FP310moonbitgis12supercluster3src20shallow__clone__json(v) {
  let m;
  _L: {
    if (v.$tag === 6) {
      const _Object = v;
      const _m = _Object._0;
      m = _m;
      break _L;
    } else {
      return v;
    }
  }
  const _bind = [];
  const copy = _M0MPB3Map3MapGsRPC14json4JsonE(new _M0TPB9ArrayViewGUsRPC14json4JsonEE(_bind, 0, 0), undefined);
  const _it = _M0MPB3Map5iter2GsRPC14json4JsonE(m);
  while (true) {
    let k;
    let val;
    _L$2: {
      const _bind$2 = _M0MPB5Iter24nextGsRPC14json4JsonE(_it);
      if (_bind$2 === undefined) {
        break;
      } else {
        const _Some = _bind$2;
        const _x = _Some;
        const _k = _x._0;
        const _val = _x._1;
        k = _k;
        val = _val;
        break _L$2;
      }
    }
    _M0MPB3Map3setGsRPC14json4JsonE(copy, k, val);
    continue;
  }
  return _M0MPC14json4Json6object(copy);
}
function _M0MP310moonbitgis12supercluster3src12Supercluster10map__props(self, data, i, clone) {
  const _tmp = i + 5 | 0;
  if ((_tmp >>> 0 < data.length ? data[_tmp] : $oob()) > 1) {
    const _tmp$2 = self.cluster_props;
    const _tmp$3 = i + 6 | 0;
    const props = _M0MPC15array5Array2atGUddEE(_tmp$2, _tmp$3 >>> 0 < data.length ? data[_tmp$3] : $oob());
    return clone ? _M0FP310moonbitgis12supercluster3src20shallow__clone__json(props) : props;
  } else {
    const _tmp$2 = self.props;
    const _tmp$3 = i + 3 | 0;
    const original = _M0MPC15array5Array2atGUddEE(_tmp$2, _tmp$3 >>> 0 < data.length ? data[_tmp$3] : $oob());
    const _func = self.options.map;
    const result = _func(original);
    return clone ? _M0FP310moonbitgis12supercluster3src20shallow__clone__json(result) : result;
  }
}
function _M0MP310moonbitgis12supercluster3src12Supercluster15cluster__points(self, data, num_items, zoom, out) {
  const opts = self.options;
  const r = opts.radius / (opts.extent * ((1 << zoom) + 0)) * 1073741824;
  const not_processed = opts.max_zoom + 1 | 0;
  const _tmp = self.trees;
  const _tmp$2 = zoom + 1 | 0;
  const tree = _tmp$2 >>> 0 < _tmp.length ? _tmp[_tmp$2] : $oob();
  const stride = self.stride;
  const limit = Math.imul(num_items, stride) | 0;
  const neighbor_ids = $make_array_len_and_init(num_items, 0);
  const cursor = new _M0TPB8MutLocalGiE(0);
  const i = new _M0TPB8MutLocalGiE(0);
  while (true) {
    if (i.val < limit) {
      const _tmp$3 = i.val + 2 | 0;
      if ((_tmp$3 >>> 0 < data.length ? data[_tmp$3] : $oob()) <= zoom) {
        i.val = i.val + stride | 0;
        continue;
      }
      const _tmp$4 = i.val + 2 | 0;
      if (_tmp$4 >>> 0 < data.length) {
        data[_tmp$4] = zoom;
      } else {
        $oob();
      }
      const _tmp$5 = i.val;
      const x = _tmp$5 >>> 0 < data.length ? data[_tmp$5] : $oob();
      const _tmp$6 = i.val + 1 | 0;
      const y = _tmp$6 >>> 0 < data.length ? data[_tmp$6] : $oob();
      const neighbor_count = _M0MP310moonbitgis12supercluster3src6KDBush12within__into(tree, x + 0, y + 0, r, neighbor_ids);
      const _tmp$7 = i.val + 5 | 0;
      const num_points_origin = _tmp$7 >>> 0 < data.length ? data[_tmp$7] : $oob();
      const num_points = new _M0TPB8MutLocalGiE(num_points_origin);
      const _bind = 0;
      let _tmp$8 = _bind;
      while (true) {
        const n = _tmp$8;
        if (n < neighbor_count) {
          const k = Math.imul(n >>> 0 < neighbor_ids.length ? neighbor_ids[n] : $oob(), stride) | 0;
          const _tmp$9 = k + 2 | 0;
          if ((_tmp$9 >>> 0 < data.length ? data[_tmp$9] : $oob()) > zoom) {
            const _tmp$10 = num_points.val;
            const _tmp$11 = k + 5 | 0;
            num_points.val = _tmp$10 + (_tmp$11 >>> 0 < data.length ? data[_tmp$11] : $oob()) | 0;
          }
          _tmp$8 = n + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      if (num_points.val > num_points_origin && num_points.val >= opts.min_points) {
        const wx = new _M0TPB8MutLocalGdE((x + 0) * (num_points_origin + 0));
        const wy = new _M0TPB8MutLocalGdE((y + 0) * (num_points_origin + 0));
        const cluster_properties = new _M0TPB8MutLocalGORPC14json4JsonE(undefined);
        const cluster_prop_index = new _M0TPB8MutLocalGiE(-1);
        if (stride === 0) {
          $panic();
        }
        const id = (((i.val / stride | 0) << 5) + (zoom + 1 | 0) | 0) + self.num_points | 0;
        const _bind$2 = 0;
        let _tmp$9 = _bind$2;
        while (true) {
          const n = _tmp$9;
          if (n < neighbor_count) {
            _L: {
              const k = Math.imul(n >>> 0 < neighbor_ids.length ? neighbor_ids[n] : $oob(), stride) | 0;
              const _tmp$10 = k + 2 | 0;
              if ((_tmp$10 >>> 0 < data.length ? data[_tmp$10] : $oob()) <= zoom) {
                break _L;
              }
              const _tmp$11 = k + 2 | 0;
              if (_tmp$11 >>> 0 < data.length) {
                data[_tmp$11] = zoom;
              } else {
                $oob();
              }
              const _tmp$12 = k + 5 | 0;
              const num_points2 = _tmp$12 >>> 0 < data.length ? data[_tmp$12] : $oob();
              wx.val = wx.val + ((k >>> 0 < data.length ? data[k] : $oob()) + 0) * (num_points2 + 0);
              const _tmp$13 = wy.val;
              const _tmp$14 = k + 1 | 0;
              wy.val = _tmp$13 + ((_tmp$14 >>> 0 < data.length ? data[_tmp$14] : $oob()) + 0) * (num_points2 + 0);
              const _tmp$15 = k + 4 | 0;
              if (_tmp$15 >>> 0 < data.length) {
                data[_tmp$15] = id;
              } else {
                $oob();
              }
              let reduce;
              _L$2: {
                _L$3: {
                  const _bind$3 = opts.reduce;
                  if (_bind$3 === undefined) {
                  } else {
                    const _Some = _bind$3;
                    const _reduce = _Some;
                    reduce = _reduce;
                    break _L$3;
                  }
                  break _L$2;
                }
                let acc;
                _L$4: {
                  _L$5: {
                    const _bind$3 = cluster_properties.val;
                    if (_bind$3 === undefined) {
                      const init = _M0MP310moonbitgis12supercluster3src12Supercluster10map__props(self, data, i.val, true);
                      cluster_prop_index.val = _M0MPC15array5Array6lengthGUddEE(self.cluster_props);
                      _M0MPC15array5Array4pushGRP310moonbitgis12supercluster3src7FeatureE(self.cluster_props, init);
                      cluster_properties.val = init;
                      reduce(init, _M0MP310moonbitgis12supercluster3src12Supercluster10map__props(self, data, k, false));
                    } else {
                      const _Some = _bind$3;
                      const _acc = _Some;
                      acc = _acc;
                      break _L$5;
                    }
                    break _L$4;
                  }
                  reduce(acc, _M0MP310moonbitgis12supercluster3src12Supercluster10map__props(self, data, k, false));
                }
              }
              break _L;
            }
            _tmp$9 = n + 1 | 0;
            continue;
          } else {
            break;
          }
        }
        const _tmp$10 = i.val + 4 | 0;
        if (_tmp$10 >>> 0 < data.length) {
          data[_tmp$10] = id;
        } else {
          $oob();
        }
        const _tmp$11 = cursor.val;
        if (_tmp$11 >>> 0 < out.length) {
          out[_tmp$11] = _M0MPC16double6Double7to__int(wx.val / (num_points.val + 0));
        } else {
          $oob();
        }
        const _tmp$12 = cursor.val + 1 | 0;
        if (_tmp$12 >>> 0 < out.length) {
          out[_tmp$12] = _M0MPC16double6Double7to__int(wy.val / (num_points.val + 0));
        } else {
          $oob();
        }
        const _tmp$13 = cursor.val + 2 | 0;
        if (_tmp$13 >>> 0 < out.length) {
          out[_tmp$13] = not_processed;
        } else {
          $oob();
        }
        const _tmp$14 = cursor.val + 3 | 0;
        if (_tmp$14 >>> 0 < out.length) {
          out[_tmp$14] = id;
        } else {
          $oob();
        }
        const _tmp$15 = cursor.val + 4 | 0;
        if (_tmp$15 >>> 0 < out.length) {
          out[_tmp$15] = -1;
        } else {
          $oob();
        }
        const _tmp$16 = cursor.val + 5 | 0;
        if (_tmp$16 >>> 0 < out.length) {
          out[_tmp$16] = num_points.val;
        } else {
          $oob();
        }
        if (stride === 7) {
          const _tmp$17 = cursor.val + 6 | 0;
          if (_tmp$17 >>> 0 < out.length) {
            out[_tmp$17] = cluster_prop_index.val;
          } else {
            $oob();
          }
        }
        cursor.val = cursor.val + stride | 0;
      } else {
        const _bind$2 = 0;
        let _tmp$9 = _bind$2;
        while (true) {
          const j = _tmp$9;
          if (j < stride) {
            const _tmp$10 = cursor.val + j | 0;
            const _tmp$11 = i.val + j | 0;
            if (_tmp$10 >>> 0 < out.length) {
              out[_tmp$10] = _tmp$11 >>> 0 < data.length ? data[_tmp$11] : $oob();
            } else {
              $oob();
            }
            _tmp$9 = j + 1 | 0;
            continue;
          } else {
            break;
          }
        }
        cursor.val = cursor.val + stride | 0;
        if (num_points.val > 1) {
          const _bind$3 = 0;
          let _tmp$10 = _bind$3;
          while (true) {
            const n = _tmp$10;
            if (n < neighbor_count) {
              _L: {
                const k = Math.imul(n >>> 0 < neighbor_ids.length ? neighbor_ids[n] : $oob(), stride) | 0;
                const _tmp$11 = k + 2 | 0;
                if ((_tmp$11 >>> 0 < data.length ? data[_tmp$11] : $oob()) <= zoom) {
                  break _L;
                }
                const _tmp$12 = k + 2 | 0;
                if (_tmp$12 >>> 0 < data.length) {
                  data[_tmp$12] = zoom;
                } else {
                  $oob();
                }
                const _bind$4 = 0;
                let _tmp$13 = _bind$4;
                while (true) {
                  const j = _tmp$13;
                  if (j < stride) {
                    const _tmp$14 = cursor.val + j | 0;
                    const _tmp$15 = k + j | 0;
                    if (_tmp$14 >>> 0 < out.length) {
                      out[_tmp$14] = _tmp$15 >>> 0 < data.length ? data[_tmp$15] : $oob();
                    } else {
                      $oob();
                    }
                    _tmp$13 = j + 1 | 0;
                    continue;
                  } else {
                    break;
                  }
                }
                cursor.val = cursor.val + stride | 0;
                break _L;
              }
              _tmp$10 = n + 1 | 0;
              continue;
            } else {
              break;
            }
          }
        }
      }
      i.val = i.val + stride | 0;
      continue;
    } else {
      break;
    }
  }
  if (stride === 0) {
    $panic();
  }
  return cursor.val / stride | 0;
}
function _M0MP310moonbitgis12supercluster3src6KDBush3add(self, x, y) {
  const index = self.pos >> 1;
  const _tmp = self.ids;
  if (index >>> 0 < _tmp.length) {
    _tmp[index] = index;
  } else {
    $oob();
  }
  const _tmp$2 = self.coords;
  const _tmp$3 = self.pos;
  if (_tmp$3 >>> 0 < _tmp$2.length) {
    _tmp$2[_tmp$3] = x;
  } else {
    $oob();
  }
  self.pos = self.pos + 1 | 0;
  const _tmp$4 = self.coords;
  const _tmp$5 = self.pos;
  if (_tmp$5 >>> 0 < _tmp$4.length) {
    _tmp$4[_tmp$5] = y;
  } else {
    $oob();
  }
  self.pos = self.pos + 1 | 0;
  return index;
}
function _M0FP310moonbitgis12supercluster3src8int__max(a, b) {
  return a > b ? a : b;
}
function _M0FP310moonbitgis12supercluster3src14kd__swap__item(ids, coords, i, j) {
  const ti = i >>> 0 < ids.length ? ids[i] : $oob();
  if (i >>> 0 < ids.length) {
    ids[i] = j >>> 0 < ids.length ? ids[j] : $oob();
  } else {
    $oob();
  }
  if (j >>> 0 < ids.length) {
    ids[j] = ti;
  } else {
    $oob();
  }
  const _tmp = Math.imul(2, i) | 0;
  const tx = _tmp >>> 0 < coords.length ? coords[_tmp] : $oob();
  const _tmp$2 = Math.imul(2, i) | 0;
  const _tmp$3 = Math.imul(2, j) | 0;
  if (_tmp$2 >>> 0 < coords.length) {
    coords[_tmp$2] = _tmp$3 >>> 0 < coords.length ? coords[_tmp$3] : $oob();
  } else {
    $oob();
  }
  const _tmp$4 = Math.imul(2, j) | 0;
  if (_tmp$4 >>> 0 < coords.length) {
    coords[_tmp$4] = tx;
  } else {
    $oob();
  }
  const _tmp$5 = (Math.imul(2, i) | 0) + 1 | 0;
  const ty = _tmp$5 >>> 0 < coords.length ? coords[_tmp$5] : $oob();
  const _tmp$6 = (Math.imul(2, i) | 0) + 1 | 0;
  const _tmp$7 = (Math.imul(2, j) | 0) + 1 | 0;
  if (_tmp$6 >>> 0 < coords.length) {
    coords[_tmp$6] = _tmp$7 >>> 0 < coords.length ? coords[_tmp$7] : $oob();
  } else {
    $oob();
  }
  const _tmp$8 = (Math.imul(2, j) | 0) + 1 | 0;
  if (_tmp$8 >>> 0 < coords.length) {
    coords[_tmp$8] = ty;
  } else {
    $oob();
  }
}
function _M0FP310moonbitgis12supercluster3src10kd__select(ids, coords, k, left0, right0, axis) {
  const left = new _M0TPB8MutLocalGiE(left0);
  const right = new _M0TPB8MutLocalGiE(right0);
  while (true) {
    if (right.val > left.val) {
      if ((right.val - left.val | 0) > 600) {
        const n = ((right.val - left.val | 0) + 1 | 0) + 0;
        const m = ((k - left.val | 0) + 1 | 0) + 0;
        const z = _M0FPC14math2ln(n);
        const s = 0.5 * _M0FPC14math3exp(2 * z / 3);
        const sign = m - n / 2 < 0 ? -1 : 1;
        const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * sign;
        const new_left = _M0FP310moonbitgis12supercluster3src8int__max(left.val, _M0MPC16double6Double7to__int(_M0MPC16double6Double5floor(k + 0 - m * s / n + sd)));
        const new_right = _M0FP310moonbitgis12supercluster3src8int__min(right.val, _M0MPC16double6Double7to__int(_M0MPC16double6Double5floor(k + 0 + (n - m) * s / n + sd)));
        _M0FP310moonbitgis12supercluster3src10kd__select(ids, coords, k, new_left, new_right, axis);
      }
      const _tmp = (Math.imul(2, k) | 0) + axis | 0;
      const t = _tmp >>> 0 < coords.length ? coords[_tmp] : $oob();
      const i = new _M0TPB8MutLocalGiE(left.val);
      const j = new _M0TPB8MutLocalGiE(right.val);
      _M0FP310moonbitgis12supercluster3src14kd__swap__item(ids, coords, left.val, k);
      const _tmp$2 = (Math.imul(2, right.val) | 0) + axis | 0;
      if ((_tmp$2 >>> 0 < coords.length ? coords[_tmp$2] : $oob()) > t) {
        _M0FP310moonbitgis12supercluster3src14kd__swap__item(ids, coords, left.val, right.val);
      }
      while (true) {
        if (i.val < j.val) {
          _M0FP310moonbitgis12supercluster3src14kd__swap__item(ids, coords, i.val, j.val);
          i.val = i.val + 1 | 0;
          j.val = j.val - 1 | 0;
          while (true) {
            const _tmp$3 = (Math.imul(2, i.val) | 0) + axis | 0;
            if ((_tmp$3 >>> 0 < coords.length ? coords[_tmp$3] : $oob()) < t) {
              i.val = i.val + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          while (true) {
            const _tmp$3 = (Math.imul(2, j.val) | 0) + axis | 0;
            if ((_tmp$3 >>> 0 < coords.length ? coords[_tmp$3] : $oob()) > t) {
              j.val = j.val - 1 | 0;
              continue;
            } else {
              break;
            }
          }
          continue;
        } else {
          break;
        }
      }
      const _tmp$3 = (Math.imul(2, left.val) | 0) + axis | 0;
      if ((_tmp$3 >>> 0 < coords.length ? coords[_tmp$3] : $oob()) === t) {
        _M0FP310moonbitgis12supercluster3src14kd__swap__item(ids, coords, left.val, j.val);
      } else {
        j.val = j.val + 1 | 0;
        _M0FP310moonbitgis12supercluster3src14kd__swap__item(ids, coords, j.val, right.val);
      }
      if (j.val <= k) {
        left.val = j.val + 1 | 0;
      }
      if (k <= j.val) {
        right.val = j.val - 1 | 0;
      }
      continue;
    } else {
      return;
    }
  }
}
function _M0FP310moonbitgis12supercluster3src8kd__sort(ids, coords, node_size, left, right, axis) {
  let _tmp = ids;
  let _tmp$2 = coords;
  let _tmp$3 = node_size;
  let _tmp$4 = left;
  let _tmp$5 = right;
  let _tmp$6 = axis;
  while (true) {
    const ids$2 = _tmp;
    const coords$2 = _tmp$2;
    const node_size$2 = _tmp$3;
    const left$2 = _tmp$4;
    const right$2 = _tmp$5;
    const axis$2 = _tmp$6;
    if ((right$2 - left$2 | 0) <= node_size$2) {
      return undefined;
    }
    const m = (left$2 + right$2 | 0) >> 1;
    _M0FP310moonbitgis12supercluster3src10kd__select(ids$2, coords$2, m, left$2, right$2, axis$2);
    _M0FP310moonbitgis12supercluster3src8kd__sort(ids$2, coords$2, node_size$2, left$2, m - 1 | 0, 1 - axis$2 | 0);
    _tmp$4 = m + 1 | 0;
    _tmp$6 = 1 - axis$2 | 0;
    continue;
  }
}
function _M0MP310moonbitgis12supercluster3src6KDBush6finish(self) {
  const num_added = self.pos >> 1;
  _M0FP310moonbitgis12supercluster3src8kd__sort(self.ids, self.coords, self.node_size, 0, num_added - 1 | 0, 0);
  self.finished = true;
  return self;
}
function _M0MP310moonbitgis12supercluster3src12Supercluster12create__tree(self, data, num_items) {
  const tree = _M0MP310moonbitgis12supercluster3src6KDBush3new(num_items, self.options.node_size);
  const stride = self.stride;
  const _bind = 0;
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < num_items) {
      const _tmp$2 = Math.imul(i, stride) | 0;
      const _tmp$3 = _tmp$2 >>> 0 < data.length ? data[_tmp$2] : $oob();
      const _tmp$4 = (Math.imul(i, stride) | 0) + 1 | 0;
      _M0MP310moonbitgis12supercluster3src6KDBush3add(tree, _tmp$3, _tmp$4 >>> 0 < data.length ? data[_tmp$4] : $oob());
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  _M0MP310moonbitgis12supercluster3src6KDBush6finish(tree);
  tree.data = data;
  return tree;
}
function _M0MP310moonbitgis12supercluster3src12Supercluster4load(self, points) {
  const opts = self.options;
  const not_processed = opts.max_zoom + 1 | 0;
  const stride = self.stride;
  const n = new _M0TPB8MutLocalGiE(0);
  const _bind = points.len;
  const _bind$2 = points.buf;
  let _tmp = 0;
  while (true) {
    const _ = _tmp;
    if (_ < _bind) {
      const p = _bind$2[_];
      n.val = n.val + (_M0MPC15array5Array6lengthGUddEE(p.coords) === 0 ? 1 : _M0MPC15array5Array6lengthGUddEE(p.coords)) | 0;
      _tmp = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const num_points = n.val;
  self.num_points = num_points;
  const props = _M0MPC15array5Array4makeGRPC14json4JsonE(num_points, _M0MPC14json4Json4null());
  const coords = $make_array_len_and_init(Math.imul(num_points, 2) | 0, 0);
  const ids = $make_array_len_and_init(num_points, undefined);
  const data = $make_array_len_and_init(Math.imul(num_points, stride) | 0, 0);
  const w = new _M0TPB8MutLocalGiE(0);
  const i = new _M0TPB8MutLocalGiE(0);
  const _bind$3 = points.len;
  const _bind$4 = points.buf;
  let _tmp$2 = 0;
  while (true) {
    const _ = _tmp$2;
    if (_ < _bind$3) {
      const p = _bind$4[_];
      _L: {
        const n$2 = _M0MPC15array5Array6lengthGUddEE(p.coords);
        if (n$2 === 0) {
          i.val = i.val + 1 | 0;
          break _L;
        }
        const _bind$5 = 0;
        let _tmp$3 = _bind$5;
        while (true) {
          const c = _tmp$3;
          if (c < n$2) {
            let lng;
            let lat;
            _L$2: {
              const _bind$6 = _M0MPC15array5Array2atGUddEE(p.coords, c);
              const _lng = _bind$6._0;
              const _lat = _bind$6._1;
              lng = _lng;
              lat = _lat;
              break _L$2;
            }
            const px = _M0FP310moonbitgis12supercluster3src6lng__x(lng);
            const py = _M0FP310moonbitgis12supercluster3src6lat__y(lat);
            const _tmp$4 = Math.imul(2, i.val) | 0;
            if (_tmp$4 >>> 0 < coords.length) {
              coords[_tmp$4] = px;
            } else {
              $oob();
            }
            const _tmp$5 = (Math.imul(2, i.val) | 0) + 1 | 0;
            if (_tmp$5 >>> 0 < coords.length) {
              coords[_tmp$5] = py;
            } else {
              $oob();
            }
            const _tmp$6 = w.val;
            if (_tmp$6 >>> 0 < data.length) {
              data[_tmp$6] = _M0FP310moonbitgis12supercluster3src6encode(px);
            } else {
              $oob();
            }
            const _tmp$7 = w.val + 1 | 0;
            if (_tmp$7 >>> 0 < data.length) {
              data[_tmp$7] = _M0FP310moonbitgis12supercluster3src6encode(py);
            } else {
              $oob();
            }
            const _tmp$8 = w.val + 2 | 0;
            if (_tmp$8 >>> 0 < data.length) {
              data[_tmp$8] = not_processed;
            } else {
              $oob();
            }
            const _tmp$9 = w.val + 3 | 0;
            if (_tmp$9 >>> 0 < data.length) {
              data[_tmp$9] = i.val;
            } else {
              $oob();
            }
            const _tmp$10 = w.val + 4 | 0;
            if (_tmp$10 >>> 0 < data.length) {
              data[_tmp$10] = -1;
            } else {
              $oob();
            }
            const _tmp$11 = w.val + 5 | 0;
            if (_tmp$11 >>> 0 < data.length) {
              data[_tmp$11] = 1;
            } else {
              $oob();
            }
            _M0MPC15array5Array3setGRPC14json4JsonE(props, i.val, p.properties);
            let id;
            _L$3: {
              _L$4: {
                const _bind$6 = p.id;
                if (_bind$6 === undefined) {
                } else {
                  const _Some = _bind$6;
                  const _id = _Some;
                  id = _id;
                  break _L$4;
                }
                break _L$3;
              }
              const _tmp$12 = i.val;
              if (_tmp$12 >>> 0 < ids.length) {
                ids[_tmp$12] = id;
              } else {
                $oob();
              }
            }
            w.val = w.val + stride | 0;
            i.val = i.val + 1 | 0;
            _tmp$3 = c + 1 | 0;
            continue;
          } else {
            break;
          }
        }
        break _L;
      }
      _tmp$2 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  self.props = props;
  self.coords = coords;
  self.ids = ids;
  const prev = new _M0TPB8MutLocalGAiE(data);
  const prev_num = new _M0TPB8MutLocalGiE(i.val);
  const _tmp$3 = self.trees;
  const _tmp$4 = opts.max_zoom + 1 | 0;
  if (_tmp$4 >>> 0 < _tmp$3.length) {
    _tmp$3[_tmp$4] = _M0MP310moonbitgis12supercluster3src12Supercluster12create__tree(self, prev.val, prev_num.val);
  } else {
    $oob();
  }
  const z = new _M0TPB8MutLocalGiE(opts.max_zoom);
  while (true) {
    if (z.val >= opts.min_zoom) {
      const out = $make_array_len_and_init(Math.imul(prev_num.val, stride) | 0, 0);
      const written = _M0MP310moonbitgis12supercluster3src12Supercluster15cluster__points(self, prev.val, prev_num.val, z.val, out);
      if (written === prev_num.val) {
        const _tmp$5 = self.trees;
        const _tmp$6 = z.val;
        const _tmp$7 = self.trees;
        const _tmp$8 = z.val + 1 | 0;
        if (_tmp$6 >>> 0 < _tmp$5.length) {
          _tmp$5[_tmp$6] = _tmp$8 >>> 0 < _tmp$7.length ? _tmp$7[_tmp$8] : $oob();
        } else {
          $oob();
        }
      } else {
        const _tmp$5 = self.trees;
        const _tmp$6 = z.val;
        if (_tmp$6 >>> 0 < _tmp$5.length) {
          _tmp$5[_tmp$6] = _M0MP310moonbitgis12supercluster3src12Supercluster12create__tree(self, out, written);
        } else {
          $oob();
        }
        prev.val = out;
        prev_num.val = written;
      }
      z.val = z.val - 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return self;
}
function _M0FP310moonbitgis12supercluster3src11double__max(a, b) {
  return a > b ? a : b;
}
function _M0FP310moonbitgis12supercluster3src11double__min(a, b) {
  return a < b ? a : b;
}
function _M0MP310moonbitgis12supercluster3src6KDBush5range(self, min_x, min_y, max_x, max_y) {
  const result = new _M0TPB5ArrayGiE([], 0);
  if (self.num_items === 0) {
    return result;
  }
  const stack = $make_array_len_and_init(192, 0);
  if (0 >>> 0 < stack.length) {
    stack[0] = 0;
  } else {
    $oob();
  }
  if (1 >>> 0 < stack.length) {
    stack[1] = self.ids.length - 1 | 0;
  } else {
    $oob();
  }
  if (2 >>> 0 < stack.length) {
    stack[2] = 0;
  } else {
    $oob();
  }
  const sp = new _M0TPB8MutLocalGiE(3);
  const ids = self.ids;
  const coords = self.coords;
  const node_size = self.node_size;
  while (true) {
    if (sp.val > 0) {
      sp.val = sp.val - 1 | 0;
      const _tmp = sp.val;
      const axis = _tmp >>> 0 < stack.length ? stack[_tmp] : $oob();
      sp.val = sp.val - 1 | 0;
      const _tmp$2 = sp.val;
      const right = _tmp$2 >>> 0 < stack.length ? stack[_tmp$2] : $oob();
      sp.val = sp.val - 1 | 0;
      const _tmp$3 = sp.val;
      const left = _tmp$3 >>> 0 < stack.length ? stack[_tmp$3] : $oob();
      if ((right - left | 0) <= node_size) {
        const _bind = right + 1 | 0;
        let _tmp$4 = left;
        while (true) {
          const i = _tmp$4;
          if (i < _bind) {
            const _tmp$5 = Math.imul(2, i) | 0;
            const x = _tmp$5 >>> 0 < coords.length ? coords[_tmp$5] : $oob();
            const _tmp$6 = (Math.imul(2, i) | 0) + 1 | 0;
            const y = _tmp$6 >>> 0 < coords.length ? coords[_tmp$6] : $oob();
            if (x >= min_x && (x <= max_x && (y >= min_y && y <= max_y))) {
              _M0MPC15array5Array4pushGiE(result, i >>> 0 < ids.length ? ids[i] : $oob());
            }
            _tmp$4 = i + 1 | 0;
            continue;
          } else {
            break;
          }
        }
        continue;
      }
      const m = (left + right | 0) >> 1;
      const _tmp$4 = Math.imul(2, m) | 0;
      const x = _tmp$4 >>> 0 < coords.length ? coords[_tmp$4] : $oob();
      const _tmp$5 = (Math.imul(2, m) | 0) + 1 | 0;
      const y = _tmp$5 >>> 0 < coords.length ? coords[_tmp$5] : $oob();
      if (x >= min_x && (x <= max_x && (y >= min_y && y <= max_y))) {
        _M0MPC15array5Array4pushGiE(result, m >>> 0 < ids.length ? ids[m] : $oob());
      }
      const go_left = axis === 0 ? min_x <= x : min_y <= y;
      if (go_left) {
        const _tmp$6 = sp.val;
        if (_tmp$6 >>> 0 < stack.length) {
          stack[_tmp$6] = left;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
        const _tmp$7 = sp.val;
        if (_tmp$7 >>> 0 < stack.length) {
          stack[_tmp$7] = m - 1 | 0;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
        const _tmp$8 = sp.val;
        if (_tmp$8 >>> 0 < stack.length) {
          stack[_tmp$8] = 1 - axis | 0;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
      }
      const go_right = axis === 0 ? max_x >= x : max_y >= y;
      if (go_right) {
        const _tmp$6 = sp.val;
        if (_tmp$6 >>> 0 < stack.length) {
          stack[_tmp$6] = m + 1 | 0;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
        const _tmp$7 = sp.val;
        if (_tmp$7 >>> 0 < stack.length) {
          stack[_tmp$7] = right;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
        const _tmp$8 = sp.val;
        if (_tmp$8 >>> 0 < stack.length) {
          stack[_tmp$8] = 1 - axis | 0;
        } else {
          $oob();
        }
        sp.val = sp.val + 1 | 0;
      }
      continue;
    } else {
      break;
    }
  }
  return result;
}
function _M0FP310moonbitgis12supercluster3src22double__to__js__string(d) {
  return d === _M0MPC16double6Double5floor(d) ? _M0MPC13int3Int18to__string_2einner(_M0MPC16double6Double7to__int(d), 10) : String(d);
}
function _M0FP310moonbitgis12supercluster3src9js__round(d) {
  return _M0MPC16double6Double5floor(d + 0.5);
}
function _M0FP310moonbitgis12supercluster3src24get__cluster__properties(data, i, cluster_props) {
  const _tmp = i + 5 | 0;
  const count = _tmp >>> 0 < data.length ? data[_tmp] : $oob();
  let abbrev;
  if (count >= 10000) {
    abbrev = _M0MPC14json4Json6string(`${_M0MPC13int3Int18to__string_2einner(_M0MPC16double6Double7to__int(_M0FP310moonbitgis12supercluster3src9js__round((count + 0) / 1000)), 10)}k`);
  } else {
    if (count >= 1000) {
      const v = _M0FP310moonbitgis12supercluster3src9js__round((count + 0) / 100) / 10;
      abbrev = _M0MPC14json4Json6string(`${_M0FP310moonbitgis12supercluster3src22double__to__js__string(v)}k`);
    } else {
      abbrev = _M0MPC14json4Json6number(count + 0, undefined);
    }
  }
  const _tmp$2 = i + 6 | 0;
  const prop_index = _tmp$2 >>> 0 < data.length ? data[_tmp$2] : $oob();
  const _bind = [];
  const result = _M0MPB3Map3MapGsRPC14json4JsonE(new _M0TPB9ArrayViewGUsRPC14json4JsonEE(_bind, 0, 0), undefined);
  if (prop_index >= 0 && prop_index < _M0MPC15array5Array6lengthGUddEE(cluster_props)) {
    let m;
    _L: {
      _L$2: {
        const _bind$2 = _M0MPC15array5Array2atGUddEE(cluster_props, prop_index);
        if (_bind$2.$tag === 6) {
          const _Object = _bind$2;
          const _m = _Object._0;
          m = _m;
          break _L$2;
        }
        break _L;
      }
      const _it = _M0MPB3Map5iter2GsRPC14json4JsonE(m);
      while (true) {
        let k;
        let v;
        _L$3: {
          const _bind$2 = _M0MPB5Iter24nextGsRPC14json4JsonE(_it);
          if (_bind$2 === undefined) {
            break;
          } else {
            const _Some = _bind$2;
            const _x = _Some;
            const _k = _x._0;
            const _v = _x._1;
            k = _k;
            v = _v;
            break _L$3;
          }
        }
        _M0MPB3Map3setGsRPC14json4JsonE(result, k, v);
        continue;
      }
    }
  }
  _M0MPB3Map3setGsRPC14json4JsonE(result, "cluster", _M0MPC14json4Json7boolean(true));
  const _tmp$3 = i + 3 | 0;
  _M0MPB3Map3setGsRPC14json4JsonE(result, "cluster_id", _M0MPC14json4Json6number((_tmp$3 >>> 0 < data.length ? data[_tmp$3] : $oob()) + 0, undefined));
  _M0MPB3Map3setGsRPC14json4JsonE(result, "point_count", _M0MPC14json4Json6number(count + 0, undefined));
  _M0MPB3Map3setGsRPC14json4JsonE(result, "point_count_abbreviated", abbrev);
  return _M0MPC14json4Json6object(result);
}
function _M0FP310moonbitgis12supercluster3src6x__lng(x) {
  return (x - 0.5) * 360;
}
function _M0FP310moonbitgis12supercluster3src6y__lat(y) {
  const y2 = (180 - y * 360) * 3.1415926535897931 / 180;
  return 360 * _M0FPC14math4atan(_M0FPC14math3exp(y2)) / 3.1415926535897931 - 90;
}
function _M0MP310moonbitgis12supercluster3src12Supercluster13feature__json(self, data, k) {
  const _tmp = k + 3 | 0;
  const i = _tmp >>> 0 < data.length ? data[_tmp] : $oob();
  const _tmp$2 = k + 5 | 0;
  const is_cluster = (_tmp$2 >>> 0 < data.length ? data[_tmp$2] : $oob()) > 1;
  let id;
  if (is_cluster) {
    id = _M0MPC14json4Json6number(i + 0, undefined);
  } else {
    const _tmp$3 = self.ids;
    id = i >>> 0 < _tmp$3.length ? _tmp$3[i] : $oob();
  }
  let properties;
  let lng;
  let lat;
  let cluster_id;
  let point_count;
  _L: {
    if (is_cluster) {
      const props = _M0FP310moonbitgis12supercluster3src24get__cluster__properties(data, k, self.cluster_props);
      const _tmp$3 = k + 3 | 0;
      const cid = _tmp$3 >>> 0 < data.length ? data[_tmp$3] : $oob();
      const _tmp$4 = k + 5 | 0;
      const pc = _tmp$4 >>> 0 < data.length ? data[_tmp$4] : $oob();
      const _tmp$5 = _M0FP310moonbitgis12supercluster3src6x__lng(_M0FP310moonbitgis12supercluster3src6decode(k >>> 0 < data.length ? data[k] : $oob()));
      const _tmp$6 = k + 1 | 0;
      properties = props;
      lng = _tmp$5;
      lat = _M0FP310moonbitgis12supercluster3src6y__lat(_M0FP310moonbitgis12supercluster3src6decode(_tmp$6 >>> 0 < data.length ? data[_tmp$6] : $oob()));
      cluster_id = cid;
      point_count = pc;
      break _L;
    } else {
      const props = _M0MPC15array5Array2atGUddEE(self.props, i);
      const _tmp$3 = self.coords;
      const _tmp$4 = Math.imul(2, i) | 0;
      const _tmp$5 = _M0FP310moonbitgis12supercluster3src6x__lng(_tmp$4 >>> 0 < _tmp$3.length ? _tmp$3[_tmp$4] : $oob());
      const _tmp$6 = self.coords;
      const _tmp$7 = (Math.imul(2, i) | 0) + 1 | 0;
      properties = props;
      lng = _tmp$5;
      lat = _M0FP310moonbitgis12supercluster3src6y__lat(_tmp$7 >>> 0 < _tmp$6.length ? _tmp$6[_tmp$7] : $oob());
      cluster_id = 0;
      point_count = 1;
      break _L;
    }
  }
  return new _M0TP310moonbitgis12supercluster3src7Feature(id, properties, lng, lat, is_cluster, cluster_id, point_count);
}
function _M0MP310moonbitgis12supercluster3src12Supercluster11limit__zoom(self, z) {
  return _M0FP310moonbitgis12supercluster3src8int__max(self.options.min_zoom, _M0FP310moonbitgis12supercluster3src8int__min(z, self.options.max_zoom + 1 | 0));
}
function _M0MP310moonbitgis12supercluster3src12Supercluster13get__clusters(self, min_lng0, min_lat0, max_lng0, max_lat0, zoom) {
  const min_lng = new _M0TPB8MutLocalGdE(_M0IPC16double6DoublePB3Mod3mod(_M0IPC16double6DoublePB3Mod3mod(min_lng0 + 180, 360) + 360, 360) - 180);
  const min_lat = _M0FP310moonbitgis12supercluster3src11double__max(-90, _M0FP310moonbitgis12supercluster3src11double__min(90, min_lat0));
  const max_lng = new _M0TPB8MutLocalGdE(max_lng0 === 180 ? 180 : _M0IPC16double6DoublePB3Mod3mod(_M0IPC16double6DoublePB3Mod3mod(max_lng0 + 180, 360) + 360, 360) - 180);
  const max_lat = _M0FP310moonbitgis12supercluster3src11double__max(-90, _M0FP310moonbitgis12supercluster3src11double__min(90, max_lat0));
  if (max_lng0 - min_lng0 >= 360) {
    min_lng.val = -180;
    max_lng.val = 180;
  } else {
    if (min_lng.val > max_lng.val) {
      const eastern_hem = _M0MP310moonbitgis12supercluster3src12Supercluster13get__clusters(self, min_lng.val, min_lat, 180, max_lat, zoom);
      const western_hem = _M0MP310moonbitgis12supercluster3src12Supercluster13get__clusters(self, -180, min_lat, max_lng.val, max_lat, zoom);
      const _bind = western_hem.len;
      const _bind$2 = western_hem.buf;
      let _tmp = 0;
      while (true) {
        const _ = _tmp;
        if (_ < _bind) {
          const f = _bind$2[_];
          _M0MPC15array5Array4pushGRP310moonbitgis12supercluster3src7FeatureE(eastern_hem, f);
          _tmp = _ + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      return eastern_hem;
    }
  }
  const _tmp = self.trees;
  const _tmp$2 = _M0MP310moonbitgis12supercluster3src12Supercluster11limit__zoom(self, zoom);
  const tree = _tmp$2 >>> 0 < _tmp.length ? _tmp[_tmp$2] : $oob();
  const ids = _M0MP310moonbitgis12supercluster3src6KDBush5range(tree, _M0FP310moonbitgis12supercluster3src6encode(_M0FP310moonbitgis12supercluster3src6lng__x(min_lng.val)), _M0FP310moonbitgis12supercluster3src6encode(_M0FP310moonbitgis12supercluster3src6lat__y(max_lat)), _M0FP310moonbitgis12supercluster3src6encode(_M0FP310moonbitgis12supercluster3src6lng__x(max_lng.val)), _M0FP310moonbitgis12supercluster3src6encode(_M0FP310moonbitgis12supercluster3src6lat__y(min_lat)));
  const clusters = new _M0TPB5ArrayGRP310moonbitgis12supercluster3src7FeatureE([], 0);
  const _bind = ids.len;
  const _bind$2 = ids.buf;
  let _tmp$3 = 0;
  while (true) {
    const _ = _tmp$3;
    if (_ < _bind) {
      const id = _bind$2[_];
      _M0MPC15array5Array4pushGRP310moonbitgis12supercluster3src7FeatureE(clusters, _M0MP310moonbitgis12supercluster3src12Supercluster13feature__json(self, tree.data, Math.imul(self.stride, id) | 0));
      _tmp$3 = _ + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return clusters;
}
function _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi11sc__version() {
  return "moonbitgis/supercluster 0.1.0 (MoonBit JS backend)";
}
function _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi16sc__build__index(count) {
  const points = new _M0TPB5ArrayGRP310moonbitgis12supercluster3src10InputPointE([], 0);
  const _bind = 0;
  let _tmp = _bind;
  while (true) {
    const i = _tmp;
    if (i < count) {
      const city = _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi14js__data__city(i);
      const name = city >= 0 && city < _M0MPC15array5Array6lengthGUddEE(_M0FP410moonbitgis12supercluster10web_2ddemo5mbapi6cities) ? _M0MPC15array5Array2atGUddEE(_M0FP410moonbitgis12supercluster10web_2ddemo5mbapi6cities, city) : "未知";
      const _bind$2 = [];
      const props = _M0MPB3Map3MapGsRPC14json4JsonE(new _M0TPB9ArrayViewGUsRPC14json4JsonEE(_bind$2, 0, 0), undefined);
      _M0MPB3Map3setGsRPC14json4JsonE(props, "name", _M0MPC14json4Json6string(name));
      _M0MPC15array5Array4pushGRP310moonbitgis12supercluster3src7FeatureE(points, _M0MP310moonbitgis12supercluster3src10InputPoint2of(_M0FP410moonbitgis12supercluster10web_2ddemo5mbapi13js__data__lng(i), _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi13js__data__lat(i), _M0MPC14json4Json6object(props)));
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  const index = _M0MP310moonbitgis12supercluster3src12Supercluster4load(_M0MP310moonbitgis12supercluster3src12Supercluster3new(_M0MP310moonbitgis12supercluster3src7Options3new(undefined, 16, 3, new _M0DTPC16option6OptionGdE4Some(60), _M0DTPC16option6OptionGdE4None__, undefined, -1, undefined, _M0DTPC16option6OptionGOWRPC14json4JsonRPC14json4JsonEuE4None__)), points);
  _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi10index__ref.val = index;
  return index.num_points;
}
function _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi11point__name(props) {
  let m;
  _L: {
    if (props.$tag === 6) {
      const _Object = props;
      const _m = _Object._0;
      m = _m;
      break _L;
    } else {
      return "";
    }
  }
  const _bind = _M0MPB3Map3getGsRPC14json4JsonE(m, "name");
  if (_bind === undefined) {
    return "";
  } else {
    const _Some = _bind;
    const _x = _Some;
    if (_x.$tag === 4) {
      const _String = _x;
      const _s = _String._0;
      return _s;
    } else {
      return "";
    }
  }
}
function _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi12sc__clusters(min_lng, min_lat, max_lng, max_lat, zoom) {
  let index;
  _L: {
    const _bind = _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi10index__ref.val;
    if (_bind === undefined) {
      return "[]";
    } else {
      const _Some = _bind;
      const _index = _Some;
      index = _index;
      break _L;
    }
  }
  const feats = _M0MP310moonbitgis12supercluster3src12Supercluster13get__clusters(index, min_lng, min_lat, max_lng, max_lat, zoom);
  const buf = _M0MPB13StringBuilder21StringBuilder_2einner(8);
  _M0IPB13StringBuilderPB6Logger13write__string(buf, "[");
  const _bind = feats.len;
  const _bind$2 = feats.buf;
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < _bind) {
      const f = _bind$2[i];
      if (i > 0) {
        _M0IPB13StringBuilderPB6Logger13write__string(buf, ",");
      }
      _M0IPB13StringBuilderPB6Logger13write__string(buf, "{\"lng\":");
      _M0IPB13StringBuilderPB6Logger13write__string(buf, String(f.lng));
      _M0IPB13StringBuilderPB6Logger13write__string(buf, ",\"lat\":");
      _M0IPB13StringBuilderPB6Logger13write__string(buf, String(f.lat));
      if (f.is_cluster) {
        _M0IPB13StringBuilderPB6Logger13write__string(buf, ",\"cluster\":true,\"id\":");
        _M0IPB13StringBuilderPB6Logger13write__string(buf, _M0MPC13int3Int18to__string_2einner(f.cluster_id, 10));
        _M0IPB13StringBuilderPB6Logger13write__string(buf, ",\"count\":");
        _M0IPB13StringBuilderPB6Logger13write__string(buf, _M0MPC13int3Int18to__string_2einner(f.point_count, 10));
        _M0IPB13StringBuilderPB6Logger13write__string(buf, "}");
      } else {
        _M0IPB13StringBuilderPB6Logger13write__string(buf, ",\"cluster\":false,\"name\":\"");
        _M0IPB13StringBuilderPB6Logger13write__string(buf, _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi11point__name(f.properties));
        _M0IPB13StringBuilderPB6Logger13write__string(buf, "\"}");
      }
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  _M0IPB13StringBuilderPB6Logger13write__string(buf, "]");
  return _M0MPB13StringBuilder10to__string(buf);
}
(() => {
  _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi11sc__version();
})();
export { _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi11sc__version as sc_version, _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi16sc__build__index as sc_build_index, _M0FP410moonbitgis12supercluster10web_2ddemo5mbapi12sc__clusters as sc_clusters }
//# sourceMappingURL=mbapi.js.map
