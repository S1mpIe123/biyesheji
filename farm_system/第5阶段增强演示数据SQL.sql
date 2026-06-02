-- 第5阶段增强演示数据：让“数据分析看板”的图表和 AI 报告更丰富
-- 使用方式：在 Navicat 或 MySQL 控制台选中 farm_system 数据库后执行。
-- 说明：
-- 1. 本脚本只清理 enhanced_debug_* 账号产生的数据，不会删除你的正式账号数据。
-- 2. 直接执行 SQL 不会经过后端审核逻辑，所以脚本末尾会手动把已通过供应同步到 goods。
-- 3. 供应与商城库存统一使用“斤”，方便和“单次最多购买100斤”的购买规则对应。

-- 1. 准备演示账号。密码均为 123。
insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'enhanced_debug_supplier_01', '123', '华北果蔬供应社', '', 'USER', '男', '18810000001', 'enhanced_supplier01@test.com', 'SUPPLIER'
where not exists (select 1 from user where username = 'enhanced_debug_supplier_01');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'enhanced_debug_supplier_02', '123', '西北鲜果合作社', '', 'USER', '女', '18810000002', 'enhanced_supplier02@test.com', 'SUPPLIER'
where not exists (select 1 from user where username = 'enhanced_debug_supplier_02');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'enhanced_debug_supplier_03', '123', '东北粮油基地', '', 'USER', '男', '18810000003', 'enhanced_supplier03@test.com', 'SUPPLIER'
where not exists (select 1 from user where username = 'enhanced_debug_supplier_03');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'enhanced_debug_buyer_01', '123', '社区团购采购A', '', 'USER', '女', '18810000004', 'enhanced_buyer01@test.com', 'BUYER'
where not exists (select 1 from user where username = 'enhanced_debug_buyer_01');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'enhanced_debug_buyer_02', '123', '生鲜超市采购B', '', 'USER', '男', '18810000005', 'enhanced_buyer02@test.com', 'BUYER'
where not exists (select 1 from user where username = 'enhanced_debug_buyer_02');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'enhanced_debug_buyer_03', '123', '餐饮渠道采购C', '', 'USER', '女', '18810000006', 'enhanced_buyer03@test.com', 'BUYER'
where not exists (select 1 from user where username = 'enhanced_debug_buyer_03');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'enhanced_debug_shopper_01', '123', '演示日常购买用户', '', 'USER', '男', '18810000007', 'enhanced_shopper01@test.com', 'SHOPPER'
where not exists (select 1 from user where username = 'enhanced_debug_shopper_01');

-- 2. 准备分类。
insert into category(name)
select '蔬菜'
where not exists (select 1 from category where name = '蔬菜');

insert into category(name)
select '水果'
where not exists (select 1 from category where name = '水果');

insert into category(name)
select '粮油'
where not exists (select 1 from category where name = '粮油');

insert into category(name)
select '农副产品'
where not exists (select 1 from category where name = '农副产品');

set @supplier_1 := (select id from user where username = 'enhanced_debug_supplier_01' limit 1);
set @supplier_2 := (select id from user where username = 'enhanced_debug_supplier_02' limit 1);
set @supplier_3 := (select id from user where username = 'enhanced_debug_supplier_03' limit 1);
set @buyer_1 := (select id from user where username = 'enhanced_debug_buyer_01' limit 1);
set @buyer_2 := (select id from user where username = 'enhanced_debug_buyer_02' limit 1);
set @buyer_3 := (select id from user where username = 'enhanced_debug_buyer_03' limit 1);
set @shopper_1 := (select id from user where username = 'enhanced_debug_shopper_01' limit 1);
set @cat_veg := (select id from category where name = '蔬菜' limit 1);
set @cat_fruit := (select id from category where name = '水果' limit 1);
set @cat_grain := (select id from category where name = '粮油' limit 1);
set @cat_side := (select id from category where name = '农副产品' limit 1);

-- 3. 清理增强演示数据，方便重复执行。
delete from orders where user_id in (@shopper_1, @buyer_1, @buyer_2, @buyer_3);
delete from match_record
where response_user_id in (@supplier_1, @supplier_2, @supplier_3, @buyer_1, @buyer_2, @buyer_3)
   or supply_id in (select id from supply where supplier_id in (@supplier_1, @supplier_2, @supplier_3))
   or demand_id in (select id from purchase_demand where buyer_id in (@buyer_1, @buyer_2, @buyer_3));
