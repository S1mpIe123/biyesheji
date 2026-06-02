alter table match_record
    add column deleted tinyint default 0 comment '是否在对接记录中隐藏：0显示，1隐藏' after create_time;

update match_record
set deleted = 0
where deleted is null;
