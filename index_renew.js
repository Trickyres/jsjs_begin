/**
 * ==============================
 * 三、JavaScript 交互逻辑区
 * ==============================
 * JavaScript 负责“能不能点、点了以后发生什么”。
 *
 * 本文件的运行逻辑可以简单理解为：
 * 1. 先准备数据：分类 CATEGORIES、点位 POINTS、电话 CONTACTS。
 * 2. 页面打开时执行 init()。
 * 3. init() 根据数据自动生成快捷入口、筛选按钮、地图点位、列表卡片和电话卡片。
 * 4. 用户点击按钮时，调用 setView() 切换页面，或调用 renderRealMap()/renderList() 刷新内容。
 *
 * 使用说明：
 * 1. 直接把本文件保存为 index.html，双击即可打开。
 * 2. 下方 POINTS 为点位数据，可按实际点位修改名称、地址、电话、经纬度等。
 * 3. 地图优先使用 POINTS 中的 lng/lat；没有坐标时会通过高德地址解析自动补齐。
 * 4. 高德 Key 与安全配置统一放在 amap.config.js 中。
 */

/*
  CATEGORIES：点位分类配置。

  key   ：程序内部使用的分类代码，不建议随便改。
  label ：筛选按钮上显示的短名称，例如“便民”。
  full  ：卡片上显示的完整名称，例如“便民服务”。
  icon  ：首页快捷入口和分类图标。
  color ：这一类点位的主题颜色。
*/
const CATEGORIES = [
  { key: 'all', label: '全部', icon: '◎', color: '#f2672a' },
  { key: 'service', label: '便民', full: '便民服务', icon: '👥', color: '#f2672a' },
  { key: 'shopping', label: '购物', full: '生活购物', icon: '🛒', color: '#f59d32' },
  { key: 'leisure', label: '休闲', full: '休闲游玩', icon: '🌳', color: '#78aa63' },
  { key: 'memory', label: '记忆', full: '多稼记忆', icon: '🏛️', color: '#a85e48' }
];

/*
  POINTS：最重要的点位数据。

  后续你真正做“稼享指南”时，主要就是改这里。
  每一个 { ... } 代表一个点位。

  字段说明：
  id       ：点位唯一编号，英文即可，不能重复。
  name     ：点位名称。
  category ：点位分类，要对应 CATEGORIES 里的 key，例如 service / shopping / leisure / memory。
  icon     ：点位图标，可以用 emoji，也可以后续换成图片图标。
  intro    ：一句话简介。
  address  ：地址。
  phone    ：电话，没有电话可以写“无”。
  hours    ：开放时间或服务时间。
  lng/lat  ：人工确认的高德 GCJ-02 坐标；未确认时保持 null。
  baiduLng/baiduLat：人工确认的百度 BD-09 坐标；未确认时保持 null。
  x/y      ：示意地图上的位置，范围 0-100；x 越大越靠右，y 越大越靠下。
*/

