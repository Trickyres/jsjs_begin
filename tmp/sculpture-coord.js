
/********************************************************************/
/*                                                                  */
/*  Copyright (c) 2017 Genesis Mobile                               */
/*                                                                  */
/*  This obfuscated code was created by Jasob 4.2 Trial Version.    */
/*  The code may be used for evaluation purposes only.              */
/*  To obtain full rights to the obfuscated code you have to        */
/*  purchase the license key (http://www.jasob.com/Purchase.html).  */
/*                                                                  */
/********************************************************************/

(function(root,ar){if(typeof define==='function'&&define.aq){define([],ar);}else if(typeof bJ==='object'&&bJ.aV){bJ.aV=ar();}else{root.smicoord=ar();}}(this,function(){var bA=3.14159265358979324*3000.0/180.0;var PI=3.1415926535897932384626;var a=6378245.0;var aP=0.00669342162296594323;var aZ=function aZ(aU,bu){var aU= +aU;var bu= +bu;var x=aU-0.0065;var y=bu-0.006;var z=Math.sqrt(x*x+y*y)-0.00002*Math.sin(y*bA);var G=Math.atan2(y,x)-0.000003*Math.cos(x*bA);var aj=z*Math.cos(G);var ag=z*Math.sin(G);return[aj,ag]};var aS=function aS(C,L){var L= +L;var C= +C;var z=Math.sqrt(C*C+L*L)+0.00002*Math.sin(L*bA);var G=Math.atan2(L,C)+0.000003*Math.cos(C*bA);var aD=z*Math.cos(G)+0.0065;var bu=z*Math.sin(G)+0.006;return[aD,bu]};var aK=function aK(C,L){var L= +L;var C= +C;if(aL(C,L)){return[C,L]}else{var J=bU(C-105.0,L-35.0);var F=bh(C-105.0,L-35.0);var l=L/180.0*PI;var H=Math.sin(l);H=1-aP*H*H;var K=Math.sqrt(H);J=(J*180.0)/((a*(1-aP))/(H*K)*PI);F=(F*180.0)/(a/K*Math.cos(l)*PI);var aT=L+J;var bI=C+F;return[bI,aT]}};var ak=function ak(C,L){var L= +L;var C= +C;if(aL(C,L)){return[C,L]}else{var J=bU(C-105.0,L-35.0);var F=bh(C-105.0,L-35.0);var l=L/180.0*PI;var H=Math.sin(l);H=1-aP*H*H;var K=Math.sqrt(H);J=(J*180.0)/((a*(1-aP))/(H*K)*PI);F=(F*180.0)/(a/K*Math.cos(l)*PI);var aT=L+J;var bI=C+F;return[C*2-bI,L*2-aT]}};
var bC=function bC(C,L){
var t=121.3;var bS=31.2;var bK=1.006;var V=1.0;var bN=0.99;var bm=0.0;var h=0.5;var R=1.0;var v=(V-bK)/(h-bm);var bk=V-v*h;var j=(bN-V)/(R-h);var bo=bN-j*(R-h);var x,y;var O=0.0;var k=0.0;if(C>t){O=0;}else{O=Math.PI;}k=Math.abs(C-t);if(k<h){var f=v*k+bk;k=f*k;x=t+k*Math.cos(O);C=x;}else if(k>h&&k<R){k=k-h;var f=j*k+bo;k=f*k;C=t+h*Math.cos(O)+k*Math.cos(O);}return[C,L]
};
var al=function al(C,L){
var t=121.3;var bS=31.2;var bK=1.006;var V=1.0;var bN=0.99;var bm=0.0;var h=0.5;var R=1.0;var v=(V-bK)/(h-bm);var bk=V-v*h;var j=(bN-V)/(R-h);var bo=bN-j*(R-h);var x,y;var O=0.0;var k=0.0;if(C>t){O=0;}else{O=Math.PI;}k=Math.abs(C-t);if(k<h){k=(-bk+Math.sqrt(bk*bk+4*v*k))/(2*v);x=t+k*Math.cos(O);C=x;}else if(k>h&&k<R){k=k-h;k=(-bo+Math.sqrt(bo*bo+4*j*k))/(2*j);k+=h;aG=t+k*Math.cos(O);}return[C,L]
};

var smitrans=function smitrans(C,L){
var an=ak(C,L);//火星-cgcs
var bB=bC(an[0],an[1]); //cgcs-tdt
return bB;
};
var smitrans2=function smitrans2(aG,L){
var bv=al(aG,L);
var an=aK(bv[0],bv[1]);
return an;
};
var bU=function bU(C,L){var L= +L;var C= +C;var T= -100.0+2.0*C+3.0*L+0.2*L*L+0.1*C*L+0.2*Math.sqrt(Math.abs(C));T+=(20.0*Math.sin(6.0*C*PI)+20.0*Math.sin(2.0*C*PI))*2.0/3.0;T+=(20.0*Math.sin(L*PI)+40.0*Math.sin(L/3.0*PI))*2.0/3.0;T+=(160.0*Math.sin(L/12.0*PI)+320*Math.sin(L*PI/30.0))*2.0/3.0;return T};var bh=function bh(C,L){var L= +L;var C= +C;var T=300.0+C+2.0*L+0.1*C*C+0.1*C*L+0.1*Math.sqrt(Math.abs(C));T+=(20.0*Math.sin(6.0*C*PI)+20.0*Math.sin(2.0*C*PI))*2.0/3.0;T+=(20.0*Math.sin(C*PI)+40.0*Math.sin(C/3.0*PI))*2.0/3.0;T+=(150.0*Math.sin(C/12.0*PI)+300.0*Math.sin(C/30.0*PI))*2.0/3.0;return T};var aL=function aL(C,L){var L= +L;var C= +C;return!(C>73.66&&C<135.05&&L>3.86&&L<53.55);};
return{aZ:aZ,aS:aS,aK:aK,ak:ak,bC:bC,al:al,smitrans:smitrans,smitrans2:smitrans2}}));

