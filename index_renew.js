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
 * 4. 用户点击按钮时，调用 setView() 切换页面，或调用 renderMap()/renderList() 刷新内容。
 *
 * 使用说明：
 * 1. 直接把本文件保存为 index.html，双击即可打开。
 * 2. 下方 POINTS 为点位数据，可按实际点位修改名称、地址、电话、经纬度等。
 * 3. x/y 用来控制示意地图上的点位位置，范围 0-100；lng/lat 用于跳转高德导航。
 * 4. 如果后续接入真实高德 JS API，可保留页面结构，只替换 map-shell 内部地图实现。
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
  lng/lat  ：真实经纬度，用于点击“一键导航”后跳转高德地图。
  x/y      ：示意地图上的位置，范围 0-100；x 越大越靠右，y 越大越靠下。
*/

/*
  POINTS：全站唯一的点位数据源。
  地图热点、列表搜索、详情卡片和高德导航都从这里读取。
  x/y 控制图片地图上的位置；hitSize 控制热点点击范围；
  lng/lat 可选，未提供时导航会按名称和地址在高德地图中搜索。
*/
const POINTS = [
  { id: "swimming-pool", name: "馨园健身游泳会所", address: "上海市黄浦区南仓街118号馨园小区5号楼对面花园中心", category: "leisure", x: 33.2, y: 47.3, hitSize: 26 },
  { id: "employment", name: "小东门街道融创就业服务站", address: "上海市黄浦区中华路518弄16号", category: "service", x: 24.6, y: 11.7, hitSize: 28 },
  { id: "xiaonanmen-metro", name: "小南门地铁站 9号线", address: "上海市黄浦区中华路与王家码头路交叉口", category: "service", x: 21.1, y: 17.9, hitSize: 34 },
  { id: "jingzhonglou", name: "小南门警钟楼", address: "上海市黄浦区中华路581号", category: "memory", x: 16.8, y: 25.6, hitSize: 30 },
  { id: "police", name: "上海市公安局黄浦分局小东门派出所", address: "上海市黄浦区新码头街66号", category: "service", x: 70.3, y: 6.3, hitSize: 34 },
  { id: "sports-center", name: "外滩金融都市运动中心", address: "上海市黄浦区中山南路609号鑫景金融中心地下空间", category: "leisure", x: 71.3, y: 20.5, hitSize: 28 },
  { id: "huangpu-riverside", name: "黄浦滨江南外滩段", address: "上海市黄浦区复兴东路至南浦大桥之间的外马路沿江一侧", category: "leisure", x: 81.1, y: 17.5, hitSize: 30 },
  { id: "shanghai-bank", name: "上海银行总行（上银金融大厦）", address: "上海市黄浦区中山南路688号", category: "shopping", x: 59.2, y: 22.8, hitSize: 28 },
  { id: "boc", name: "中国银行上海市南外滩支行", address: "上海市黄浦区中山南路800弄20号2层L208a、L208b、L209号", category: "shopping", x: 65.7, y: 31.2, hitSize: 22 },
  { id: "bund-trendy", name: "绿地·外滩潮方", address: "上海市黄浦区中山南路800弄1号", category: "shopping", x: 70.4, y: 34.6, hitSize: 22 },
  { id: "dongjiadu-ferry", name: "董家渡渡口（董家渡轮渡站）", address: "上海市黄浦区外马路737号", category: "service", x: 84.3, y: 29.1, hitSize: 32 },
  { id: "dongjiadu-flower-bridge", name: "董家渡路花桥", address: "上海市黄浦区董家渡路185号（中山南路至黄浦滨江）", category: "leisure", x: 78.8, y: 37.6, hitSize: 34 },
  { id: "church", name: "董家渡天主堂", address: "上海市黄浦区董家渡路185号", category: "memory", x: 59.6, y: 34.4, hitSize: 26 },
  { id: "duojia-committee", name: "多稼居民委员会", address: "上海市黄浦区会馆街66号（多稼居委会党群服务站）", category: "service", x: 49.4, y: 41.7, hitSize: 24 },
  { id: "merchants-house", name: "商船会馆", address: "上海市黄浦区会馆街38号", category: "memory", x: 57, y: 43.9, hitSize: 28 },
  {
    id: "ccb-cmb-donghao-cluster",
    name: "中国建设银行、招商银行、东浩兰生",
    address: "上海市黄浦区董家渡路182号至208号一带",
    category: "shopping",
    x: 53.2,
    y: 38.4,
    hitSize: 24,
    locations: [
      { name: "中国建设银行上海董家渡路支行", address: "上海市黄浦区董家渡路182号、184号、186号、188号1层" },
      { name: "招商银行上海董家渡支行", address: "上海市黄浦区董家渡路208号1层" },
      { name: "东浩兰生（集团）有限公司", address: "上海市黄浦区董家渡路200号47层" }
    ]
  },
  { id: "guotai-haitong", name: "国泰海通外滩金融广场", address: "上海市黄浦区中山南路888号", category: "shopping", x: 66.6, y: 40.7, hitSize: 26 },
  { id: "guohai-sec", name: "国海证券上海中山南路证券营业部", address: "上海市黄浦区中山南路988号2层201室", category: "shopping", x: 63.3, y: 47, hitSize: 24 },
  { id: "time-plastic", name: "上海时光整形外科医院（外滩总院）", address: "上海市黄浦区中山南路935号", category: "service", x: 70.3, y: 50.4, hitSize: 22 },
  { id: "qiangsheng", name: "上海市强生职工医院", address: "上海市黄浦区外马路984号", category: "service", x: 75.8, y: 52.4, hitSize: 22 },
  { id: "health-center", name: "小东门街道社区卫生服务中心", address: "上海市黄浦区陆家浜路525号", category: "service", x: 19, y: 50.7, hitSize: 26 },
  { id: "fabric-market", name: "上海南外滩轻纺面料市场", address: "上海市黄浦区陆家浜路399号", category: "shopping", x: 30.2, y: 52.5, hitSize: 28 },
  { id: "icbc", name: "中国工商银行上海市南市支行", address: "上海市黄浦区陆家浜路275号", category: "shopping", x: 38.4, y: 59.4, hitSize: 26 },
  { id: "gotterwell", name: "上海歌特维康门诊部", address: "上海市黄浦区中山南路1228号", category: "service", x: 43, y: 64.3, hitSize: 28 },
  { id: "nanpu-metro", name: "南浦大桥地铁站 4号线", address: "上海市黄浦区中山南路与国货路交叉口", category: "service", x: 32.1, y: 68.5, hitSize: 34 },
  { id: "sinopec", name: "中国石化齐爱加油站", address: "上海市黄浦区中山南路1133号", category: "shopping", x: 53.5, y: 65, hitSize: 26 },
  { id: "toilet", name: "南浦大桥附近公共厕所", address: "上海市黄浦区中山南路与陆家浜路交叉口附近", category: "service", x: 49.6, y: 70.8, hitSize: 30 },
  { id: "workers-gym", name: "黄浦区工人体育馆", address: "上海市黄浦区外马路1288号", category: "leisure", x: 54.2, y: 78.5, hitSize: 30 },
  { id: "dongjiadu-road-ferry", name: "陆家浜路轮渡站", address: "上海市黄浦区外马路1279号", category: "service", x: 62.1, y: 79.4, hitSize: 30 },
  { id: "nanpu-bridge", name: "南浦大桥（浦西引桥）", address: "上海市黄浦区中山南路与陆家浜路交叉口", category: "leisure", x: 54.5, y: 91.4, hitSize: 34 },
].map(point => ({
  icon: CATEGORIES.find(category => category.key === point.category)?.icon || '⌖',
  intro: '提供地点位置、地址与导航信息。',
  phone: '无',
  hours: '开放或服务时间请以现场公告为准',
  ...point
}));