/*
  POINTS：全站唯一的点位数据源。
  地图热点、列表搜索、详情卡片和高德导航都从这里读取。
  lng/lat：高德 GCJ-02 坐标。人工确认后把 null 换成数字；没有时才按 address 自动解析并缓存。
  baiduLng/baiduLat：百度 BD-09 坐标预留字段，不可直接复制高德坐标。
  x/y 与 hitSize 仅作为旧版图片地图的数据保留，不再控制真实地图的位置。
*/
const POINTS = [
  {
    "id": "swimming-pool",
    "name": "XYGYM馨园健身(馨园健身游泳会所)",
    "address": "上海市黄浦区南仓街118号馨园小区5号楼对面花园中心",
    "lng": 121.500093,
    "lat": 31.212716,
    "baiduLng": null,
    "baiduLat": null,
    "category": "leisure",
    "x": 33.2,
    "y": 47.3,
    "hitSize": 26
  },
  {
    "id": "employment",
    "name": "小东门街道就业服务站",
    "address": "上海市黄浦区中华路518弄16号",
    "lng": 121.498706,
    "lat": 31.217481,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 24.6,
    "y": 11.7,
    "hitSize": 28
  },
  {
    "id": "xiaonanmen-metro",
    "name": "小南门地铁站",
    "address": "上海市黄浦区中华路/王家码头路",
    "lng": 121.498421,
    "lat": 31.216756,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 21.1,
    "y": 17.9,
    "hitSize": 34
  },
  {
    "id": "jingzhonglou",
    "name": "小南门警钟楼",
    "address": "上海市黄浦区中华路579号(小南门地铁站2号口步行60米)",
    "lng": 121.49804,
    "lat": 31.215929,
    "baiduLng": null,
    "baiduLat": null,
    "category": "memory",
    "x": 16.8,
    "y": 25.6,
    "hitSize": 30
  },
  {
    "id": "police",
    "name": "小东门派出所",
    "address": "上海市黄浦区新码头街66号",
    "lng": 121.506341,
    "lat": 31.218662,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 70.3,
    "y": 6.3,
    "hitSize": 34
  },
  {
    "id": "sports-center",
    "name": "外滩金融都市运动中心(中山南路店)",
    "address": "上海市黄浦区中山南路609号B1层",
    "lng": 121.506148,
    "lat": 31.216467,
    "baiduLng": null,
    "baiduLat": null,
    "category": "leisure",
    "x": 71.3,
    "y": 20.5,
    "hitSize": 28
  },
  {
    "id": "huangpu-riverside",
    "name": "黄浦滨江南外滩段",
    "address": "上海市黄浦区复兴东路至南浦大桥之间的外马路沿江一侧",
    "lng": 121.507671,
    "lat": 31.217172,
    "baiduLng": null,
    "baiduLat": null,
    "category": "leisure",
    "x": 81.1,
    "y": 17.5,
    "hitSize": 30
  },
  {
    "id": "shanghai-bank",
    "name": "上海银行(营业部)",
    "address": "上海市黄浦区中山南路688号",
    "lng": 121.503654,
    "lat": 31.215876,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 59.2,
    "y": 22.8,
    "hitSize": 28
  },
  {
    "id": "boc",
    "name": "中国银行(南外滩支行)",
    "address": "上海市黄浦区中山南路800弄20号2层L208a、L208b、L209号",
    "lng": 121.505378,
    "lat": 31.214866,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 65.7,
    "y": 31.2,
    "hitSize": 22
  },
  {
    "id": "bund-trendy",
    "name": "绿地·外滩潮方",
    "address": "上海市黄浦区中山南路800弄1号",
    "lng": 121.505606,
    "lat": 31.214584,
    "baiduLng": null,
    "baiduLat": null,
    "category": "shopping",
    "x": 70.4,
    "y": 34.6,
    "hitSize": 22
  },
  {
    "id": "dongjiadu-ferry",
    "name": "董家渡渡口（轮渡站）",
    "address": "上海市黄浦区外马路737号",
    "lng": 121.508069,
    "lat": 31.21487,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 84.3,
    "y": 29.1,
    "hitSize": 32
  },
  {
    "id": "dongjiadu-flower-bridge",
    "name": "董家渡路花桥",
    "address": "上海市黄浦区外滩潮方至外马路沿江一侧",
    "lng": 121.506944,
    "lat": 31.214494,
    "baiduLng": null,
    "baiduLat": null,
    "category": "leisure",
    "x": 78.8,
    "y": 37.6,
    "hitSize": 34
  },
  {
    "id": "church",
    "name": "董家渡天主堂",
    "address": "上海市黄浦区董家渡路185号",
    "lng": 121.504369,
    "lat": 31.214324,
    "baiduLng": null,
    "baiduLat": null,
    "category": "memory",
    "x": 59.6,
    "y": 34.4,
    "hitSize": 26
  },
  {
    "id": "duojia-committee",
    "name": "多稼居民委员会",
    "address": "上海市黄浦区会馆街66号(多稼居委会党群服务站）",
    "lng": 121.50277,
    "lat": 31.213552,
    "baiduLng": null,
    "baiduLat": null,
    "description": "社区咨询、活动报名、便民联系与党群服务。",
    "image": "assets/points/duojia-committee.jpg",
    "imageAlt": "多稼居民委员会实景",
    "imageCaption": "多稼居民委员会 · 会馆街66号",
    "category": "service",
    "x": 49.4,
    "y": 41.7,
    "hitSize": 24
  },
  {
    "id": "merchants-house",
    "name": "商船会馆",
    "address": "上海市黄浦区会馆街38号",
    "lng": 121.504401,
    "lat": 31.212942,
    "baiduLng": null,
    "baiduLat": null,
    "category": "memory",
    "x": 57,
    "y": 43.9,
    "hitSize": 28
  },
  {
    "id": "ccb",
    "name": "中国建设银行(上海董家渡路支行)",
    "address": "上海市黄浦区董家渡路182号、184号、186号、188号1层",
    "lng": 121.503825,
    "lat": 31.214175,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 53.2,
    "y": 38.4,
    "hitSize": 24
  },
  {
    "id": "cmb",
    "name": "招商银行(董家渡支行)",
    "address": "上海市黄浦区董家渡路208号1层",
    "lng": 121.503057,
    "lat": 31.214417,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 53.2,
    "y": 38.4,
    "hitSize": 24
  },
  {
    "id": "spdb",
    "name": "浦发银行(董家渡路支行)",
    "address": "上海市黄浦区董家渡路208号1层",
    "lng": 121.502667,
    "lat": 31.214507,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 53.2,
    "y": 38.4,
    "hitSize": 24
  },
  {
    "id": "donghao-lansheng",
    "name": "东浩兰生会展集团股份有限公司",
    "address": "上海市黄浦区董家渡路200号董家渡外滩中心T3栋47楼",
    "lng": 121.502624,
    "lat": 31.21416,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 53.2,
    "y": 38.4,
    "hitSize": 24
  },
  {
    "id": "guotai-haitong",
    "name": "国泰海通外滩金融广场",
    "address": "上海市黄浦区中山南路888号",
    "lng": 121.505166,
    "lat": 31.213564,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 66.6,
    "y": 40.7,
    "hitSize": 26
  },
  {
    "id": "guohai-sec",
    "name": "国海证券(上海黄浦区中山南路营业部)",
    "address": "上海市黄浦区中山南路988号",
    "lng": 121.505454,
    "lat": 31.211917,
    "baiduLng": null,
    "baiduLat": null,
    "category": "shopping",
    "x": 63.3,
    "y": 47,
    "hitSize": 24
  },
  {
    "id": "time-plastic",
    "name": "上海时光整形外科医院（外滩旗舰院）",
    "address": "上海市黄浦区中山南路935号",
    "lng": 121.506064,
    "lat": 31.2122,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 70.3,
    "y": 50.4,
    "hitSize": 22
  },
  {
    "id": "qiangsheng",
    "name": "上海市强生职工医院",
    "address": "上海市黄浦区外马路984号",
    "lng": 121.506814,
    "lat": 31.211809,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 75.8,
    "y": 52.4,
    "hitSize": 22
  },
  {
    "id": "health-center",
    "name": "小东门街道社区卫生服务中心",
    "address": "上海市黄浦区陆家浜路525号",
    "lng": 121.497989,
    "lat": 31.21231,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 19,
    "y": 50.7,
    "hitSize": 26
  },
  {
    "id": "fabric-market",
    "name": "南外滩轻纺面料市场",
    "address": "上海市黄浦区陆家浜路399号",
    "lng": 121.499716,
    "lat": 31.211674,
    "baiduLng": null,
    "baiduLat": null,
    "category": "shopping",
    "x": 30.2,
    "y": 52.5,
    "hitSize": 28
  },
  {
    "id": "icbc",
    "name": "中国工商银行(南市支行)",
    "address": "上海市黄浦区陆家浜路275号",
    "lng": 121.501099,
    "lat": 31.210866,
    "baiduLng": null,
    "baiduLat": null,
    "category": "shopping",
    "x": 38.4,
    "y": 59.4,
    "hitSize": 26
  },
  {
    "id": "gotterwell",
    "name": "上海歌特维康门诊部",
    "address": "上海市黄浦区中山南路1228号",
    "lng": 121.501767,
    "lat": 31.210323,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 43,
    "y": 64.3,
    "hitSize": 28
  },
  {
    "id": "nanpu-metro",
    "name": "南浦大桥地铁站",
    "address": "上海市黄浦区中山南路/国货路",
    "lng": 121.499725,
    "lat": 31.208504,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 32.1,
    "y": 68.5,
    "hitSize": 34
  },
  {
    "id": "sinopec",
    "name": "中国石化齐爱加油站",
    "address": "上海市黄浦区中山南路1133号",
    "lng": 121.503521,
    "lat": 31.209978,
    "baiduLng": null,
    "baiduLat": null,
    "category": "shopping",
    "x": 53.5,
    "y": 65,
    "hitSize": 26
  },
  {
    "id": "toilet",
    "name": "南浦大桥附近公共厕所",
    "address": "上海市黄浦区南外滩环卫大楼油车码头街附近",
    "lng": 121.503037,
    "lat": 31.209229,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 49.6,
    "y": 70.8,
    "hitSize": 30
  },
  {
    "id": "workers-gym",
    "name": "上海市总工会黄浦区工人体育馆",
    "address": "上海市黄浦区外马路1288号",
    "lng": 121.503732,
    "lat": 31.207728,
    "baiduLng": null,
    "baiduLat": null,
    "category": "leisure",
    "x": 54.2,
    "y": 78.5,
    "hitSize": 30
  },
  {
    "id": "dongjiadu-road-ferry",
    "name": "陆家浜渡口（轮渡站）",
    "address": "上海市黄浦区外马路1279号",
    "lng": 121.50427,
    "lat": 31.207623,
    "baiduLng": null,
    "baiduLat": null,
    "category": "service",
    "x": 62.1,
    "y": 79.4,
    "hitSize": 30
  },
  {
    "id": "nanpu-bridge",
    "name": "南浦大桥（浦西引桥）",
    "address": "上海市黄浦区中山南路/陆家浜路",
    "lng": 121.501071,
    "lat": 31.209071,
    "baiduLng": null,
    "baiduLat": null,
    "category": "leisure",
    "x": 54.5,
    "y": 91.4,
    "hitSize": 34
  }
].map(point => ({
  icon: CATEGORIES.find(category => category.key === point.category)?.icon || '⌖',
  intro: '提供地点位置、地址与导航信息。',
  phone: '无',
  hours: '开放或服务时间请以现场公告为准',
  ...point
}));

/*
  旧版图片地图校准开关（真实高德地图不再使用）：
  true  = 显示拖动、坐标和点击范围工具；
  false = 恢复普通访客看到的地图。
  校准完成并把数据复制回 POINTS 后，请改成 false。
*/
const MAP_CALIBRATION_MODE = false;
const MAP_CALIBRATION_STORAGE_KEY = 'jiaxiang-map-calibration-v1';
let calibrationSelectedId = POINTS[0]?.id || null;

/*
  真实高德地图配置与运行状态。
  正式地图的 Key / 安全密钥请填写在 amap.config.js，不要写进 POINTS。
*/
const DUOJIA_CENTER_POINT_ID = 'duojia-committee';
// 只控制“一键导航”打开哪家地图；页面内嵌底图仍使用高德。
const NAVIGATION_MAP_PROVIDER = 'amap'; // 可改为 'baidu'
const AMAP_FALLBACK_CENTER = [121.5004, 31.2111];
// v3 会忽略此前可能已经错位的 v2 地址解析缓存。
const AMAP_GEOCODE_STORAGE_KEY = 'jiaxiang-amap-geocodes-v3';
const AMAP_LOADER_URL = 'https://webapi.amap.com/loader.js';
const amapRuntime = {
  api: null,
  map: null,
  markers: new Map(),
  loadPromise: null,
  coordinatesReady: false,
  fallbackCount: 0
};

/*
  CONTACTS：便民电话页的数据。
  如果只想增加、删除或修改电话号码，改这里即可。
*/
const CONTACTS = [
  { name: '多稼居民委员会', desc: '社区咨询、活动报名、便民联系', phone: '021-3376 6298', icon: '👥', color: '#f2672a' },
  { name: '社区卫生服务中心', desc: '基础医疗、健康咨询、慢病随访', phone: '021-6377 0202', icon: '✚', color: '#5fae78' },
  { name: '物业服务电话', desc: '报修、门禁、公共区域维护', phone: '021-8888 8888', icon: '🛠️', color: '#5b91ca' },
  { name: '街道服务热线', desc: '综合咨询与为民服务联系', phone: '021-6332 5638', icon: '☎', color: '#a85e48' }
];