delete from goods where source_supply_id in (
    select id from supply where supplier_id in (@supplier_1, @supplier_2, @supplier_3)
);
delete from supply where supplier_id in (@supplier_1, @supplier_2, @supplier_3);
delete from purchase_demand where buyer_id in (@buyer_1, @buyer_2, @buyer_3);

-- 4. 供应数据：覆盖多个省份、品类和库存风险。
insert into supply(supplier_id, product_name, category_id, img, origin_province, origin_place, unit, price, total_quantity, quantity, available_time, contact, status, create_time)
values
(@supplier_1, '番茄', @cat_veg, '', '山东', '寿光市', '斤', 1.42, 2200, 1880, '2026-05-08', '18810000001', '已通过', now()),
(@supplier_1, '黄瓜', @cat_veg, '', '河南', '安阳市', '斤', 1.18, 1800, 1260, '2026-05-09', '18810000001', '已通过', now()),
(@supplier_1, '白菜', @cat_veg, '', '四川', '彭州市', '斤', 0.82, 5200, 4100, '2026-05-10', '18810000001', '已通过', now()),
(@supplier_2, '苹果', @cat_fruit, '', '陕西', '洛川县', '斤', 2.65, 3600, 3100, '2026-05-18', '18810000002', '已通过', now()),
(@supplier_2, '猕猴桃', @cat_fruit, '', '陕西', '周至县', '斤', 3.45, 1600, 920, '2026-05-16', '18810000002', '已通过', now()),
(@supplier_2, '西瓜', @cat_fruit, '', '海南', '东方市', '斤', 1.05, 7000, 6900, '2026-05-06', '18810000002', '已通过', now()),
(@supplier_3, '大米', @cat_grain, '', '黑龙江', '五常市', '斤', 2.38, 8000, 7600, '2026-05-20', '18810000003', '已通过', now()),
(@supplier_3, '玉米', @cat_grain, '', '吉林', '松原市', '斤', 1.12, 6000, 85, '2026-05-11', '18810000003', '已通过', now()),
(@supplier_3, '花生', @cat_side, '', '山东', '临沂市', '斤', 4.80, 1200, 660, '2026-05-22', '18810000003', '已通过', now()),
(@supplier_1, '土豆', @cat_veg, '', '内蒙古', '乌兰察布', '斤', 0.72, 6500, 0, '2026-05-02', '18810000001', '已通过', now());

-- 5. 采购需求：刻意制造水果、蔬菜和粮油的不同缺口。
insert into purchase_demand(buyer_id, product_name, category_id, total_quantity, quantity, unit, expected_price, receive_area, deadline, contact, status, create_time)
values
(@buyer_1, '番茄', @cat_veg, 900, 660, '斤', 1.72, '北京朝阳区', '2026-05-21', '18810000004', '已通过', now()),
(@buyer_1, '黄瓜', @cat_veg, 800, 800, '斤', 1.35, '天津滨海新区', '2026-05-19', '18810000004', '已通过', now()),
(@buyer_1, '白菜', @cat_veg, 5000, 4200, '斤', 0.95, '上海浦东新区', '2026-05-22', '18810000004', '已通过', now()),
(@buyer_2, '苹果', @cat_fruit, 2400, 2100, '斤', 3.05, '广东广州市', '2026-05-25', '18810000005', '已通过', now()),
(@buyer_2, '猕猴桃', @cat_fruit, 1500, 1280, '斤', 3.95, '广东深圳市', '2026-05-24', '18810000005', '已通过', now()),
(@buyer_2, '西瓜', @cat_fruit, 3600, 3000, '斤', 1.28, '浙江杭州市', '2026-05-18', '18810000005', '已通过', now()),
(@buyer_3, '大米', @cat_grain, 5200, 4600, '斤', 2.62, '江苏南京市', '2026-05-27', '18810000006', '已通过', now()),
(@buyer_3, '玉米', @cat_grain, 2400, 2200, '斤', 1.35, '安徽合肥市', '2026-05-23', '18810000006', '已通过', now()),
(@buyer_3, '花生', @cat_side, 900, 760, '斤', 5.15, '湖北武汉市', '2026-05-29', '18810000006', '已通过', now()),
(@buyer_1, '辣椒', @cat_veg, 1200, 1200, '斤', 2.20, '重庆渝北区', '2026-05-20', '18810000004', '已通过', now());