/**
 *  判断经纬度是否超出中国境内
 */
function isLocationOutOfChina(latitude, longitude) {
  if (longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271)
    return true;
  return false;
}


/**
 *  将WGS-84(国际标准)转为GCJ-02(火星坐标):
 */
function transformFromWGSToGCJ(latitude, longitude) {
  var lat = "";
  var lon = "";
  var ee = 0.00669342162296594323;
  var a = 6378245.0;
  var pi = 3.14159265358979324;

  if (isLocationOutOfChina(latitude, longitude)) {
    lat = latitude;
    lon = longitude;
  }
  else {
    var adjustLat = transformLatWithXY(longitude - 105.0, latitude - 35.0);
    var adjustLon = transformLonWithXY(longitude - 105.0, latitude - 35.0);
    var radLat = latitude / 180.0 * pi;
    var magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    var sqrtMagic = Math.sqrt(magic);
    adjustLat = (adjustLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
    adjustLon = (adjustLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * pi);
    latitude = latitude + adjustLat;
    longitude = longitude + adjustLon;
  }
  return { latitude: latitude, longitude: longitude };

}

/**
 *  将GCJ-02(火星坐标)转为百度坐标:
 */
function transformFromGCJToBaidu(latitude, longitude) {
  var pi = 3.14159265358979324 * 3000.0 / 180.0;

  var z = Math.sqrt(longitude * longitude + latitude * latitude) + 0.00002 * Math.sin(latitude * pi);
  var theta = Math.atan2(latitude, longitude) + 0.000003 * Math.cos(longitude * pi);
  var a_latitude = (z * Math.sin(theta) + 0.006);
  var a_longitude = (z * Math.cos(theta) + 0.0065);

  return { latitude: a_latitude, longitude: a_longitude };
}

/**
 *  将百度坐标转为GCJ-02(火星坐标):
 */
function transformFromBaiduToGCJ(latitude, longitude) {
  var xPi = 3.14159265358979323846264338327950288 * 3000.0 / 180.0;

  var x = longitude - 0.0065;
  var y = latitude - 0.006;
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * xPi);
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * xPi);
  var a_latitude = z * Math.sin(theta);
  var a_longitude = z * Math.cos(theta);

  return { latitude: a_latitude, longitude: a_longitude };
}

