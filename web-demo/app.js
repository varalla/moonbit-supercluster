// 在线演示逻辑：Leaflet 地图 + MoonBit supercluster（ES Module 动态导入）
// 数据：web-demo/data/gd_points.json（模拟接口），索引与查询全部走 MoonBit 产物
// 注意：MoonBit 产物在模块加载时捕获 globalThis.__SC_* 胶水函数，
//       因此胶水必须在动态 import 之前设置（内部再惰性解引用 __SC_DATA）。
//
// 扩展演示（2026-11-23）：
//   1. GCJ-02 切换按钮：把 WGS-84 数据在 JS 侧正变换成 GCJ-02（模拟国内
//      数据源），以 coord_system=Gcj02 重建索引——输出还原 GCJ-02，
//      与高德底图（GCJ-02）对齐；WGS-84 模式则可见 ~500m 底图偏移。
//   2. 行政区划区域查询：DataV 六市边界 GeoJSON（GCJ-02）作为 regions
//      锚定，下拉切换城市时走 get_clusters_in_region（簇按中心判定）。
//      WGS-84 模式下边界先做 GCJ→WGS 还原再喂给索引，保证 PIP 一致。

// ---------- MoonBit 侧数据胶水（先于动态 import 设置） ----------
globalThis.__SC_DATA = null;
globalThis.__SC_LNG = i => globalThis.__SC_DATA[i * 3];
globalThis.__SC_LAT = i => globalThis.__SC_DATA[i * 3 + 1];
globalThis.__SC_CITY = i => globalThis.__SC_DATA[i * 3 + 2];
const mb = await import('./mbapi.js');
const { sc_version, sc_build_index, sc_clusters, sc_set_regions, sc_clusters_in_region } = mb;

// ---------- 地图 ----------
const map = L.map('map', { zoomControl: true }).setView([22.95, 113.5], 9);
L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
  subdomains: ['1', '2', '3', '4'],
  attribution: '© 高德地图 | 聚类引擎 moonbitgis/supercluster（MoonBit JS 后端）',
  maxZoom: 18,
}).addTo(map);
const layer = L.layerGroup().addTo(map);
let polygonLayer = null; // 六市边界（GCJ-02，与高德瓦片对齐）

// ---------- 坐标转换（JS 侧，供 GCJ-02 演示数据与边界还原用） ----------
const PI = Math.PI, GCJ_A = 6378245.0, GCJ_EE = 0.00669342162296594323;
function tLat(x, y) {
  let r = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x));
  r += (20*Math.sin(6*x*PI) + 20*Math.sin(2*x*PI)) * 2/3;
  r += (20*Math.sin(y*PI) + 40*Math.sin(y/3*PI)) * 2/3;
  r += (160*Math.sin(y/12*PI) + 320*Math.sin(y*PI/30)) * 2/3;
  return r;
}
function tLng(x, y) {
  let r = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x));
  r += (20*Math.sin(6*x*PI) + 20*Math.sin(2*x*PI)) * 2/3;
  r += (20*Math.sin(x*PI) + 40*Math.sin(x/3*PI)) * 2/3;
  r += (150*Math.sin(x/12*PI) + 300*Math.sin(x/30*PI)) * 2/3;
  return r;
}
function outOfChina(lng, lat) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}
function wgs2gcj(lng, lat) { // 正变换，精确
  if (outOfChina(lng, lat)) return [lng, lat];
  const rl = lat / 180 * PI, m = 1 - GCJ_EE * Math.sin(rl) ** 2, sq = Math.sqrt(m);
  const dLat = tLat(lng - 105, lat - 35) * 180 / ((GCJ_A * (1 - GCJ_EE)) / (m * sq) * PI);
  const dLng = tLng(lng - 105, lat - 35) * 180 / (GCJ_A / sq * Math.cos(rl) * PI);
  return [lng + dLng, lat + dLat];
}
function gcj2wgs(lng, lat) { // 不动点迭代 2 次，~0.3mm
  let wLng = lng, wLat = lat;
  for (let i = 0; i < 2; i++) {
    const g = wgs2gcj(wLng, wLat);
    wLng += lng - g[0]; wLat += lat - g[1];
  }
  return [wLng, wLat];
}

// ---------- 簇分档着色（原版 supercluster 风格） ----------
const BUCKETS = [
  { max: 10, r: 14, bg: '#85FABF', fg: '#004D26' },
  { max: 50, r: 18, bg: '#0FDC78', fg: '#004D26' },
  { max: 200, r: 22, bg: '#f5e503ff', fg: '#FFFFFF' },
  { max: Infinity, r: 28, bg: '#f80000ff', fg: '#FFFFFF' },
];
function bucket(count) {
  for (const b of BUCKETS) if (count < b.max) return b;
  return BUCKETS[BUCKETS.length - 1];
}

