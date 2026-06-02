alter table match_record
    add column delivery_address varchar(255) null comment '采购方填写的收货地址' after status;

alter table match_record
    modify column status varchar(20) default '待确认' comment '状态：待确认、已确认、已拒绝、已支付、待发货、待收货、已完成、售后中、售后已处理';
