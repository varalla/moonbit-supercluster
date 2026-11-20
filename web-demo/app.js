// 在线演示逻辑：Leaflet 地图 + MoonBit supercluster（ES Module 动态导入）
// 数据：web-demo/data/gd_points.json（模拟接口），索引与查询全部走 MoonBit 产物
// 注意：MoonBit 产物在模块加载时捕获 globalThis.__SC_* 胶水函数，
//       因此胶水必须在动态 import 之前设置（内部再惰性解引用 __SC_DATA）。

// ---------- MoonBit 侧数据胶水（先于动态 import 设置） ----------
globalThis.__SC_DATA = null;
globalThis.__SC_LNG = i => globalThis.__SC_DATA[i * 3];
globalThis.__SC_LAT = i => globalThis.__SC_DATA[i * 3 + 1];
globalThis.__SC_CITY = i => globalThis.__SC_DATA[i * 3 + 2];
const mb = await import('./mbapi.js');
const { sc_version, sc_build_index, sc_clusters } = mb;

// ---------- 地图 ----------
const map = L.map('map', { zoomControl: true }).setView([22.95, 113.5], 9);
L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
  subdomains: ['1', '2', '3', '4'],
  attribution: '© 高德地图 | 聚类引擎 moonbitgis/supercluster（MoonBit JS 后端）',
  maxZoom: 18,
}).addTo(map);
const layer = L.layerGroup().addTo(map);

// ---------- 簇分档着色（原版 supercluster 风格） ----------
const BUCKETS = [
  { max: 10, r: 14, bg: '#85FABF', fg: '#004D26' },
  { max: 50, r: 18, bg: '#0FDC78', fg: '#004D26' },
  { max: 200, r: 22, bg: '#05994F', fg: '#FFFFFF' },
  { max: Infinity, r: 28, bg: '#02743B', fg: '#FFFFFF' },
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
};
function renderStats() {
  const b = bucket(state.maxCount);
  document.getElementById('stats').innerHTML = [
    ['绑定版本', state.version],
    ['点位总数', state.total.toLocaleString()],
    ['索引构建耗时', state.buildMs.toFixed(0) + ' ms'],
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
async function boot() {
  loadmsg.textContent = '下载 gd_points.json …';
  bar.style.width = '20%';
  const t0 = performance.now();
  const res = await fetch('./data/gd_points.json');
  const json = await res.json();
  const pts = json.points;
  loadmsg.textContent = '投喂给 MoonBit 索引 …';
  bar.style.width = '55%';

  // 平铺 [lng, lat, cityIdx]，MoonBit 侧经 extern "js" 逐点读取
  const data = new Float64Array(pts.length * 3);
  for (let i = 0; i < pts.length; i++) {
    data[i * 3] = pts[i][0];
    data[i * 3 + 1] = pts[i][1];
    data[i * 3 + 2] = pts[i][2];
  }
  globalThis.__SC_DATA = data;

  await new Promise(r => setTimeout(r, 30)); // 让 loading 文案先渲染
  state.version = sc_version();
  state.total = sc_build_index(pts.length);
  state.buildMs = performance.now() - t0;
  bar.style.width = '100%';
  renderStats();

  document.getElementById('loading').style.display = 'none';
  redraw();
}

// ---------- 视口查询与渲染 ----------
function redraw() {
  const z = Math.min(16, Math.max(0, Math.round(map.getZoom())));
  const b = map.getBounds();
  const t0 = performance.now();
  const feats = JSON.parse(sc_clusters(b.getWest(), b.getSouth(), b.getEast(), b.getNorth(), z));
  state.queryMs = performance.now() - t0;

  layer.clearLayers();
  let clusters = 0, points = 0, maxCount = 0;
  for (const f of feats) {
    if (f.cluster) {
      clusters++;
      if (f.count > maxCount) maxCount = f.count;
      const s = bucket(f.count);
      const d = s.r * 2;
      const fs = Math.max(10, Math.round(s.r * 0.62));
      L.marker([f.lat, f.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="cluster" style="width:' + d + 'px;height:' + d + 'px;background:' + s.bg + ';color:' + s.fg + ';font-size:' + fs + 'px">' + (f.count >= 10000 ? Math.round(f.count / 1000) + 'k' : f.count) + '</div>',
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

map.on('moveend', redraw);
map.on('zoomend', redraw);
boot().catch(err => {
  loadmsg.textContent = '加载失败：' + err.message + '（请确认已通过本地静态服务器访问，而非 file://）';
});
