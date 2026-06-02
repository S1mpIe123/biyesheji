alter table supply
    add column total_quantity int null comment '初始供应总量，用于计算售出百分比' after price;

alter table purchase_demand
    add column total_quantity int null comment '初始采购总量，用于计算采购完成百分比' after category_id;

update supply set total_quantity = quantity where total_quantity is null;

update purchase_demand set total_quantity = quantity where total_quantity is null;