/**
 *  将GCJ-02(火星坐标)转为WGS-84:
 */
function transformFromGCJToWGS(latitude, longitude) {
  var threshold = 0.00001;

  // The boundary
  var minLat = latitude - 0.5;
  var maxLat = latitude + 0.5;
  var minLng = longitude - 0.5;
  var maxLng = longitude + 0.5;

  var delta = 1;
  var maxIteration = 30;

  while (true) {
    var leftBottom = transformFromWGSToGCJ(minLat, minLng);
    var rightBottom = transformFromWGSToGCJ(minLat, maxLng);
    var leftUp = transformFromWGSToGCJ(maxLat, minLng);
    var midPoint = transformFromWGSToGCJ((minLat + maxLat) / 2, (minLng + maxLng) / 2);
    delta = Math.abs(midPoint.latitude - latitude) + Math.abs(midPoint.longitude - longitude);

    if (maxIteration-- <= 0 || delta <= threshold) {
      return { latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2 };
    }

    if (isContains({ latitude: latitude, longitude: longitude }, leftBottom, midPoint)) {
      maxLat = (minLat + maxLat) / 2;
      maxLng = (minLng + maxLng) / 2;
    }
    else if (isContains({ latitude: latitude, longitude: longitude }, rightBottom, midPoint)) {
      maxLat = (minLat + maxLat) / 2;
      minLng = (minLng + maxLng) / 2;
    }
    else if (isContains({ latitude: latitude, longitude: longitude }, leftUp, midPoint)) {
      minLat = (minLat + maxLat) / 2;
      maxLng = (minLng + maxLng) / 2;
    }
    else {
      minLat = (minLat + maxLat) / 2;
      minLng = (minLng + maxLng) / 2;
    }
  }

}

function isContains(point, p1, p2) {
  return (point.latitude >= Math.min(p1.latitude, p2.latitude) && point.latitude <= Math.max(p1.latitude, p2.latitude)) && (point.longitude >= Math.min(p1.longitude, p2.longitude) && point.longitude <= Math.max(p1.longitude, p2.longitude));
}

function transformLatWithXY(x, y) {
  var pi = 3.14159265358979324;
  var lat = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  lat += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
  lat += (20.0 * Math.sin(y * pi) + 40.0 * Math.sin(y / 3.0 * pi)) * 2.0 / 3.0;
  lat += (160.0 * Math.sin(y / 12.0 * pi) + 320 * Math.sin(y * pi / 30.0)) * 2.0 / 3.0;
  return lat;
}

function transformLonWithXY(x, y) {
  var pi = 3.14159265358979324;
  var lon = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  lon += (20.0 * Math.sin(6.0 * x * pi) + 20.0 * Math.sin(2.0 * x * pi)) * 2.0 / 3.0;
  lon += (20.0 * Math.sin(x * pi) + 40.0 * Math.sin(x / 3.0 * pi)) * 2.0 / 3.0;
  lon += (150.0 * Math.sin(x / 12.0 * pi) + 300.0 * Math.sin(x / 30.0 * pi)) * 2.0 / 3.0;
  return lon;
}



const Host="https://www.shanghai-maps.cn/dsdc/service/";
//const Host="http://127.0.0.1/sys/dsdc/service/";

const dic_jglx={
  "1100":"砌体结构",
  "1200":"钢筋混凝土结构",
  "1300":"钢结构",
  "1400":"木结构",
  "9999":"其它"
}

const dic_bhxjz={
  "01":"全国重点文物保护建筑",
  "02":"省级文物保护建筑",
  "03":"市县级文物保护建筑",
  "04":"历史建筑"
}

