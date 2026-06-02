-- 第5阶段调试数据：用于丰富“我的对接记录”里的市场货源/需求图形展示
-- 使用方式：在 Navicat 或 MySQL 控制台选中 farm_system 数据库后执行。
-- 说明：脚本会创建少量调试账号、分类、供应信息、采购需求和同步商品；不会删除你的正式数据。

-- 1. 准备调试账号。密码均为 123。
insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'debug_supplier_01', '123', '调试供应商A', '', 'USER', '男', '18800000001', 'supplier01@test.com', 'SUPPLIER'
where not exists (select 1 from user where username = 'debug_supplier_01');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'debug_supplier_02', '123', '调试供应商B', '', 'USER', '女', '18800000002', 'supplier02@test.com', 'SUPPLIER'
where not exists (select 1 from user where username = 'debug_supplier_02');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'debug_buyer_01', '123', '调试采购商A', '', 'USER', '男', '18800000003', 'buyer01@test.com', 'BUYER'
where not exists (select 1 from user where username = 'debug_buyer_01');

insert into user(username, password, name, avatar, role, sex, phone, email, user_type)
select 'debug_buyer_02', '123', '调试采购商B', '', 'USER', '女', '18800000004', 'buyer02@test.com', 'BUYER'
where not exists (select 1 from user where username = 'debug_buyer_02');

-- 2. 准备调试分类。若你已有同名分类，则复用已有分类。
insert into category(name)
select '蔬菜'
where not exists (select 1 from category where name = '蔬菜');

insert into category(name)
select '水果'
where not exists (select 1 from category where name = '水果');

insert into category(name)
select '粮油'
where not exists (select 1 from category where name = '粮油');

set @supplier_a := (select id from user where username = 'debug_supplier_01' limit 1);
set @supplier_b := (select id from user where username = 'debug_supplier_02' limit 1);
set @buyer_a := (select id from user where username = 'debug_buyer_01' limit 1);
set @buyer_b := (select id from user where username = 'debug_buyer_02' limit 1);
set @cat_veg := (select id from category where name = '蔬菜' limit 1);
set @cat_fruit := (select id from category where name = '水果' limit 1);
set @cat_grain := (select id from category where name = '粮油' limit 1);

-- 3. 清理调试账号生成的数据，便于重复执行脚本后数据不会越堆越多。
delete from goods where source_supply_id in (
    select id from supply where supplier_id in (@supplier_a, @supplier_b)
);
delete from supply where supplier_id in (@supplier_a, @supplier_b);
delete from purchase_demand where buyer_id in (@buyer_a, @buyer_b);

-- 4. 供应货源。quantity 为 0 的“玉米”用于测试：前端市场卡片应自动隐藏售罄货源。
--    供应数据统一使用“斤”，这样同步到农产品购买后能直接按“单次最多100斤”限制购买。
insert into supply(supplier_id, product_name, category_id, img, origin_province, origin_place, unit, price, total_quantity, quantity, available_time, contact, status, create_time)
values
(@supplier_a, '番茄', @cat_veg, '', '山东', '寿光市', '斤', 1.50, 1000, 860, '2026-05-10', '18800000001', '已通过', now()),
(@supplier_b, '番茄', @cat_veg, '', '河北', '保定市', '斤', 1.35, 800, 620, '2026-05-12', '18800000002', '已通过', now()),
(@supplier_a, '白菜', @cat_veg, '', '四川', '彭州市', '斤', 0.90, 5000, 4000, '2026-05-08', '18800000001', '已通过', now()),
(@supplier_b, '土豆', @cat_veg, '', '内蒙古', '乌兰察布', '斤', 0.75, 6000, 5400, '2026-05-14', '18800000002', '已通过', now()),
(@supplier_a, '黄瓜', @cat_veg, '', '河南', '安阳市', '斤', 1.20, 2200, 1800, '2026-05-09', '18800000001', '已通过', now()),
(@supplier_b, '苹果', @cat_fruit, '', '陕西', '洛川县', '斤', 2.80, 3000, 2600, '2026-05-20', '18800000002', '已通过', now()),
(@supplier_a, '猕猴桃', @cat_fruit, '', '陕西', '周至县', '斤', 3.60, 1800, 1400, '2026-05-18', '18800000001', '已通过', now()),
(@supplier_b, '大米', @cat_grain, '', '黑龙江', '五常市', '斤', 2.30, 5000, 4700, '2026-05-15', '18800000002', '已通过', now()),
(@supplier_a, '玉米', @cat_grain, '', '黑龙江', '哈尔滨市', '斤', 1.17, 3000, 0, '2026-05-02', '18800000001', '已通过', now());

-- 5. 采购需求。供应商登录后会看到这些未完成需求。
insert into purchase_demand(buyer_id, product_name, category_id, total_quantity, quantity, unit, expected_price, receive_area, deadline, contact, status, create_time)
values
(@buyer_a, '番茄', @cat_veg, 500, 420, '斤', 1.80, '北京', '2026-05-25', '18800000003', '已通过', now()),
(@buyer_b, '白菜', @cat_veg, 3000, 2600, '斤', 1.00, '上海', '2026-05-26', '18800000004', '已通过', now()),
(@buyer_a, '土豆', @cat_veg, 2500, 2100, '斤', 0.95, '天津', '2026-05-24', '18800000003', '已通过', now()),
(@buyer_b, '黄瓜', @cat_veg, 1200, 1000, '斤', 1.35, '重庆', '2026-05-23', '18800000004', '已通过', now()),
(@buyer_a, '苹果', @cat_fruit, 1600, 1500, '斤', 3.10, '广州', '2026-05-28', '18800000003', '已通过', now()),
(@buyer_b, '猕猴桃', @cat_fruit, 900, 760, '斤', 3.90, '深圳', '2026-05-29', '18800000004', '已通过', now()),
(@buyer_a, '大米', @cat_grain, 4000, 3600, '斤', 2.50, '杭州', '2026-05-30', '18800000003', '已通过', now()),
(@buyer_b, '玉米', @cat_grain, 2000, 0, '斤', 1.30, '南京', '2026-05-21', '18800000004', '已通过', now());

-- 6. 直接执行 SQL 不会经过后端 SupplyService，所以这里手动把已通过且未售罄的调试供应同步为农产品购买商品。
insert into goods(name, img, descr, specials, price, unit, store, category_id, source_supply_id)
select
    s.product_name,
    s.img,
    concat('供应方直供，产地：', ifnull(s.origin_province, ''), ifnull(s.origin_place, ''), '，上市时间：', ifnull(s.available_time, '')),
    '产销对接直供',
    s.price,
    s.unit,
    s.quantity,
    s.category_id,
    s.id
from supply s
where s.supplier_id in (@supplier_a, @supplier_b)
  and s.status = '已通过'
  and s.quantity > 0;

-- 7. 如果你想让当前登录的采购商看到“匹配货源”指标，请用该账号发布同名采购需求，
--    例如发布“番茄 / 白菜 / 土豆”；供应商同理，发布同名供应后即可看到匹配需求指标。
