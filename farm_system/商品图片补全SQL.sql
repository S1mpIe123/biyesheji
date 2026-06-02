-- 商品图片补全 SQL
-- 使用方式：在 Navicat 或 MySQL 控制台选中 farm_system 数据库后，直接执行本文件。
-- 作用：为演示数据中 img 为空或外链失效的农产品商品和供应信息补充本地图片地址。
-- 前提：图片文件已放在 springboot/files 目录，后端端口为 application.yml 中的 9090。

update goods
set img = case name
    when '番茄' then 'http://localhost:9090/files/download/product-tomato.png'
    when '大米' then 'http://localhost:9090/files/download/product-rice.png'
    when '白菜' then 'http://localhost:9090/files/download/product-cabbage.png'
    when '黄瓜' then 'http://localhost:9090/files/download/product-cucumber.png'
    when '苹果' then 'http://localhost:9090/files/download/product-apple.png'
    when '猕猴桃' then 'http://localhost:9090/files/download/product-kiwi.png'
    when '西瓜' then 'http://localhost:9090/files/download/product-watermelon.png'
    when '玉米' then 'http://localhost:9090/files/download/product-corn.png'
    when '土豆' then 'http://localhost:9090/files/download/product-potato.png'
    when '花生' then 'http://localhost:9090/files/download/product-peanut.png'
    when '辣椒' then 'http://localhost:9090/files/download/product-chili.png'
    when '小米辣' then 'http://localhost:9090/files/download/product-chili.png'
    when '苦瓜' then 'http://localhost:9090/files/download/product-bittergourd.png'
    when '香蕉' then 'http://localhost:9090/files/download/product-banana.png'
    when '火龙果' then 'http://localhost:9090/files/download/product-dragonfruit.png'
    when '小米' then 'http://localhost:9090/files/download/product-millet.png'
    else 'http://localhost:9090/files/download/product-vegetables.png'
end;

update supply
set img = case product_name
    when '番茄' then 'http://localhost:9090/files/download/product-tomato.png'
    when '大米' then 'http://localhost:9090/files/download/product-rice.png'
    when '白菜' then 'http://localhost:9090/files/download/product-cabbage.png'
    when '黄瓜' then 'http://localhost:9090/files/download/product-cucumber.png'
    when '苹果' then 'http://localhost:9090/files/download/product-apple.png'
    when '猕猴桃' then 'http://localhost:9090/files/download/product-kiwi.png'
    when '西瓜' then 'http://localhost:9090/files/download/product-watermelon.png'
    when '玉米' then 'http://localhost:9090/files/download/product-corn.png'
    when '土豆' then 'http://localhost:9090/files/download/product-potato.png'
    when '花生' then 'http://localhost:9090/files/download/product-peanut.png'
    when '辣椒' then 'http://localhost:9090/files/download/product-chili.png'
    when '小米辣' then 'http://localhost:9090/files/download/product-chili.png'
    when '苦瓜' then 'http://localhost:9090/files/download/product-bittergourd.png'
    when '香蕉' then 'http://localhost:9090/files/download/product-banana.png'
    when '火龙果' then 'http://localhost:9090/files/download/product-dragonfruit.png'
    when '小米' then 'http://localhost:9090/files/download/product-millet.png'
    else 'http://localhost:9090/files/download/product-vegetables.png'
end;

-- 如果订单快照图片为空或仍是外链，同步补齐订单里的商品图片快照。
update orders o
left join goods g on o.goods_id = g.id
set o.goods_img = g.img
where g.img is not null
  and g.img != '';
