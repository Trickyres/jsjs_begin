/**
 * 居民活动照片上传配置。
 *
 * endpoint 留空时，移动端会调用系统分享面板，由居民选择微信等渠道发送给社区工作人员。
 * 如已部署照片接收服务，请填写支持 multipart/form-data POST 的 HTTPS 地址；照片字段名为 photos。
 */
window.DUOJIA_ACTIVITY_UPLOAD_CONFIG = {
  endpoint: '',
  maxFiles: 6,
  maxFileSizeMB: 10
};
