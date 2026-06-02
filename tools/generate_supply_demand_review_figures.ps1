# 作用：生成论文中“供需信息审核与发布流程”的拆分版插图。
# 设计原则：去掉图标、渐变和过多装饰，采用白底、细边框和较大中文字体，降低“AI生成图”的视觉特征。

param(
  [string]$OutputDir = "论文插图"
)

Add-Type -AssemblyName System.Drawing

# 模块作用：提供基础绘图对象，统一字体、颜色和抗锯齿设置。
function New-FigureCanvas {
  param([int]$Width, [int]$Height)

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $graphics.Clear([System.Drawing.Color]::White)

  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

# 模块作用：按照论文图常用样式绘制矩形节点。
# 关键代码：用 StringFormat 控制中文居中换行，避免插入 Word 后节点文字过小或溢出。
function Draw-ProcessBox {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect,
    [string]$Title,
    [string[]]$Lines,
    [System.Drawing.Color]$BorderColor,
    [System.Drawing.Color]$FillColor
  )

  $fillBrush = New-Object System.Drawing.SolidBrush($FillColor)
  $borderPen = New-Object System.Drawing.Pen($BorderColor, 3)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(32, 45, 52))
  $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(84, 97, 105))
  $titleFont = New-Object System.Drawing.Font("Microsoft YaHei", 31, [System.Drawing.FontStyle]::Bold)
  $bodyFont = New-Object System.Drawing.Font("Microsoft YaHei", 24, [System.Drawing.FontStyle]::Regular)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $Graphics.FillRectangle($fillBrush, $Rect)
  $Graphics.DrawRectangle($borderPen, $Rect.X, $Rect.Y, $Rect.Width, $Rect.Height)

  $titleRect = [System.Drawing.RectangleF]::new($Rect.X + 16, $Rect.Y + 18, $Rect.Width - 32, 42)
  $bodyRect = [System.Drawing.RectangleF]::new($Rect.X + 18, $Rect.Y + 72, $Rect.Width - 36, $Rect.Height - 86)
  $Graphics.DrawString($Title, $titleFont, $textBrush, $titleRect, $format)
  $Graphics.DrawString(($Lines -join "`n"), $bodyFont, $mutedBrush, $bodyRect, $format)

  $fillBrush.Dispose()
  $borderPen.Dispose()
  $textBrush.Dispose()
  $mutedBrush.Dispose()
  $titleFont.Dispose()
  $bodyFont.Dispose()
  $format.Dispose()
}

# 模块作用：绘制审核判断节点。
# 关键代码：使用菱形强调“通过/拒绝”分支，保留流程图的标准表达方式。
function Draw-DecisionBox {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect,
    [string]$Title,
    [System.Drawing.Color]$BorderColor,
    [System.Drawing.Color]$FillColor
  )

  $points = @(
    ([System.Drawing.PointF]::new(($Rect.X + $Rect.Width / 2), $Rect.Y)),
    ([System.Drawing.PointF]::new(($Rect.X + $Rect.Width), ($Rect.Y + $Rect.Height / 2))),
    ([System.Drawing.PointF]::new(($Rect.X + $Rect.Width / 2), ($Rect.Y + $Rect.Height))),
    ([System.Drawing.PointF]::new($Rect.X, ($Rect.Y + $Rect.Height / 2)))
  )

  $fillBrush = New-Object System.Drawing.SolidBrush($FillColor)
  $borderPen = New-Object System.Drawing.Pen($BorderColor, 3)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(32, 45, 52))
  $font = New-Object System.Drawing.Font("Microsoft YaHei", 29, [System.Drawing.FontStyle]::Bold)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $Graphics.FillPolygon($fillBrush, $points)
  $Graphics.DrawPolygon($borderPen, $points)
  $Graphics.DrawString($Title, $font, $textBrush, $Rect, $format)

  $fillBrush.Dispose()
  $borderPen.Dispose()
  $textBrush.Dispose()
  $font.Dispose()
  $format.Dispose()
}