/*
  state：页面当前状态。

  view       ：当前显示哪个页面，home/map/list/phone。
  category   ：当前筛选的分类，all 表示全部。
  selectedId ：地图页当前选中的点位 id。
  search     ：列表页搜索框里的关键词。

  你可以把 state 理解为“网页当前记住的状态”。
*/
const state = {
  view: 'home',
  category: 'all',
  selectedId: 'duojia-committee',
  search: '',
  mapReturnView: 'home',
  listReturnView: 'home'
};

/*
  下面两个是简写工具函数：
  $('选择器')  ：找到第一个匹配的元素。
  $$('选择器') ：找到所有匹配的元素，并转成数组。

  例如：
  $('#toast') 相当于 document.querySelector('#toast')。
*/
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// 根据分类 key 找到对应分类信息，例如 service -> 便民服务。
function getCategory(key) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0];
}

// 根据点位 id 找到对应点位信息，例如 duojia-jwh -> 多稼居民委员会。
function getPoint(id) {
  return POINTS.find(p => p.id === id) || POINTS[0];
}

/*
  一键导航函数。
  点击“导航前往”后，根据 NAVIGATION_MAP_PROVIDER 拼接高德或百度地图 URI。
  默认使用高德；以后可把配置改成 baidu。
*/
function navigateToPoint(point) {
  if (!point) return;
  showToast(`正在打开${point.name}`);
  window.location.href = NAVIGATION_MAP_PROVIDER === 'baidu'
    ? buildBaiduMapUrl(point)
    : buildAmapUrl(point);
}

// 页面底部黑色提示条，例如点击“我的”时弹出的说明。
function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

/*
  切换页面函数。
  例如 setView('map') 就会显示地图页，隐藏其他页面。
  核心原理：给目标 section 添加 active 类，其他 section 去掉 active 类。
*/
function setView(view) {
  const enteringMap = view === 'map' && state.view !== 'map';
  state.view = view;
  const activeNavView = ['route', 'guide'].includes(view) ? 'home' : view;
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.go === activeNavView));
  if (view === 'map') renderRealMap({ resetCenter: enteringMap });
  if (view === 'list') renderList();
  if (view === 'phone') renderContacts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/*
  切换分类筛选。
  category 可以是 all/service/shopping/leisure/memory。
  地图页和列表页都会用到这个函数。
*/
function setCategory(category, targetView = state.view) {
  state.category = category;
  if (targetView === 'map') renderRealMap();
  if (targetView === 'list') renderList();
}

/*
  渲染首页四个快捷入口。
  这些入口根据 CATEGORIES 自动生成，所以你改 CATEGORIES 后，这里会自动跟着变。
*/
function renderQuickEntries() {
  const quicks = CATEGORIES.filter(c => c.key !== 'all');
  $('#quickEntries').innerHTML = quicks.map(c => `
    <button class="quick-item" data-quick="${c.key}">
      <span class="quick-icon" style="background:${c.color}">${c.icon}</span>
      <span class="quick-label">${c.full}</span>
    </button>
  `).join('');

  $$('#quickEntries .quick-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.quick;
      state.listReturnView = 'home';
      setView('list');
    });
  });
}

/*
  渲染分类筛选按钮。
  地图页和列表页各有一组筛选按钮，这个函数会同时更新两处。
*/
function renderFilterRows() {
  const html = CATEGORIES.map(c => `<button class="pill ${state.category === c.key ? 'active' : ''}" data-category="${c.key}">${c.label}</button>`).join('');
  $('#mapFilters').innerHTML = html;
  $('#listFilters').innerHTML = html;

  $$('#mapFilters .pill').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.category, 'map')));
  $$('#listFilters .pill').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.category, 'list')));
}

/*
  根据“当前分类”和“搜索关键词”过滤点位。
  列表页搜索时主要靠这个函数返回符合条件的点位。
*/
function filteredPoints() {
  const keyword = state.search.trim().toLowerCase();
  return POINTS.filter(p => {
    const categoryOk = state.category === 'all' || p.category === state.category;
    const text = `${p.name} ${p.intro} ${p.address} ${getCategory(p.category).full}`.toLowerCase();
    const keywordOk = !keyword || text.includes(keyword);
    return categoryOk && keywordOk;
  });
}

