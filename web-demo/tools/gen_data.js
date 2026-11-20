// 生成广东省六城市合成聚簇点数据（模拟接口返回的本地 JSON）
// 用法: node tools/gen_data.js
const fs = require('fs');
const path = require('path');

// [名称索引, 中心经度, 中心纬度, 点数, 高斯 sigma(度)]
const CITIES = [
  [0, 113.2644, 23.1291, 28000, 0.100], // 广州
  [1, 113.8830, 22.5530, 24000, 0.075], // 深圳
  [2, 113.7518, 23.0207, 14000, 0.055], // 东莞
  [3, 113.1228, 23.0298, 13000, 0.060], // 佛山
  [4, 113.3926, 22.5170, 11000, 0.050], // 中山
  [5, 113.5767, 22.2707, 10000, 0.050], // 珠海
];

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const points = [];
for (const [ci, lng0, lat0, count, sigma] of CITIES) {
  for (let i = 0; i < count; i++) {
    const lng = +(lng0 + gauss() * sigma).toFixed(5);
    const lat = +(lat0 + gauss() * sigma * 0.8).toFixed(5);
    points.push([lng, lat, ci]);
  }
}

const out = {
  meta: {
    name: '广东省六城市合成聚簇数据（模拟接口）',
    cities: ['广州', '深圳', '东莞', '佛山', '中山', '珠海'],
    count: points.length,
  },
  points,
};

const dest = path.join(__dirname, '..', 'data');
fs.mkdirSync(dest, { recursive: true });
fs.writeFileSync(path.join(dest, 'gd_points.json'), JSON.stringify(out));
console.log('generated', points.length, 'points ->', path.join(dest, 'gd_points.json'));
