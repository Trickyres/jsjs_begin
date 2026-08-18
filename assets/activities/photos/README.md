# 活动相册图片

请按分类建立以下文件夹并放入照片：

- `neighbor-gathering/`：邻里欢聚
- `parent-child-charity/`：亲子公益
- `riverside-walk/`：滨江健步
- `traditional-culture/`：传统文化
- `community-building/`：社区共建

放入或删除照片后，双击项目根目录的：

```text
update-activity-albums.cmd
```

脚本会扫描五个分类文件夹及其子文件夹，并重新生成项目根目录的 `activity-album-files.js`。刷新网页后，新照片就会出现在对应相册中，不需要再手动填写 `files`。

也可以在 PowerShell 中运行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\update-activity-albums.ps1
```

支持 JPG、JPEG、PNG、WebP、GIF、AVIF。建议使用 `01.jpg`、`02.jpg` 这样的编号命名，单张图片控制在 1 MB 左右，并保留横图、竖图的不同比例，瀑布流效果会更自然。

当某个分类没有正式照片时，页面会使用 `previewPhotos` 中现有的示例照片；扫描到正式照片后，该分类的示例照片会自动停止显示。
