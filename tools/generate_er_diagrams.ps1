Add-Type -AssemblyName System.Drawing

# 生成论文可插入的 E-R 图。
# 文字按宋体五号（约 10.5pt）对应 300dpi 输出，优先保证插入 Word 后可读。
$OutputDir = Join-Path (Resolve-Path ".").Path "output"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$FontPath = "C:\Windows\Fonts\simsun.ttc"
$FontCollection = New-Object System.Drawing.Text.PrivateFontCollection
$FontCollection.AddFontFile($FontPath)
$SimSun = $FontCollection.Families[0]

function New-Font($size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
  return New-Object System.Drawing.Font($SimSun, $size, $style, [System.Drawing.GraphicsUnit]::Point)
}

function New-Pen($color, $width = 3) {
  return New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($color), $width)
}

function New-Brush($color) {
  return New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
}

function Draw-CenteredText($g, $text, $font, $brush, $rect) {
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString([string]$text, $font, $brush, $rect, $sf)
}

function Draw-Text($g, $text, $font, $brush, $x, $y) {
  $g.DrawString($text, $font, $brush, [single]$x, [single]$y)
}

function Draw-Table($g, $x, $y, $w, $title, $fields, $theme) {
  $headerH = 58
  $lineH = 45
  $h = $headerH + ($fields.Count * $lineH) + 18
  $border = New-Pen $theme.Border 4
  $headerBrush = New-Brush $theme.Header
  $bodyBrush = New-Brush "#FFFFFF"
  $textBrush = New-Brush "#111827"
  $keyBrush = New-Brush "#EAB308"
  $titleFont = New-Font 10.5 ([System.Drawing.FontStyle]::Bold)
  $bodyFont = New-Font 10.5

  $g.FillRectangle($bodyBrush, $x, $y, $w, $h)
  $g.DrawRectangle($border, $x, $y, $w, $h)
  $g.FillRectangle($headerBrush, $x, $y, $w, $headerH)
  $g.DrawLine($border, $x, $y + $headerH, $x + $w, $y + $headerH)
  Draw-CenteredText $g $title $titleFont $textBrush (New-Object System.Drawing.RectangleF($x, $y, $w, $headerH))

  $yy = $y + $headerH + 10
  foreach ($field in $fields) {
    if ($field.StartsWith("*")) {
      $clean = $field.Substring(1)
      $g.FillEllipse($keyBrush, $x + 18, $yy + 12, 14, 14)
      Draw-Text $g $clean $bodyFont $textBrush ($x + 42) $yy
    } else {
      Draw-Text $g $field $bodyFont $textBrush ($x + 42) $yy
    }
    $yy += $lineH
  }
  return @{ X = $x; Y = $y; W = $w; H = $h; L = $x; R = $x + $w; T = $y; B = $y + $h; CX = $x + ($w / 2); CY = $y + ($h / 2) }
}

function Draw-LineLabel($g, $from, $to, $label, $startCard, $endCard) {
  $pen = New-Pen "#334155" 3
  $dashPen = New-Pen "#64748B" 3
  $labelFont = New-Font 10.5
  $textBrush = New-Brush "#0F172A"
  $cardBrush = New-Brush "#FFFFFF"

  $fromX = [single]$from["X"]
  $fromY = [single]$from["Y"]
  $toX = [single]$to["X"]
  $toY = [single]$to["Y"]

  $g.DrawLine($pen, [int]$fromX, [int]$fromY, [int]$toX, [int]$toY)

  $mx = ($fromX + $toX) / 2
  $my = ($fromY + $toY) / 2
  $labelRect = [System.Drawing.RectangleF]::new([single]($mx - 95), [single]($my - 24), [single]190, [single]48)
  $g.FillRectangle($cardBrush, $labelRect.X, $labelRect.Y, $labelRect.Width, $labelRect.Height)
  Draw-CenteredText $g $label $labelFont $textBrush $labelRect

  Draw-CenteredText $g $startCard $labelFont $textBrush ([System.Drawing.RectangleF]::new([single]($fromX - 34), [single]($fromY - 45), [single]68, [single]38))
  Draw-CenteredText $g $endCard $labelFont $textBrush ([System.Drawing.RectangleF]::new([single]($toX - 34), [single]($toY + 8), [single]68, [single]38))
}

function Draw-Title($g, $width, $title) {
  $titleFont = New-Font 18 ([System.Drawing.FontStyle]::Bold)
  $brush = New-Brush "#0F172A"
  Draw-CenteredText $g $title $titleFont $brush (New-Object System.Drawing.RectangleF(0, 28, $width, 70))
  $pen = New-Pen "#334155" 3
  $g.DrawLine($pen, ($width / 2) - 390, 65, ($width / 2) - 130, 65)
  $g.DrawLine($pen, ($width / 2) + 130, 65, ($width / 2) + 390, 65)
}

