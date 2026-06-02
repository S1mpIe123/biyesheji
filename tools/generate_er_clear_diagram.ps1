Add-Type -AssemblyName System.Drawing

# 生成论文正文更适合使用的 E-R 清晰版。
# 该版本只展示实体和实体关系，不在图中堆叠全部字段，避免宋体五号字导致重叠。
$OutputDir = Join-Path (Resolve-Path ".").Path "output"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$FontPath = "C:\Windows\Fonts\simsun.ttc"
$FontCollection = New-Object System.Drawing.Text.PrivateFontCollection
$FontCollection.AddFontFile($FontPath)
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

function Draw-Entity($g, $x, $y, $w, $h, $cn, $en, $borderColor, $fillColor) {
  $border = Pen-Of $borderColor 4
  $fill = Brush-Of $fillColor
  $textBrush = Brush-Of "#111827"
  $cnFont = Font-Of 10.5 ([System.Drawing.FontStyle]::Bold)
  $enFont = Font-Of 10.5

  $g.FillRectangle($fill, $x, $y, $w, $h)
  $g.DrawRectangle($border, $x, $y, $w, $h)
  Center-Text $g $cn $cnFont $textBrush ([System.Drawing.RectangleF]::new($x, $y + 15, $w, 42))
  Center-Text $g $en $enFont $textBrush ([System.Drawing.RectangleF]::new($x, $y + 58, $w, 42))
  return @{ X = $x; Y = $y; W = $w; H = $h; L = $x; R = $x + $w; T = $y; B = $y + $h; CX = $x + $w / 2; CY = $y + $h / 2 }
}

function Draw-Relation($g, $from, $to, $label, $startCard, $endCard) {
  $pen = Pen-Of "#334155" 3
  $brush = Brush-Of "#0F172A"
  $white = Brush-Of "#FFFFFF"
  $font = Font-Of 10.5
  $x1 = [single]$from["X"]
  $y1 = [single]$from["Y"]
  $x2 = [single]$to["X"]
  $y2 = [single]$to["Y"]
  $g.DrawLine($pen, [int]$x1, [int]$y1, [int]$x2, [int]$y2)

  $mx = ($x1 + $x2) / 2
  $my = ($y1 + $y2) / 2
  $labelRect = [System.Drawing.RectangleF]::new([single]($mx - 105), [single]($my - 24), [single]210, [single]48)
  $g.FillRectangle($white, $labelRect.X, $labelRect.Y, $labelRect.Width, $labelRect.Height)
  Center-Text $g $label $font $brush $labelRect

  Center-Text $g $startCard $font $brush ([System.Drawing.RectangleF]::new([single]($x1 - 30), [single]($y1 - 42), [single]60, [single]36))
  Center-Text $g $endCard $font $brush ([System.Drawing.RectangleF]::new([single]($x2 - 30), [single]($y2 + 8), [single]60, [single]36))
}

$w = 2800
$h = 1700
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$bmp.SetResolution(300, 300)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::White)

$titleFont = Font-Of 18 ([System.Drawing.FontStyle]::Bold)
$titleBrush = Brush-Of "#0F172A"
Center-Text $g "系统 E-R 图" $titleFont $titleBrush ([System.Drawing.RectangleF]::new(0, 35, $w, 70))
$linePen = Pen-Of "#334155" 3
$g.DrawLine($linePen, 860, 72, 1110, 72)
$g.DrawLine($linePen, 1690, 72, 1940, 72)

$admin = Draw-Entity $g 120 250 390 130 "管理员" "admin" "#2563EB" "#DBEAFE"
$notice = Draw-Entity $g 120 660 390 130 "公告" "notice" "#D97706" "#FEF3C7"
$user = Draw-Entity $g 650 460 390 130 "用户" "user" "#2563EB" "#DBEAFE"
$category = Draw-Entity $g 1200 190 390 130 "分类" "category" "#475569" "#E2E8F0"
$supply = Draw-Entity $g 1080 560 430 130 "供应信息" "supply" "#0F766E" "#CCFBF1"
$demand = Draw-Entity $g 1660 560 500 130 "采购需求" "purchase_demand" "#0F766E" "#CCFBF1"
$match = Draw-Entity $g 1350 1050 500 130 "撮合记录" "match_record" "#0891B2" "#CFFAFE"
$goods = Draw-Entity $g 2290 540 390 130 "商品" "goods" "#7C3AED" "#EDE9FE"
$orders = Draw-Entity $g 2290 1050 390 130 "订单" "orders" "#D97706" "#FEF3C7"

Draw-Relation $g @{X=$admin.R;Y=$admin.B-20} @{X=$notice.L;Y=$notice.T+45} "发布公告" "1" "N"
Draw-Relation $g @{X=$user.R;Y=$user.T+35} @{X=$supply.L;Y=$supply.T+45} "发布供应" "1" "N"
Draw-Relation $g @{X=$user.R;Y=$user.B-25} @{X=$demand.L;Y=$demand.T+60} "发布需求" "1" "N"
Draw-Relation $g @{X=$category.CX;Y=$category.B} @{X=$supply.CX;Y=$supply.T} "供应分类" "1" "N"
Draw-Relation $g @{X=$category.R;Y=$category.B-20} @{X=$demand.CX;Y=$demand.T} "需求分类" "1" "N"
Draw-Relation $g @{X=$category.R;Y=$category.CY} @{X=$goods.L;Y=$goods.T+45} "商品分类" "1" "N"
Draw-Relation $g @{X=$supply.R;Y=$supply.CY} @{X=$goods.L;Y=$goods.CY} "同步上架" "1" "0..1"
Draw-Relation $g @{X=$goods.CX;Y=$goods.B} @{X=$orders.CX;Y=$orders.T} "生成订单" "1" "N"
Draw-Relation $g @{X=$user.R;Y=$user.B} @{X=$orders.L;Y=$orders.T+55} "提交订单" "1" "N"
Draw-Relation $g @{X=$supply.CX;Y=$supply.B} @{X=$match.L+110;Y=$match.T} "参与撮合" "1" "N"
Draw-Relation $g @{X=$demand.CX;Y=$demand.B} @{X=$match.R-110;Y=$match.T} "参与撮合" "1" "N"
Draw-Relation $g @{X=$user.R;Y=$user.B-10} @{X=$match.L;Y=$match.T+60} "发起撮合" "1" "N"

$legendPen = Pen-Of "#94A3B8" 2
$legendBrush = Brush-Of "#334155"
$legendFont = Font-Of 10.5
$g.DrawRectangle($legendPen, 480, 1500, 1840, 82)
Center-Text $g "说明：图中 1、N、0..1 表示实体之间的一对一、一对多和可选一对一关系。" $legendFont $legendBrush ([System.Drawing.RectangleF]::new(500, 1510, 1800, 62))

$out = Join-Path $OutputDir "系统E-R图_论文清晰版.png"
$g.Dispose()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output $out