/*
  渲染点位列表页。
  根据当前分类和搜索关键词，生成一张张点位卡片。
*/
function renderList() {
  renderFilterRows();
  const titleMap = {
    all: '全部点位',
    service: '便民服务',
    shopping: '生活购物',
    leisure: '休闲游玩',
    memory: '多稼记忆'
  };
  $('#listTitle').textContent = titleMap[state.category] || '点位列表';

  const list = $('#placeList');
  const points = filteredPoints();
  if (!points.length) {
    list.innerHTML = `<div class="empty">没有找到相关点位。可以换个关键词，或点击上方分类重新筛选。</div>`;
    return;
  }
  list.innerHTML = points.map(point => {
    const category = getCategory(point.category);
    return `
      <article class="place-card">
        <div class="place-icon" style="background:${category.color}">${point.icon}</div>
        <div class="place-main">
          <h3>${point.name}<span class="tag ${point.category}">${category.full || category.label}</span></h3>
          <p>${point.intro}</p>
          <div class="place-lines">
            <span>⌖ ${point.address}</span>
            <span>◷ ${point.hours}</span>
          </div>
          <div class="place-actions">
            <button class="btn btn-mini btn-ghost" data-view-map="${point.id}">⌖ 查看地图</button>
            <button class="btn btn-mini btn-primary" data-nav="${point.id}">➤ 导航前往</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  $$('[data-nav]', list).forEach(btn => btn.addEventListener('click', () => navigateToPoint(getPoint(btn.dataset.nav))));
  $$('[data-view-map]', list).forEach(btn => btn.addEventListener('click', () => {
    state.mapReturnView = 'list';
    state.selectedId = btn.dataset.viewMap;
    setView('map');
  }));
}

/*
  渲染便民电话页。
  根据 CONTACTS 数据生成电话卡片。
*/
function renderContacts() {
  $('#contactList').innerHTML = CONTACTS.map(c => `
    <article class="contact-card">
      <div class="contact-icon" style="background:${c.color}">${c.icon}</div>
      <div>
        <h3>${c.name}</h3>
        <p>${c.desc}</p>
      </div>
      <a class="btn btn-primary btn-mini" href="tel:${c.phone.replace(/\s/g, '')}">拨打</a>
    </article>
  `).join('');
}

/*
  绑定点击事件。
  简单说，就是告诉网页：用户点击某个按钮后，应该执行什么动作。

  例如：
  - 点击底部“地图” -> setView('map')
  - 点击搜索框输入 -> renderList()
  - 点击说明按钮 -> showToast()
*/

function openBinjiangRoute() {
  state.selectedId = 'huangpu-riverside';
  setView('route');
}

function openBinjiangMap(shouldAnnounce = false) {
  state.mapReturnView = 'route';
  state.category = 'leisure';
  state.selectedId = 'huangpu-riverside';
  setView('map');
  if (shouldAnnounce) showToast('已打开滨江散步路线起点，可继续点击一键导航。');
}

function openGuideCategory(category) {
  state.category = category;
  state.search = '';
  state.listReturnView = 'guide';
  $('#searchInput').value = '';
  setView('list');
}

const GUIDE_GALLERY_IMAGES = [
  { src: 'assets/guide/guide-page-01.webp', title: '稼享指南 · 正面', alt: '稼享指南正面：欢迎到多稼生活圈地图' },
  { src: 'assets/guide/guide-page-02.webp', title: '稼享指南 · 反面', alt: '稼享指南反面：社区记忆与指南封面' }
];

const guideGalleryState = {
  index: 0,
  scale: 1,
  x: 0,
  y: 0,
  pointers: new Map(),
  dragStartX: 0,
  dragStartY: 0,
  dragBaseX: 0,
  dragBaseY: 0,
  swipeX: 0,
  pinchDistance: 0,
  pinchScale: 1,
  pinchMidX: 0,
  pinchMidY: 0,
  pinchBaseX: 0,
  pinchBaseY: 0,
  returnFocus: null
};

function clampGuideGalleryValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampGuideGalleryPan() {
  const stage = $('#guideLightboxStage');
  const image = $('#guideLightboxImage');
  if (!stage || !image) return;
  const maxX = Math.max(0, (image.clientWidth * guideGalleryState.scale - stage.clientWidth) / 2);
  const maxY = Math.max(0, (image.clientHeight * guideGalleryState.scale - stage.clientHeight) / 2);
  guideGalleryState.x = clampGuideGalleryValue(guideGalleryState.x, -maxX, maxX);
  guideGalleryState.y = clampGuideGalleryValue(guideGalleryState.y, -maxY, maxY);
}

function renderGuideGallery(animate = false) {
  const stage = $('#guideLightboxStage');
  const image = $('#guideLightboxImage');
  if (!stage || !image) return;
  if (guideGalleryState.scale <= 1) {
    guideGalleryState.scale = 1;
    guideGalleryState.x = 0;
    guideGalleryState.y = 0;
  }
  clampGuideGalleryPan();
  stage.classList.toggle('is-animating', animate);
  image.style.transform = `translate3d(${guideGalleryState.x}px, ${guideGalleryState.y}px, 0) scale(${guideGalleryState.scale})`;
  if (animate) setTimeout(() => stage.classList.remove('is-animating'), 220);
}

function resetGuideGallery(animate = true) {
  guideGalleryState.scale = 1;
  guideGalleryState.x = 0;
  guideGalleryState.y = 0;
  guideGalleryState.swipeX = 0;
  renderGuideGallery(animate);
}

function showGuideGalleryImage(index) {
  const image = $('#guideLightboxImage');
  const title = $('#guideLightboxTitle');
  const counter = $('#guideLightboxCounter');
  if (!image || !title || !counter) return;
  const imageCount = GUIDE_GALLERY_IMAGES.length;
  guideGalleryState.index = (index + imageCount) % imageCount;
  const current = GUIDE_GALLERY_IMAGES[guideGalleryState.index];
  if (!image.src.endsWith(current.src)) image.src = current.src;
  image.alt = current.alt;
  title.textContent = current.title;
  counter.textContent = `${guideGalleryState.index + 1} / ${imageCount}`;
  $$('[data-gallery-dot]').forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === guideGalleryState.index));
  resetGuideGallery(true);
}

function openGuideGallery(index, opener) {
  const lightbox = $('#guideLightbox');
  if (!lightbox) return;
  guideGalleryState.returnFocus = opener || document.activeElement;
  lightbox.hidden = false;
  document.body.classList.add('guide-lightbox-open');
  showGuideGalleryImage(index);
  requestAnimationFrame(() => lightbox.classList.add('is-open'));
  $('.guide-lightbox-close', lightbox)?.focus();
}

function closeGuideGallery() {
  const lightbox = $('#guideLightbox');
  if (!lightbox || lightbox.hidden) return;
  lightbox.classList.remove('is-open');
  document.body.classList.remove('guide-lightbox-open');
  setTimeout(() => {
    if (!lightbox.classList.contains('is-open')) lightbox.hidden = true;
  }, 210);
  if (guideGalleryState.returnFocus?.focus) guideGalleryState.returnFocus.focus();
}

function changeGuideGalleryScale(nextScale, animate = true) {
  guideGalleryState.scale = clampGuideGalleryValue(nextScale, 1, 4);
  renderGuideGallery(animate);
}

function getGuideGalleryPinchData() {
  const points = Array.from(guideGalleryState.pointers.values());
  if (points.length < 2) return null;
  const [first, second] = points;
  return {
    distance: Math.hypot(second.x - first.x, second.y - first.y),
    midX: (first.x + second.x) / 2,
    midY: (first.y + second.y) / 2
  };
}

function setupGuideGallery() {
  const lightbox = $('#guideLightbox');
  const stage = $('#guideLightboxStage');
  const image = $('#guideLightboxImage');
  if (!lightbox || !stage || !image) return;

  $$('[data-gallery-page]').forEach(button => {
    button.addEventListener('click', () => openGuideGallery(Number(button.dataset.galleryPage), button));
  });
  $$('[data-gallery-close]').forEach(button => button.addEventListener('click', closeGuideGallery));
  $$('[data-gallery-dot]').forEach(button => button.addEventListener('click', () => showGuideGalleryImage(Number(button.dataset.galleryDot))));
  $$('[data-gallery-action]').forEach(button => {
    button.addEventListener('click', () => showGuideGalleryImage(
      guideGalleryState.index + (button.dataset.galleryAction === 'next' ? 1 : -1)
    ));
  });

  stage.addEventListener('wheel', event => {
    event.preventDefault();
    changeGuideGalleryScale(guideGalleryState.scale + (event.deltaY < 0 ? .25 : -.25), false);
  }, { passive: false });
  stage.addEventListener('dblclick', () => changeGuideGalleryScale(guideGalleryState.scale > 1 ? 1 : 2, true));

  document.addEventListener('keydown', event => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeGuideGallery();
    if (event.key === 'ArrowLeft') showGuideGalleryImage(guideGalleryState.index - 1);
    if (event.key === 'ArrowRight') showGuideGalleryImage(guideGalleryState.index + 1);
    if (event.key === '+' || event.key === '=') changeGuideGalleryScale(guideGalleryState.scale + .35);
    if (event.key === '-') changeGuideGalleryScale(guideGalleryState.scale - .35);
    if (event.key === '0') resetGuideGallery(true);
  });

  stage.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;
    stage.setPointerCapture(event.pointerId);
    guideGalleryState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (guideGalleryState.pointers.size === 1) {
      guideGalleryState.dragStartX = event.clientX;
      guideGalleryState.dragStartY = event.clientY;
      guideGalleryState.dragBaseX = guideGalleryState.x;
      guideGalleryState.dragBaseY = guideGalleryState.y;
      guideGalleryState.swipeX = 0;
    } else if (guideGalleryState.pointers.size === 2) {
      const pinch = getGuideGalleryPinchData();
      guideGalleryState.pinchDistance = pinch.distance;
      guideGalleryState.pinchScale = guideGalleryState.scale;
      guideGalleryState.pinchMidX = pinch.midX;
      guideGalleryState.pinchMidY = pinch.midY;
      guideGalleryState.pinchBaseX = guideGalleryState.x;
      guideGalleryState.pinchBaseY = guideGalleryState.y;
    }
  });

  stage.addEventListener('pointermove', event => {
    if (!guideGalleryState.pointers.has(event.pointerId)) return;
    guideGalleryState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (guideGalleryState.pointers.size >= 2) {
      const pinch = getGuideGalleryPinchData();
      if (!pinch || !guideGalleryState.pinchDistance) return;
      guideGalleryState.scale = clampGuideGalleryValue(
        guideGalleryState.pinchScale * (pinch.distance / guideGalleryState.pinchDistance),
        1,
        4
      );
      guideGalleryState.x = guideGalleryState.pinchBaseX + pinch.midX - guideGalleryState.pinchMidX;
      guideGalleryState.y = guideGalleryState.pinchBaseY + pinch.midY - guideGalleryState.pinchMidY;
      renderGuideGallery(false);
      return;
    }
    if (guideGalleryState.scale > 1) {
      guideGalleryState.x = guideGalleryState.dragBaseX + event.clientX - guideGalleryState.dragStartX;
      guideGalleryState.y = guideGalleryState.dragBaseY + event.clientY - guideGalleryState.dragStartY;
      renderGuideGallery(false);
    } else {
      guideGalleryState.swipeX = event.clientX - guideGalleryState.dragStartX;
    }
  });

  const finishPointer = (event, allowSwipe) => {
    const wasSinglePointer = guideGalleryState.pointers.size === 1;
    guideGalleryState.pointers.delete(event.pointerId);
    if (allowSwipe && wasSinglePointer && guideGalleryState.scale === 1 && Math.abs(guideGalleryState.swipeX) >= 50) {
      showGuideGalleryImage(guideGalleryState.index + (guideGalleryState.swipeX < 0 ? 1 : -1));
    }
    if (guideGalleryState.pointers.size === 1) {
      const remaining = Array.from(guideGalleryState.pointers.values())[0];
      guideGalleryState.dragStartX = remaining.x;
      guideGalleryState.dragStartY = remaining.y;
      guideGalleryState.dragBaseX = guideGalleryState.x;
      guideGalleryState.dragBaseY = guideGalleryState.y;
    }
    guideGalleryState.swipeX = 0;
  };

  stage.addEventListener('pointerup', event => finishPointer(event, true));
  stage.addEventListener('pointercancel', event => finishPointer(event, false));
  image.addEventListener('load', () => renderGuideGallery(false));
}

function setupActivityPage() {
  const feature = $('#activityFeature');
  const video = $('#activityFeatureVideo');
  const title = $('#activityFeatureTitle');
  const albumLightbox = $('#activityAlbumLightbox');
  const albumTitle = $('#activityAlbumTitle');
  const albumDescription = $('#activityAlbumDescription');
  const albumGrid = $('#activityAlbumGrid');
  const albumEmpty = $('#activityAlbumEmpty');
  const lightbox = $('#activityPhotoLightbox');
  const lightboxImage = $('#activityPhotoImage');
  const lightboxTitle = $('#activityPhotoTitle');
  if (!feature || !video || !title || !albumLightbox || !albumTitle || !albumDescription
    || !albumGrid || !albumEmpty || !lightbox || !lightboxImage || !lightboxTitle) return;

  const albums = window.ACTIVITY_ALBUMS || {};
  let albumOpener = null;
  let photoOpener = null;
  let failedVideoSrc = '';

  const resetFeatureVideo = () => {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden = true;
    feature.classList.remove('is-playing');
  };

  const reportMissingVideo = src => {
    if (failedVideoSrc === src) return;
    failedVideoSrc = src;
    resetFeatureVideo();
    showToast(`视频文件尚未放入：${src}`);
    setTimeout(() => { failedVideoSrc = ''; }, 1200);
  };

  const playActivityVideo = button => {
    const src = button.dataset.activityVideo;
    const nextTitle = button.dataset.activityTitle || '多稼社区活动回顾';
    if (!src) return;

    title.textContent = nextTitle;
    video.src = src;
    video.hidden = false;
    feature.classList.add('is-playing');
    const playRequest = video.play();
    if (playRequest) playRequest.catch(() => reportMissingVideo(src));

    if (!button.classList.contains('activity-play-btn')) {
      feature.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  $$('[data-activity-video]').forEach(button => {
    button.addEventListener('click', () => playActivityVideo(button));
  });

  video.addEventListener('error', () => {
    const src = video.getAttribute('src');
    if (src) reportMissingVideo(src);
  });
  video.addEventListener('ended', resetFeatureVideo);

  const getAlbumPhotos = album => {
    const folder = String(album.folder || '').replace(/\/$/, '');
    const configuredFiles = Array.isArray(album.files) ? album.files : [];
    if (configuredFiles.length) {
      return configuredFiles.map((item, index) => {
        const photo = typeof item === 'string' ? { file: item } : item;
        const filename = photo.file || '';
        return {
          src: photo.src || `${folder}/${filename}`,
          alt: photo.alt || `${album.title || '活动相册'}第 ${index + 1} 张照片`,
          caption: photo.caption || `${album.title || '活动相册'} · ${index + 1}`
        };
      }).filter(photo => photo.src && !photo.src.endsWith('/'));
    }
    return Array.isArray(album.previewPhotos) ? album.previewPhotos : [];
  };

  const openPhoto = (photo, opener) => {
    if (!photo?.src) return;
    photoOpener = opener || null;
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt || photo.caption || '社区活动照片';
    lightboxTitle.textContent = photo.caption || photo.alt || '社区活动照片';
    lightbox.hidden = false;
    document.body.classList.add('activity-photo-open');
    $('.activity-photo-close', lightbox)?.focus();
  };

  const closePhoto = () => {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('activity-photo-open');
    if (photoOpener) photoOpener.focus();
  };

  const renderAlbum = album => {
    const photos = getAlbumPhotos(album);
    albumGrid.replaceChildren();
    albumEmpty.hidden = photos.length > 0;

    photos.forEach((photo, index) => {
      const button = document.createElement('button');
      const image = document.createElement('img');
      const caption = document.createElement('span');
      button.type = 'button';
      button.className = 'activity-album-photo';
      button.setAttribute('aria-label', `查看${photo.caption || album.title || '活动'}照片`);
      image.src = photo.src;
      image.alt = photo.alt || photo.caption || `${album.title || '活动相册'}第 ${index + 1} 张照片`;
      image.loading = 'lazy';
      image.decoding = 'async';
      caption.textContent = photo.caption || `${album.title || '活动相册'} · ${index + 1}`;
      button.append(image, caption);
      button.addEventListener('click', () => openPhoto(photo, button));
      image.addEventListener('error', () => {
        button.remove();
        if (!albumGrid.children.length) albumEmpty.hidden = false;
      });
      albumGrid.append(button);
    });
  };

  const openAlbum = button => {
    const album = albums[button.dataset.activityAlbum];
    if (!album) {
      showToast(`尚未配置相册：${button.textContent.trim()}`);
      return;
    }
    albumOpener = button;
    albumTitle.textContent = album.title || button.textContent.trim();
    albumDescription.textContent = album.description || '';
    renderAlbum(album);
    albumLightbox.hidden = false;
    document.body.classList.add('activity-album-open');
    $('.activity-album-close', albumLightbox)?.focus();
  };

  const closeAlbum = () => {
    if (albumLightbox.hidden) return;
    closePhoto();
    albumLightbox.hidden = true;
    albumGrid.replaceChildren();
    document.body.classList.remove('activity-album-open');
    if (albumOpener) albumOpener.focus();
  };

  $$('[data-activity-album]').forEach(button => {
    button.addEventListener('click', () => openAlbum(button));
  });

  $$('[data-activity-photo]').forEach(button => {
    button.addEventListener('click', () => {
      openPhoto({
        src: button.dataset.activityPhoto,
        alt: button.dataset.activityPhotoTitle,
        caption: button.dataset.activityPhotoTitle
      }, button);
    });
  });

  $$('[data-activity-album-close]', albumLightbox).forEach(button => button.addEventListener('click', closeAlbum));
  $$('[data-activity-photo-close]', lightbox).forEach(button => button.addEventListener('click', closePhoto));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!lightbox.hidden) closePhoto();
    else if (!albumLightbox.hidden) closeAlbum();
  });
}

function bindEvents() {
  $$('[data-go]').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.go === 'map') state.mapReturnView = state.view === 'route' ? 'route' : 'home';
    if (btn.dataset.go === 'list') state.listReturnView = state.view === 'guide' ? 'guide' : 'home';
    setView(btn.dataset.go);
  }));
  $$('[data-route-detail]').forEach(card => card.addEventListener('click', openBinjiangRoute));
  $$('[data-route-map]').forEach(button => button.addEventListener('click', () => openBinjiangMap(false)));
  $$('[data-route-start]').forEach(button => button.addEventListener('click', () => openBinjiangMap(true)));
  $$('[data-guide-open]').forEach(button => button.addEventListener('click', () => setView('guide')));
  $$('[data-guide-category]').forEach(button => button.addEventListener('click', () => openGuideCategory(button.dataset.guideCategory)));
  $('#listBackBtn').addEventListener('click', () => setView(state.listReturnView || 'home'));
  $('#mapBackBtn').addEventListener('click', () => setView(state.mapReturnView || 'home'));
  $$('[data-select-point]').forEach(card => card.addEventListener('click', () => {
    state.mapReturnView = 'home';
    state.selectedId = card.dataset.selectPoint;
    setView('map');
  }));
  $('#searchInput').addEventListener('input', e => {
    state.search = e.target.value;
    renderList();
  });
  $('#mapTipBtn').addEventListener('click', () => showToast(`当前为真实高德地图，共载入 ${POINTS.length} 个社区点位；可按上方分类筛选。`));
  $('#listTipBtn').addEventListener('click', () => showToast('列表支持分类筛选和关键词搜索。后续可接入真实点位库或后台管理。'));
  $('#locateBtn').addEventListener('click', () => {
    resetAmapToCommittee(true);
    showToast('已回到多稼居民委员会。');
  });
}


/*
增加渲染热点和跳转导航函数
*/
   function isCoordinateValue(value) {
return value !== null && value !== '' && Number.isFinite(Number(value));
  }

   function hasCoordinatePair(lng, lat) {
return isCoordinateValue(lng)
  && isCoordinateValue(lat)
  && Number(lng) >= -180
  && Number(lng) <= 180
  && Number(lat) >= -90
  && Number(lat) <= 90;
  }

   function hasAmapCoordinate(point) {
return hasCoordinatePair(point?.lng, point?.lat);
  }

   function hasBaiduCoordinate(point) {
return hasCoordinatePair(point?.baiduLng, point?.baiduLat);
  }

   function buildAmapUrl(point) {
// lng / lat 是高德 GCJ-02 坐标；填写后直接按人工坐标步行导航。
if (hasAmapCoordinate(point)) {
  const name = encodeURIComponent(point.name);
  return `https://uri.amap.com/navigation?to=${point.lng},${point.lat},${name}&mode=walk&coordinate=gaode&callnative=1&src=jiaxiang-guide`;
}

// 如果暂时没有精确经纬度，就先用地点名 / 地址打开高德搜索
const keyword = encodeURIComponent(point.address || `上海市黄浦区 ${point.name}`);
return `https://uri.amap.com/search?keyword=${keyword}&city=上海&callnative=1&src=jiaxiang-guide`;
  }

   function buildBaiduMapUrl(point) {
const params = new URLSearchParams({
  destination: hasBaiduCoordinate(point)
    ? `latlng:${point.baiduLat},${point.baiduLng}|name:${point.name}`
    : (point.address || `上海市黄浦区 ${point.name}`),
  mode: 'walking',
  region: '上海',
  output: 'html',
  src: 'jiaxiang-guide'
});
return `https://api.map.baidu.com/direction?${params.toString()}`;
  }

   function clampCalibrationNumber(value, min, max) {
return Math.min(max, Math.max(min, value));
  }

   function roundCalibrationNumber(value) {
return Number(value.toFixed(1));
  }

   function getCalibrationPoint() {
return POINTS.find(point => point.id === calibrationSelectedId) || POINTS[0] || null;
  }

   function pointToSource(point) {
const sourcePoint = {
  id: point.id,
  name: point.name,
  address: point.address,
  lng: isCoordinateValue(point.lng) ? Number(point.lng) : null,
  lat: isCoordinateValue(point.lat) ? Number(point.lat) : null,
  baiduLng: isCoordinateValue(point.baiduLng) ? Number(point.baiduLng) : null,
  baiduLat: isCoordinateValue(point.baiduLat) ? Number(point.baiduLat) : null,
  category: point.category,
  icon: point.icon,
  intro: point.intro,
  phone: point.phone,
  hours: point.hours,
  x: roundCalibrationNumber(point.x),
  y: roundCalibrationNumber(point.y),
  hitSize: Number(point.hitSize) || 34
};
if (Array.isArray(point.locations)) sourcePoint.locations = point.locations;
return `      ${JSON.stringify(sourcePoint)}`;
  }

   function allPointsToSource() {
return `const POINTS = [\n${POINTS.map(point => `${pointToSource(point)},`).join('\n')}\n    ];`;
  }

   function saveMapCalibration() {
if (!MAP_CALIBRATION_MODE) return;

const savedPoints = Object.fromEntries(POINTS.map(point => [point.id, {
  x: roundCalibrationNumber(point.x),
  y: roundCalibrationNumber(point.y),
  hitSize: Number(point.hitSize) || 34
}]));

try {
  localStorage.setItem(MAP_CALIBRATION_STORAGE_KEY, JSON.stringify(savedPoints));
} catch {
  // 浏览器禁用本地存储时仍可继续校准，只是刷新后不会自动保留。
}
  }

   function restoreMapCalibration() {
if (!MAP_CALIBRATION_MODE) return;

try {
  const savedPoints = JSON.parse(localStorage.getItem(MAP_CALIBRATION_STORAGE_KEY) || '{}');
  POINTS.forEach(point => {
    const saved = savedPoints[point.id];
    if (!saved) return;
    if (Number.isFinite(saved.x)) point.x = clampCalibrationNumber(saved.x, 0, 100);
    if (Number.isFinite(saved.y)) point.y = clampCalibrationNumber(saved.y, 0, 100);
    if (Number.isFinite(saved.hitSize)) point.hitSize = clampCalibrationNumber(saved.hitSize, 20, 80);
  });
} catch {
  localStorage.removeItem(MAP_CALIBRATION_STORAGE_KEY);
}
  }

   function refreshCalibrationPanel(point = getCalibrationPoint()) {
if (!MAP_CALIBRATION_MODE || !point) return;

calibrationSelectedId = point.id;
document.querySelectorAll('.map-hotspot').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.id === point.id);
});