function New-Canvas($width, $height) {
  $bmp = New-Object System.Drawing.Bitmap($width, $height)
  $bmp.SetResolution(300, 300)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::White)
  return @{ Bitmap = $bmp; Graphics = $g }
}

function Save-Canvas($canvas, $path) {
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Bitmap.Dispose()
}

$themeBlue = @{ Border = "#2563EB"; Header = "#DBEAFE" }
$themeGreen = @{ Border = "#0F766E"; Header = "#CCFBF1" }
$themeCyan = @{ Border = "#0891B2"; Header = "#CFFAFE" }
$themeViolet = @{ Border = "#7C3AED"; Header = "#EDE9FE" }
$themeOrange = @{ Border = "#D97706"; Header = "#FEF3C7" }
$themeSlate = @{ Border = "#475569"; Header = "#E2E8F0" }

# 横向总览版：适合横向页面或附录插入。
$canvas = New-Canvas 3400 2100
$g = $canvas.Graphics
Draw-Title $g 3400 "系统 E-R 图（五号字重排版）"

$admin = Draw-Table $g 120 230 390 "管理员 admin" @("*id", "username", "password", "name", "role") $themeBlue
$notice = Draw-Table $g 120 720 390 "公告 notice" @("*id", "title", "content", "time") $themeOrange
$user = Draw-Table $g 650 520 440 "用户 user" @("*id", "username", "password", "name", "role", "userType", "phone", "email") $themeBlue
$category = Draw-Table $g 1450 200 390 "分类 category" @("*id", "name") $themeSlate
$supply = Draw-Table $g 1270 610 460 "供应信息 supply" @("*id", "supplierId", "productName", "categoryId", "price", "quantity", "status", "createTime") $themeGreen
$demand = Draw-Table $g 1910 610 520 "采购需求 purchase_demand" @("*id", "buyerId", "productName", "categoryId", "quantity", "expectedPrice", "status", "deadline") $themeGreen
$match = Draw-Table $g 1570 1260 520 "撮合记录 match_record" @("*id", "supplyId", "demandId", "requesterUserId", "quantity", "price", "status", "createTime") $themeCyan
$goods = Draw-Table $g 2760 530 460 "商品 goods" @("*id", "name", "price", "unit", "store", "categoryId", "sourceSupplyId") $themeViolet
$orders = Draw-Table $g 2760 1230 460 "订单 orders" @("*id", "orderNo", "goodsId", "userId", "num", "status", "time", "deleted") $themeOrange

Draw-LineLabel $g @{X=$admin.R;Y=$admin.B-50} @{X=$notice.L;Y=$notice.T+65} "发布公告" "1" "N"
Draw-LineLabel $g @{X=$user.R;Y=$user.T+110} @{X=$supply.L;Y=$supply.T+90} "发布供应" "1" "N"
Draw-LineLabel $g @{X=$user.R;Y=$user.T+230} @{X=$demand.L;Y=$demand.T+120} "发布需求" "1" "N"
Draw-LineLabel $g @{X=$category.CX;Y=$category.B} @{X=$supply.CX;Y=$supply.T} "供应分类" "1" "N"
Draw-LineLabel $g @{X=$category.R;Y=$category.B-10} @{X=$demand.CX;Y=$demand.T} "需求分类" "1" "N"
Draw-LineLabel $g @{X=$category.R;Y=$category.CY} @{X=$goods.L;Y=$goods.T+120} "商品分类" "1" "N"
Draw-LineLabel $g @{X=$supply.R;Y=$supply.T+210} @{X=$goods.L;Y=$goods.T+260} "同步上架" "1" "0..1"
Draw-LineLabel $g @{X=$goods.CX;Y=$goods.B} @{X=$orders.CX;Y=$orders.T} "生成订单" "1" "N"
Draw-LineLabel $g @{X=$user.R;Y=$user.B-70} @{X=$orders.L;Y=$orders.T+180} "提交订单" "1" "N"
Draw-LineLabel $g @{X=$supply.CX;Y=$supply.B} @{X=$match.L+80;Y=$match.T} "参与撮合" "1" "N"
Draw-LineLabel $g @{X=$demand.CX;Y=$demand.B} @{X=$match.R-80;Y=$match.T} "参与撮合" "1" "N"
Draw-LineLabel $g @{X=$user.R;Y=$user.B-20} @{X=$match.L;Y=$match.T+160} "发起撮合" "1" "N"

$legendFont = New-Font 10.5
$legendBrush = New-Brush "#334155"
$legendBorder = New-Pen "#94A3B8" 2
$g.DrawRectangle($legendBorder, 620, 1930, 2180, 78)
Draw-Text $g "说明：系统以用户、供需信息、撮合记录、商品订单为核心实体，支持农产品产销对接与商城交易业务闭环。" $legendFont $legendBrush 670 1950
Save-Canvas $canvas (Join-Path $OutputDir "系统E-R图_五号字_横向总览.png")

