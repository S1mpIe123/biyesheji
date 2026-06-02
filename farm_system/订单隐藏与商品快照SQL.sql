alter table orders
    add column goods_name varchar(255) null comment '下单时的商品名称快照，避免商品变动后订单名称为空' after time;

alter table orders
    add column goods_img varchar(255) null comment '下单时的商品图片快照，避免商品变动后订单图片为空' after goods_name;

alter table orders
    add column deleted tinyint default 0 comment '是否在订单管理中隐藏：0显示，1隐藏' after goods_img;

update orders o
left join goods g on o.goods_id = g.id
set o.goods_name = ifnull(o.goods_name, g.name),
    o.goods_img = ifnull(o.goods_img, g.img),
    o.deleted = ifnull(o.deleted, 0);
