// 活动相册文字、目录与预览素材。
// 正式照片文件名由 update-activity-albums.cmd 扫描生成到 activity-album-files.js。
const generatedActivityAlbumFiles = window.ACTIVITY_ALBUM_FILES || {};
window.ACTIVITY_ALBUMS = {
  "neighbor-gathering": {
    title: "邻里欢聚",
    description: "记录邻里相识、相聚与彼此陪伴的温暖时刻。",
    folder: "assets/activities/photos/neighbor-gathering",
    files: generatedActivityAlbumFiles["neighbor-gathering"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/highlight-photo.jpg", alt: "居民在社区活动中欢聚", caption: "邻里欢聚时刻" },
      { src: "assets/routes/binjiang/stop-park.jpg", alt: "居民在社区公园交流", caption: "公园里的邻里时光" },
      { src: "assets/routes/binjiang/highlight-night.jpg", alt: "社区夜间活动", caption: "夜色中的社区相聚" },
      { src: "assets/routes/binjiang/hero.jpg", alt: "社区居民共同参与活动", caption: "一起留下社区记忆" }
    ]
  },
  "parent-child-charity": {
    title: "亲子公益",
    description: "在共同参与中学习关爱、分享与责任。",
    folder: "assets/activities/photos/parent-child-charity",
    files: generatedActivityAlbumFiles["parent-child-charity"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/stop-park.jpg", alt: "亲子家庭参加户外公益活动", caption: "亲子携手参与" },
      { src: "assets/routes/binjiang/stop-walkway.jpg", alt: "亲子家庭沿步道开展活动", caption: "边走边学的公益课堂" },
      { src: "assets/routes/binjiang/highlight-photo.jpg", alt: "亲子家庭合影", caption: "共同成长的纪念" }
    ]
  },
  "riverside-walk": {
    title: "滨江健步",
    description: "沿着黄浦江畔，在行走中感受健康与社区活力。",
    folder: "assets/activities/photos/riverside-walk",
    files: generatedActivityAlbumFiles["riverside-walk"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/highlight-river.jpg", alt: "黄浦滨江健步活动", caption: "迎着江风出发" },
      { src: "assets/routes/binjiang/stop-walkway.jpg", alt: "滨江步道健步", caption: "滨江步道同行" },
      { src: "assets/routes/binjiang/stop-platform.jpg", alt: "居民在滨江平台休整", caption: "途中小憩" },
      { src: "assets/routes/binjiang/highlight-night.jpg", alt: "滨江夜间健步", caption: "华灯初上的滨江" }
    ]
  },
  "traditional-culture": {
    title: "传统文化",
    description: "在节庆、手作与故事里延续社区文化记忆。",
    folder: "assets/activities/photos/traditional-culture",
    files: generatedActivityAlbumFiles["traditional-culture"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/stop-ferry.jpg", alt: "与渡口历史有关的文化活动", caption: "城市记忆分享" },
      { src: "assets/routes/binjiang/stop-ferry_01.jpg", alt: "社区传统文化参访", caption: "寻访老城故事" },
      { src: "assets/routes/binjiang/highlight-photo.jpg", alt: "居民参加传统文化活动", caption: "邻里共度传统佳节" }
    ]
  },
  "community-building": {
    title: "社区共建",
    description: "居民、社区与共建单位一起，让家园变得更美好。",
    folder: "assets/activities/photos/community-building",
    files: generatedActivityAlbumFiles["community-building"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/hero.jpg", alt: "社区共建活动现场", caption: "共建美好家园" },
      { src: "assets/routes/binjiang/stop-platform.jpg", alt: "居民参与公共空间共建", caption: "一起关注公共空间" },
      { src: "assets/routes/binjiang/stop-park.jpg", alt: "社区志愿服务活动", caption: "志愿服务在身边" },
      { src: "assets/routes/binjiang/highlight-river.jpg", alt: "滨江社区共建活动", caption: "连接社区与滨江" }
    ]
  }
};