/*
  临时地图校准开关：
  true  = 显示拖动、坐标和点击范围工具；
  false = 恢复普通访客看到的地图。
  校准完成并把数据复制回 POINTS 后，请改成 false。
*/
const MAP_CALIBRATION_MODE = false;
const MAP_CALIBRATION_STORAGE_KEY = 'jiaxiang-map-calibration-v1';
let calibrationSelectedId = POINTS[0]?.id || null;

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
  mapReturnView: 'home'
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
  点击“导航前往”后，拼接一个高德地图 URI，然后让浏览器跳转。
  手机里如果装了高德地图，通常会尝试打开 App；否则会打开网页地图。
*/
function navigateToPoint(point) {
  if (!point) return;
  showToast(`正在打开${point.name}`);
  window.location.href = buildAmapUrl(point);
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
  state.view = view;
  const activeNavView = view === 'route' ? 'home' : view;
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.go === activeNavView));
  if (view === 'map') renderImageMap();
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
  if (targetView === 'map') renderImageMap();
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
  渲染地图页。
  做三件事：
  1. 刷新分类按钮。
  2. 根据 POINTS 数据在示意地图上生成 marker 点位。
  3. 渲染底部点位信息卡片。
*/
function renderMap() {
  renderFilterRows();
  const canvas = $('#mapCanvas');
  $$('.marker', canvas).forEach(m => m.remove());

  const points = POINTS.filter(p => state.category === 'all' || p.category === state.category);
  if (!points.some(p => p.id === state.selectedId)) {
    state.selectedId = points[0]?.id || POINTS[0].id;
  }

  points.forEach(point => {
    const category = getCategory(point.category);
    const marker = document.createElement('button');
    marker.className = `marker ${point.id === state.selectedId ? 'active' : ''}`;
    marker.style.left = `${point.x}%`;
    marker.style.top = `${point.y}%`;
    marker.style.background = category.color;
    marker.dataset.id = point.id;
    marker.setAttribute('aria-label', point.name);
    marker.innerHTML = `<span>${point.icon}</span>`;
    marker.addEventListener('click', () => {
      state.selectedId = point.id;
      renderMap();
    });
    canvas.appendChild(marker);
  });

  renderSheet(getPoint(state.selectedId));
}


