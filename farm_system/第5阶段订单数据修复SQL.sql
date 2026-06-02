-- 第5阶段订单数据修复 SQL
-- 使用方式：在 Navicat 或 MySQL 控制台选中 farm_system 数据库后，直接执行本文件即可。
-- 作用：补充增强演示数据中的订单状态样本，避免 uuid 字符串插入 orders.id 导致 1265 报错。
-- 注意：本脚本只处理 enhanced_debug_* 演示账号的订单数据，不影响正式用户订单。

set @buyer_1 := (select id from user where username = 'enhanced_debug_buyer_01' limit 1);
set @buyer_2 := (select id from user where username = 'enhanced_debug_buyer_02' limit 1);
set @buyer_3 := (select id from user where username = 'enhanced_debug_buyer_03' limit 1);
set @shopper_1 := (select id from user where username = 'enhanced_debug_shopper_01' limit 1);

-- 防止重复执行时订单越堆越多：只清理本脚本生成的增强演示订单。
delete from orders
where order_no like 'ENH_FIX_%'
   or user_id in (@shopper_1, @buyer_1, @buyer_2, @buyer_3);

-- 订单状态样本：待支付。
insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH_FIX_', date_format(now(), '%Y%m%d%H%i%s'), '_01'), g.id, 20, @shopper_1, '待支付', now(), g.name, g.img, 0
from goods g
where g.source_supply_id is not null
  and g.name = '番茄'
limit 1;

-- 订单状态样本：待发货。
insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH_FIX_', date_format(now(), '%Y%m%d%H%i%s'), '_02'), g.id, 45, @shopper_1, '待发货', now(), g.name, g.img, 0
from goods g
where g.source_supply_id is not null
  and g.name = '苹果'
limit 1;

-- 订单状态样本：待收货。
insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH_FIX_', date_format(now(), '%Y%m%d%H%i%s'), '_03'), g.id, 60, @buyer_1, '待收货', now(), g.name, g.img, 0
from goods g
where g.source_supply_id is not null
  and g.name = '白菜'
limit 1;

-- 订单状态样本：已完成。
insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH_FIX_', date_format(now(), '%Y%m%d%H%i%s'), '_04'), g.id, 80, @buyer_2, '已完成', now(), g.name, g.img, 0
from goods g
where g.source_supply_id is not null
  and g.name = '西瓜'
limit 1;

-- 订单状态样本：已取消。
insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH_FIX_', date_format(now(), '%Y%m%d%H%i%s'), '_05'), g.id, 30, @buyer_3, '已取消', now(), g.name, g.img, 0
from goods g
where g.source_supply_id is not null
  and g.name = '玉米'
limit 1;

-- 执行后刷新管理员“数据分析看板”，订单状态结构会出现待支付、待发货、待收货、已完成、已取消。