// ---------- 统计面板 ----------
const state = {
  total: 0,
  buildMs: 0,
  version: '',
  zoom: 0,
  feats: 0,
  clusters: 0,
  points: 0,
  maxCount: 0,
  queryMs: 0,
  coordMode: 'wgs84', // 'wgs84' | 'gcj02'
  region: -1,         // -1 = 全部区域；>=0 = gd_cities.json 的 feature 下标
};
function renderStats() {
  const b = bucket(state.maxCount);
  document.getElementById('stats').innerHTML = [
    ['绑定版本', state.version],
    ['点位总数', state.total.toLocaleString()],
    ['索引构建耗时', state.buildMs.toFixed(0) + ' ms'],
    ['当前坐标系', state.coordMode === 'gcj02' ? 'GCJ-02（已纠偏）' : 'WGS-84（原始）'],
    ['区域筛选', state.region >= 0 ? regionNames[state.region] : '全部区域'],
    ['当前 zoom', 'z' + state.zoom],
    ['视野要素数', state.feats + '（簇 ' + state.clusters + ' / 单点 ' + state.points + '）'],
    ['最大簇', state.maxCount ? state.maxCount.toLocaleString() + ' 点' : '—'],
    ['最近查询耗时', state.queryMs.toFixed(1) + ' ms'],
    ['簇样式分档', '<span class="cluster-dot" style="background:' + b.bg + '"></span>&lt; ' + (b.max === Infinity ? '∞' : b.max)],
  ].map(([k, v]) => '<tr><td>' + k + '</td><td>' + v + '</td></tr>').join('');
}

// ---------- 数据加载与索引构建 ----------
const bar = document.getElementById('bar');
const loadmsg = document.getElementById('loadmsg');
let wgsData = null, gcjData = null;
let citiesGcj = null, citiesGcjText = null, citiesWgsText = null;
let nPts = 0;
let regionNames = [];

function toGcjData() { // GCJ-02 演示数据集：懒生成一次（模拟国内数据源）
  if (gcjData) return gcjData;
  gcjData = new Float64Array(wgsData.length);
  for (let i = 0; i < nPts; i++) {
    const [lng, lat] = wgs2gcj(wgsData[i * 3], wgsData[i * 3 + 1]);
    gcjData[i * 3] = lng;
    gcjData[i * 3 + 1] = lat;
    gcjData[i * 3 + 2] = wgsData[i * 3 + 2];
  }
  return gcjData;
}
function polyToWgs(geojson) { // 边界 GCJ→WGS（WGS-84 模式下供 PIP 一致性）
  const conv = ring => ring.map(c => gcj2wgs(c[0], c[1]));
  const walk = g => {
    if (g.type === 'Polygon') g.coordinates = g.coordinates.map(conv);
    else if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map(poly => poly.map(conv));
  };
  const out = JSON.parse(JSON.stringify(geojson));
  out.features.forEach(f => walk(f.geometry));
  return out;
}

async function buildIndex(mode) {
  globalThis.__SC_DATA = mode === 'gcj02' ? toGcjData() : wgsData;
  // 区域与输入点必须同一坐标系：GCJ 模式喂原始边界，WGS 模式喂还原后边界
  sc_set_regions(mode === 'gcj02' ? citiesGcjText : JSON.stringify(polyToWgs(citiesGcj)));
  const t0 = performance.now();
  state.total = sc_build_index(nPts, mode === 'gcj02' ? 1 : 0);
  state.buildMs = performance.now() - t0;
  state.coordMode = mode;
  renderStats();
}