const select = document.querySelector('#calibrationPointSelect');
const xInput = document.querySelector('#calibrationX');
const yInput = document.querySelector('#calibrationY');
const sizeInput = document.querySelector('#calibrationSize');
const output = document.querySelector('#calibrationOutput');

if (select) select.value = point.id;
if (xInput) xInput.value = roundCalibrationNumber(point.x);
if (yInput) yInput.value = roundCalibrationNumber(point.y);
if (sizeInput) sizeInput.value = Number(point.hitSize) || 34;
if (output) output.value = `${point.name}\n${pointToSource(point).trim()}`;
  }

   function updateCalibrationPoint(point, x, y, hitSize, shouldSave = true) {
if (!point) return;

point.x = roundCalibrationNumber(clampCalibrationNumber(Number(x), 0, 100));
point.y = roundCalibrationNumber(clampCalibrationNumber(Number(y), 0, 100));
point.hitSize = clampCalibrationNumber(Number(hitSize) || 34, 20, 80);

const btn = document.querySelector(`.map-hotspot[data-id="${point.id}"]`);
if (btn) {
  btn.style.setProperty('--x', `${point.x}%`);
  btn.style.setProperty('--y', `${point.y}%`);
  btn.style.setProperty('--hit-size', `${point.hitSize}px`);
}

refreshCalibrationPanel(point);
if (shouldSave) saveMapCalibration();
  }

   function selectCalibrationPoint(pointOrId) {
const point = typeof pointOrId === 'string'
  ? POINTS.find(item => item.id === pointOrId)
  : pointOrId;
if (!point) return;
refreshCalibrationPanel(point);
  }

   function selectAdjacentCalibrationPoint(direction) {
const currentIndex = Math.max(0, POINTS.findIndex(point => point.id === calibrationSelectedId));
const nextIndex = (currentIndex + direction + POINTS.length) % POINTS.length;
selectCalibrationPoint(POINTS[nextIndex]);
  }

   async function copyCalibrationText(text, successMessage) {
const output = document.querySelector('#calibrationOutput');
if (output) {
  output.value = text;
  output.focus();
  output.select();
}

try {
  await navigator.clipboard.writeText(text);
  showToast(successMessage);
} catch {
  const copied = document.execCommand('copy');
  showToast(copied ? successMessage : '请在黑色文本框内手动复制');
}
  }

   function bindHotspotCalibrationDrag(btn, point, mapEl) {
if (!MAP_CALIBRATION_MODE) return;

let isDragging = false;

btn.addEventListener('pointerdown', event => {
  isDragging = true;
  selectCalibrationPoint(point);
  btn.setPointerCapture(event.pointerId);
  event.preventDefault();
});

btn.addEventListener('pointermove', event => {
  if (!isDragging) return;
  const rect = mapEl.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  updateCalibrationPoint(point, x, y, point.hitSize || 34, false);
});

const finishDrag = event => {
  if (!isDragging) return;
  isDragging = false;
  if (btn.hasPointerCapture(event.pointerId)) btn.releasePointerCapture(event.pointerId);
  saveMapCalibration();
};

btn.addEventListener('pointerup', finishDrag);
btn.addEventListener('pointercancel', finishDrag);
  }

   function setupMapCalibration() {
const panel = document.querySelector('#mapCalibrator');
const mapEl = document.querySelector('#duojiaMap');
const mapView = document.querySelector('[data-view="map"]');
if (!panel || !mapEl || !mapView) return;

panel.hidden = !MAP_CALIBRATION_MODE;
mapEl.classList.toggle('is-calibrating', MAP_CALIBRATION_MODE);
mapView.classList.toggle('is-calibrating', MAP_CALIBRATION_MODE);
if (!MAP_CALIBRATION_MODE) return;

restoreMapCalibration();

const select = document.querySelector('#calibrationPointSelect');
select.innerHTML = POINTS.map((point, index) => (
  `<option value="${point.id}">${index + 1}. ${point.name}</option>`
)).join('');

select.addEventListener('change', () => selectCalibrationPoint(select.value));
document.querySelector('#calibrationPrevBtn').addEventListener('click', () => selectAdjacentCalibrationPoint(-1));
document.querySelector('#calibrationNextBtn').addEventListener('click', () => selectAdjacentCalibrationPoint(1));

const updateFromInputs = () => {
  const point = getCalibrationPoint();
  const xValue = document.querySelector('#calibrationX').value;
  const yValue = document.querySelector('#calibrationY').value;
  const sizeValue = document.querySelector('#calibrationSize').value;
  if (!xValue || !yValue || !sizeValue) return;

  updateCalibrationPoint(
    point,
    Number(xValue),
    Number(yValue),
    Number(sizeValue)
  );
};

document.querySelector('#calibrationX').addEventListener('input', updateFromInputs);
document.querySelector('#calibrationY').addEventListener('input', updateFromInputs);
document.querySelector('#calibrationSize').addEventListener('input', updateFromInputs);

document.querySelector('#copyCurrentPointBtn').addEventListener('click', () => {
  const point = getCalibrationPoint();
  if (point) copyCalibrationText(`${pointToSource(point)},`, '已复制当前点位数据');
});

document.querySelector('#copyAllPointsBtn').addEventListener('click', () => {
  copyCalibrationText(allPointsToSource(), '已复制全部点位数据');
});

document.querySelector('#resetCalibrationBtn').addEventListener('click', () => {
  if (!window.confirm('确定清除浏览器中暂存的校准结果，并恢复源文件坐标吗？')) return;
  localStorage.removeItem(MAP_CALIBRATION_STORAGE_KEY);
  window.location.reload();
});

refreshCalibrationPanel();
  }