# 模块作用：绘制节点之间的箭头和少量分支文字。
# 关键代码：CustomEndCap 生成统一箭头，避免手动画三角形造成线条不一致。
function Draw-Arrow {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X1,
    [float]$Y1,
    [float]$X2,
    [float]$Y2,
    [string]$Label = "",
    [System.Drawing.Color]$Color
  )

  $pen = New-Object System.Drawing.Pen($Color, 3)
  $cap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(7, 8)
  $pen.CustomEndCap = $cap
  $Graphics.DrawLine($pen, $X1, $Y1, $X2, $Y2)

  if ($Label -ne "") {
    $labelFont = New-Object System.Drawing.Font("Microsoft YaHei", 21, [System.Drawing.FontStyle]::Regular)
    $labelBrush = New-Object System.Drawing.SolidBrush($Color)
    $labelRect = [System.Drawing.RectangleF]::new((($X1 + $X2) / 2 - 80), (($Y1 + $Y2) / 2 - 26), 160, 34)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $Graphics.DrawString($Label, $labelFont, $labelBrush, $labelRect, $format)
    $labelFont.Dispose()
    $labelBrush.Dispose()
    $format.Dispose()
  }

  $pen.Dispose()
  $cap.Dispose()
}

# 模块作用：绘制底部的数据说明区，把接口和表名压缩为辅助信息，不干扰主流程阅读。
function Draw-TechNote {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.RectangleF]$Rect,
    [string]$Text
  )

  $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 190, 198), 2)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(67, 78, 87))
  $font = New-Object System.Drawing.Font("Microsoft YaHei", 22, [System.Drawing.FontStyle]::Regular)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $Graphics.FillRectangle($brush, $Rect)
  $Graphics.DrawRectangle($pen, $Rect.X, $Rect.Y, $Rect.Width, $Rect.Height)
  $Graphics.DrawString($Text, $font, $textBrush, $Rect, $format)

  $brush.Dispose()
  $pen.Dispose()
  $textBrush.Dispose()
  $font.Dispose()
  $format.Dispose()
}