-- 6. 撮合记录：让撮合漏斗和成功率更好看。
insert into match_record(supply_id, demand_id, response_user_id, quantity, unit, price, message, status, create_time)
select s.id, d.id, @buyer_1, 240, '斤', 1.62, '增强演示：社区团购优先采购番茄', '已确认', now()
from supply s, purchase_demand d
where s.product_name = '番茄' and d.product_name = '番茄'
  and s.supplier_id = @supplier_1 and d.buyer_id = @buyer_1
limit 1;

insert into match_record(supply_id, demand_id, response_user_id, quantity, unit, price, message, status, create_time)
select s.id, d.id, @buyer_2, 300, '斤', 2.95, '增强演示：超市采购苹果', '已确认', now()
from supply s, purchase_demand d
where s.product_name = '苹果' and d.product_name = '苹果'
  and s.supplier_id = @supplier_2 and d.buyer_id = @buyer_2
limit 1;

insert into match_record(supply_id, demand_id, response_user_id, quantity, unit, price, message, status, create_time)
select s.id, d.id, @supplier_3, 600, '斤', 2.55, '增强演示：供应商主动响应大米需求', '待确认', now()
from supply s, purchase_demand d
where s.product_name = '大米' and d.product_name = '大米'
  and s.supplier_id = @supplier_3 and d.buyer_id = @buyer_3
limit 1;

insert into match_record(supply_id, demand_id, response_user_id, quantity, unit, price, message, status, create_time)
select s.id, d.id, @buyer_3, 500, '斤', 1.28, '增强演示：玉米库存偏低，等待确认', '待确认', now()
from supply s, purchase_demand d
where s.product_name = '玉米' and d.product_name = '玉米'
  and s.supplier_id = @supplier_3 and d.buyer_id = @buyer_3
limit 1;

insert into match_record(supply_id, demand_id, response_user_id, quantity, unit, price, message, status, create_time)
select s.id, d.id, @buyer_2, 220, '斤', 3.80, '增强演示：猕猴桃价格仍需协商', '已拒绝', now()
from supply s, purchase_demand d
where s.product_name = '猕猴桃' and d.product_name = '猕猴桃'
  and s.supplier_id = @supplier_2 and d.buyer_id = @buyer_2
limit 1;

-- 7. 同步商城商品：只同步已通过且未售罄的供应。
insert into goods(name, img, descr, specials, price, unit, store, category_id, source_supply_id)
select
    s.product_name,
    s.img,
    concat('增强演示直供，产地：', ifnull(s.origin_province, ''), ifnull(s.origin_place, ''), '，上市时间：', ifnull(s.available_time, '')),
    '产销对接直供',
    s.price,
    s.unit,
    s.quantity,
    s.category_id,
    s.id
from supply s
where s.supplier_id in (@supplier_1, @supplier_2, @supplier_3)
  and s.status = '已通过'
  and s.quantity > 0;

-- 8. 订单数据：让订单状态结构出现待支付、待发货、待收货、已完成、已取消。
insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH', date_format(now(), '%Y%m%d%H%i%s'), '01'), g.id, 20, @shopper_1, '待支付', now(), g.name, g.img, 0
from goods g where g.source_supply_id is not null and g.name = '番茄' limit 1;

insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH', date_format(now(), '%Y%m%d%H%i%s'), '02'), g.id, 45, @shopper_1, '待发货', now(), g.name, g.img, 0
from goods g where g.source_supply_id is not null and g.name = '苹果' limit 1;

insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH', date_format(now(), '%Y%m%d%H%i%s'), '03'), g.id, 60, @buyer_1, '待收货', now(), g.name, g.img, 0
from goods g where g.source_supply_id is not null and g.name = '白菜' limit 1;

insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH', date_format(now(), '%Y%m%d%H%i%s'), '04'), g.id, 80, @buyer_2, '已完成', now(), g.name, g.img, 0
from goods g where g.source_supply_id is not null and g.name = '西瓜' limit 1;

insert into orders(order_no, goods_id, num, user_id, status, time, goods_name, goods_img, deleted)
select concat('ENH', date_format(now(), '%Y%m%d%H%i%s'), '05'), g.id, 30, @buyer_3, '已取消', now(), g.name, g.img, 0
from goods g where g.source_supply_id is not null and g.name = '玉米' limit 1;

-- 执行后建议刷新页面：
-- 1. 管理员查看“数据分析看板”
-- 2. 查看 AI 运营分析师弹窗
-- 3. 点击导出报告验证下载文本
