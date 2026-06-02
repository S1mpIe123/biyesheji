alter table user
    add column user_type varchar(20) default 'SHOPPER' comment '普通用户身份：SUPPLIER供应方，BUYER采购方，SHOPPER日常购买';

update user set user_type = 'SHOPPER' where role = 'USER' and (user_type is null or user_type = '');

create table if not exists supply (
    id int primary key auto_increment comment 'ID',
    supplier_id int not null comment '供应方用户ID',
    product_name varchar(100) not null comment '产品名称',
    category_id int null comment '分类ID',
    img varchar(255) null comment '产品图片',
    origin_province varchar(30) null comment '产地省份',
    origin_place varchar(100) null comment '详细产地',
    unit varchar(20) default '斤' comment '规格单位：斤、吨、个；吨会在后端折算为斤存储',
    price decimal(10,2) null comment '单价',
    total_quantity int null comment '初始供应总量，用于计算售出百分比',
    quantity int null comment '剩余供应量',
    available_time varchar(30) null comment '上市时间',
    contact varchar(100) null comment '联系方式',
    status varchar(20) default '待审核' comment '状态：待审核、已通过、已拒绝',
    create_time varchar(30) null comment '创建时间'
) comment '农产品供应信息';

create table if not exists purchase_demand (
    id int primary key auto_increment comment 'ID',
    buyer_id int not null comment '采购方用户ID',
    product_name varchar(100) not null comment '产品名称',
    category_id int null comment '分类ID',
    total_quantity int null comment '初始采购总量，用于计算采购完成百分比',
    quantity int null comment '期望数量',
    unit varchar(20) default '斤' comment '采购单位：斤、吨、个',
    expected_price decimal(10,2) null comment '期望价格',
    receive_area varchar(100) null comment '收货地区',
    deadline varchar(30) null comment '截止时间',
    contact varchar(100) null comment '联系方式',
    status varchar(20) default '待审核' comment '状态：待审核、已通过、已拒绝',
    create_time varchar(30) null comment '创建时间'
) comment '农产品采购需求';

create table if not exists match_record (
    id int primary key auto_increment comment 'ID',
    supply_id int null comment '供应信息ID',
    demand_id int null comment '采购需求ID',
    response_user_id int not null comment '响应人用户ID',
    quantity int null comment '意向数量',
    unit varchar(20) default '斤' comment '对接单位：斤、吨、个',
    price decimal(10,2) null comment '报价',
    message varchar(255) null comment '留言',
    status varchar(20) default '待确认' comment '状态：待确认、已确认、已拒绝',
    create_time varchar(30) null comment '创建时间'
) comment '供需撮合记录';

alter table goods
    add column source_supply_id int null comment '来源供应信息ID，用于同步供应剩余库存';
