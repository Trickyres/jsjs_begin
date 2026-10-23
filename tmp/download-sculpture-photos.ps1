param([int]$Concurrency = 6)
$ErrorActionPreference = 'Stop'
$root = 'F:\Project\jsjs_begin\雕塑点位图片'
$sourcePath = 'F:\Project\jsjs_begin\tmp\sculpture-points.json'
$points = @(Get-Content -LiteralPath $sourcePath -Raw -Encoding UTF8 | ConvertFrom-Json)
function Safe-Name([string]$value, [string]$fallback, [int]$maxLength) {
    $value = $value.Trim() -replace '[\\/:*?"<>|\x00-\x1f]', '-'
    $value = $value -replace '_', ''
    $value = $value.Trim().TrimEnd('.')
    if ([string]::IsNullOrWhiteSpace($value)) { $value = $fallback }
    if ($value.Length -gt $maxLength) { $value = $value.Substring(0, $maxLength).TrimEnd('.') }
    return $value
}
$jobs = @()
$pointRecords = @()
foreach ($point in $points) {
    if ($point.status -ne '已调查') { continue }
    $id = [string]$point.id
    if ($id -notmatch '^\d+$') { throw 'Unexpected point ID' }
    $address = Safe-Name ([string]$point.address) '未填写地址' 70
    $title = Safe-Name ([string]$point.title) '未命名' 90
    $photos = @(([string]$point.images).Split(';') | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $recordPhotos = @()
    for ($i = 0; $i -lt $photos.Count; $i++) {
        $original = $photos[$i]
        $ext = [IO.Path]::GetExtension($original).ToLowerInvariant()
        if ($ext -notin @('.jpg','.jpeg','.png','.gif','.webp','.bmp')) { throw "Unexpected image extension for point $id" }
        $filename = '{0}_{1:D2}_{2}_{3}{4}' -f $id, ($i+1), $address, $title, $ext
        $target = Join-Path $root $filename
        if ($target.Length -gt 245) { throw "Filename too long for point $id" }
        $url = 'https://www.shanghai-maps.cn/dsdc/service/pictures/origin/' + [uri]::EscapeDataString($original)
        $job = [PSCustomObject]@{PointID=$id; Order=$i+1; File=$filename; Original=$original; Url=$url; Path=$target}
        $jobs += $job
        $recordPhotos += [PSCustomObject]@{file=$filename; original=$original; url=$url}
    }
    $pointRecords += [PSCustomObject]@{point_id=$id; name=[string]$point.title; address=[string]$point.address; district=[string]$point.county; town=[string]$point.town; expected_photo_count=$photos.Count; photos=$recordPhotos}
}
if (($jobs | Group-Object File | Where-Object Count -gt 1).Count -gt 0) { throw 'Filename collision' }
$manifest = [PSCustomObject]@{source_page='https://www.shanghai-maps.cn/dsdc/index.html'; county='黄浦区'; status_filter='已调查（绿色点位）'; naming_pattern='编号_序号_地址_作品名称.原扩展名'; point_count=$pointRecords.Count; expected_photo_count=$jobs.Count; points=$pointRecords}
$manifest | ConvertTo-Json -Depth 9 | Set-Content -LiteralPath (Join-Path $root '全部点位_下载清单.json') -Encoding UTF8
Write-Output "PLAN points=$($pointRecords.Count) photos=$($jobs.Count) concurrency=$Concurrency"
$results = @($jobs | ForEach-Object -Parallel {
    $job = $_
    $ErrorActionPreference = 'Stop'
    $status = 'failed'; $errorText = ''; $bytes = 0
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            if (Test-Path -LiteralPath $job.Path) {
                $bytes = (Get-Item -LiteralPath $job.Path).Length
                if ($bytes -gt 0) { $status = 'existing'; break }
            }
            $temporaryPath = $job.Path + '.part'
            Invoke-WebRequest -Uri $job.Url -OutFile $temporaryPath -TimeoutSec 45 -MaximumRedirection 3
            $buffer = [IO.File]::ReadAllBytes($temporaryPath)
            $valid = $buffer.Length -gt 100 -and (($buffer[0] -eq 255 -and $buffer[1] -eq 216) -or ($buffer[0] -eq 137 -and $buffer[1] -eq 80) -or ($buffer[0] -eq 71 -and $buffer[1] -eq 73) -or ($buffer[0] -eq 82 -and $buffer[1] -eq 73) -or ($buffer[0] -eq 66 -and $buffer[1] -eq 77))
            if (-not $valid) { throw 'Downloaded response is not an image' }
            Move-Item -LiteralPath $temporaryPath -Destination $job.Path -Force
            $bytes = $buffer.Length; $status = 'downloaded'; break
        } catch { $errorText = $_.Exception.Message }
    }
    [PSCustomObject]@{point_id=$job.PointID; order=$job.Order; file=$job.File; bytes=$bytes; status=$status; error= $(if($status -eq 'failed'){$errorText}else{''})}
} -ThrottleLimit $Concurrency)
$results = @($results | Sort-Object {[int]$_.point_id},order)
$results | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $root '全部图片_下载结果.json') -Encoding UTF8
$results | Export-Csv -LiteralPath (Join-Path $root '全部图片_下载结果.csv') -NoTypeInformation -Encoding utf8BOM
$failed = @($results | Where-Object status -eq 'failed')
Write-Output "DOWNLOAD complete=$($results.Count-$failed.Count) failed=$($failed.Count)"
if ($failed.Count) { $failed | Select-Object point_id,order,error | Format-Table -AutoSize; exit 2 }
Add-Type -AssemblyName System.Drawing
$validationErrors = @()
foreach ($result in $results) {
    try {
        $path = Join-Path $root $result.file
        $image = [Drawing.Image]::FromFile($path)
        $result | Add-Member -NotePropertyName width -NotePropertyValue $image.Width -Force
        $result | Add-Member -NotePropertyName height -NotePropertyValue $image.Height -Force
        $image.Dispose()
        $result | Add-Member -NotePropertyName sha256 -NotePropertyValue ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()) -Force
    } catch { $validationErrors += $result.file }
}
$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $root '全部图片_下载结果.json') -Encoding UTF8
$results | Export-Csv -LiteralPath (Join-Path $root '全部图片_下载结果.csv') -NoTypeInformation -Encoding utf8BOM
$report = [PSCustomObject]@{completed_at=(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'); point_count=$pointRecords.Count; expected_photo_count=$jobs.Count; saved_photo_count=$results.Count; failed_count=$failed.Count; decode_errors=$validationErrors; total_bytes=($results | Measure-Object bytes -Sum).Sum}
$report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $root '完成核对.json') -Encoding UTF8
Write-Output ($report | ConvertTo-Json -Depth 4 -Compress)
if ($validationErrors.Count) { exit 3 }
