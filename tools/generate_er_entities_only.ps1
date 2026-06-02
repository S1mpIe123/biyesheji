Add-Type -AssemblyName System.Drawing

$OutputDir = Join-Path (Resolve-Path ".").Path "output"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$FontCollection = New-Object System.Drawing.Text.PrivateFontCollection
$FontCollection.AddFontFile("C:\Windows\Fonts\simsun.ttc")
$SimSun = $FontCollection.Families[0]

function Font-Of($size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
  return New-Object System.Drawing.Font($SimSun, $size, $style, [System.Drawing.GraphicsUnit]::Point)
}

function Pen-Of($color, $width = 3) {
  return New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($color), $width)
}

function Brush-Of($color) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
}

function Center-Text($g, $text, $font, $brush, $rect) {
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString([string]$text, $font, $brush, $rect, $sf)
}

function Entity($g, $x, $y, $w, $h, $cn, $en, $borderColor, $fillColor) {
  $g.FillRectangle((Brush-Of $fillColor), $x, $y, $w, $h)
  $g.DrawRectangle((Pen-Of $borderColor 4), $x, $y, $w, $h)
  Center-Text $g $cn (Font-Of 10.5 ([System.Drawing.FontStyle]::Bold)) (Brush-Of "#111827") ([System.Drawing.RectangleF]::new($x, $y + 18, $w, 42))
  Center-Text $g $en (Font-Of 10.5) (Brush-Of "#111827") ([System.Drawing.RectangleF]::new($x, $y + 62, $w, 42))
  return @{ X = $x; Y = $y; W = $w; H = $h; L = $x; R = $x + $w; T = $y; B = $y + $h; CX = $x + $w / 2; CY = $y + $h / 2 }
}

function Link($g, $from, $to) {
  $g.DrawLine((Pen-Of "#334155" 3), [int]$from["X"], [int]$from["Y"], [int]$to["X"], [int]$to["Y"])
}

$w = 2800
$h = 1700
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$bmp.SetResolution(300, 300)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)

Center-Text $g "系统 E-R 图" (Font-Of 18 ([System.Drawing.FontStyle]::Bold)) (Brush-Of "#0F172A") ([System.Drawing.RectangleF]::new(0, 35, $w, 70))
$g.DrawLine((Pen-Of "#334155" 3), 860, 72, 1110, 72)
$g.DrawLine((Pen-Of "#334155" 3), 1690, 72, 1940, 72)

$admin = Entity $g 120 250 390 130 "管理员" "admin" "#2563EB" "#DBEAFE"
$notice = Entity $g 120 660 390 130 "公告" "notice" "#D97706" "#FEF3C7"
$user = Entity $g 650 460 390 130 "用户" "user" "#2563EB" "#DBEAFE"
$category = Entity $g 1220 190 390 130 "分类" "category" "#475569" "#E2E8F0"
$supply = Entity $g 1060 560 430 130 "供应信息" "supply" "#0F766E" "#CCFBF1"
$demand = Entity $g 1660 560 500 130 "采购需求" "purchase_demand" "#0F766E" "#CCFBF1"
$match = Entity $g 1350 1050 500 130 "撮合记录" "match_record" "#0891B2" "#CFFAFE"
$goods = Entity $g 2290 540 390 130 "商品" "goods" "#7C3AED" "#EDE9FE"
$orders = Entity $g 2290 1050 390 130 "订单" "orders" "#D97706" "#FEF3C7"

Link $g @{X=$admin.R;Y=$admin.B-20} @{X=$notice.L;Y=$notice.T+45}
Link $g @{X=$user.R;Y=$user.T+35} @{X=$supply.L;Y=$supply.T+45}
Link $g @{X=$user.R;Y=$user.B-25} @{X=$demand.L;Y=$demand.T+60}
Link $g @{X=$category.CX;Y=$category.B} @{X=$supply.CX;Y=$supply.T}
Link $g @{X=$category.R;Y=$category.B-20} @{X=$demand.CX;Y=$demand.T}
Link $g @{X=$category.R;Y=$category.CY} @{X=$goods.L;Y=$goods.T+45}
Link $g @{X=$supply.R;Y=$supply.CY} @{X=$goods.L;Y=$goods.CY}
Link $g @{X=$goods.CX;Y=$goods.B} @{X=$orders.CX;Y=$orders.T}
Link $g @{X=$user.R;Y=$user.B} @{X=$orders.L;Y=$orders.T+55}
Link $g @{X=$supply.CX;Y=$supply.B} @{X=$match.L+110;Y=$match.T}
Link $g @{X=$demand.CX;Y=$demand.B} @{X=$match.R-110;Y=$match.T}
Link $g @{X=$user.R;Y=$user.B-10} @{X=$match.L;Y=$match.T+60}

Center-Text $g "注：实体之间的关系名称与基数见下方实体关系说明表。" (Font-Of 10.5) (Brush-Of "#334155") ([System.Drawing.RectangleF]::new(480, 1508, 1840, 58))

$out = Join-Path $OutputDir "系统E-R图_实体关系清晰版.png"
$g.Dispose()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output $out