async function boot() {
  loadmsg.textContent = '下载 gd_points.json / gd_cities.json …';
  bar.style.width = '20%';
  const [ptsJson, citiesJson] = await Promise.all([
    fetch('./data/gd_points.json').then(r => r.json()),
    fetch('./data/gd_cities.json').then(r => r.json()),
  ]);
  const pts = ptsJson.points;
  nPts = pts.length;
  citiesGcj = citiesJson;
  citiesGcjText = JSON.stringify(citiesGcj);
  regionNames = citiesGcj.features.map(f => f.properties.name);

  // 平铺 [lng, lat, cityIdx]，MoonBit 侧经 extern "js" 逐点读取
  wgsData = new Float64Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    wgsData[i * 3] = pts[i][0];
    wgsData[i * 3 + 1] = pts[i][1];
    wgsData[i * 3 + 2] = pts[i][2];
  }

  loadmsg.textContent = '投喂给 MoonBit 索引 …';
  bar.style.width = '55%';
  await new Promise(r => setTimeout(r, 30)); // 让 loading 文案先渲染

  // 六市边界底图（GCJ-02，与高德瓦片对齐）
  polygonLayer = L.geoJSON(citiesGcj, {
    style: () => ({ color: '#3E63DD', weight: 1.5, dashArray: '4 4', fill: true, fillOpacity: 0.03 }),
    onEachFeature: (f, l) => l.bindTooltip(f.properties.name, { sticky: true }),
  }).addTo(map);

  // 城市切换下拉
  const sel = document.getElementById('sel-city');
  sel.innerHTML = '<option value="-1">全部区域</option>' +
    citiesGcj.features.map((f, i) => '<option value="' + i + '">' + i + ' · ' + f.properties.name + '</option>').join('');
  sel.onchange = () => { state.region = parseInt(sel.value, 10); highlightRegion(); renderStats(); redraw(); };

  state.version = sc_version();
  const btn = document.getElementById('btn-coord');
  btn.disabled = true;
  btn.textContent = '正在构建索引…';
  await buildIndex('wgs84');
  btn.disabled = false;
  btn.textContent = '切换 GCJ-02 数据';
  bar.style.width = '100%';
  document.getElementById('loading').style.display = 'none';
  redraw();
}

function highlightRegion() {
  if (!polygonLayer) return;
  polygonLayer.resetStyle();
  if (state.region >= 0) {
    const selected = citiesGcj.features[state.region].properties.name;
    polygonLayer.eachLayer(l => {
      if (l.feature.properties.name === selected) {
        l.setStyle({ color: '#0FDC78', weight: 3, fillOpacity: 0.25, dashArray: null });
      }
    });
  }
}

// ---------- 视口查询与渲染 ----------
function redraw() {
  const z = Math.min(16, Math.max(0, Math.round(map.getZoom())));
  const b = map.getBounds();
  const w = b.getWest(), s = b.getSouth(), e = b.getEast(), n = b.getNorth();
  const t0 = performance.now();
  const raw = state.region >= 0
    ? sc_clusters_in_region(state.region, w, s, e, n, z)
    : sc_clusters(w, s, e, n, z);
  const feats = JSON.parse(raw);
  state.queryMs = performance.now() - t0;

  layer.clearLayers();
  let clusters = 0, points = 0, maxCount = 0;
  for (const f of feats) {
    if (f.cluster) {
      clusters++;
      if (f.count > maxCount) maxCount = f.count;
      const s2 = bucket(f.count);
      const d = s2.r * 2;
      const fs = Math.max(10, Math.round(s2.r * 0.62));
      L.marker([f.lat, f.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="cluster" style="width:' + d + 'px;height:' + d + 'px;background:' + s2.bg + ';color:' + s2.fg + ';font-size:' + fs + 'px">' + (f.count >= 10000 ? Math.round(f.count / 1000) + 'k' : f.count) + '</div>',
          iconSize: [d, d],
        }),
        title: f.count + ' 点（cluster_id=' + f.id + '）',
      }).addTo(layer);
    } else {
      points++;
      L.circleMarker([f.lat, f.lng], {
        radius: 5, weight: 1.5, color: '#02743B',
        fillColor: '#0FDC78', fillOpacity: 0.9,
      }).bindTooltip(f.name || '点').addTo(layer);
    }
  }
  state.zoom = z;
  state.feats = feats.length;
  state.clusters = clusters;
  state.points = points;
  state.maxCount = maxCount;
  renderStats();
}

// ---------- 控件事件 ----------
document.getElementById('btn-coord').onclick = async () => {
  const next = state.coordMode === 'wgs84' ? 'gcj02' : 'wgs84';
  const btn = document.getElementById('btn-coord');
  btn.disabled = true;
  btn.textContent = '正在切换数据并重建索引…';
  await buildIndex(next);
  btn.disabled = false;
  btn.textContent = next === 'wgs84' ? '切换 GCJ-02 数据' : '切回 WGS-84 数据';
  redraw();
};

map.on('moveend', redraw);
map.on('zoomend', redraw);
boot().catch(err => {
  loadmsg.textContent = '加载失败：' + err.message + '（请确认已通过本地静态服务器访问，而非 file://）';
});