function getAmapConfig() {
  return window.DUOJIA_AMAP_CONFIG || {};
}

function setAmapStatus(type, title, detail) {
  const status = document.querySelector('#amapMapStatus');
  if (!status) return;
  if (type === 'ready') {
    status.hidden = true;
    return;
  }

  status.hidden = false;
  status.classList.toggle('is-error', type === 'error');
  status.innerHTML = `
    <span class="amap-map-status-icon" aria-hidden="true">${type === 'error' ? '!' : '⌖'}</span>
    <strong>${title}</strong>
    <small>${detail}</small>
  `;
}

function loadAmapLoaderScript() {
  if (window.AMapLoader) return Promise.resolve(window.AMapLoader);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-amap-loader]');
    const script = existing || document.createElement('script');
    const handleLoad = () => window.AMapLoader
      ? resolve(window.AMapLoader)
      : reject(new Error('高德地图加载器未正确初始化'));
    const handleError = () => reject(new Error('无法连接高德地图服务'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.src = AMAP_LOADER_URL;
      script.async = true;
      script.dataset.amapLoader = 'true';
      document.head.appendChild(script);
    }
  });
}

function loadAmapApi() {
  if (amapRuntime.api) return Promise.resolve(amapRuntime.api);
  if (amapRuntime.loadPromise) return amapRuntime.loadPromise;

  const config = getAmapConfig();
  const hasSecurityConfig = Boolean(config.securityJsCode || config.securityServiceHost);
  if (!config.key || !hasSecurityConfig) {
    return Promise.reject(new Error('AMAP_CONFIG_MISSING'));
  }

  window._AMapSecurityConfig = config.securityServiceHost
    ? { serviceHost: config.securityServiceHost }
    : { securityJsCode: config.securityJsCode };

  amapRuntime.loadPromise = loadAmapLoaderScript()
    .then(loader => loader.load({
      key: config.key,
      version: '2.0',
      plugins: ['AMap.Geocoder']
    }))
    .then(AMap => {
      amapRuntime.api = AMap;
      return AMap;
    })
    .catch(error => {
      amapRuntime.loadPromise = null;
      throw error;
    });

  return amapRuntime.loadPromise;
}