# 模块作用：生成单张流程图；通过 FlowType 参数复用布局，保持上下两张图风格一致。
function Export-ReviewFigure {
  param(
    [string]$FlowType,
    [string]$Title,
    [string]$OutputName,
    [System.Drawing.Color]$Accent,
    [string[]]$Step1,
    [string[]]$Step5,
    [string]$SubmitApi,
    [string]$TableNote
  )

  $canvas = New-FigureCanvas -Width 1650 -Height 980
  $g = $canvas.Graphics
  $bitmap = $canvas.Bitmap

  $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 36, 48))
  $titleFont = New-Object System.Drawing.Font("Microsoft YaHei", 42, [System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Object System.Drawing.Font("Microsoft YaHei", 24, [System.Drawing.FontStyle]::Regular)
  $centerFormat = New-Object System.Drawing.StringFormat
  $centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

  $g.DrawString($Title, $titleFont, $titleBrush, ([System.Drawing.RectangleF]::new(0, 38, 1650, 62)), $centerFormat)

  $border = $Accent
  $fill = [System.Drawing.Color]::FromArgb(250, 252, 253)
  $warn = [System.Drawing.Color]::FromArgb(232, 127, 65)
  $gray = [System.Drawing.Color]::FromArgb(92, 108, 120)

  $r1 = [System.Drawing.RectangleF]::new(90, 170, 390, 170)
  $r2 = [System.Drawing.RectangleF]::new(630, 170, 390, 170)
  $r3 = [System.Drawing.RectangleF]::new(1170, 170, 390, 170)
  $r4 = [System.Drawing.RectangleF]::new(90, 520, 390, 170)
  $r5 = [System.Drawing.RectangleF]::new(655, 495, 340, 220)
  $r6 = [System.Drawing.RectangleF]::new(1170, 520, 390, 170)

  Draw-ProcessBox $g $r1 "填写信息" $Step1 $border $fill
  Draw-ProcessBox $g $r2 "前端校验" @("校验必填字段", "校验价格和数量") $border $fill
  if ($FlowType -eq "Demand") {
    $submitLabel = "调用新增需求接口"
  } else {
    $submitLabel = "调用新增供应接口"
  }

  Draw-ProcessBox $g $r3 "提交审核" @($submitLabel, "状态置为待审核") $border $fill
  Draw-ProcessBox $g $r4 "管理员处理" @("查看提交内容", "选择通过或拒绝") $border $fill
  Draw-DecisionBox $g $r5 "审核结果" $warn ([System.Drawing.Color]::FromArgb(255, 250, 245))
  Draw-ProcessBox $g $r6 $Step5[0] @($Step5[1], $Step5[2]) $border $fill

  Draw-Arrow $g 480 255 630 255 "" $gray
  Draw-Arrow $g 1020 255 1170 255 "" $gray
  Draw-Arrow $g 1365 340 1365 430 "" $gray
  Draw-Arrow $g 1365 430 480 430 "" $gray
  Draw-Arrow $g 480 430 480 605 "" $gray
  Draw-Arrow $g 480 605 655 605 "" $gray
  Draw-Arrow $g 995 605 1170 605 "通过" $border

  # 拒绝分支从图外侧回到填写节点，避免返回线穿过业务节点。
  Draw-Arrow $g 825 715 825 820 "拒绝修改" $warn
  Draw-Arrow $g 825 820 50 820 "" $warn
  Draw-Arrow $g 50 820 50 255 "" $warn
  Draw-Arrow $g 50 255 90 255 "" $warn

  Draw-TechNote $g ([System.Drawing.RectangleF]::new(90, 875, 1470, 58)) $TableNote

  $outPath = Join-Path $OutputDir $OutputName
  $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $titleBrush.Dispose()
  $titleFont.Dispose()
  $subtitleFont.Dispose()
  $centerFormat.Dispose()
  $g.Dispose()
  $bitmap.Dispose()
}

if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

Export-ReviewFigure `
  -FlowType "Supply" `
  -Title "供应信息审核与发布流程" `
  -OutputName "供需信息审核与发布流程图_1供应信息流程.png" `
  -Accent ([System.Drawing.Color]::FromArgb(29, 113, 118)) `
  -Step1 @("名称、分类、产地", "价格、数量、联系方式") `
  -Step5 @("发布与流转", "供应大厅展示", "匹配推荐与库存同步") `
  -SubmitApi "/supply/add" `
  -TableNote "数据落点：supply、goods、match_record    审核通过后进入供应大厅、商城库存和撮合推荐流程"

Export-ReviewFigure `
  -FlowType "Demand" `
  -Title "采购需求审核与发布流程" `
  -OutputName "供需信息审核与发布流程图_2采购需求流程.png" `
  -Accent ([System.Drawing.Color]::FromArgb(44, 99, 170)) `
  -Step1 @("名称、分类、数量", "期望价格、收货地区") `
  -Step5 @("发布与响应", "需求大厅展示", "供应商响应与匹配推荐") `
  -SubmitApi "/purchaseDemand/add" `
  -TableNote "数据落点：purchase_demand、match_record    审核通过后进入需求大厅和撮合推荐流程"

# 模块作用：把两张拆分图合成为一张上下排列图，便于论文中作为一个图号整体插入。
$supplyPath = Join-Path $OutputDir "供需信息审核与发布流程图_1供应信息流程.png"
$demandPath = Join-Path $OutputDir "供需信息审核与发布流程图_2采购需求流程.png"
$combinedPath = Join-Path $OutputDir "供需信息审核与发布流程图_上下拆分版.png"
$supplyImage = [System.Drawing.Image]::FromFile($supplyPath)
$demandImage = [System.Drawing.Image]::FromFile($demandPath)
$combined = New-Object System.Drawing.Bitmap(1650, 1960)
$combinedGraphics = [System.Drawing.Graphics]::FromImage($combined)
$combinedGraphics.Clear([System.Drawing.Color]::White)
$combinedGraphics.DrawImage($supplyImage, 0, 0, 1650, 980)
$combinedGraphics.DrawImage($demandImage, 0, 980, 1650, 980)
$combined.Save($combinedPath, [System.Drawing.Imaging.ImageFormat]::Png)

$combinedGraphics.Dispose()
$combined.Dispose()
$supplyImage.Dispose()
$demandImage.Dispose()

Write-Host "已生成："
Write-Host $supplyPath
Write-Host $demandPath
Write-Host $combinedPath