const County=["黄浦区","徐汇区","长宁区","静安区","普陀区",
"虹口区","杨浦区","闵行区","宝山区","嘉定区","浦东新区","金山区","松江区",
"青浦区","奉贤区","崇明区"];

const County_Town={
  "黄浦区":["豫园街道","小东门街道","南京东路街道","老西门街道"],
  "徐汇区":["徐家汇街道","枫林路街道","斜土路街道","龙华街道","华泾镇"],
  "长宁区":["北新泾街道","新泾镇","虹桥街道"],
  "静安区":["石门二路街道","大宁路街道","静安寺街道","临汾路街道","北站街道"],
  "普陀区":["长寿路街道","甘泉路街道","真如镇街道","桃浦镇"],
  "虹口区":["北外滩街道","嘉兴路街道","江湾镇街道","欧阳路街道"],
  "杨浦区":["殷行街道","长海路街道","长白新村街道","定海路街道"],
  "闵行区":["江川路街道","莘庄镇","吴泾镇","古美路街道","虹桥镇","华漕镇","马桥镇","梅陇镇","浦江镇","浦锦街道","七宝镇","莘庄工业区","新虹街道","颛桥镇"],
  "宝山区":["高境镇","顾村镇","罗泾镇","月浦镇","杨行镇"],
  "嘉定区":["嘉定工业区","真新街道"],
  "浦东新区":["陆家嘴街道","浦兴路街道","潍坊新村街道","洋泾街道","东明路街道","沪东新村街道"],
  "金山区":["枫泾镇","上海湾区高新技术产业开发区","亭林镇","朱泾镇"],
  "松江区":["泗泾镇","岳阳街道","中山街道","永丰街道"],
  "青浦区":["金泽镇","朱家角镇","夏阳街道","香花桥街道"],
  "奉贤区":["南桥镇","奉城镇","金汇镇","庄行镇","金海街道"],
  "崇明区":["长兴镇","新河镇","堡镇","庙镇"]
};



const imagePalneIdList=[
"image-panel-images"
];

const imageAddBoxIdList=[
   "image-add-box-images"];

const uploadBtnIdList=[
   "upload-btn-images"];


const imageArrList=["images"];

const imageArrListnew=["images"];



const code={
  "310":"上海市",
"310101":"黄浦区",
"310104":"徐汇区",
"310105":"长宁区",
"310106":"静安区",
"310107":"普陀区",
"310109":"虹口区",
"310110":"杨浦区",
"310112":"闵行区",
"310113":"宝山区",
"310114":"嘉定区",
"310115":"浦东新区",
"310116":"金山区",
"310117":"松江区",
"310118":"青浦区",
"310120":"奉贤区",
"310151":"崇明区",
"310101018":"豫园街道",
"310101017":"小东门街道",
"310101002":"南京东路街道",
"310101019":"老西门街道",
"310115013":"洋泾街道",
"310109019":"江湾镇街道",
"310115005":"陆家嘴街道",
"310120102":"奉城镇",
"310110016":"殷行街道",
"310109018":"北外滩街道",
"310120003":"金海街道",
"310112001":"江川路街道",
"310109009":"欧阳路街道",
"310104007":"斜土路街道",
"310120101":"南桥镇",
"310117002":"永丰街道",
"310117001":"岳阳街道",
"310109014":"嘉兴路街道",
"310117004":"中山街道",
"310105102":"新泾镇",
"310110001":"定海路街道",
"310110021":"长海路街道",
// "310114501":"嘉定工业区",
"310114109":"嘉定工业区",
"310104008":"枫林路街道",
"310120106":"金汇镇",
"310115004":"潍坊新村街道",
"310112101":"莘庄镇",
"310120104":"庄行镇",
"310105011":"北新泾街道",
"310110013":"长白新村街道",
"310114002":"真新街道",
"310115014":"浦兴路街道",
"310104016":"龙华街道",
"310104103":"华泾镇",
"310117102":"泗泾镇",
"310104014":"徐家汇街道",
"310105009":"虹桥街道",
"310151116":"长兴镇",
"310151103":"新河镇",
"310113111":"高境镇",
"310113109":"顾村镇",
"310113106":"罗泾镇",
"310113104":"月浦镇",
"310151102":"堡镇",
"310151104":"庙镇",
"310106011":"石门二路街道",
"310106019":"大宁路街道",
"310106013":"静安寺街道",
"310106021":"临汾路街道",
"310106016":"北站街道",
"310118104":"金泽镇",
"310118102":"朱家角镇",
"310118001":"夏阳街道",
"310116102":"枫泾镇",
"310116503":"上海湾区高新技术产业开发区",
"310116104":"亭林镇",
"310116101":"朱泾镇",
"310112110":"吴泾镇",
"310107016":"甘泉路街道",
"310107022":"真如镇街道",
"310113103":"杨行镇",
"310107015":"长寿路街道",
"310118003":"香花桥街道",
"310107103":"桃浦镇",
"310115015":"东明路街道",
"310115011":"沪东新村街道",
// "310112006":"古美路街道",//古美街道
// "310112107":"虹桥镇",
// "310112106":"华漕镇",
// "310112112":"马桥镇",
// "310112108":"梅陇镇",
// "310112114":"浦江镇",
// "310112009":"浦锦街道",
// "310112102":"七宝镇",
// "310112501":"莘庄工业区",
// "310112008":"新虹街道",
"310112103":"颛桥镇"
}

