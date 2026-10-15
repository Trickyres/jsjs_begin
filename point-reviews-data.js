/*
 * 邻里探店笔记：用户提供的个人体验和评分，不代表平台综合评分。
 * 以点位 id 关联；仅已确认点位显示短评，待补点位保留在 pending 中。
 */
window.POINT_REVIEWS_DATA = {
  label: '邻里探店笔记',
  disclaimer: '个人体验，仅供参考，非综合评分',
  entries: {
    panguoxianhuntun: {
      rating: 5,
      text: '馄饨和面都很合口味，想吃哪样就点哪样，是我愿意推荐给邻里伙伴的一家小店。'
    },
    'traditional-beef-noodles': {
      rating: 3,
      text: '牛肉面吃下来感觉还不错。想在附近吃碗面时，可以把它列进备选，口味感受因人而异。'
    },
    'beef-noodles-lamb-soup-yangguangli': {
      rating: 3,
      text: '牛肉面吃下来感觉还可以，店面不大。想在附近吃碗面时可以列入备选，具体口味还是看个人喜好。'
    },
    alishaokao: {
      rating: 4,
      text: '下午才开门，牛肉串吃着不错。店里没有桌子，需要站着吃，出发前记得考虑这一点。'
    },
    laochengxiangtangbao: {
      rating: 4,
      text: '汤包的味道很合我的口味，是这家让我惦记的一口。想吃汤包时，邻居们可以留意。'
    },
    xiaolaoban: {
      rating: 4,
      text: '一家感觉不错的海鲜饭店。想在附近吃海鲜时，不妨把它列入备选，具体口味还要看个人喜好。'
    },
    chaoshanyiniuhuoguo: {
      rating: 5,
      text: '既有火锅，也有猪脚饭；我更想推荐的是猪脚饭，吃着挺不错，附近想换换口味时可以留意。'
    },
    'roast-meat-rice-canteen': {
      rating: 3,
      text: '这次吃下来的感觉比较一般，整体没有特别打动我。口味各有偏好，选店时可以参考这份感受。'
    },
    tonecoffee: {
      rating: 5,
      text: '很想分享给邻里的宝藏小店，咖啡喝着很合口味。想在附近找杯咖啡时，这家值得放进备选清单。'
    }
  },
  pending: [
    {
      name: '超杰沪味面坊',
      pointId: null,
      rating: null,
      status: '待开业',
      text: '目前标记为待开业，暂不提供食评或评分。等正式营业后，再补上实际探店感受。'
    }
  ]
};