/*
  渲染地图底部的点位详情卡片。
  参数 point 就是当前选中的点位对象。
*/
function renderSheet(point) {
  const category = getCategory(point.category);
  $('#mapSheet').innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title-row">
      <h3>${point.name}</h3>
      <span class="tag ${point.category}">${category.full || category.label}</span>
      <button class="fav" aria-label="收藏">☆</button>
    </div>
    <p>${point.intro}</p>
    <div class="sheet-meta">
      <span>⌖ ${point.address}</span>
      <span>☎ ${point.phone}</span>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-open-list="${point.id}">查看详情</button>
      <button class="btn btn-primary" data-nav="${point.id}">➤ 一键导航</button>
    </div>
  `;
  $('[data-nav]', $('#mapSheet')).addEventListener('click', () => navigateToPoint(point));
  $('[data-open-list]', $('#mapSheet')).addEventListener('click', () => {
    state.search = point.name;
    $('#searchInput').value = point.name;
    setView('list');
  });
  $('.fav', $('#mapSheet')).addEventListener('click', () => showToast('已加入常用点位示例。实际项目可接入本地存储或后台。'));
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

function bindEvents() {
  $$('[data-go]').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.go === 'map') state.mapReturnView = state.view === 'route' ? 'route' : 'home';
    setView(btn.dataset.go);
  }));
  $$('[data-route-detail]').forEach(card => card.addEventListener('click', openBinjiangRoute));
  $$('[data-route-map]').forEach(button => button.addEventListener('click', () => openBinjiangMap(false)));
  $$('[data-route-start]').forEach(button => button.addEventListener('click', () => openBinjiangMap(true)));
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
  $('#mapTipBtn').addEventListener('click', () => showToast('当前为示意地图版本：点位位置可在 POINTS 的 x/y 字段中调整；导航使用经纬度跳转高德地图。'));
  $('#listTipBtn').addEventListener('click', () => showToast('列表支持分类筛选和关键词搜索。后续可接入真实点位库或后台管理。'));
  $('#locateBtn').addEventListener('click', () => showToast('已回到多稼十分钟生活圈中心点。实际项目可接入浏览器定位。'));
  $('#aboutBtn').addEventListener('click', () => showToast('稼享指南：面向新居民、社区居民和周边工作者的社区生活服务导览 H5。'));
}


/*
增加渲染热点和跳转导航函数
*/
   function buildAmapUrl(point) {
// 如果后期补了 lng / lat，就可以直接步行导航
if (point.lng && point.lat) {
  const name = encodeURIComponent(point.name);
  return `https://uri.amap.com/navigation?to=${point.lng},${point.lat},${name}&mode=walk&coordinate=gaode&callnative=1&src=jiaxiang-guide`;
}