# 拆分图 1：基础数据与商城交易关系。
$canvas = New-Canvas 2600 1700
$g = $canvas.Graphics
Draw-Title $g 2600 "基础数据与商城交易 E-R 图"
$admin = Draw-Table $g 120 250 390 "管理员 admin" @("*id", "username", "password", "name", "role") $themeBlue
$notice = Draw-Table $g 120 800 390 "公告 notice" @("*id", "title", "content", "time") $themeOrange
$user = Draw-Table $g 720 520 430 "用户 user" @("*id", "username", "password", "name", "role", "userType", "phone", "email") $themeBlue
$category = Draw-Table $g 1370 260 390 "分类 category" @("*id", "name") $themeSlate
$goods = Draw-Table $g 1370 750 460 "商品 goods" @("*id", "name", "price", "unit", "store", "categoryId", "sourceSupplyId") $themeViolet
$orders = Draw-Table $g 1980 760 460 "订单 orders" @("*id", "orderNo", "goodsId", "userId", "num", "status", "time", "deleted") $themeOrange
Draw-LineLabel $g @{X=$admin.R;Y=$admin.B-50} @{X=$notice.L;Y=$notice.T+65} "发布公告" "1" "N"
Draw-LineLabel $g @{X=$category.CX;Y=$category.B} @{X=$goods.CX;Y=$goods.T} "商品分类" "1" "N"
Draw-LineLabel $g @{X=$goods.R;Y=$goods.CY} @{X=$orders.L;Y=$orders.CY} "生成订单" "1" "N"
Draw-LineLabel $g @{X=$user.R;Y=$user.CY} @{X=$orders.L;Y=$orders.T+180} "提交订单" "1" "N"
Save-Canvas $canvas (Join-Path $OutputDir "系统E-R图_五号字_1基础交易关系.png")

# 拆分图 2：供需撮合核心关系。
$canvas = New-Canvas 2600 1700
$g = $canvas.Graphics
Draw-Title $g 2600 "供需撮合核心 E-R 图"
$user = Draw-Table $g 120 520 430 "用户 user" @("*id", "username", "password", "name", "role", "userType", "phone", "email") $themeBlue
$category = Draw-Table $g 1080 220 390 "分类 category" @("*id", "name") $themeSlate
$supply = Draw-Table $g 730 600 460 "供应信息 supply" @("*id", "supplierId", "productName", "categoryId", "price", "quantity", "status", "createTime") $themeGreen
$demand = Draw-Table $g 1450 600 520 "采购需求 purchase_demand" @("*id", "buyerId", "productName", "categoryId", "quantity", "expectedPrice", "status", "deadline") $themeGreen
$match = Draw-Table $g 1010 1240 520 "撮合记录 match_record" @("*id", "supplyId", "demandId", "requesterUserId", "quantity", "price", "status", "createTime") $themeCyan
$goods = Draw-Table $g 2020 1020 460 "商品 goods" @("*id", "name", "price", "unit", "store", "categoryId", "sourceSupplyId") $themeViolet
Draw-LineLabel $g @{X=$user.R;Y=$user.T+120} @{X=$supply.L;Y=$supply.T+110} "发布供应" "1" "N"
Draw-LineLabel $g @{X=$user.R;Y=$user.T+250} @{X=$demand.L;Y=$demand.T+120} "发布需求" "1" "N"
Draw-LineLabel $g @{X=$category.CX;Y=$category.B} @{X=$supply.CX;Y=$supply.T} "供应分类" "1" "N"
Draw-LineLabel $g @{X=$category.R;Y=$category.B-5} @{X=$demand.CX;Y=$demand.T} "需求分类" "1" "N"
Draw-LineLabel $g @{X=$supply.CX;Y=$supply.B} @{X=$match.L+90;Y=$match.T} "参与撮合" "1" "N"
Draw-LineLabel $g @{X=$demand.CX;Y=$demand.B} @{X=$match.R-90;Y=$match.T} "参与撮合" "1" "N"
Draw-LineLabel $g @{X=$user.R;Y=$user.B-60} @{X=$match.L;Y=$match.T+170} "发起撮合" "1" "N"
Draw-LineLabel $g @{X=$supply.R;Y=$supply.B-90} @{X=$goods.L;Y=$goods.T+180} "同步商品" "1" "0..1"
Save-Canvas $canvas (Join-Path $OutputDir "系统E-R图_五号字_2供需撮合关系.png")

Write-Output (Join-Path $OutputDir "系统E-R图_五号字_横向总览.png")
Write-Output (Join-Path $OutputDir "系统E-R图_五号字_1基础交易关系.png")
Write-Output (Join-Path $OutputDir "系统E-R图_五号字_2供需撮合关系.png")
