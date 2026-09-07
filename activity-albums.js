// 活动相册文字、目录与预览素材。
// 正式照片文件名由 update-activity-albums.cmd 扫描生成到 activity-album-files.js。
const generatedActivityAlbumFiles = window.ACTIVITY_ALBUM_FILES || {};
window.ACTIVITY_ALBUMS = {
  "community-co-governance": {
    title: "社区共治",
    description: "记录居民议事、志愿参与与协商共治的行动瞬间。",
    folder: "assets/activities/photos/01_community co-governance",
    files: generatedActivityAlbumFiles["community-co-governance"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/highlight-photo.webp", alt: "居民参与社区议事活动", caption: "居民共商社区事务" },
      { src: "assets/routes/binjiang/stop-park.webp", alt: "居民参与社区志愿活动", caption: "志愿行动在身边" },
      { src: "assets/routes/binjiang/highlight-night.webp", alt: "社区夜间共治活动", caption: "多方携手参与共治" },
      { src: "assets/routes/binjiang/hero.webp", alt: "居民共同参与社区建设", caption: "一起建设美好家园" }
    ]
  },
  "parent-child-vitality": {
    title: "亲子活力",
    description: "记录亲子互动、运动体验与共同成长的活力时刻。",
    folder: "assets/activities/photos/03_parent-child vitality",
    files: generatedActivityAlbumFiles["parent-child-vitality"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/stop-park.webp", alt: "亲子家庭参加户外活力活动", caption: "亲子携手出发" },
      { src: "assets/routes/binjiang/stop-walkway.webp", alt: "亲子家庭沿步道开展活动", caption: "活力满满的亲子时光" },
      { src: "assets/routes/binjiang/highlight-photo.webp", alt: "亲子家庭合影", caption: "共同成长的纪念" }
    ]
  },
  "riverside-walk": {
    title: "滨江漫步",
    description: "沿着黄浦江畔，在行走中感受健康与社区活力。",
    folder: "assets/activities/photos/05_riverside-walk",
    files: generatedActivityAlbumFiles["riverside-walk"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/highlight-river.webp", alt: "黄浦滨江漫步活动", caption: "迎着江风出发" },
      { src: "assets/routes/binjiang/stop-walkway.webp", alt: "滨江步道健步", caption: "滨江步道同行" },
      { src: "assets/routes/binjiang/stop-platform.webp", alt: "居民在滨江平台休整", caption: "途中小憩" },
      { src: "assets/routes/binjiang/highlight-night.webp", alt: "滨江夜间健步", caption: "华灯初上的滨江" }
    ]
  },
  "white-collar-stress-relief": {
    title: "白领解压",
    description: "在轻松互动与兴趣体验中，为社区白领释放压力、补充能量。",
    folder: "assets/activities/photos/04_white-collar stress relief",
    files: generatedActivityAlbumFiles["white-collar-stress-relief"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/stop-ferry.webp", alt: "社区白领参加解压活动", caption: "忙里偷闲放松身心" },
      { src: "assets/routes/binjiang/stop-ferry_01.webp", alt: "白领参与社区兴趣体验", caption: "兴趣体验补充能量" },
      { src: "assets/routes/binjiang/highlight-photo.webp", alt: "白领参加轻松互动活动", caption: "轻松相聚释放压力" }
    ]
  },
  "golden-years-radiance": {
    title: "夕照芳华",
    description: "记录长者乐享生活、相互陪伴与绽放风采的温暖时刻。",
    folder: "assets/activities/photos/02_golden years radiance",
    files: generatedActivityAlbumFiles["golden-years-radiance"] || [],
    previewPhotos: [
      { src: "assets/routes/binjiang/hero.webp", alt: "社区长者参加集体活动", caption: "乐享温暖社区生活" },
      { src: "assets/routes/binjiang/stop-platform.webp", alt: "长者在户外交流互动", caption: "相聚相伴的好时光" },
      { src: "assets/routes/binjiang/stop-park.webp", alt: "长者参加社区休闲活动", caption: "夕阳正好芳华依旧" },
      { src: "assets/routes/binjiang/highlight-river.webp", alt: "长者参与滨江社区活动", caption: "记录幸福晚年时刻" }
    ]
  }
};