const code2={
  "豫园街道":"310101018",
  "小东门街道":"310101017",
  "南京东路街道":"310101002",
  "老西门街道":"310101019",
  "洋泾街道":"310115013",
  "江湾镇街道":"310109019",
  "陆家嘴街道":"310115005",
  "奉城镇":"310120102",
  "殷行街道":"310110016",
  "北外滩街道":"310109018",
  "金海街道":"310120003",
  "江川路街道":"310112001",
  "欧阳路街道":"310109009",
  "斜土路街道":"310104007",
  "南桥镇":"310120101",
  "永丰街道":"310117002",
  "岳阳街道":"310117001",
  "嘉兴路街道":"310109014",
  "中山街道":"310117004",
  "新泾镇":"310105102",
  "定海路街道":"310110001",
  "长海路街道":"310110021",
  // "嘉定工业区":"310114501",
  "嘉定工业区":"310114109",
  "枫林路街道":"310104008",
  "金汇镇":"310120106",
  "潍坊新村街道":"310115004",
  "莘庄镇":"310112101",
  "庄行镇":"310120104",
  "北新泾街道":"310105011",
  "长白新村街道":"310110013",
  "真新街道":"310114002",
  "浦兴路街道":"310115014",
  "龙华街道":"310104016",
  "华泾镇":"310104103",
  "泗泾镇":"310117102",
  "徐家汇街道":"310104014",
  "虹桥街道":"310105009",
  "长兴镇":"310151116",
  "新河镇":"310151103",
  "高境镇":"310113111",
  "顾村镇":"310113109",
  "罗泾镇":"310113106",
  "月浦镇":"310113104",
  "堡镇":"310151102",
  "庙镇":"310151104",
  "石门二路街道":"310106011",
  "大宁路街道":"310106019",
  "静安寺街道":"310106013",
  "临汾路街道":"310106021",
  "北站街道":"310106016",
  "金泽镇":"310118104",
  "朱家角镇":"310118102",
  "夏阳街道":"310118001",
  "枫泾镇":"310116102",
  "上海湾区高新技术产业开发区":"310116503",
  "亭林镇":"310116104",
  "朱泾镇":"310116101",
  "吴泾镇":"310112110",
  "甘泉路街道":"310107016",
  "真如镇街道":"310107022",
  "杨行镇":"310113103",
  "长寿路街道":"310107015",
  "香花桥街道":"310118003",
  "桃浦镇":"310107103",
  "东明路街道":"310115015",
  "沪东新村街道":"310115011",
  "颛桥镇":"310112103"
}