function readAmapCoordinateCache() {
  try {
    return JSON.parse(localStorage.getItem(AMAP_GEOCODE_STORAGE_KEY) || '{}');
  } catch {
    localStorage.removeItem(AMAP_GEOCODE_STORAGE_KEY);
    return {};
  }
}

function saveAmapCoordinateCache(cache) {
  try {
    localStorage.setItem(AMAP_GEOCODE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // 无痕模式等环境可能禁用本地存储；不影响本次地图展示。
  }
}

function getFallbackCoordinate(point) {
  if (point.id === DUOJIA_CENTER_POINT_ID) return [...AMAP_FALLBACK_CENTER];
  const x = Number.isFinite(Number(point.x)) ? Number(point.x) : 49.4;
  const y = Number.isFinite(Number(point.y)) ? Number(point.y) : 41.7;
  return [
    Number((AMAP_FALLBACK_CENTER[0] + (x - 49.4) * 0.00024).toFixed(6)),
    Number((AMAP_FALLBACK_CENTER[1] - (y - 41.7) * 0.00022).toFixed(6))
  ];
}

function applyPointCoordinate(point, coordinate, isFallback = false) {
  const lng = Number(coordinate?.[0] ?? coordinate?.getLng?.());
  const lat = Number(coordinate?.[1] ?? coordinate?.getLat?.());
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  point.lng = lng;
  point.lat = lat;
  point.coordinateFallback = isFallback;
  return true;
}

function geocodePointBatch(geocoder, points) {
  return new Promise(resolve => {
    geocoder.getLocation(points.map(point => point.address || point.name), (status, result) => {
      if (status !== 'complete' || result.info !== 'OK') {
        resolve([]);
        return;
      }
      resolve(result.geocodes || []);
    });
  });
}

async function resolveAmapPointCoordinates(AMap) {
  if (amapRuntime.coordinatesReady) return;

  const cache = readAmapCoordinateCache();
  POINTS.forEach(point => {
    if (hasAmapCoordinate(point)) {
      applyPointCoordinate(point, [Number(point.lng), Number(point.lat)]);
      return;
    }
    const saved = cache[point.id];
    if (Array.isArray(saved)) applyPointCoordinate(point, saved);
  });

  const unresolved = POINTS.filter(point => !hasAmapCoordinate(point));
  if (unresolved.length) {
    const geocoder = new AMap.Geocoder({ city: '上海', citylimit: true });
    for (let index = 0; index < unresolved.length; index += 10) {
      const batch = unresolved.slice(index, index + 10);
      const geocodes = await geocodePointBatch(geocoder, batch);
      batch.forEach((point, batchIndex) => {
        const location = geocodes[batchIndex]?.location;
        if (!location || !applyPointCoordinate(point, location)) return;
        cache[point.id] = [point.lng, point.lat];
      });
    }
    saveAmapCoordinateCache(cache);
  }

  amapRuntime.fallbackCount = 0;
  POINTS.forEach(point => {
    if (hasAmapCoordinate(point)) return;
    applyPointCoordinate(point, getFallbackCoordinate(point), true);
    amapRuntime.fallbackCount += 1;
  });
  amapRuntime.coordinatesReady = true;
}

function getAmapCenterCoordinate() {
  const centerPoint = getPoint(DUOJIA_CENTER_POINT_ID);
  return hasAmapCoordinate(centerPoint)
    ? [centerPoint.lng, centerPoint.lat]
    : AMAP_FALLBACK_CENTER;
}

function createAmapMarkerElement(point) {
  const category = getCategory(point.category);
  const element = document.createElement('div');
  element.className = `amap-community-marker${point.id === DUOJIA_CENTER_POINT_ID ? ' is-center' : ''}`;
  element.style.setProperty('--marker-color', category.color);
  element.dataset.id = point.id;
  element.setAttribute('role', 'button');
  element.setAttribute('aria-label', point.name);
  element.title = point.name;

  const core = document.createElement('span');
  core.className = 'amap-community-marker-core';
  core.textContent = point.icon;
  const label = document.createElement('span');
  label.className = 'amap-community-marker-label';
  label.textContent = point.name;
  element.append(core, label);
  return element;
}

function updateAmapMarkerSelection() {
  amapRuntime.markers.forEach(({ marker, element }, pointId) => {
    const selected = pointId === state.selectedId;
    element.classList.toggle('is-selected', selected);
    marker.setzIndex(selected ? 300 : 100);
  });
}

function renderAmapMarkers() {
  if (!amapRuntime.map || !amapRuntime.api) return;

  amapRuntime.markers.forEach(({ marker }) => marker.setMap(null));
  amapRuntime.markers.clear();

  const visiblePoints = POINTS.filter(point => state.category === 'all' || point.category === state.category);
  visiblePoints.forEach(point => {
    const element = createAmapMarkerElement(point);
    const marker = new amapRuntime.api.Marker({
      map: amapRuntime.map,
      position: [point.lng, point.lat],
      content: element,
      anchor: 'bottom-center',
      title: point.name,
      zIndex: point.id === state.selectedId ? 300 : 100
    });

    marker.on('click', () => selectRealMapPoint(point, true));
    amapRuntime.markers.set(point.id, { marker, element });
  });

  updateAmapMarkerSelection();
}

function resetAmapToCommittee(selectPoint = false) {
  const centerPoint = getPoint(DUOJIA_CENTER_POINT_ID);
  if (amapRuntime.map) {
    amapRuntime.map.setZoomAndCenter(15.5, getAmapCenterCoordinate(), false, 260);
  }
  if (selectPoint && centerPoint) selectRealMapPoint(centerPoint, false);
}

async function ensureAmapMap({ resetCenter = false } = {}) {
  setAmapStatus('loading', '正在加载高德地图', '首次加载会自动解析 30 个社区地址，请稍候。');

  try {
    const AMap = await loadAmapApi();
    await resolveAmapPointCoordinates(AMap);

    if (!amapRuntime.map) {
      amapRuntime.map = new AMap.Map('duojiaMap', {
        center: getAmapCenterCoordinate(),
        zoom: 15.5,
        zooms: [13, 19],
        viewMode: '2D',
        mapStyle: 'amap://styles/whitesmoke',
        features: ['bg', 'road', 'building'],
        showLabel: true,
        rotateEnable: false,
        pitchEnable: false,
        resizeEnable: true
      });
      amapRuntime.map.on('click', closeRealMapSheet);
    }

    renderAmapMarkers();
    if (resetCenter) resetAmapToCommittee(false);
    requestAnimationFrame(() => amapRuntime.map?.resize());
    document.querySelector('#locateBtn').hidden = false;
    setAmapStatus('ready');

    if (amapRuntime.fallbackCount) {
      showToast(`${POINTS.length} 个点位已显示，其中 ${amapRuntime.fallbackCount} 个使用备用位置，可在 POINTS 中补充 lng/lat。`);
    }
  } catch (error) {
    const isMissingConfig = error?.message === 'AMAP_CONFIG_MISSING';
    setAmapStatus(
      'error',
      isMissingConfig ? '请先填写高德地图配置' : '地图暂时无法加载',
      isMissingConfig
        ? '打开 <code>amap.config.js</code>，填写 Web 端 Key 和安全密钥后刷新页面。'
        : '请检查网络、Key 的域名白名单和安全密钥配置。'
    );
    document.querySelector('#locateBtn').hidden = true;
    console.error('高德地图初始化失败：', error);
  }
}

function renderRealMap(options = {}) {
  renderFilterRows();
  closeRealMapSheet();

  const visiblePoints = POINTS.filter(point => state.category === 'all' || point.category === state.category);
  if (!visiblePoints.some(point => point.id === state.selectedId)) {
    state.selectedId = visiblePoints[0]?.id || DUOJIA_CENTER_POINT_ID;
  }

  const selectedPoint = visiblePoints.find(point => point.id === state.selectedId) || null;
  if (selectedPoint) renderMapSheet(selectedPoint);
  void ensureAmapMap(options);
}

function closeRealMapSheet() {
  const sheet = document.querySelector('#mapSheet');
  if (sheet) sheet.classList.remove('is-open');
}

function selectRealMapPoint(point, panToPoint = false) {
  if (!point) return null;
  state.selectedId = point.id;
  updateAmapMarkerSelection();
  if (panToPoint && amapRuntime.map && hasAmapCoordinate(point)) {
    amapRuntime.map.panTo([point.lng, point.lat], 260);
  }
  return renderMapSheet(point);
}

// 只负责生成详情内容、绑定详情按钮事件并打开详情卡片。
function renderMapSheet(point) {
if (!point) return null;

const sheet = document.querySelector("#mapSheet");
if (!sheet) return null;

const category = getCategory(point.category);
const locations = Array.isArray(point.locations) ? point.locations : [];

if (locations.length) {
  sheet.innerHTML = `
    <span class="sheet-selection-label"></span>
    <div class="cluster-sheet-card">
      <div class="sheet-title-row">
        <h3>${point.name}</h3>
        <span class="tag ${point.category}">${locations.length}个地点</span>
      </div>
      <p class="cluster-sheet-intro">地图上合并为一个点位，请在下方选择具体目的地。</p>
      <div class="cluster-location-list">
        ${locations.map((location, index) => `
          <article class="cluster-location">
            <span class="cluster-location-index">${index + 1}</span>
            <div class="cluster-location-info">
              <strong>${location.name}</strong>
              <small>${location.address || '暂无详细地址'}</small>
            </div>
            <button class="cluster-nav-btn" type="button" data-cluster-nav="${index}" aria-label="导航到${location.name}">导航</button>
          </article>
        `).join('')}
      </div>
      <div class="cluster-sheet-actions">
        <button class="btn btn-ghost" id="copyClusterBtn"><span aria-hidden="true">⧉</span> 复制三个地点名称</button>
      </div>
    </div>
  `;

  sheet.querySelectorAll('[data-cluster-nav]').forEach(button => {
    button.addEventListener('click', () => {
      const location = locations[Number(button.dataset.clusterNav)];
      if (!location) return;
      showToast(`正在打开${location.name}`);
      navigateToPoint(location);
    });
  });

  sheet.querySelector('#copyClusterBtn').addEventListener('click', async () => {
    const names = locations.map(location => location.name).join('、');
    try {
      await navigator.clipboard.writeText(names);
      showToast('已复制三个地点名称');
    } catch {
      showToast(names);
    }
  });

  requestAnimationFrame(() => sheet.classList.add('is-open'));
  return sheet;
}

sheet.innerHTML = `
  <span class="sheet-selection-label"></span>
  <div class="map-sheet-compact ${point.image ? '' : 'no-photo'}">
    ${point.image ? `
      <figure class="map-place-photo">
        <img src="${point.image}" alt="${point.imageAlt || point.name}">
        <div class="map-place-photo-fallback" hidden>
          <span aria-hidden="true">▣</span>
          <strong>${point.name}</strong>
          <small>请将实景照片放入指定素材目录</small>
        </div>
        <figcaption>${point.imageCaption || point.name}</figcaption>
      </figure>
    ` : ''}
    <div class="map-sheet-summary">
      <div class="sheet-title-row">
        <h3>${point.name}</h3>
        <span class="tag ${point.category}">${category.full || category.label}</span>
      </div>
      ${point.description ? `<p class="sheet-description">${point.description}</p>` : ''}
      <p class="sheet-address"><span aria-hidden="true">⌖</span> ${point.address || "暂无详细地址，可后续补充。"}</p>
      <div class="map-sheet-compact-actions">
        <button class="sheet-details-btn" id="detailsBtn" type="button" aria-expanded="false">查看详情 <span aria-hidden="true">›</span></button>
        <button class="btn btn-primary" id="navBtn"><span aria-hidden="true">➤</span> 一键导航</button>
      </div>
    </div>
  </div>
  <div class="sheet-detail-extra" id="sheetDetailExtra" hidden>
    <span><b>完整地址</b>${point.address || "暂无详细地址"}</span>
    <span><b>路线提示</b>点击一键导航，可在高德地图中查看步行路线。</span>
  </div>
`;

const navButton = sheet.querySelector("#navBtn");
const detailsButton = sheet.querySelector("#detailsBtn");
const detailExtra = sheet.querySelector("#sheetDetailExtra");
const placePhoto = sheet.querySelector(".map-place-photo img");

if (placePhoto) {
  placePhoto.addEventListener("error", () => {
    placePhoto.hidden = true;
    const fallback = sheet.querySelector(".map-place-photo-fallback");
    if (fallback) fallback.hidden = false;
  });
}

navButton.addEventListener("click", () => {
  navigateToPoint(point);
});

detailsButton.addEventListener("click", () => {
  const isExpanded = detailsButton.getAttribute("aria-expanded") === "true";
  detailsButton.setAttribute("aria-expanded", String(!isExpanded));
  detailExtra.hidden = isExpanded;
  detailsButton.innerHTML = isExpanded
    ? '查看详情 <span aria-hidden="true">›</span>'
    : '收起详情 <span aria-hidden="true">⌃</span>';
});

requestAnimationFrame(() => {
  sheet.classList.add("is-open");
});

return sheet;
  }

/*
  初始化函数。
  页面第一次打开时，只执行一次。
  它会把所有数据渲染到页面上，并绑定各种点击事件。
*/
function init() {
  setupGuideGallery();
  setupActivityPage();
  renderQuickEntries();
  renderFilterRows();
  renderList();
  renderContacts();
  bindEvents();
}

// 启动整个网页。
init();
