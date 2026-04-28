$port = 5175
$root = $PSScriptRoot
Add-Type -AssemblyName System.Web

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".jsx"  = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".ico"  = "image/x-icon"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()
Write-Host "Serving $root on http://0.0.0.0:$port"

function Handle-Client {
  param($client)
  try {
    $stream = $client.GetStream()
    $stream.ReadTimeout = 5000
    $buf = New-Object byte[] 8192
    $sb = New-Object System.Text.StringBuilder
    $headerEnd = -1
    while ($headerEnd -lt 0) {
      if (-not $stream.DataAvailable) { Start-Sleep -Milliseconds 30 }
      $n = $stream.Read($buf, 0, $buf.Length)
      if ($n -le 0) { return }
      [void]$sb.Append([System.Text.Encoding]::ASCII.GetString($buf, 0, $n))
      $s = $sb.ToString()
      $headerEnd = $s.IndexOf("`r`n`r`n")
      if ($sb.Length -gt 16384) { return }
    }
    $reqText = $sb.ToString().Substring(0, $headerEnd)
    $firstLine = ($reqText -split "`r`n")[0]
    $parts = $firstLine -split " "
    if ($parts.Length -lt 2) { return }
    $rawPath = $parts[1]
    $qIdx = $rawPath.IndexOf("?")
    if ($qIdx -ge 0) { $rawPath = $rawPath.Substring(0, $qIdx) }
    $path = [System.Web.HttpUtility]::UrlDecode($rawPath)
    if ($path -eq "/" -or [string]::IsNullOrEmpty($path)) { $path = "/index.html" }
    $rel = $path.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
    $file = Join-Path $root $rel
    $fullRoot = [System.IO.Path]::GetFullPath($root)
    $fullFile = [System.IO.Path]::GetFullPath($file)
    if (-not $fullFile.StartsWith($fullRoot)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
      $head = "HTTP/1.1 403 Forbidden`r`nContent-Type: text/plain`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($hb, 0, $hb.Length); $stream.Write($body, 0, $body.Length)
      return
    }
    Write-Host "GET $path"
    if (Test-Path $file -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $body = [System.IO.File]::ReadAllBytes($file)
      $head = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($hb, 0, $hb.Length); $stream.Write($body, 0, $body.Length)
    } else {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found: $path")
      $head = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($hb, 0, $hb.Length); $stream.Write($body, 0, $body.Length)
    }
  } catch {
    Write-Host ("Error: " + $_.Exception.Message)
  } finally {
    try { $client.Close() } catch {}
  }
}

while ($true) {
  try {
    $client = $listener.AcceptTcpClient()
    Handle-Client $client
  } catch {
    Write-Host ("Accept error: " + $_.Exception.Message)
  }
}
