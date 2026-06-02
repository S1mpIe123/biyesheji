alter table user
    modify column user_type varchar(20) default 'SHOPPER' comment '普通用户身份：SUPPLIER供应方，BUYER采购方，SHOPPER日常购买';

update user set user_type = 'SHOPPER' where role = 'USER' and (user_type is null or user_type = '');

alter table supply
    add column origin_province varchar(30) null comment '产地省份' after img;

alter table supply
    modify column unit varchar(20) default '斤' comment '规格单位：斤、吨、个；吨会在后端折算为斤存储';

alter table supply
    add column total_quantity int null comment '初始供应总量，用于计算售出百分比' after price;

alter table purchase_demand
    add column unit varchar(20) default '斤' comment '采购单位：斤、吨、个' after quantity;

alter table purchase_demand
    add column total_quantity int null comment '初始采购总量，用于计算采购完成百分比' after category_id;

alter table match_record
    add column unit varchar(20) default '斤' comment '对接单位：斤、吨、个' after quantity;

alter table goods
    add column source_supply_id int null comment '来源供应信息ID，用于同步供应剩余库存';

update supply set quantity = quantity * 2000, unit = '斤' where unit = '吨';

update supply set total_quantity = quantity where total_quantity is null;

update purchase_demand set total_quantity = quantity where total_quantity is null;

update goods
inner join supply on goods.source_supply_id = supply.id
set goods.store = supply.quantity, goods.unit = supply.unit
where goods.source_supply_id is not null;