// 如果暂时没有精确经纬度，就先用地点名 / 地址打开高德搜索
const keyword = encodeURIComponent(point.address || `上海市黄浦区 ${point.name}`);
return `https://uri.amap.com/search?keyword=${keyword}&city=上海&callnative=1&src=jiaxiang-guide`;
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
  category: point.category,
  icon: point.icon,
  intro: point.intro,
  phone: point.phone,
  hours: point.hours,
  x: roundCalibrationNumber(point.x),
  y: roundCalibrationNumber(point.y),
  hitSize: Number(point.hitSize) || 34
};
if (Number.isFinite(point.lng) && Number.isFinite(point.lat)) {
  sourcePoint.lng = point.lng;
  sourcePoint.lat = point.lat;
}
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

   function renderImageMap() {
const mapEl = document.querySelector("#duojiaMap");
if (!mapEl) return;

renderFilterRows();
closeImageMapSheet();

// 避免重复渲染热点
mapEl.querySelectorAll(".map-hotspot").forEach(el => el.remove());

const visiblePoints = MAP_CALIBRATION_MODE
  ? POINTS
  : POINTS.filter(point => state.category === 'all' || point.category === state.category);
visiblePoints.forEach(point => {
  const btn = document.createElement("button");
  btn.className = "map-hotspot";
  btn.style.setProperty("--x", `${point.x}%`);
  btn.style.setProperty("--y", `${point.y}%`);
  btn.style.setProperty("--hit-size", `${point.hitSize || 34}px`);
  btn.dataset.id = point.id;
  btn.setAttribute("aria-label", point.name);
  btn.title = point.name;

  if (MAP_CALIBRATION_MODE) {
    const label = document.createElement('span');
    label.className = 'map-hotspot-label';
    label.textContent = POINTS.indexOf(point) + 1;
    btn.appendChild(label);
    bindHotspotCalibrationDrag(btn, point, mapEl);
  }

  btn.addEventListener("click", () => {
    if (MAP_CALIBRATION_MODE) {
      selectCalibrationPoint(point);
      return;
    }
    selectImageMapPoint(point);
  });

  mapEl.appendChild(btn);
});

if (!MAP_CALIBRATION_MODE) {
  const selectedPoint = visiblePoints.find(point => point.id === state.selectedId) || visiblePoints[0] || null;
  state.selectedId = selectedPoint?.id || null;
  if (selectedPoint) selectImageMapPoint(selectedPoint);
}

// 点击地图图片的空白处时，收起点位详情面板。 event.target 表示用户实际点击的元素
mapEl.onclick = event => {
  if (!MAP_CALIBRATION_MODE && !event.target.closest(".map-hotspot")) closeImageMapSheet();
};

if (MAP_CALIBRATION_MODE) refreshCalibrationPanel();
  }

   function closeImageMapSheet() {
document.querySelectorAll(".map-hotspot.active").forEach(btn => btn.classList.remove("active"));
const sheet = document.querySelector("#mapSheet");
if (sheet) sheet.classList.remove("is-open");
  }

   // 只负责更新“当前选中了哪个地图点位”。
   function selectImageMapPoint(point) {
if (!point) return null;

state.selectedId = point.id;
document.querySelectorAll(".map-hotspot").forEach(btn => {
  btn.classList.toggle("active", btn.dataset.id === point.id);
});

return renderImageMapSheet(point);
  }

   // 只负责生成详情内容、绑定详情按钮事件并打开详情卡片。
   function renderImageMapSheet(point) {
if (!point) return null;

const sheet = document.querySelector("#mapSheet");
if (!sheet) return null;

const category = getCategory(point.category);
const locations = Array.isArray(point.locations) ? point.locations : [];

if (locations.length) {
  sheet.innerHTML = `
    <div class="sheet-handle"></div>
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
  <div class="sheet-handle"></div>
  <div class="sheet-title-row">
    <h3>${point.name}</h3>
    <span class="tag ${point.category}">${category.full || category.label}</span>
  </div>
  <p>${point.address || "暂无详细地址，可后续补充。"}</p>
  <div class="sheet-meta">
    <span>⌖ 点击导航可在高德地图中查看路线</span>
  </div>
  <div class="sheet-actions map-sheet-actions">
    <button class="btn btn-primary" id="navBtn"><span aria-hidden="true">➤</span> 一键导航</button>
    <button class="btn btn-ghost" id="copyBtn"><span aria-hidden="true">⧉</span> 复制名称</button>
  </div>
`;

const navButton = sheet.querySelector("#navBtn");
const copyButton = sheet.querySelector("#copyBtn");

navButton.addEventListener("click", () => {
  navigateToPoint(point);
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(point.name);
    showToast("已复制点位名称");
  } catch {
    showToast(point.name);
  }
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
  setupMapCalibration();
  renderQuickEntries();
  renderFilterRows();
  // renderMap(); // zyf revise
  renderImageMap();
  renderList();
  renderContacts();
  bindEvents();
}

// 启动整个网页。
init();
